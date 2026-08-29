from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..llm import luxora_llm
from ..prompts import SYSTEM_PROMPT
from ..tools import (
    get_complementary_products,
    get_product,
)


class RecommendationAgent:
    """
    LUXORA Recommendation Agent.

    Responsibilities:
    - recommend products related to a selected product
    - accept products discovered by another agent
    - use only products from the real LUXORA catalog
    - explain why products complement the selected item
    - provide deterministic fallbacks when needed
    - never invent catalog information
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # HELPERS
    # ========================================================

    @staticmethod
    def _clean_text(
        value: Any,
    ) -> str:
        return str(
            value or ""
        ).strip()

    # ========================================================
    # DETERMINISTIC FALLBACK
    # ========================================================

    def _build_fallback_message(
        self,
        product: dict[str, Any],
        recommendations: list[dict[str, Any]],
    ) -> str:
        product_name = self._clean_text(
            product.get("name")
        ) or "this product"

        if not recommendations:
            return (
                f"I couldn't find a strong complementary "
                f"product for {product_name} in the current "
                f"LUXORA catalog."
            )

        lines = [
            (
                f"For {product_name}, these LUXORA products "
                "could complement your selection:"
            )
        ]

        for item in recommendations[:4]:
            name = self._clean_text(
                item.get("name")
            ) or "LUXORA product"

            category = self._clean_text(
                item.get("category")
            ) or "LUXORA"

            price = float(
                item.get("price") or 0
            )

            lines.append(
                f"- {name} ({category}) — "
                f"₹{price:,.0f}"
            )

        return "\n".join(lines)

    # ========================================================
    # GET RECOMMENDATIONS FOR A REAL PRODUCT
    # ========================================================

    def _get_recommendations_for_product(
        self,
        product: dict[str, Any],
    ) -> list[dict[str, Any]]:
        product_id = product.get("id")

        if product_id is None:
            return []

        try:
            product_id = int(product_id)
        except (
            TypeError,
            ValueError,
        ):
            return []

        db_product = get_product(
            self.db,
            product_id,
        )

        if not db_product:
            return []

        return get_complementary_products(
            self.db,
            db_product,
        )

    # ========================================================
    # UNIQUE PRODUCTS
    # ========================================================

    @staticmethod
    def _unique_products(
        products: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        unique: list[dict[str, Any]] = []
        seen_ids: set[int] = set()

        for product in products:
            if not isinstance(
                product,
                dict,
            ):
                continue

            product_id = product.get(
                "id"
            )

            if product_id is None:
                continue

            try:
                product_id = int(
                    product_id
                )
            except (
                TypeError,
                ValueError,
            ):
                continue

            if product_id in seen_ids:
                continue

            seen_ids.add(
                product_id
            )

            unique.append(
                product
            )

        return unique

    # ========================================================
    # RECOMMEND FROM PRODUCT ID
    # ========================================================

    def recommend(
        self,
        product_id: int,
    ) -> dict[str, Any]:
        """
        Generate recommendations for one existing LUXORA product.

        This remains the standard entry point used by the
        existing orchestrator/frontend flow.
        """

        product = get_product(
            self.db,
            product_id,
        )

        if not product:
            return {
                "agent": "recommendation",
                "message": (
                    "I couldn't find that LUXORA product "
                    "in the current catalog."
                ),
                "products": [],
                "constraints": {
                    "based_on_product": product_id,
                },
            }

        recommendations = (
            get_complementary_products(
                self.db,
                product,
            )
        )

        return self._build_recommendation_response(
            product=product,
            recommendations=recommendations,
            based_on_product=product_id,
        )

    # ========================================================
    # RECOMMEND FROM ANOTHER AGENT'S PRODUCT RESULT
    # ========================================================

    def recommend_from_products(
        self,
        products: list[dict[str, Any]],
        customer_message: str = "",
    ) -> dict[str, Any]:
        """
        Generate recommendations using products discovered by
        another LUXORA agent, such as the Shopping Agent.

        Example:

        Shopping Agent discovers:
            product 5 = Mono Classic

        Recommendation Agent receives:
            [product 5]

        and finds complementary products for that result.

        This enables:

            Shopping Agent
                    ↓
            Recommendation Agent
        """

        discovered_products = self._unique_products(
            products
        )

        if not discovered_products:
            return {
                "agent": "recommendation",
                "message": (
                    "I couldn't identify a product from the "
                    "shopping results to build recommendations."
                ),
                "products": [],
                "constraints": {
                    "handoff": True,
                    "source_agent": "shopping",
                },
            }

        # ----------------------------------------------------
        # Prefer the strongest product.
        #
        # ShoppingAgent returns ranked products, so the first
        # product is normally the strongest match.
        # ----------------------------------------------------

        primary_product = discovered_products[0]

        primary_product_id = primary_product.get(
            "id"
        )

        # ----------------------------------------------------
        # Build complementary candidates from the database.
        # ----------------------------------------------------

        recommendation_candidates: list[
            dict[str, Any]
        ] = []

        for product in discovered_products[:4]:
            recommendations = (
                self._get_recommendations_for_product(
                    product
                )
            )

            recommendation_candidates.extend(
                recommendations
            )

        recommendation_candidates = (
            self._unique_products(
                recommendation_candidates
            )
        )

        # Do not recommend products that were already
        # returned by the Shopping Agent.
        discovered_ids = {
            int(product["id"])
            for product in discovered_products
            if product.get("id") is not None
        }

        recommendation_candidates = [
            product
            for product in recommendation_candidates
            if int(product["id"])
            not in discovered_ids
        ]

        recommendation_candidates = (
            recommendation_candidates[:6]
        )

        fallback_message = (
            self._build_fallback_message(
                primary_product,
                recommendation_candidates,
            )
        )

        if not recommendation_candidates:
            return {
                "agent": "recommendation",
                "message": fallback_message,
                "products": [],
                "constraints": {
                    "based_on_product": primary_product_id,
                    "handoff": True,
                    "source_agent": "shopping",
                },
            }

        # ----------------------------------------------------
        # LLM CONTEXT
        # ----------------------------------------------------

        context = json.dumps(
            {
                "customer_message": (
                    customer_message or ""
                ),
                "selected_product": primary_product,
                "shopping_results": discovered_products[:4],
                "real_luxora_recommendations": (
                    recommendation_candidates[:4]
                ),
            },
            ensure_ascii=False,
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Recommendation Agent.

A previous LUXORA Shopping Agent has already searched
the real product catalog.

CUSTOMER REQUEST:
{customer_message}

SELECTED PRODUCT:
{json.dumps(primary_product, ensure_ascii=False)}

SHOPPING AGENT RESULTS:
{json.dumps(discovered_products[:4], ensure_ascii=False)}

REAL LUXORA COMPLEMENTARY PRODUCTS:
{json.dumps(recommendation_candidates[:4], ensure_ascii=False)}

Your task is to continue the shopping journey.

Explain which products from REAL LUXORA COMPLEMENTARY
PRODUCTS would complement the SELECTED PRODUCT.

IMPORTANT RULES:

1. Recommend ONLY products present in REAL LUXORA
   COMPLEMENTARY PRODUCTS.
2. Never invent another product.
3. Never invent prices.
4. Never invent specifications.
5. Never invent materials, colors, dimensions,
   features, benefits, stock or availability.
6. Use the customer's request as context.
7. Explain briefly WHY the recommendation complements
   the selected product.
8. Do not aggressively upsell.
9. Keep the response concise.
10. Do not output JSON.
11. Never claim an order was placed.
12. Never claim payment succeeded.

You are continuing a multi-agent LUXORA shopping workflow.
"""

        explanation = luxora_llm.invoke(
            prompt
        )

        if not explanation:
            explanation = fallback_message

        return {
            "agent": "recommendation",
            "message": explanation,
            "products": recommendation_candidates[:4],
            "constraints": {
                "based_on_product": primary_product_id,
                "handoff": True,
                "source_agent": "shopping",
            },
        }

    # ========================================================
    # BUILD STANDARD RESPONSE
    # ========================================================

    def _build_recommendation_response(
        self,
        product: dict[str, Any],
        recommendations: list[dict[str, Any]],
        based_on_product: int,
    ) -> dict[str, Any]:
        """
        Build the standard recommendation response used when
        a specific product ID is supplied directly.
        """

        recommendations = self._unique_products(
            recommendations
        )[:6]

        fallback_message = (
            self._build_fallback_message(
                product,
                recommendations,
            )
        )

        # ----------------------------------------------------
        # NO RECOMMENDATIONS
        # ----------------------------------------------------

        if not recommendations:
            return {
                "agent": "recommendation",
                "message": fallback_message,
                "products": [],
                "constraints": {
                    "based_on_product": based_on_product,
                },
            }

        # ----------------------------------------------------
        # SAFE LLM CONTEXT
        # ----------------------------------------------------

        context = json.dumps(
            {
                "main_product": product,
                "recommended_products": recommendations,
            },
            ensure_ascii=False,
        )

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Recommendation Agent.

MAIN PRODUCT:
{json.dumps(product, ensure_ascii=False)}

REAL LUXORA RECOMMENDATIONS:
{context}

Your task is to explain which products from
REAL LUXORA RECOMMENDATIONS complement the MAIN PRODUCT.

Rules:

1. Recommend ONLY products present in the supplied list.
2. Never invent products.
3. Never invent prices.
4. Never invent specifications.
5. Never invent colors, materials, sizes, features,
   benefits, or availability.
6. Explain WHY the recommendation complements
   the main product using only supplied data.
7. Do not aggressively upsell.
8. Keep the response concise.
9. Do not output JSON.
10. Never claim an order or payment occurred.

Write a premium, factual LUXORA recommendation.
"""

        explanation = luxora_llm.invoke(
            prompt
        )

        if not explanation:
            explanation = fallback_message

        return {
            "agent": "recommendation",
            "message": explanation,
            "products": recommendations[:4],
            "constraints": {
                "based_on_product": based_on_product,
            },
        }

    # ========================================================
    # SMART ENTRY POINT
    # ========================================================

    def run(
        self,
        product_id: int | None = None,
        products: list[dict[str, Any]] | None = None,
        customer_message: str = "",
    ) -> dict[str, Any]:
        """
        Unified recommendation entry point.

        Supports:

        1. Direct product:
           run(product_id=1)

        2. Shopping Agent handoff:
           run(
               products=[...],
               customer_message="..."
           )
        """

        # ----------------------------------------------------
        # MULTI-AGENT HANDOFF
        # ----------------------------------------------------

        if products:
            return self.recommend_from_products(
                products=products,
                customer_message=customer_message,
            )

        # ----------------------------------------------------
        # DIRECT PRODUCT REQUEST
        # ----------------------------------------------------

        if product_id is not None:
            return self.recommend(
                product_id
            )

        # ----------------------------------------------------
        # NOTHING PROVIDED
        # ----------------------------------------------------

        return {
            "agent": "recommendation",
            "message": (
                "Tell me which LUXORA product you're "
                "considering and I can recommend "
                "complementary products."
            ),
            "products": [],
            "constraints": {},
        }