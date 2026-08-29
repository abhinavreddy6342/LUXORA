from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import Session

from .agents.cart_agent import CartAgent
from .agents.order_agent import OrderAgent
from .agents.product_agent import ProductAgent
from .agents.recommendation_agent import RecommendationAgent
from .agents.shopping_agent import ShoppingAgent


class LuxoraOrchestrator:
    """
    Central orchestration layer for LUXORA AI.

    Responsibilities:
    - detect customer intent
    - extract product references
    - route simple requests to one specialized agent
    - execute multi-agent workflows when required
    - pass results from one agent to another
    - combine multiple agent results
    - expose agent execution metadata to the frontend

    The orchestrator itself does not call the LLM directly.
    """

    AGENT_NAMES = {
        "shopping": "Shopping Agent",
        "product": "Product Agent",
        "recommendation": "Recommendation Agent",
        "cart": "Cart Agent",
        "order": "Order Agent",
    }

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # INTENT DETECTION
    # ========================================================

    def _detect_intent(
        self,
        message: str,
    ) -> str:
        intents = self._detect_intents(
            message
        )

        if not intents:
            return "shopping"

        return intents[0]

    # ========================================================
    # MULTI-INTENT DETECTION
    # ========================================================

    def _detect_intents(
        self,
        message: str,
    ) -> list[str]:
        text = str(
            message or ""
        ).strip().lower()

        if not text:
            return []

        detected: list[str] = []

        # ----------------------------------------------------
        # CART
        # ----------------------------------------------------

        cart_patterns = [
            "my cart",
            "in my cart",
            "cart insight",
            "cart analysis",
            "analyze my cart",
            "analyse my cart",
            "improve my cart",
            "what goes with my cart",
            "what should i add to my cart",
            "help with my cart",
            "cart items",
        ]

        if any(
            phrase in text
            for phrase in cart_patterns
        ):
            detected.append("cart")

        # ----------------------------------------------------
        # ORDER
        # ----------------------------------------------------

        order_patterns = [
            "checkout",
            "ready to buy",
            "ready to purchase",
            "order summary",
            "prepare my order",
            "continue to payment",
            "continue checkout",
            "what is my total",
            "my order total",
            "total for my cart",
            "place my order",
            "complete my order",
        ]

        if any(
            phrase in text
            for phrase in order_patterns
        ):
            detected.append("order")

        # ----------------------------------------------------
        # PRODUCT
        # ----------------------------------------------------

        product_patterns = [
            "compare",
            "comparison",
            "which is better",
            "which one is better",
            "difference between",
            "versus",
            "tell me about product",
            "tell me about item",
            "about product",
            "about item",
            "product details",
            "product information",
            "is this good",
            "is this suitable",
            "why this product",
            "what is this product",
            "how is this product",
        ]

        if any(
            phrase in text
            for phrase in product_patterns
        ):
            detected.append("product")

        # ----------------------------------------------------
        # RECOMMENDATION
        # ----------------------------------------------------

        recommendation_patterns = [
            "recommend",
            "recommendation",
            "recommend something",
            "pair with",
            "goes with",
            "complement",
            "complements",
            "complete the look",
            "what should i add",
            "what should i buy with",
            "what can i pair",
            "matching products",
            "suggest something",
            "suggest a product",
            "what matches",
            "what would go well",
        ]

        if any(
            phrase in text
            for phrase in recommendation_patterns
        ):
            detected.append(
                "recommendation"
            )

        # ----------------------------------------------------
        # SHOPPING
        # ----------------------------------------------------

        shopping_patterns = [
            "find",
            "show me",
            "looking for",
            "i need",
            "i want",
            "search for",
            "shop for",
            "looking to buy",
            "something under",
            "something below",
            "products under",
            "products below",
            "buy me",
        ]

        has_product_language = any(
            keyword in text
            for keyword in [
                "watch",
                "watches",
                "timepiece",
                "shoe",
                "shoes",
                "sneaker",
                "sneakers",
                "runner",
                "bag",
                "bags",
                "leather",
                "tote",
                "wallet",
                "travel",
                "weekender",
                "luggage",
                "footwear",
                "accessories",
            ]
        )

        if (
            any(
                phrase in text
                for phrase in shopping_patterns
            )
            and has_product_language
        ):
            detected.append(
                "shopping"
            )

        # ----------------------------------------------------
        # DEFAULT
        # ----------------------------------------------------

        if not detected:
            detected.append(
                "shopping"
            )

        # ----------------------------------------------------
        # EXECUTION PRIORITY
        # ----------------------------------------------------

        priority = {
            "shopping": 1,
            "product": 2,
            "cart": 3,
            "recommendation": 4,
            "order": 5,
        }

        detected = list(
            dict.fromkeys(detected)
        )

        detected.sort(
            key=lambda intent: priority.get(
                intent,
                99,
            )
        )

        return detected

    # ========================================================
    # PRODUCT ID EXTRACTION
    # ========================================================

    def _extract_product_id(
        self,
        message: str,
    ) -> int | None:
        text = str(
            message or ""
        ).lower()

        match = re.search(
            r"(?:product|item)\s*[#/:\-]?\s*(\d+)",
            text,
        )

        if match:
            return int(
                match.group(1)
            )

        return None

    # ========================================================
    # MULTIPLE PRODUCT ID EXTRACTION
    # ========================================================

    def _extract_product_ids(
        self,
        message: str,
    ) -> list[int]:
        text = str(
            message or ""
        ).lower()

        ids: list[int] = []

        explicit_matches = re.findall(
            r"(?:product|item)\s*[#/:\-]?\s*(\d+)",
            text,
        )

        for value in explicit_matches:
            product_id = int(value)

            if product_id not in ids:
                ids.append(
                    product_id
                )

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
    # AGENT METADATA
    # ========================================================

    def _agent_metadata(
        self,
        agent: str,
        status: str,
    ) -> dict[str, str]:
        return {
            "agent": agent,
            "name": self.AGENT_NAMES.get(
                agent,
                agent.title(),
            ),
            "status": status,
        }

    # ========================================================
    # SINGLE AGENT EXECUTION
    # ========================================================

    def _run_single_agent(
        self,
        intent: str,
        message: str,
        user_id: int | None,
        product_id: int | None,
        product_ids: list[int],
    ) -> dict[str, Any]:

        # ====================================================
        # SHOPPING
        # ====================================================

        if intent == "shopping":
            return ShoppingAgent(
                self.db
            ).search(
                message
            )

        # ====================================================
        # CART
        # ====================================================

        if intent == "cart":
            if user_id is None:
                return {
                    "agent": "cart",
                    "message": (
                        "Please sign in so I can analyze "
                        "your personal LUXORA cart."
                    ),
                    "products": [],
                    "constraints": {
                        "requires_authentication": True,
                    },
                }

            return CartAgent(
                self.db
            ).analyze(
                user_id
            )

        # ====================================================
        # ORDER
        # ====================================================

        if intent == "order":
            if user_id is None:
                return {
                    "agent": "order",
                    "message": (
                        "Please sign in before I prepare "
                        "your personalized order summary."
                    ),
                    "products": [],
                    "constraints": {
                        "requires_authentication": True,
                    },
                }

            return OrderAgent(
                self.db
            ).summarize(
                user_id
            )

        # ====================================================
        # PRODUCT
        # ====================================================

        if intent == "product":
            agent = ProductAgent(
                self.db
            )

            if len(
                product_ids
            ) >= 2:
                return agent.compare(
                    message=message,
                    product_ids=product_ids,
                )

            if product_id is not None:
                return agent.answer(
                    message=message,
                    product_id=product_id,
                )

            return {
                "agent": "product",
                "message": (
                    "Tell me which LUXORA product "
                    "you want to know more about. "
                    "For example: 'Tell me about product 1'."
                ),
                "products": [],
                "constraints": {},
            }

        # ====================================================
        # RECOMMENDATION
        # ====================================================

        if intent == "recommendation":
            if product_id is None:
                return {
                    "agent": "recommendation",
                    "message": (
                        "Tell me which LUXORA product "
                        "you're considering and I can "
                        "recommend complementary products."
                    ),
                    "products": [],
                    "constraints": {},
                }

            return RecommendationAgent(
                self.db
            ).recommend(
                product_id
            )

        # ====================================================
        # UNKNOWN
        # ====================================================

        return {
            "agent": "shopping",
            "message": (
                "Tell me what you're looking for "
                "and I'll help you find it."
            ),
            "products": [],
            "constraints": {},
        }

    # ========================================================
    # MERGE PRODUCTS
    # ========================================================

    def _merge_products(
        self,
        results: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        merged: list[
            dict[str, Any]
        ] = []

        seen_ids: set[int] = set()

        for result in results:
            products = result.get(
                "products",
                [],
            )

            if not isinstance(
                products,
                list,
            ):
                continue

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

                merged.append(
                    product
                )

        return merged[:8]

    # ========================================================
    # COMBINE MESSAGES
    # ========================================================

    def _combine_messages(
        self,
        results: list[dict[str, Any]],
    ) -> str:

        valid_messages: list[str] = []

        for result in results:
            message = str(
                result.get(
                    "message",
                    "",
                )
                or ""
            ).strip()

            if not message:
                continue

            if message in valid_messages:
                continue

            valid_messages.append(
                message
            )

        if not valid_messages:
            return (
                "LUXORA AI processed your request, "
                "but there is no additional information "
                "to display right now."
            )

        if len(
            valid_messages
        ) == 1:
            return valid_messages[0]

        return "\n\n".join(
            valid_messages
        )

    # ========================================================
    # BUILD AGENT CHAIN
    # ========================================================

    def _build_agent_chain(
        self,
        intents: list[str],
    ) -> list[dict[str, str]]:

        return [
            self._agent_metadata(
                intent,
                "completed",
            )
            for intent in intents
        ]

    # ========================================================
    # MULTI-AGENT HANDOFF
    # ========================================================

    def _run_multi_agent(
        self,
        message: str,
        intents: list[str],
        user_id: int | None,
        product_id: int | None,
        product_ids: list[int],
    ) -> dict[str, Any]:
        """
        Execute a true sequential multi-agent workflow.

        Important:

        The output of one agent becomes the input/context
        for the next agent whenever possible.

        Example:

            Shopping Agent
                ↓
            discovered products
                ↓
            Recommendation Agent
                ↓
            complementary products
        """

        results: list[
            dict[str, Any]
        ] = []

        agent_execution: list[
            dict[str, Any]
        ] = []

        # Product context discovered during the workflow.
        discovered_products: list[
            dict[str, Any]
        ] = []

        # Current primary product that downstream agents
        # can use.
        handoff_product_id = (
            product_id
        )

        # ----------------------------------------------------
        # EXECUTE EACH AGENT
        # ----------------------------------------------------

        for intent in intents:
            execution = self._agent_metadata(
                intent,
                "responding",
            )

            agent_execution.append(
                execution
            )

            # =================================================
            # SHOPPING
            # =================================================

            if intent == "shopping":
                result = ShoppingAgent(
                    self.db
                ).search(
                    message
                )

                results.append(
                    result
                )

                shopping_products = (
                    result.get(
                        "products",
                        [],
                    )
                )

                if isinstance(
                    shopping_products,
                    list,
                ):
                    discovered_products = [
                        product
                        for product in shopping_products
                        if isinstance(
                            product,
                            dict,
                        )
                    ]

                    if (
                        discovered_products
                    ):
                        first_product = (
                            discovered_products[
                                0
                            ]
                        )

                        first_product_id = (
                            first_product.get(
                                "id"
                            )
                        )

                        if (
                            first_product_id
                            is not None
                        ):
                            try:
                                handoff_product_id = (
                                    int(
                                        first_product_id
                                    )
                                )
                            except (
                                TypeError,
                                ValueError,
                            ):
                                pass

                agent_execution[-1] = (
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                )

                continue

            # =================================================
            # RECOMMENDATION
            # =================================================

            if intent == "recommendation":

                recommendation_agent = (
                    RecommendationAgent(
                        self.db
                    )
                )

                # ------------------------------------------------
                # TRUE SHOPPING → RECOMMENDATION HANDOFF
                # ------------------------------------------------

                if (
                    discovered_products
                ):
                    result = (
                        recommendation_agent.recommend_from_products(
                            products=discovered_products,
                            customer_message=message,
                        )
                    )

                elif (
                    handoff_product_id
                    is not None
                ):
                    result = (
                        recommendation_agent.recommend(
                            handoff_product_id
                        )
                    )

                else:
                    result = {
                        "agent": "recommendation",
                        "message": (
                            "Tell me which LUXORA product "
                            "you're considering and I can "
                            "recommend complementary products."
                        ),
                        "products": [],
                        "constraints": {},
                    }

                results.append(
                    result
                )

                agent_execution[-1] = (
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                )

                continue

            # =================================================
            # CART
            # =================================================

            if intent == "cart":

                if user_id is None:
                    result = {
                        "agent": "cart",
                        "message": (
                            "Please sign in so I can analyze "
                            "your personal LUXORA cart."
                        ),
                        "products": [],
                        "constraints": {
                            "requires_authentication": True,
                        },
                    }
                else:
                    result = CartAgent(
                        self.db
                    ).analyze(
                        user_id
                    )

                results.append(
                    result
                )

                # If the Cart Agent provides products,
                # retain them as workflow context.
                cart_products = (
                    result.get(
                        "products",
                        [],
                    )
                )

                if isinstance(
                    cart_products,
                    list,
                ) and cart_products:
                    discovered_products.extend(
                        product
                        for product in cart_products
                        if isinstance(
                            product,
                            dict,
                        )
                    )

                agent_execution[-1] = (
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                )

                continue

            # =================================================
            # PRODUCT
            # =================================================

            if intent == "product":

                product_agent = (
                    ProductAgent(
                        self.db
                    )
                )

                if len(
                    product_ids
                ) >= 2:
                    result = (
                        product_agent.compare(
                            message=message,
                            product_ids=product_ids,
                        )
                    )

                elif (
                    handoff_product_id
                    is not None
                ):
                    result = (
                        product_agent.answer(
                            message=message,
                            product_id=handoff_product_id,
                        )
                    )

                else:
                    result = {
                        "agent": "product",
                        "message": (
                            "Tell me which LUXORA product "
                            "you want to know more about."
                        ),
                        "products": [],
                        "constraints": {},
                    }

                results.append(
                    result
                )

                product_results = (
                    result.get(
                        "products",
                        [],
                    )
                )

                if isinstance(
                    product_results,
                    list,
                ):
                    discovered_products.extend(
                        product
                        for product in product_results
                        if isinstance(
                            product,
                            dict,
                        )
                    )

                agent_execution[-1] = (
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                )

                continue

            # =================================================
            # ORDER
            # =================================================

            if intent == "order":

                if user_id is None:
                    result = {
                        "agent": "order",
                        "message": (
                            "Please sign in before I prepare "
                            "your personalized order summary."
                        ),
                        "products": [],
                        "constraints": {
                            "requires_authentication": True,
                        },
                    }
                else:
                    result = OrderAgent(
                        self.db
                    ).summarize(
                        user_id
                    )

                results.append(
                    result
                )

                agent_execution[-1] = (
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                )

                continue

            # =================================================
            # FALLBACK
            # =================================================

            result = self._run_single_agent(
                intent=intent,
                message=message,
                user_id=user_id,
                product_id=handoff_product_id,
                product_ids=product_ids,
            )

            results.append(
                result
            )

            agent_execution[-1] = (
                self._agent_metadata(
                    intent,
                    "completed",
                )
            )

        # ----------------------------------------------------
        # MERGE
        # ----------------------------------------------------

        combined_message = (
            self._combine_messages(
                results
            )
        )

        products = (
            self._merge_products(
                results
            )
        )

        constraints: dict[str, Any] = {
            "multi_agent": True,
            "agent_count": len(
                intents
            ),
            "agents": intents,
        }

        # ----------------------------------------------------
        # PRESERVE AGENT DATA
        # ----------------------------------------------------

        for result in results:
            result_constraints = (
                result.get(
                    "constraints"
                )
            )

            if isinstance(
                result_constraints,
                dict,
            ):
                for key, value in (
                    result_constraints.items()
                ):
                    if key not in constraints:
                        constraints[
                            key
                        ] = value

        # ----------------------------------------------------
        # PRIMARY AGENT
        # ----------------------------------------------------

        primary_agent = (
            intents[0]
            if intents
            else "shopping"
        )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return {
            "agent": primary_agent,
            "message": combined_message,
            "products": products,
            "constraints": constraints,
            "agents": intents,
            "agent_chain": agent_execution,
            "results": results,
        }

    # ========================================================
    # RUN
    # ========================================================

    def run(
        self,
        message: str,
        user_id: int | None = None,
        product_id: int | None = None,
    ) -> dict[str, Any]:

        clean_message = str(
            message or ""
        ).strip()

        if not clean_message:
            return {
                "agent": "shopping",
                "message": (
                    "Tell me what you're looking for "
                    "and I'll help you find it."
                ),
                "products": [],
                "constraints": {},
                "agents": [
                    "shopping",
                ],
                "agent_chain": [
                    self._agent_metadata(
                        "shopping",
                        "completed",
                    )
                ],
            }

        # ----------------------------------------------------
        # INTENTS
        # ----------------------------------------------------

        intents = self._detect_intents(
            clean_message
        )

        if not intents:
            intents = [
                "shopping"
            ]

        # ----------------------------------------------------
        # PRODUCT IDS
        # ----------------------------------------------------

        extracted_product_ids = (
            self._extract_product_ids(
                clean_message
            )
        )

        resolved_product_id = (
            product_id
            if product_id is not None
            else (
                extracted_product_ids[0]
                if extracted_product_ids
                else None
            )
        )

        # ----------------------------------------------------
        # FORCE PRODUCT COMPARISON
        # ----------------------------------------------------

        if len(
            extracted_product_ids
        ) >= 2:

            if "product" not in intents:
                intents.insert(
                    0,
                    "product",
                )

            # A pure comparison should not trigger
            # unrelated agents.
            has_other_action = any(
                intent in intents
                for intent in [
                    "shopping",
                    "recommendation",
                    "cart",
                    "order",
                ]
            )

            if not has_other_action:
                intents = [
                    "product"
                ]

        # ----------------------------------------------------
        # SINGLE AGENT
        # ----------------------------------------------------

        if len(
            intents
        ) == 1:

            intent = intents[0]

            result = self._run_single_agent(
                intent=intent,
                message=clean_message,
                user_id=user_id,
                product_id=resolved_product_id,
                product_ids=extracted_product_ids,
            )

            result.setdefault(
                "agent",
                intent,
            )

            result.setdefault(
                "agents",
                [
                    intent
                ],
            )

            result.setdefault(
                "agent_chain",
                [
                    self._agent_metadata(
                        intent,
                        "completed",
                    )
                ],
            )

            result.setdefault(
                "constraints",
                {},
            )

            return result

        # ----------------------------------------------------
        # MULTI-AGENT
        # ----------------------------------------------------

        return self._run_multi_agent(
            message=clean_message,
            intents=intents,
            user_id=user_id,
            product_id=resolved_product_id,
            product_ids=extracted_product_ids,
        )