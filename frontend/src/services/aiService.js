const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

const ACCESS_TOKEN_KEY = "luxora_access_token";

const CONVERSATION_STORAGE_KEY =
  "luxora_ai_conversation_id";

/* ============================================================
   ACCESS TOKEN
============================================================ */

function getAccessToken() {
  try {
    return (
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) || ""
    );
  } catch (error) {
    console.error(
      "LUXORA AI: failed to read access token:",
      error
    );

    return "";
  }
}

/* ============================================================
   CONVERSATION ID
============================================================ */

function generateConversationId() {
  return `conversation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function getConversationId() {
  try {
    const existingId =
      localStorage.getItem(
        CONVERSATION_STORAGE_KEY
      );

    if (
      existingId &&
      existingId.trim()
    ) {
      return existingId.trim();
    }

    const newId =
      generateConversationId();

    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      newId
    );

    return newId;
  } catch (error) {
    console.error(
      "LUXORA AI: failed to read/create conversation ID:",
      error
    );

    return generateConversationId();
  }
}

export function startNewConversation() {
  const newId =
    generateConversationId();

  try {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      newId
    );
  } catch (error) {
    console.error(
      "LUXORA AI: failed to store new conversation ID:",
      error
    );
  }

  return newId;
}

export function setConversationId(
  conversationId
) {
  const cleanId = String(
    conversationId || ""
  ).trim();

  if (!cleanId) {
    return getConversationId();
  }

  try {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      cleanId
    );
  } catch (error) {
    console.error(
      "LUXORA AI: failed to store conversation ID:",
      error
    );
  }

  return cleanId;
}

export function clearConversationId() {
  try {
    localStorage.removeItem(
      CONVERSATION_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "LUXORA AI: failed to clear conversation ID:",
      error
    );
  }
}

/* ============================================================
   API ERROR PARSER
============================================================ */

async function parseResponse(
  response
) {
  try {
    const data =
      await response.json();

    if (
      typeof data?.detail ===
      "string"
    ) {
      return data.detail;
    }

    if (
      Array.isArray(
        data?.detail
      )
    ) {
      return data.detail
        .map(
          (item) =>
            item?.msg
        )
        .filter(Boolean)
        .join(", ");
    }

    if (
      typeof data?.message ===
      "string"
    ) {
      return data.message;
    }

    if (
      typeof data?.error ===
      "string"
    ) {
      return data.error;
    }

    return (
      "LUXORA AI could not process your request."
    );
  } catch (error) {
    console.error(
      "LUXORA AI: failed to parse API error:",
      error
    );

    return (
      "LUXORA AI could not process your request."
    );
  }
}

/* ============================================================
   CHAT
============================================================ */

/**
 * Send a message to the LUXORA AI backend.
 *
 * The browser never receives or sends the Grok/xAI API key.
 *
 * conversationId:
 * - optional
 * - when omitted, the persisted browser conversation ID
 *   is automatically used
 *
 * productId:
 * - optional
 * - identifies the product currently being viewed
 */
export async function chatWithLuxoraAI({
  message,
  productId = null,
  conversationId = null,
}) {
  const cleanMessage = String(
    message || ""
  ).trim();

  if (!cleanMessage) {
    return {
      success: false,
      message:
        "Please tell me what you are looking for.",
      data: null,
    };
  }

  const token =
    getAccessToken();

  if (!token) {
    return {
      success: false,
      message:
        "Please sign in to use LUXORA AI and access personalized commerce features.",
      data: null,
    };
  }

  const activeConversationId =
    String(
      conversationId ||
        getConversationId()
    ).trim();

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/ai/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message:
              cleanMessage,

            product_id:
              productId !== null &&
              productId !== undefined
                ? Number(productId)
                : null,

            conversation_id:
              activeConversationId,
          }),
        }
      );

    /* --------------------------------------------------------
       AUTH FAILURE
    -------------------------------------------------------- */

    if (
      response.status ===
        401 ||
      response.status === 403
    ) {
      return {
        success: false,
        message:
          "Your LUXORA login session has expired. Please sign in again.",
        data: null,
        status:
          response.status,
      };
    }

    /* --------------------------------------------------------
       API FAILURE
    -------------------------------------------------------- */

    if (!response.ok) {
      const errorMessage =
        await parseResponse(
          response
        );

      return {
        success: false,
        message:
          errorMessage,
        data: null,
        status:
          response.status,
      };
    }

    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */

    const data =
      await response.json();

    /* --------------------------------------------------------
       KEEP BACKEND CONVERSATION ID
    -------------------------------------------------------- */

    if (
      data?.conversation_id
    ) {
      setConversationId(
        data.conversation_id
      );
    } else {
      setConversationId(
        activeConversationId
      );
    }

    return {
      success: true,

      message:
        data?.message ||
        "LUXORA AI has responded.",

      data,

      status:
        response.status,

      conversationId:
        data?.conversation_id ||
        activeConversationId,
    };
  } catch (error) {
    console.error(
      "LUXORA AI request failed:",
      error
    );

    return {
      success: false,
      message:
        "I couldn't connect to LUXORA AI right now. Please try again.",
      data: null,
      error,
      conversationId:
        activeConversationId,
    };
  }
}

/* ============================================================
   API BASE URL
============================================================ */

export function getLuxoraAIBaseURL() {
  return API_BASE_URL;
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default chatWithLuxoraAI;