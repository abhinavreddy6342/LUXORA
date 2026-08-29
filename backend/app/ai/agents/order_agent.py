from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..llm import luxora_llm
from ..prompts import SYSTEM_PROMPT
from ..tools import get_cart


class OrderAgent:
    """
    LUXORA Order / Checkout Intelligence Agent.

    Responsibilities:
    - inspect the authenticated user's current cart
    - prepare a concise checkout summary
    - calculate/display real cart totals
    - clearly explain that checkout/payment still requires
      explicit user action
    - never place an order
    - never claim payment succeeded
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # FALLBACK SUMMARY
    # ========================================================

    def _build_fallback_message(
        self,
        cart: dict[str, Any],
    ) -> str:
        items = cart.get("items") or []

        if not items:
            return (
                "Your LUXORA cart is currently empty. "
                "Add products before continuing to checkout."
            )

        item_count = int(
            cart.get("item_count") or 0
        )

        subtotal = float(
            cart.get("subtotal") or 0
        )

        lines = [
            (
                f"Your order summary contains "
                f"{item_count} item"
                f"{'s' if item_count != 1 else ''}."
            ),
            "",
        ]

        for item in items[:10]:
            name = str(
                item.get("name")
                or "LUXORA Product"
            ).strip()

            quantity = int(
                item.get("quantity") or 1
            )

            line_total = float(
                item.get("line_total") or 0
            )

            lines.append(
                f"- {name} × {quantity} — "
                f"₹{line_total:,.0f}"
            )

        lines.extend(
            [
                "",
                f"Subtotal: ₹{subtotal:,.0f}",
                "",
                (
                    "You must explicitly continue to "
                    "checkout and confirm your payment "
                    "method before an order is created."
                ),
            ]
        )

        return "\n".join(lines)

    # ========================================================
    # SUMMARIZE ORDER
    # ========================================================

    def summarize(
        self,
        user_id: int,
    ) -> dict[str, Any]:
        """
        Prepare a checkout summary from the real cart.
        """

        cart = get_cart(
            self.db,
            user_id,
        )

        # ----------------------------------------------------
        # EMPTY CART
        # ----------------------------------------------------

        if not cart.get("items"):
            return {
                "agent": "order",
                "message": (
                    "Your LUXORA cart is currently empty. "
                    "Add products before continuing to checkout."
                ),
                "products": [],
                "constraints": {
                    "requires_user_confirmation": True,
                    "requires_checkout": True,
                    "requires_payment_confirmation": True,
                },
                "cart": cart,
            }

        # ----------------------------------------------------
        # FALLBACK
        # ----------------------------------------------------

        fallback_message = self._build_fallback_message(
            cart,
        )

        # ----------------------------------------------------
        # LLM CONTEXT
        # ----------------------------------------------------

        context = json.dumps(
            {
                "cart": cart,
                "subtotal": cart.get("subtotal", 0),
                "item_count": cart.get("item_count", 0),
            },
            ensure_ascii=False,
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Checkout Intelligence Agent.

REAL CUSTOMER CART:
{context}

Prepare a concise checkout summary.

Include:

1. Number of items.
2. Product names and quantities.
3. Actual subtotal from the supplied cart.
4. A clear statement that checkout has NOT happened yet.
5. A clear statement that payment has NOT happened yet.
6. Tell the customer they must explicitly continue
   to checkout and confirm a payment method.

CRITICAL RULES:

- Use only the supplied cart data.
- Never invent products.
- Never invent prices.
- Never invent discounts.
- Never invent delivery charges.
- Never invent payment status.
- Never claim an order was created.
- Never claim payment succeeded.
- Never perform checkout.
- Never charge money.
- Do not output JSON.
- Keep the response concise and professional.

You are preparing information for checkout, not executing
the transaction.
"""

        # ----------------------------------------------------
        # GROK EXPLANATION
        # ----------------------------------------------------

        explanation = luxora_llm.invoke(
            prompt,
        )

        if not explanation:
            explanation = fallback_message

        return {
            "agent": "order",
            "message": explanation,
            "products": cart.get("items", []),
            "constraints": {
                "item_count": int(
                    cart.get("item_count") or 0
                ),
                "subtotal": float(
                    cart.get("subtotal") or 0
                ),
                "requires_user_confirmation": True,
                "requires_checkout": True,
                "requires_payment_confirmation": True,
            },
            "cart": cart,
        }