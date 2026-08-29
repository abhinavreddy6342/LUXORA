from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy.orm import Session

from ..llm import luxora_llm
from ..prompts import SYSTEM_PROMPT
from ..tools import (
    compare_products,
    get_complementary_products,
    get_product,
)


class ProductAgent:
    """
    LUXORA Product Intelligence Agent.

    Responsibilities:
    - explain individual products
    - compare multiple products
    - extract product IDs
    - handle contextual/follow-up product questions
    - provide factual product information
    - provide complementary product context
    - never invent catalog information
    """

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    # ========================================================
    # SAFE TEXT
    # ========================================================

    @staticmethod
    def _clean_text(
        value: Any,
    ) -> str:
        return str(
            value or ""
        ).strip()

    # ========================================================
    # PRODUCT ID EXTRACTION
    # ========================================================

    def _extract_product_ids(
        self,
        message: str,
    ) -> list[int]:
        """
        Extract product IDs from natural language.

        Supported:

        product 1
        product #1
        item 5
        item #5
        compare product 1 and product 5
        compare 1 and 5
        product 1 vs product 5
        """

        text = str(
            message or ""
        ).lower()

        ids: list[int] = []

        # ----------------------------------------------------
        # Explicit product/item references
        # ----------------------------------------------------

        matches = re.findall(
            r"(?:product|item)\s*[#/:\-]?\s*(\d+)",
            text,
        )

        for value in matches:
            product_id = int(
                value
            )

            if product_id not in ids:
                ids.append(
                    product_id
                )

        # ----------------------------------------------------
        # Comparison shorthand
        # ----------------------------------------------------

        if (
            not ids
            and re.search(
                r"\b(?:compare|vs|versus)\b",
                text,
            )
        ):
            numbers = re.findall(
                r"\b\d+\b",
                text,
            )

            for value in numbers[:4]:
                product_id = int(
                    value
                )

                if product_id not in ids:
                    ids.append(
                        product_id
                    )

        return ids[:4]

    # ========================================================
    # PRODUCT ID VALIDATION
    # ========================================================

    @staticmethod
    def _normalize_product_ids(
        product_ids: list[int] | None,
    ) -> list[int]:
        """
        Normalize, validate and deduplicate product IDs.
        """

        if not product_ids:
            return []

        normalized: list[int] = []

        for product_id in product_ids:
            try:
                value = int(
                    product_id
                )
            except (
                TypeError,
                ValueError,
            ):
                continue

            if value <= 0:
                continue

            if value not in normalized:
                normalized.append(
                    value
                )

        return normalized[:4]

    # ========================================================
    # PRODUCT SUMMARY
    # ========================================================

    def _build_single_product_summary(
        self,
        product: dict[str, Any],
        complementary: list[dict[str, Any]],
    ) -> str:
        """
        Deterministic fallback for a single product.
        """

        name = (
            self._clean_text(
                product.get("name")
            )
            or "LUXORA product"
        )

        category = (
            self._clean_text(
                product.get("category")
            )
            or "product"
        )

        price = float(
            product.get("price") or 0
        )

        rating = float(
            product.get("rating") or 0
        )

        review_count = int(
            product.get("review_count") or 0
        )

        stock = int(
            product.get("stock") or 0
        )

        description = self._clean_text(
            product.get("description")
        )

        stock_text = (
            "currently in stock"
            if stock > 0
            else "currently out of stock"
        )

        response = (
            f"{name} is a {category} product priced at "
            f"₹{price:,.0f}. It has a {rating:.1f}/5 rating "
            f"from {review_count} review"
            f"{'' if review_count == 1 else 's'} and is "
            f"{stock_text}."
        )

        if description:
            response += (
                f" {description}"
            )

        if complementary:
            names = []

            for item in complementary[:3]:
                item_name = self._clean_text(
                    item.get("name")
                )

                if item_name:
                    names.append(
                        item_name
                    )

            if names:
                response += (
                    " You may also consider: "
                    + ", ".join(names)
                    + "."
                )

        return response

    # ========================================================
    # COMPARISON SUMMARY
    # ========================================================

    def _build_comparison_summary(
        self,
        products: list[dict[str, Any]],
    ) -> str:
        """
        Deterministic comparison fallback.
        """

        if not products:
            return (
                "I couldn't find the products you asked "
                "me to compare."
            )

        if len(products) == 1:
            return (
                f"I found only one matching product: "
                f"{products[0]['name']}. "
                "Please provide another product to compare."
            )

        lines = [
            "Here is a factual LUXORA comparison:"
        ]

        for product in products:
            name = (
                self._clean_text(
                    product.get("name")
                )
                or "LUXORA product"
            )

            price = float(
                product.get("price") or 0
            )

            rating = float(
                product.get("rating") or 0
            )

            review_count = int(
                product.get("review_count") or 0
            )

            stock = int(
                product.get("stock") or 0
            )

            lines.append(
                f"- {name}: "
                f"₹{price:,.0f}, "
                f"{rating:.1f}/5 rating, "
                f"{review_count} reviews, "
                f"{stock} in stock."
            )

        cheapest = min(
            products,
            key=lambda item: float(
                item.get("price") or 0
            ),
        )

        highest_rated = max(
            products,
            key=lambda item: float(
                item.get("rating") or 0
            ),
        )

        lines.append(
            f"Best price: {cheapest['name']}."
        )

        lines.append(
            f"Highest rating: {highest_rated['name']}."
        )

        return "\n".join(
            lines
        )

    # ========================================================
    # BUILD PRODUCT CONTEXT
    # ========================================================

    @staticmethod
    def _build_product_context(
        products: list[dict[str, Any]],
    ) -> str:
        """
        Create safe JSON context for Grok.
        """

        return json.dumps(
            products,
            ensure_ascii=False,
        )

    # ========================================================
    # SINGLE PRODUCT ANSWER
    # ========================================================

    def answer(
        self,
        message: str,
        product_id: int,
    ) -> dict[str, Any]:
        """
        Answer a question about one real LUXORA product.
        """

        try:
            resolved_id = int(
                product_id
            )
        except (
            TypeError,
            ValueError,
        ):
            resolved_id = 0

        if resolved_id <= 0:
            return {
                "agent": "product",
                "message": (
                    "I couldn't identify a valid "
                    "LUXORA product."
                ),
                "products": [],
                "constraints": {},
            }

        # ----------------------------------------------------
        # DATABASE PRODUCT
        # ----------------------------------------------------

        product = get_product(
            self.db,
            resolved_id,
        )

        if not product:
            return {
                "agent": "product",
                "message": (
                    "I couldn't find that LUXORA product "
                    "in the current catalog."
                ),
                "products": [],
                "constraints": {
                    "product_id": resolved_id,
                    "comparison": False,
                },
            }

        # ----------------------------------------------------
        # COMPLEMENTARY PRODUCTS
        # ----------------------------------------------------

        complementary = (
            get_complementary_products(
                self.db,
                product,
            )
        )

        # ----------------------------------------------------
        # FALLBACK
        # ----------------------------------------------------

        fallback = (
            self._build_single_product_summary(
                product,
                complementary,
            )
        )

        # ----------------------------------------------------
        # LLM CONTEXT
        # ----------------------------------------------------

        context = self._build_product_context(
            [
                product,
                *complementary,
            ]
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Product Intelligence Agent.

CUSTOMER QUESTION:
{message}

REAL LUXORA PRODUCT DATA:
{context}

The first product in the list is the primary product
being discussed.

Rules:

1. Use ONLY the supplied catalog data.
2. Never invent specifications.
3. Never invent materials.
4. Never invent dimensions.
5. Never invent technologies.
6. Never invent guarantees.
7. Never invent colors.
8. Never invent sizes.
9. Never invent prices.
10. Never invent stock information.
11. Never invent benefits.
12. You may mention complementary products only when
    they are included in the supplied data.
13. Answer the customer's actual question directly.
14. Keep the answer concise.
15. Do not output JSON.
16. Never claim an order was placed.
17. Never claim payment succeeded.
18. Never claim a transaction happened.

This may be a conversational follow-up. Use the supplied
customer question exactly as the current request.

Return a premium, factual LUXORA product answer.
"""

        try:
            explanation = (
                luxora_llm.invoke(
                    prompt
                )
            )
        except Exception as error:
            print(
                "LUXORA PRODUCT AGENT LLM ERROR:",
                type(error).__name__,
                str(error),
            )

            explanation = ""

        if not explanation:
            explanation = fallback

        return {
            "agent": "product",
            "message": explanation,
            "products": [
                product,
                *complementary,
            ],
            "constraints": {
                "product_id": resolved_id,
                "comparison": False,
            },
        }

    # ========================================================
    # COMPARISON
    # ========================================================

    def compare(
        self,
        message: str,
        product_ids: list[int] | None = None,
    ) -> dict[str, Any]:
        """
        Compare up to four real LUXORA products.
        """

        ids = (
            self._normalize_product_ids(
                product_ids
            )
            if product_ids is not None
            else self._extract_product_ids(
                message
            )
        )

        if len(ids) < 2:
            return {
                "agent": "product",
                "message": (
                    "Please provide at least two LUXORA "
                    "products to compare. For example: "
                    "'Compare product 1 and product 5'."
                ),
                "products": [],
                "constraints": {
                    "comparison": True,
                    "product_ids": ids,
                },
            }

        # ----------------------------------------------------
        # LOAD REAL PRODUCTS
        # ----------------------------------------------------

        products = compare_products(
            self.db,
            ids,
        )

        # ----------------------------------------------------
        # MISSING PRODUCT
        # ----------------------------------------------------

        if len(products) < 2:
            return {
                "agent": "product",
                "message": (
                    "I could not find all the products "
                    "you asked me to compare."
                ),
                "products": products,
                "constraints": {
                    "comparison": True,
                    "product_ids": ids,
                },
            }

        # ----------------------------------------------------
        # FALLBACK
        # ----------------------------------------------------

        fallback = (
            self._build_comparison_summary(
                products
            )
        )

        # ----------------------------------------------------
        # LLM CONTEXT
        # ----------------------------------------------------

        context = (
            self._build_product_context(
                products
            )
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Product Comparison Agent.

CUSTOMER REQUEST:
{message}

REAL LUXORA PRODUCTS:
{context}

Compare ONLY the supplied products.

Rules:

1. Use only the supplied product data.
2. Never invent specifications.
3. Never invent materials.
4. Never invent dimensions.
5. Never invent features.
6. Never invent benefits.
7. Never invent prices.
8. Never invent stock.
9. Never invent availability.
10. Clearly explain meaningful differences.
11. Mention price where useful.
12. Mention rating where useful.
13. Give a clear conclusion when the data supports one.
14. Do not pretend subjective preferences are factual.
15. Do not output JSON.
16. Never claim an order was placed.
17. Never claim payment succeeded.

Keep the comparison concise and useful.
"""

        try:
            explanation = (
                luxora_llm.invoke(
                    prompt
                )
            )
        except Exception as error:
            print(
                "LUXORA PRODUCT COMPARISON LLM ERROR:",
                type(error).__name__,
                str(error),
            )

            explanation = ""

        if not explanation:
            explanation = fallback

        return {
            "agent": "product",
            "message": explanation,
            "products": products,
            "constraints": {
                "product_ids": ids,
                "comparison": True,
            },
        }

    # ========================================================
    # PRODUCT FROM NATURAL-LANGUAGE MESSAGE
    # ========================================================

    def run(
        self,
        message: str,
        product_id: int | None = None,
    ) -> dict[str, Any]:
        """
        Smart Product Agent entry point.

        Supports:

        - direct product questions
        - comparisons
        - contextualized follow-ups
        """

        clean_message = (
            self._clean_text(
                message
            )
        )

        if not clean_message:
            return {
                "agent": "product",
                "message": (
                    "Tell me which LUXORA product "
                    "you'd like to know more about."
                ),
                "products": [],
                "constraints": {},
            }

        # ----------------------------------------------------
        # EXTRACT EXPLICIT IDs
        # ----------------------------------------------------

        ids = self._extract_product_ids(
            clean_message
        )

        # ----------------------------------------------------
        # COMPARISON
        # ----------------------------------------------------

        if len(ids) >= 2:
            return self.compare(
                message=clean_message,
                product_ids=ids,
            )

        # ----------------------------------------------------
        # RESOLVED PRODUCT ID
        # ----------------------------------------------------

        resolved_product_id = (
            product_id
            if product_id is not None
            else (
                ids[0]
                if ids
                else None
            )
        )

        # ----------------------------------------------------
        # NO PRODUCT
        # ----------------------------------------------------

        if resolved_product_id is None:
            return {
                "agent": "product",
                "message": (
                    "Tell me which LUXORA product "
                    "you'd like to know more about. "
                    "For example: "
                    "'Tell me about product 1'."
                ),
                "products": [],
                "constraints": {},
            }

        # ----------------------------------------------------
        # SINGLE PRODUCT
        # ----------------------------------------------------

        return self.answer(
            message=clean_message,
            product_id=resolved_product_id,
        )