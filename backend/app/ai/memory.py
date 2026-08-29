from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# ============================================================
# MEMORY CONFIGURATION
# ============================================================

MAX_MESSAGES_PER_SESSION = 12
MAX_PRODUCTS_PER_SESSION = 12
MAX_SESSIONS = 500


# ============================================================
# MESSAGE MODEL
# ============================================================


@dataclass
class ConversationMessage:
    role: str
    content: str

    # Products returned by the AI for this message.
    products: list[dict[str, Any]] = field(
        default_factory=list
    )

    # Agent that handled the request.
    agent: str | None = None


# ============================================================
# CONVERSATION MEMORY
# ============================================================


class LuxoraConversationMemory:
    """
    In-memory conversation context manager for LUXORA AI.

    Purpose:
    - remember recent user/assistant messages
    - remember products shown in recent responses
    - help resolve follow-up references such as:
        "which one?"
        "the second one"
        "tell me more about it"
        "add that to my cart"
    - keep memory isolated by user/session key

    This is intentionally lightweight.

    Later, this can be replaced with Redis or database-backed
    memory without changing the AI agent architecture.
    """

    def __init__(
        self,
        max_messages: int = MAX_MESSAGES_PER_SESSION,
        max_products: int = MAX_PRODUCTS_PER_SESSION,
    ) -> None:
        self.max_messages = max(
            1,
            int(max_messages),
        )

        self.max_products = max(
            1,
            int(max_products),
        )

        self._sessions: dict[
            str,
            list[ConversationMessage],
        ] = {}

    # ========================================================
    # SESSION KEY
    # ========================================================

    @staticmethod
    def _normalize_session_key(
        session_key: str | int,
    ) -> str:
        return str(
            session_key
        ).strip()

    # ========================================================
    # CREATE / GET SESSION
    # ========================================================

    def _get_messages(
        self,
        session_key: str | int,
    ) -> list[ConversationMessage]:
        key = self._normalize_session_key(
            session_key
        )

        if key not in self._sessions:
            self._sessions[key] = []

        return self._sessions[key]

    # ========================================================
    # ADD MESSAGE
    # ========================================================

    def add_message(
        self,
        session_key: str | int,
        role: str,
        content: str,
        products: list[dict[str, Any]] | None = None,
        agent: str | None = None,
    ) -> None:
        """
        Add a message to the conversation.

        Only recent messages are retained.
        """

        messages = self._get_messages(
            session_key
        )

        clean_role = str(
            role or ""
        ).strip().lower()

        if clean_role not in {
            "user",
            "assistant",
            "system",
        }:
            clean_role = "user"

        clean_content = str(
            content or ""
        ).strip()

        if not clean_content:
            return

        clean_products: list[
            dict[str, Any]
        ] = []

        if isinstance(
            products,
            list,
        ):
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
                    int(product_id)
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                clean_products.append(
                    product
                )

        messages.append(
            ConversationMessage(
                role=clean_role,
                content=clean_content,
                products=clean_products[
                    : self.max_products
                ],
                agent=(
                    str(agent).strip()
                    if agent
                    else None
                ),
            )
        )

        # Retain only the most recent messages.
        if len(
            messages
        ) > self.max_messages:
            del messages[
                : -self.max_messages
            ]

    # ========================================================
    # ADD USER MESSAGE
    # ========================================================

    def add_user_message(
        self,
        session_key: str | int,
        content: str,
    ) -> None:
        self.add_message(
            session_key=session_key,
            role="user",
            content=content,
        )

    # ========================================================
    # ADD ASSISTANT MESSAGE
    # ========================================================

    def add_assistant_message(
        self,
        session_key: str | int,
        content: str,
        products: list[dict[str, Any]] | None = None,
        agent: str | None = None,
    ) -> None:
        self.add_message(
            session_key=session_key,
            role="assistant",
            content=content,
            products=products,
            agent=agent,
        )

    # ========================================================
    # GET RECENT MESSAGES
    # ========================================================

    def get_recent_messages(
        self,
        session_key: str | int,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        Return recent conversation messages as dictionaries.
        """

        messages = self._get_messages(
            session_key
        )

        effective_limit = (
            self.max_messages
            if limit is None
            else max(
                1,
                int(limit),
            )
        )

        recent = messages[
            -effective_limit:
        ]

        return [
            {
                "role": message.role,
                "content": message.content,
                "products": message.products,
                "agent": message.agent,
            }
            for message in recent
        ]

    # ========================================================
    # GET LAST ASSISTANT PRODUCTS
    # ========================================================

    def get_last_products(
        self,
        session_key: str | int,
    ) -> list[dict[str, Any]]:
        """
        Return products from the most recent assistant
        response that contained products.
        """

        messages = self._get_messages(
            session_key
        )

        for message in reversed(
            messages
        ):
            if (
                message.role == "assistant"
                and message.products
            ):
                return message.products[
                    : self.max_products
                ]

        return []

    # ========================================================
    # GET LAST PRODUCT
    # ========================================================

    def get_last_product(
        self,
        session_key: str | int,
    ) -> dict[str, Any] | None:
        products = self.get_last_products(
            session_key
        )

        if not products:
            return None

        return products[0]

    # ========================================================
    # GET PRODUCT BY POSITION
    # ========================================================

    def get_product_by_position(
        self,
        session_key: str | int,
        position: int,
    ) -> dict[str, Any] | None:
        """
        Resolve:
            first
            second
            third
            fourth

        into a product from the most recent AI results.
        """

        if position < 1:
            return None

        products = self.get_last_products(
            session_key
        )

        index = (
            int(position) - 1
        )

        if index >= len(
            products
        ):
            return None

        return products[index]

    # ========================================================
    # FIND PRODUCT BY ID
    # ========================================================

    def find_product(
        self,
        session_key: str | int,
        product_id: int,
    ) -> dict[str, Any] | None:
        """
        Find a product from recent conversation results.
        """

        try:
            requested_id = int(
                product_id
            )
        except (
            TypeError,
            ValueError,
        ):
            return None

        messages = self._get_messages(
            session_key
        )

        for message in reversed(
            messages
        ):
            for product in message.products:
                try:
                    current_id = int(
                        product.get("id")
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                if current_id == requested_id:
                    return product

        return None

    # ========================================================
    # ALL RECENT PRODUCTS
    # ========================================================

    def get_recent_products(
        self,
        session_key: str | int,
    ) -> list[dict[str, Any]]:
        """
        Return unique products across recent AI responses.
        """

        messages = self._get_messages(
            session_key
        )

        products: list[
            dict[str, Any]
        ] = []

        seen_ids: set[int] = set()

        for message in reversed(
            messages
        ):
            for product in message.products:
                if not isinstance(
                    product,
                    dict,
                ):
                    continue

                product_id = product.get(
                    "id"
                )

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

                products.append(
                    product
                )

                if len(
                    products
                ) >= self.max_products:
                    return products

        return products

    # ========================================================
    # LAST USER MESSAGE
    # ========================================================

    def get_last_user_message(
        self,
        session_key: str | int,
    ) -> str | None:
        messages = self._get_messages(
            session_key
        )

        for message in reversed(
            messages
        ):
            if message.role == "user":
                return message.content

        return None

    # ========================================================
    # LAST ASSISTANT MESSAGE
    # ========================================================

    def get_last_assistant_message(
        self,
        session_key: str | int,
    ) -> str | None:
        messages = self._get_messages(
            session_key
        )

        for message in reversed(
            messages
        ):
            if message.role == "assistant":
                return message.content

        return None

    # ========================================================
    # BUILD CONTEXT
    # ========================================================

    def build_context(
        self,
        session_key: str | int,
        limit: int = 8,
    ) -> str:
        """
        Convert recent conversation history into a compact
        text context suitable for an AI prompt.
        """

        messages = self.get_recent_messages(
            session_key,
            limit=limit,
        )

        if not messages:
            return ""

        lines: list[str] = []

        for message in messages:
            role = message.get(
                "role",
                "user",
            ).upper()

            content = str(
                message.get(
                    "content",
                    "",
                )
                or ""
            ).strip()

            if not content:
                continue

            lines.append(
                f"{role}: {content}"
            )

            products = message.get(
                "products",
                [],
            )

            if (
                role == "ASSISTANT"
                and isinstance(
                    products,
                    list,
                )
                and products
            ):
                product_names = []

                for product in products[:4]:
                    name = str(
                        product.get(
                            "name",
                            "",
                        )
                        or ""
                    ).strip()

                    if name:
                        product_names.append(
                            name
                        )

                if product_names:
                    lines.append(
                        "PRODUCTS SHOWN: "
                        + ", ".join(
                            product_names
                        )
                    )

        return "\n".join(
            lines
        )

    # ========================================================
    # FOLLOW-UP DETECTION
    # ========================================================

    @staticmethod
    def is_follow_up_message(
        message: str,
    ) -> bool:
        """
        Detect conversational references that depend on
        previous context.
        """

        text = str(
            message or ""
        ).strip().lower()

        if not text:
            return False

        follow_up_phrases = [
            "which one",
            "which is better",
            "what about it",
            "what about that",
            "tell me more",
            "more about it",
            "more about that",
            "this one",
            "that one",
            "the first one",
            "the second one",
            "the third one",
            "the fourth one",
            "add it",
            "add that",
            "add this",
            "buy it",
            "buy that",
            "buy this",
            "show me that",
            "show me this",
            "open it",
            "open that",
            "open this",
            "compare them",
            "compare these",
            "compare those",
        ]

        return any(
            phrase in text
            for phrase in follow_up_phrases
        )

    # ========================================================
    # CLEAR SESSION
    # ========================================================

    def clear(
        self,
        session_key: str | int,
    ) -> None:
        key = self._normalize_session_key(
            session_key
        )

        self._sessions.pop(
            key,
            None,
        )

    # ========================================================
    # SESSION EXISTS
    # ========================================================

    def has_session(
        self,
        session_key: str | int,
    ) -> bool:
        key = self._normalize_session_key(
            session_key
        )

        return key in self._sessions

    # ========================================================
    # SESSION COUNT
    # ========================================================

    def session_count(
        self,
    ) -> int:
        return len(
            self._sessions
        )

    # ========================================================
    # CLEAN OLD SESSIONS
    # ========================================================

    def enforce_session_limit(
        self,
        max_sessions: int = MAX_SESSIONS,
    ) -> None:
        """
        Simple safety valve for the in-memory store.

        When the limit is exceeded, older dictionary entries
        are removed first.
        """

        maximum = max(
            1,
            int(max_sessions),
        )

        while len(
            self._sessions
        ) > maximum:
            oldest_key = next(
                iter(
                    self._sessions
                )
            )

            del self._sessions[
                oldest_key
            ]


# ============================================================
# SINGLETON
# ============================================================

luxora_memory = LuxoraConversationMemory()