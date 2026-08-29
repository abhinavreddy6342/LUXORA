from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from langchain_groq import ChatGroq


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


class LuxoraLLM:
    """
    Centralized Groq LLM service for LUXORA.

    All LUXORA AI agents use this single service.

    The frontend never receives the Groq API key.
    """

    def __init__(self) -> None:
        self.model = os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile",
        )

        self.temperature = float(
            os.getenv(
                "GROQ_TEMPERATURE",
                "0.1",
            )
        )

        self.api_key = (
            os.getenv("GROQ_API_KEY") or ""
        ).strip()

        self._llm: ChatGroq | None = None

        if self.api_key:
            self._llm = ChatGroq(
                model=self.model,
                temperature=self.temperature,
                groq_api_key=self.api_key,
            )

    # ========================================================
    # CONFIGURATION
    # ========================================================

    def is_configured(self) -> bool:
        """
        Return True when Groq configuration exists.
        """

        return bool(
            self.api_key
            and self._llm is not None
        )

    # ========================================================
    # MODEL
    # ========================================================

    @property
    def client(self) -> ChatGroq | None:
        """
        Return the configured LangChain Groq client.
        """

        return self._llm

    # ========================================================
    # INVOKE
    # ========================================================

    def invoke(
        self,
        prompt: str,
    ) -> str:
        """
        Send a prompt to Groq.
        """

        if not self.is_configured():
            raise RuntimeError(
                "GROQ_API_KEY is not configured. "
                "Add GROQ_API_KEY to backend/.env."
            )

        clean_prompt = str(
            prompt or ""
        ).strip()

        if not clean_prompt:
            raise ValueError(
                "LLM prompt cannot be empty."
            )

        try:
            response: Any = self._llm.invoke(
                clean_prompt
            )

            content = getattr(
                response,
                "content",
                response,
            )

            if isinstance(
                content,
                str,
            ):
                return content.strip()

            if isinstance(
                content,
                list,
            ):
                parts: list[str] = []

                for item in content:
                    if isinstance(
                        item,
                        str,
                    ):
                        parts.append(item)

                    elif isinstance(
                        item,
                        dict,
                    ):
                        text = item.get(
                            "text"
                        )

                        if text:
                            parts.append(
                                str(text)
                            )

                return "\n".join(
                    parts
                ).strip()

            return str(
                content
            ).strip()

        except Exception as error:
            print(
                "LUXORA GROQ LLM ERROR:",
                type(error).__name__,
                str(error),
            )

            raise

    # ========================================================
    # STATUS
    # ========================================================

    def status(self) -> dict[str, Any]:
        """
        Return safe provider configuration information.

        Never exposes the API key.
        """

        return {
            "configured": self.is_configured(),
            "provider": "Groq",
            "model": self.model,
            "temperature": self.temperature,
        }


# ============================================================
# SINGLETON
# ============================================================

luxora_llm = LuxoraLLM()