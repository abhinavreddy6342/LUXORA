from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..llm import luxora_llm
from ..prompts import SYSTEM_PROMPT
from ..tools import get_cart, get_complementary_products, get_product


class CartAgent:
    """
    LUXORA Cart Agent.

    Responsibilities:
    - inspect the authenticated user's real cart
    - summarize cart contents
    - calculate/use the actual cart subtotal
    - identify useful complementary products
    - provide practical cart insights
    - never invent cart or catalog information
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # FALLBACK MESSAGE
    # ========================================================

    def _build_fallback_message(
        self,
        cart: dict[str, Any],
        recommendations: list[dict[str, Any]],
    ) -> str:
        items = cart.get("items") or []
        subtotal = float(
            cart.get("subtotal") or 0
        )
        item_count = int(
            cart.get("item_count") or 0
        )

        if not items:
            return "Your LUXORA cart is currently empty."

        lines = [
            f"Your cart has {item_count} item"
            f"{'s' if item_count != 1 else ''} "
            f"with a subtotal of ₹{subtotal:,.0f}."
        ]

        for item in items[:5]:
            name = str(
                item.get("name") or "LUXORA product"
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

        if recommendations:
            lines.append("")
            lines.append(
                "You may also consider:"
            )

            for product in recommendations[:3]:
                name = str(
                    product.get("name")
                    or "LUXORA product"
                ).strip()

                lines.append(
                    f"- {name} — "
                    f"₹{float(product.get('price') or 0):,.0f}"
                )

        return "\n".join(lines)

    # ========================================================
    # RECOMMEND COMPLEMENTARY PRODUCTS
    # ========================================================

    def _get_cart_recommendations(
        self,
        cart: dict[str, Any],
    ) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []

        seen_ids: set[int] = {
            int(item["id"])
            for item in cart.get("items", [])
            if item.get("id") is not None
        }

        for item in cart.get("items", []):
            product_id = item.get("id")

            if product_id is None:
                continue

            product = get_product(
                self.db,
                int(product_id),
            )

            if not product:
                continue

            complementary = get_complementary_products(
                self.db,
                product,
            )

            for recommendation in complementary:
                recommendation_id = recommendation.get("id")

                if recommendation_id is None:
                    continue

                recommendation_id = int(
                    recommendation_id
                )

                if recommendation_id in seen_ids:
                    continue

                if recommendation_id in {
                    int(item["id"])
                    for item in recommendations
                    if item.get("id") is not None
                }:
                    continue

                recommendations.append(
                    recommendation
                )

                if len(recommendations) >= 6:
                    return recommendations

        return recommendations

    # ========================================================
    # ANALYZE CART
    # ========================================================

    def analyze(
        self,
        user_id: int,
    ) -> dict[str, Any]:
        """
        Analyze the authenticated user's actual cart.
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
                "agent": "cart",
                "message": (
                    "Your LUXORA cart is currently empty. "
                    "Add some products and I can analyze "
                    "your selection."
                ),
                "products": [],
                "constraints": {},
                "cart": cart,
            }

        # ----------------------------------------------------
        # COMPLEMENTARY PRODUCTS
        # ----------------------------------------------------

        recommendations = self._get_cart_recommendations(
            cart,
        )

        # Keep UI payload compact.
        recommendations = recommendations[:4]

        # ----------------------------------------------------
        # FALLBACK
        # ----------------------------------------------------

        fallback_message = self._build_fallback_message(
            cart,
            recommendations,
        )

        # ----------------------------------------------------
        # LLM CONTEXT
        # ----------------------------------------------------

        context = json.dumps(
            {
                "cart": cart,
                "complementary_products": recommendations,
            },
            ensure_ascii=False,
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Cart Intelligence Agent.

REAL CUSTOMER CART:
{json.dumps(cart, ensure_ascii=False)}

REAL COMPLEMENTARY LUXORA PRODUCTS:
{json.dumps(recommendations, ensure_ascii=False)}

Analyze the customer's current cart.

Your response should:

1. Give a concise cart summary.
2. Mention the current item count.
3. Mention the actual subtotal.
4. Identify useful complementary products only when
   genuinely relevant.
5. Explain why a suggested product may complement the cart.
6. Avoid aggressive upselling.
7. Never invent products.
8. Never invent prices.
9. Never invent stock or specifications.
10. Never claim payment has occurred.
11. Never claim an order has been placed.
12. Do not output JSON.
13. Keep the answer concise and premium.

All product information must come from the supplied
REAL LUXORA data.

Return a helpful commerce-insight response.
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
            "agent": "cart",
            "message": explanation,
            "products": recommendations,
            "constraints": {
                "item_count": int(
                    cart.get("item_count") or 0
                ),
                "subtotal": float(
                    cart.get("subtotal") or 0
                ),
            },
            "cart": cart,
        }