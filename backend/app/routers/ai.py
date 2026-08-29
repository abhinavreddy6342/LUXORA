from __future__ import annotations

import time
import traceback
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..ai.memory import luxora_memory
from ..ai.orchestrator import LuxoraOrchestrator
from ..auth import get_current_user
from ..database import get_db
from ..models import User


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================


class AIChatRequest(BaseModel):
    """
    Request sent by the LUXORA frontend AI chat.
    """

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Customer's natural-language request.",
    )

    product_id: int | None = Field(
        default=None,
        ge=1,
        description="Optional product currently being referenced.",
    )

    conversation_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description=(
            "Optional frontend conversation identifier. "
            "When omitted, the authenticated user ID is used."
        ),
    )


# ============================================================
# AGENT EXECUTION SCHEMAS
# ============================================================


class AIAgentExecution(BaseModel):
    """
    Describes one specialized agent participating in the
    current request.
    """

    agent: str
    name: str
    status: str


# ============================================================
# RESPONSE SCHEMA
# ============================================================


class AIChatResponse(BaseModel):
    """
    Full response contract for LUXORA AI.
    """

    agent: str

    message: str

    products: list[dict[str, Any]] = Field(
        default_factory=list
    )

    constraints: dict[str, Any] = Field(
        default_factory=dict
    )

    # --------------------------------------------------------
    # AGENTS
    # --------------------------------------------------------

    agents: list[str] = Field(
        default_factory=list
    )

    agent_chain: list[AIAgentExecution] = Field(
        default_factory=list
    )

    results: list[dict[str, Any]] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # OPTIONAL CART DATA
    # --------------------------------------------------------

    cart: dict[str, Any] | None = None

    # --------------------------------------------------------
    # REQUEST METADATA
    # --------------------------------------------------------

    request_id: str | None = None

    execution_time_ms: float | None = None

    # --------------------------------------------------------
    # CONVERSATION MEMORY
    # --------------------------------------------------------

    conversation_id: str | None = None

    memory_used: bool = False

    memory_messages: int = 0


# ============================================================
# MEMORY SESSION KEY
# ============================================================


def build_memory_key(
    user_id: int,
    conversation_id: str | None,
) -> str:
    """
    Build an isolated conversation-memory key.

    Using the authenticated user ID prevents users from
    accessing another user's conversation memory.

    When the frontend supplies conversation_id, multiple
    conversations can coexist for the same user.

    Example:

        user:14:conversation:default
        user:14:conversation:shopping-session-1
    """

    clean_user_id = str(
        int(user_id)
    )

    clean_conversation_id = (
        str(
            conversation_id
            or "default"
        )
        .strip()
    )

    return (
        f"user:{clean_user_id}:"
        f"conversation:{clean_conversation_id}"
    )


# ============================================================
# FOLLOW-UP RESOLUTION
# ============================================================


def resolve_follow_up_message(
    message: str,
    memory_key: str,
) -> tuple[str, int | None, bool]:
    """
    Resolve simple conversational references using the
    previous AI results.

    Returns:

        contextualized_message
        resolved_product_id
        memory_was_used

    Examples:

        "which one is better?"
            ->
        "Compare product 1 and product 5.
         Customer follow-up: which one is better?"

        "tell me more about it"
            ->
        "Tell me about product 1.
         Customer follow-up: tell me more about it"

        "the second one"
            ->
        resolves to the second product shown previously.
    """

    clean_message = str(
        message or ""
    ).strip()

    if not clean_message:
        return (
            clean_message,
            None,
            False,
        )

    if not luxora_memory.is_follow_up_message(
        clean_message
    ):
        return (
            clean_message,
            None,
            False,
        )

    previous_products = (
        luxora_memory.get_last_products(
            memory_key
        )
    )

    if not previous_products:
        context = (
            luxora_memory.build_context(
                memory_key,
                limit=6,
            )
        )

        if context:
            return (
                (
                    "Previous LUXORA conversation context:\n"
                    f"{context}\n\n"
                    "Current customer follow-up:\n"
                    f"{clean_message}"
                ),
                None,
                True,
            )

        return (
            clean_message,
            None,
            False,
        )

    lowered = clean_message.lower()

    # --------------------------------------------------------
    # SECOND / THIRD / FOURTH / FIRST
    # --------------------------------------------------------

    ordinal_map = {
        "first": 1,
        "second": 2,
        "third": 3,
        "fourth": 4,
    }

    selected_position = None

    for word, position in ordinal_map.items():
        if (
            f"the {word}" in lowered
            or f"{word} one" in lowered
        ):
            selected_position = position
            break

    # --------------------------------------------------------
    # SELECTED PRODUCT
    # --------------------------------------------------------

    selected_product = None

    if selected_position is not None:
        selected_product = (
            luxora_memory.get_product_by_position(
                memory_key,
                selected_position,
            )
        )

    # --------------------------------------------------------
    # "IT" / "THIS" / "THAT"
    # --------------------------------------------------------

    if selected_product is None and any(
        phrase in lowered
        for phrase in [
            "it",
            "this one",
            "that one",
            "this product",
            "that product",
        ]
    ):
        selected_product = (
            luxora_memory.get_last_product(
                memory_key
            )
        )

    # --------------------------------------------------------
    # COMPARE PREVIOUS PRODUCTS
    # --------------------------------------------------------

    if (
        any(
            phrase in lowered
            for phrase in [
                "which one",
                "which is better",
                "compare them",
                "compare these",
                "compare those",
            ]
        )
        and len(previous_products) >= 2
    ):
        ids = []

        for product in previous_products[:4]:
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

            if product_id not in ids:
                ids.append(
                    product_id
                )

        if len(ids) >= 2:
            comparison_reference = (
                " and ".join(
                    f"product {product_id}"
                    for product_id in ids
                )
            )

            contextualized_message = (
                f"Compare {comparison_reference}. "
                f"Customer follow-up: {clean_message}"
            )

            return (
                contextualized_message,
                ids[0],
                True,
            )

    # --------------------------------------------------------
    # SELECTED PRODUCT
    # --------------------------------------------------------

    if selected_product:
        selected_id = selected_product.get(
            "id"
        )

        try:
            selected_id = int(
                selected_id
            )
        except (
            TypeError,
            ValueError,
        ):
            selected_id = None

        if selected_id is not None:

            # ----------------------------------------------
            # Product information follow-up
            # ----------------------------------------------

            if any(
                phrase in lowered
                for phrase in [
                    "tell me more",
                    "more about",
                    "what about",
                    "is it good",
                    "is this good",
                    "is that good",
                    "details",
                    "information",
                ]
            ):
                contextualized_message = (
                    f"Tell me about product "
                    f"{selected_id}. "
                    f"Customer follow-up: "
                    f"{clean_message}"
                )

                return (
                    contextualized_message,
                    selected_id,
                    True,
                )

            # ----------------------------------------------
            # Generic selected-product follow-up
            # ----------------------------------------------

            contextualized_message = (
                f"The customer is referring to "
                f"product {selected_id}. "
                f"Customer follow-up: "
                f"{clean_message}"
            )

            return (
                contextualized_message,
                selected_id,
                True,
            )

    # --------------------------------------------------------
    # GENERAL FOLLOW-UP WITH CONTEXT
    # --------------------------------------------------------

    context = luxora_memory.build_context(
        memory_key,
        limit=6,
    )

    if context:
        contextualized_message = (
            "Previous LUXORA conversation context:\n"
            f"{context}\n\n"
            "Current customer follow-up:\n"
            f"{clean_message}"
        )

        return (
            contextualized_message,
            None,
            True,
        )

    return (
        clean_message,
        None,
        False,
    )


# ============================================================
# ROUTER
# ============================================================


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
)
def ai_chat(
    request: AIChatRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    """
    Main LUXORA AI commerce endpoint.

    This endpoint now supports:

    - common AI chat
    - specialized agent routing
    - multi-agent workflows
    - conversation memory
    - follow-up references
    - product reference resolution
    - agent execution metadata
    """

    start_time = time.perf_counter()

    request_id = (
        f"luxora-ai-{time.time_ns()}"
    )

    # --------------------------------------------------------
    # CONVERSATION IDENTIFIER
    # --------------------------------------------------------

    conversation_id = (
        str(
            request.conversation_id
            or "default"
        ).strip()
    )

    memory_key = build_memory_key(
        user_id=current_user.id,
        conversation_id=conversation_id,
    )

    try:
        # ====================================================
        # NORMALIZE MESSAGE
        # ====================================================

        clean_message = (
            str(
                request.message or ""
            )
            .strip()
        )

        if not clean_message:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Please enter a message "
                    "for LUXORA AI."
                ),
            )

        # ====================================================
        # STORE USER MESSAGE
        # ====================================================

        try:
            luxora_memory.add_user_message(
                session_key=memory_key,
                content=clean_message,
            )

            luxora_memory.enforce_session_limit()

        except Exception as memory_error:
            print(
                "LUXORA MEMORY WRITE ERROR:",
                type(memory_error).__name__,
                str(memory_error),
            )

        # ====================================================
        # RESOLVE FOLLOW-UP
        # ====================================================

        (
            contextualized_message,
            memory_product_id,
            memory_used,
        ) = resolve_follow_up_message(
            message=clean_message,
            memory_key=memory_key,
        )

        # ====================================================
        # PRODUCT ID
        # ====================================================

        resolved_product_id = (
            request.product_id
            if request.product_id is not None
            else memory_product_id
        )

        # ====================================================
        # PREVIOUS MEMORY CONTEXT
        # ====================================================

        memory_context = (
            luxora_memory.build_context(
                memory_key,
                limit=8,
            )
        )

        memory_message_count = len(
            luxora_memory.get_recent_messages(
                memory_key,
                limit=8,
            )
        )

        # ====================================================
        # ORCHESTRATOR
        # ====================================================

        orchestrator = (
            LuxoraOrchestrator(
                db
            )
        )

        result = orchestrator.run(
            message=contextualized_message,
            user_id=current_user.id,
            product_id=resolved_product_id,
        )

        # ====================================================
        # EXECUTION TIME
        # ====================================================

        execution_time_ms = round(
            (
                time.perf_counter()
                - start_time
            )
            * 1000,
            2,
        )

        # ====================================================
        # VALIDATE RESULT
        # ====================================================

        if not isinstance(
            result,
            dict,
        ):
            raise RuntimeError(
                "LUXORA AI returned an invalid response."
            )

        # ====================================================
        # DEFAULT FIELDS
        # ====================================================

        result.setdefault(
            "agent",
            "shopping",
        )

        result.setdefault(
            "message",
            "LUXORA AI processed your request.",
        )

        result.setdefault(
            "products",
            [],
        )

        result.setdefault(
            "constraints",
            {},
        )

        result.setdefault(
            "agents",
            [
                result["agent"]
            ],
        )

        result.setdefault(
            "agent_chain",
            [
                {
                    "agent": result[
                        "agent"
                    ],
                    "name": (
                        f"{result['agent'].title()} Agent"
                    ),
                    "status": "completed",
                }
            ],
        )

        result.setdefault(
            "results",
            [],
        )

        # ====================================================
        # MEMORY METADATA
        # ====================================================

        result["request_id"] = (
            request_id
        )

        result[
            "execution_time_ms"
        ] = execution_time_ms

        result[
            "conversation_id"
        ] = conversation_id

        result[
            "memory_used"
        ] = bool(
            memory_used
            or memory_context
        )

        result[
            "memory_messages"
        ] = memory_message_count

        # ====================================================
        # NORMALIZE AGENT CHAIN
        # ====================================================

        normalized_agent_chain = []

        for item in result.get(
            "agent_chain",
            [],
        ):
            if not isinstance(
                item,
                dict,
            ):
                continue

            agent_name = str(
                item.get(
                    "agent",
                    "",
                )
            ).strip()

            if not agent_name:
                continue

            display_name = str(
                item.get(
                    "name",
                    "",
                )
                or f"{agent_name.title()} Agent"
            ).strip()

            agent_status = str(
                item.get(
                    "status",
                    "completed",
                )
            ).strip()

            normalized_agent_chain.append(
                {
                    "agent": agent_name,
                    "name": display_name,
                    "status": agent_status,
                }
            )

        result["agent_chain"] = (
            normalized_agent_chain
        )

        # ====================================================
        # NORMALIZE AGENTS
        # ====================================================

        normalized_agents: list[
            str
        ] = []

        for agent in result.get(
            "agents",
            [],
        ):
            agent_name = str(
                agent or ""
            ).strip()

            if (
                agent_name
                and agent_name
                not in normalized_agents
            ):
                normalized_agents.append(
                    agent_name
                )

        if not normalized_agents:
            normalized_agents = [
                str(
                    result["agent"]
                ).strip()
            ]

        result["agents"] = (
            normalized_agents
        )

        # ====================================================
        # NORMALIZE PRODUCTS
        # ====================================================

        if not isinstance(
            result.get(
                "products"
            ),
            list,
        ):
            result["products"] = []

        # ====================================================
        # NORMALIZE CONSTRAINTS
        # ====================================================

        if not isinstance(
            result.get(
                "constraints"
            ),
            dict,
        ):
            result["constraints"] = {}

        # ====================================================
        # NORMALIZE RESULTS
        # ====================================================

        if not isinstance(
            result.get(
                "results"
            ),
            list,
        ):
            result["results"] = []

        # ====================================================
        # STORE ASSISTANT RESPONSE IN MEMORY
        # ====================================================

        try:
            luxora_memory.add_assistant_message(
                session_key=memory_key,
                content=str(
                    result.get(
                        "message",
                        "",
                    )
                    or ""
                ),
                products=result.get(
                    "products",
                    [],
                ),
                agent=result.get(
                    "agent",
                    "shopping",
                ),
            )

            luxora_memory.enforce_session_limit()

        except Exception as memory_error:
            print(
                "LUXORA MEMORY ASSISTANT WRITE ERROR:",
                type(memory_error).__name__,
                str(memory_error),
            )

        # ====================================================
        # LOG
        # ====================================================

        print(
            "LUXORA AI REQUEST:",
            request_id,
            "| user:",
            current_user.id,
            "| conversation:",
            conversation_id,
            "| memory_used:",
            bool(
                memory_used
                or memory_context
            ),
            "| agents:",
            result["agents"],
            "| time_ms:",
            execution_time_ms,
        )

        return result

    # ========================================================
    # HTTP ERROR
    # ========================================================

    except HTTPException:
        raise

    # ========================================================
    # RUNTIME / CONFIGURATION ERROR
    # ========================================================

    except RuntimeError as error:
        execution_time_ms = round(
            (
                time.perf_counter()
                - start_time
            )
            * 1000,
            2,
        )

        print(
            "LUXORA AI CONFIGURATION ERROR:",
            request_id,
            "|",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
            headers={
                "X-LUXORA-AI-Request-ID": request_id,
            },
        ) from error

    # ========================================================
    # AUTHORIZATION
    # ========================================================

    except PermissionError as error:
        print(
            "LUXORA AI PERMISSION ERROR:",
            request_id,
            "|",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You are not authorized to use "
                "this LUXORA AI feature."
            ),
            headers={
                "X-LUXORA-AI-Request-ID": request_id,
            },
        ) from error

    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as error:
        execution_time_ms = round(
            (
                time.perf_counter()
                - start_time
            )
            * 1000,
            2,
        )

        print(
            "LUXORA AI ERROR:",
            request_id,
            "| type:",
            type(error).__name__,
            "| message:",
            str(error),
            "| time_ms:",
            execution_time_ms,
        )

        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "LUXORA AI could not process "
                "your request right now."
            ),
            headers={
                "X-LUXORA-AI-Request-ID": request_id,
            },
        ) from error