from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy.orm import Session

from ..llm import luxora_llm
from ..prompts import SYSTEM_PROMPT
from ..tools import rank_products, search_products


class ShoppingAgent:
    """
    LUXORA Shopping Agent.

    Responsibilities:
    - understand natural-language shopping requests
    - extract budget constraints
    - detect the requested product category
    - build useful catalog-search terms
    - search the real LUXORA database
    - rank actual LUXORA products
    - use Grok only to explain the results

    Important:
    Product information always comes from the LUXORA database.
    The LLM does not decide which products exist.
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # BUDGET EXTRACTION
    # ========================================================

    def _extract_budget(
        self,
        text: str,
    ) -> float | None:
        """
        Extract a maximum budget from natural-language text.

        Examples:

        "under ₹3000"
        "below ₹5,000"
        "less than Rs 4000"
        "maximum ₹20,000"
        "max 10000"
        "₹2999"

        Returns:
            float | None
        """

        lowered = str(text or "").lower()

        patterns = [
            (
                r"(?:under|below|less\s+than|"
                r"maximum|max)\s*"
                r"(?:₹|rs\.?|inr)?\s*([\d,]+)"
            ),
            r"(?:₹|rs\.?|inr)\s*([\d,]+)",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                lowered,
            )

            if not match:
                continue

            try:
                value = float(
                    match.group(1).replace(
                        ",",
                        "",
                    )
                )

                if value >= 0:
                    return value

            except (
                ValueError,
                TypeError,
            ):
                continue

        return None

    # ========================================================
    # CATEGORY DETECTION
    # ========================================================

    def _detect_category(
        self,
        text: str,
    ) -> str | None:
        """
        Detect the primary product category.

        Product/category terms are intentionally checked before
        lifestyle/use-case terms such as "travel".

        This prevents:

            "premium watch for travel"

        from being incorrectly classified as Travel.
        """

        lowered = str(text or "").lower()

        # ----------------------------------------------------
        # Product-first category detection
        # ----------------------------------------------------

        category_keywords = {
            "Timepieces": [
                "watch",
                "watches",
                "timepiece",
                "timepieces",
                "chronograph",
                "chrono",
            ],
            "Footwear": [
                "shoe",
                "shoes",
                "sneaker",
                "sneakers",
                "runner",
                "runners",
                "footwear",
            ],
            "Travel": [
                "weekender",
                "luggage",
                "travel bag",
                "travel",
            ],
            "Accessories": [
                "bag",
                "bags",
                "leather",
                "tote",
                "wallet",
                "accessory",
                "accessories",
            ],
        }

        detected_categories: list[str] = []

        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in lowered:
                    detected_categories.append(
                        category
                    )
                    break

        # ----------------------------------------------------
        # Prefer explicit product categories.
        #
        # Example:
        # "watch for travel"
        # -> Timepieces
        # ----------------------------------------------------

        if "Timepieces" in detected_categories:
            return "Timepieces"

        if "Footwear" in detected_categories:
            return "Footwear"

        if "Accessories" in detected_categories:
            return "Accessories"

        if "Travel" in detected_categories:
            return "Travel"

        return None

    # ========================================================
    # SEARCH QUERY BUILDING
    # ========================================================

    def _build_search_query(
        self,
        text: str,
    ) -> str:
        """
        Remove conversational filler and price-related words,
        leaving useful search terms.

        Example:

            "Find me a premium watch under ₹20,000 for travel"

        becomes approximately:

            "watch travel"
        """

        stop_words = {
            # Conversation
            "find",
            "me",
            "need",
            "want",
            "looking",
            "look",
            "for",
            "something",
            "please",
            "show",
            "get",
            "give",
            "some",
            "help",

            # Articles / conjunctions
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "to",
            "of",
            "with",

            # Pricing
            "under",
            "below",
            "less",
            "than",
            "maximum",
            "max",

            # Generic quality words
            "best",
            "good",
            "great",
            "nice",
            "premium",
            "quality",
            "affordable",

            # User references
            "my",
            "i",
            "me",
            "want",
        }

        words = re.findall(
            r"[a-zA-Z]+",
            str(text or "").lower(),
        )

        useful_words = [
            word
            for word in words
            if word not in stop_words
            and len(word) > 2
        ]

        return " ".join(
            useful_words[:10]
        )

    # ========================================================
    # SEARCH
    # ========================================================

    def search(
        self,
        message: str,
    ) -> dict[str, Any]:
        """
        Execute the LUXORA shopping workflow.

        Flow:

        Customer request
             ↓
        Extract budget
             ↓
        Detect category
             ↓
        Build query
             ↓
        Search database
             ↓
        Rank products
             ↓
        Send verified product context to Grok
             ↓
        Return products + explanation
        """

        clean_message = str(
            message or ""
        ).strip()

        # ----------------------------------------------------
        # EMPTY REQUEST
        # ----------------------------------------------------

        if not clean_message:
            return {
                "agent": "shopping",
                "message": (
                    "Tell me what you're looking for "
                    "and I'll help you find it."
                ),
                "products": [],
                "constraints": {},
            }

        # ====================================================
        # 1. EXTRACT CUSTOMER INTENT SIGNALS
        # ====================================================

        budget = self._extract_budget(
            clean_message,
        )

        category = self._detect_category(
            clean_message,
        )

        query = self._build_search_query(
            clean_message,
        )

        # ====================================================
        # 2. SEARCH REAL LUXORA DATABASE
        # ====================================================

        candidates = search_products(
            db=self.db,
            query=query,
            category=category,
            max_price=budget,
        )

        # ====================================================
        # 3. RANK ACTUAL PRODUCTS
        # ====================================================

        ranked = rank_products(
            products=candidates,
            query=clean_message,
            category=category,
            max_price=budget,
        )

        top_products = ranked[:4]

        # ====================================================
        # 4. FALLBACK SEARCH
        #
        # If the strict query gives nothing, search by category
        # and provide the closest real alternatives.
        # ====================================================

        if not top_products and category:
            fallback = search_products(
                db=self.db,
                category=category,
            )

            ranked = rank_products(
                products=fallback,
                query=clean_message,
                category=category,
                max_price=budget,
            )

            top_products = ranked[:4]

        # ====================================================
        # 5. GLOBAL FALLBACK
        #
        # If no category was detected or category search failed,
        # search the complete catalog.
        # ====================================================

        if not top_products:
            fallback = search_products(
                db=self.db,
            )

            ranked = rank_products(
                products=fallback,
                query=clean_message,
                category=category,
                max_price=budget,
            )

            top_products = ranked[:4]

        # ====================================================
        # 6. NOTHING FOUND
        # ====================================================

        if not top_products:
            return {
                "agent": "shopping",
                "message": (
                    "I couldn't find a close match in the "
                    "current LUXORA catalog. Try adjusting "
                    "your budget or describing what you need "
                    "in a little more detail."
                ),
                "products": [],
                "constraints": {
                    "budget": budget,
                    "category": category,
                    "query": query,
                },
            }

        # ====================================================
        # 7. PREPARE VERIFIED CATALOG CONTEXT
        # ====================================================

        catalog_context = json.dumps(
            top_products,
            ensure_ascii=False,
        )

        # ====================================================
        # 8. GROK EXPLANATION PROMPT
        # ====================================================

        prompt = f"""
{SYSTEM_PROMPT}

You are the LUXORA Shopping Agent.

Customer request:
{clean_message}

Structured signals extracted by LUXORA:
- budget: {budget}
- category: {category}
- search query: {query}

REAL LUXORA CATALOG RESULTS:
{catalog_context}

Rules:

1. Recommend ONLY products present in the supplied
   REAL LUXORA CATALOG RESULTS.
2. Never invent product names.
3. Never invent prices.
4. Never invent stock information.
5. Never invent specifications or features.
6. Respect the customer's stated budget.
7. Explain briefly why the strongest matches are relevant.
8. Mention when the result is an approximate match.
9. Do not claim that an order was created.
10. Do not claim that payment was completed.
11. Do not output JSON.
12. Keep the response concise.
13. Sound like a premium, intelligent LUXORA commerce assistant.

Preferred style:

"I found 3 strong matches for what you're looking for."

Then briefly explain the strongest match and alternatives.

The frontend will display the supplied product cards separately,
so do not reproduce long product details in your response.
"""

        # ====================================================
        # 9. GROK EXPLANATION
        # ====================================================

        explanation = luxora_llm.invoke(
            prompt,
        )

        # ====================================================
        # 10. SAFE FALLBACK IF LLM RETURNS NOTHING
        # ====================================================

        if not explanation:
            if category and budget is not None:
                explanation = (
                    f"I found {len(top_products)} "
                    f"matching {category.lower()} "
                    f"products within your budget."
                )

            elif category:
                explanation = (
                    f"I found {len(top_products)} "
                    f"strong {category.lower()} "
                    f"matches from the LUXORA catalog."
                )

            else:
                explanation = (
                    f"I found {len(top_products)} "
                    "strong matches from the LUXORA catalog."
                )

        # ====================================================
        # 11. FINAL RESPONSE
        # ====================================================

        return {
            "agent": "shopping",
            "message": explanation,
            "products": top_products,
            "constraints": {
                "budget": budget,
                "category": category,
                "query": query,
            },
        }