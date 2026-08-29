import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Check,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  chatWithLuxoraAI,
  startNewConversation,
} from "../services/aiService";

import { useShop } from "../context/ShopContext";

/* ============================================================
   SUGGESTED PROMPTS
============================================================ */

const SUGGESTED_PROMPTS = [
  "Find something for me",
  "Find a premium watch under ₹20000",
  "What goes with my cart?",
  "Help me choose",
];

/* ============================================================
   PROCESS STEPS
============================================================ */

const PROCESS_STEPS = [
  "UNDERSTANDING REQUEST",
  "SEARCHING LUXORA CATALOG",
  "MATCHING PREFERENCES",
  "RANKING PRODUCTS",
];

/* ============================================================
   AI AGENT CONFIGURATION
============================================================ */

const AI_AGENTS = [
  {
    key: "shopping",
    label: "SHOPPING",
    fullName: "SHOPPING AGENT",
  },
  {
    key: "product",
    label: "PRODUCT",
    fullName: "PRODUCT AGENT",
  },
  {
    key: "recommendation",
    label: "RECOMMENDATION",
    fullName: "RECOMMENDATION AGENT",
  },
  {
    key: "cart",
    label: "CART",
    fullName: "CART AGENT",
  },
  {
    key: "order",
    label: "ORDER",
    fullName: "ORDER AGENT",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function formatPrice(value) {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN")}`;
}

function getMatchScore(product) {
  const score = Number(
    product?.match_score
  );

  if (!Number.isFinite(score)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}

function getProductId(product) {
  if (
    product?.id === undefined ||
    product?.id === null
  ) {
    return null;
  }

  return product.id;
}

function getAgentConfig(agentKey) {
  return (
    AI_AGENTS.find(
      (agent) =>
        agent.key === agentKey
    ) || AI_AGENTS[0]
  );
}

/* ============================================================
   CLIENT-SIDE AGENT PREVIEW
   ------------------------------------------------------------
   This is ONLY a visual prediction before the backend responds.
   The backend remains authoritative.
============================================================ */

function detectAgentPreview(message) {
  const text = String(
    message || ""
  )
    .toLowerCase()
    .trim();

  if (!text) {
    return "shopping";
  }

  /* ---------------- CART ---------------- */

  if (
    [
      "my cart",
      "in my cart",
      "cart insight",
      "cart analysis",
      "analyze my cart",
      "analyse my cart",
      "what goes with my cart",
      "improve my cart",
      "cart items",
    ].some(
      (phrase) =>
        text.includes(phrase)
    )
  ) {
    return "cart";
  }

  /* ---------------- ORDER ---------------- */

  if (
    [
      "ready to buy",
      "ready to purchase",
      "checkout",
      "order summary",
      "prepare my order",
      "continue to payment",
      "continue checkout",
      "what is my total",
      "my order total",
    ].some(
      (phrase) =>
        text.includes(phrase)
    )
  ) {
    return "order";
  }

  /* ---------------- PRODUCT ---------------- */

  if (
    [
      "compare",
      "comparison",
      "which is better",
      "which one is better",
      "difference between",
      "versus",
      "tell me about product",
      "tell me about item",
      "product details",
      "product information",
      "is this good",
      "is this suitable",
    ].some(
      (phrase) =>
        text.includes(phrase)
    )
  ) {
    return "product";
  }

  /* ---------------- RECOMMENDATION ---------------- */

  if (
    [
      "recommend",
      "recommendation",
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
    ].some(
      (phrase) =>
        text.includes(phrase)
    )
  ) {
    return "recommendation";
  }

  /* ---------------- SHOPPING ---------------- */

  return "shopping";
}

/* ============================================================
   AGENT STATUS BAR
============================================================ */

function AgentStatusBar({
  activeAgent,
  isProcessing,
  responseAgents,
  agentChain,
}) {
  const selectedAgent =
    getAgentConfig(
      activeAgent
    );

  const actualResponseAgents =
    Array.isArray(
      responseAgents
    )
      ? responseAgents
      : [];

  const actualChain =
    Array.isArray(
      agentChain
    )
      ? agentChain
      : [];

  const currentResponseAgent =
    actualResponseAgents.length >
    0
      ? actualResponseAgents[
          actualResponseAgents.length - 1
        ]
      : activeAgent;

  const displayAgent =
    getAgentConfig(
      currentResponseAgent
    );

  const participatingAgents =
    actualResponseAgents.length >
    0
      ? actualResponseAgents
      : [
          selectedAgent.key,
        ];

  const participatingCount =
    participatingAgents.length;

  const hasBackendChain =
    actualChain.length > 0;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -8,
        height: 0,
      }}
      animate={{
        opacity: 1,
        y: 0,
        height: "auto",
      }}
      className="border-b border-black/10 bg-[#f4f4f1]"
    >
      <div className="px-4 py-3">
        {/* =================================================
            TOP STATUS
        ================================================= */}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="mono shrink-0 text-[7px] tracking-[0.16em] text-neutral-400">
              {AI_AGENTS.length} SPECIALIZED AGENTS
            </span>

            <span className="text-neutral-300">
              /
            </span>

            <span className="truncate mono text-[7px] font-semibold tracking-[0.13em] text-black">
              {isProcessing
                ? displayAgent.fullName
                : participatingCount > 1
                  ? `${participatingCount} AGENTS RESPONDED`
                  : displayAgent.fullName}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <motion.span
              animate={
                isProcessing
                  ? {
                      opacity: [
                        1,
                        0.35,
                        1,
                      ],
                    }
                  : {
                      opacity: 1,
                    }
              }
              transition={
                isProcessing
                  ? {
                      duration: 1.1,
                      repeat: Infinity,
                    }
                  : undefined
              }
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />

            <span className="mono text-[7px] tracking-[0.12em] text-neutral-500">
              {isProcessing
                ? "RESPONDING"
                : hasBackendChain
                  ? "COMPLETED"
                  : "ACTIVE"}
            </span>
          </div>
        </div>

        {/* =================================================
            AGENT PIPELINE
        ================================================= */}

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {AI_AGENTS.map(
            (agent) => {
              const isCurrent =
                agent.key ===
                displayAgent.key;

              const participated =
                participatingAgents.includes(
                  agent.key
                );

              const chainItem =
                actualChain.find(
                  (item) =>
                    item?.agent ===
                    agent.key
                );

              const completed =
                chainItem?.status ===
                  "completed" ||
                participated;

              return (
                <motion.div
                  key={agent.key}
                  layout
                  className={`
                    flex shrink-0 items-center gap-1.5
                    border px-2.5 py-1.5
                    transition-all duration-300
                    ${
                      isCurrent
                        ? "border-black bg-black text-white"
                        : completed
                          ? "border-black/20 bg-white text-black"
                          : "border-black/10 bg-white text-neutral-400"
                    }
                  `}
                >
                  {completed && (
                    <span
                      className={`
                        flex h-2.5 w-2.5 items-center justify-center
                        ${
                          isCurrent &&
                          isProcessing
                            ? "text-emerald-400"
                            : "text-black"
                        }
                      `}
                    >
                      {isCurrent &&
                      isProcessing ? (
                        <Loader2
                          size={
                            9
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Check
                          size={
                            8
                          }
                        />
                      )}
                    </span>
                  )}

                  {!completed &&
                    isCurrent && (
                      <span
                        className="h-1 w-1 rounded-full bg-black"
                      />
                    )}

                  <span className="mono text-[6.5px] tracking-[0.08em]">
                    {agent.label}
                  </span>
                </motion.div>
              );
            }
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function LuxoraAI() {
  const navigate =
    useNavigate();

  const {
    addToCart,
  } = useShop();

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    processStep,
    setProcessStep,
  ] = useState(0);

  /* ==========================================================
     AGENT STATE
  ========================================================== */

  const [
    activeAgent,
    setActiveAgent,
  ] = useState("shopping");

  const [, setResponseAgent] =
  useState(null);

  const [
    responseAgents,
    setResponseAgents,
  ] = useState([]);

  const [
    agentChain,
    setAgentChain,
  ] = useState([]);

  /* ==========================================================
     REFS
  ========================================================== */

  const inputRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  /* ==========================================================
     AUTO FOCUS
  ========================================================== */

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeout =
      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        150
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [isOpen]);

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "nearest",
      }
    );
  }, [
    messages,
    isProcessing,
  ]);

  /* ==========================================================
     PROCESS STEPS
  ========================================================== */

  useEffect(() => {
    if (!isProcessing) {
      return undefined;
    }

    let currentStep =
      0;

    const interval =
      window.setInterval(
        () => {
          currentStep +=
            1;

          if (
            currentStep >=
            PROCESS_STEPS.length
          ) {
            window.clearInterval(
              interval
            );

            return;
          }

          setProcessStep(
            currentStep
          );
        },
        700
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [isProcessing]);

  /* ==========================================================
     ADD USER MESSAGE
  ========================================================== */

  const addUserMessage = (
    text
  ) => {
    setMessages(
      (current) => [
        ...current,
        {
          id: `user-${Date.now()}-${Math.random()}`,
          role: "user",
          content: text,
        },
      ]
    );
  };

  /* ==========================================================
     ADD ASSISTANT MESSAGE
  ========================================================== */

  const addAssistantMessage = (
    data
  ) => {
    const backendAgent =
      data?.agent ||
      "shopping";

    const backendAgents =
      Array.isArray(
        data?.agents
      ) &&
      data.agents.length >
        0
        ? data.agents
        : [
            backendAgent,
          ];

    const backendChain =
      Array.isArray(
        data?.agent_chain
      )
        ? data.agent_chain
        : [];

    setResponseAgent(
      backendAgent
    );

    setActiveAgent(
      backendAgent
    );

    setResponseAgents(
      backendAgents
    );

    setAgentChain(
      backendChain
    );

    setMessages(
      (current) => [
        ...current,
        {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content:
            data?.message ||
            "I found some options for you.",
          products:
            Array.isArray(
              data?.products
            )
              ? data.products
              : [],
          agent:
            backendAgent,
          agents:
            backendAgents,
          agentChain:
            backendChain,
          constraints:
            data?.constraints ||
            {},
        },
      ]
    );
  };

  /* ==========================================================
     ADD ERROR MESSAGE
  ========================================================== */

  const addErrorMessage = (
    text,
    fallbackAgent
  ) => {
    const agent =
      fallbackAgent ||
      "shopping";

    setMessages(
      (current) => [
        ...current,
        {
          id: `error-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content:
            text ||
            "LUXORA AI could not process your request.",
          products: [],
          agent,
          agents: [
            agent,
          ],
          agentChain: [
            {
              agent,
              name:
                getAgentConfig(
                  agent
                ).fullName,
              status:
                "error",
            },
          ],
          constraints: {},
          isError: true,
        },
      ]
    );

    setResponseAgent(
      agent
    );

    setActiveAgent(
      agent
    );

    setResponseAgents([
      agent,
    ]);

    setAgentChain([
      {
        agent,
        name:
          getAgentConfig(
            agent
          ).fullName,
        status:
          "error",
      },
    ]);
  };

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const sendMessage = async (
    customMessage = null
  ) => {
    const text = String(
      customMessage ??
        message
    ).trim();

    if (
      !text ||
      isProcessing
    ) {
      return;
    }

    /* --------------------------------------------------------
       CLIENT PREVIEW
    -------------------------------------------------------- */

    const predictedAgent =
      detectAgentPreview(
        text
      );

    setActiveAgent(
      predictedAgent
    );

    setResponseAgent(
      null
    );

    setResponseAgents(
      []
    );

    setAgentChain(
      []
    );

    /* --------------------------------------------------------
       USER MESSAGE
    -------------------------------------------------------- */

    setMessage("");

    addUserMessage(
      text
    );

    /* --------------------------------------------------------
       START PROCESSING
    -------------------------------------------------------- */

    setIsProcessing(
      true
    );

    setProcessStep(
      0
    );

    try {
      const result =
        await chatWithLuxoraAI(
          {
            message: text,
          }
        );

      /* ------------------------------------------------------
         REQUEST FAILED
      ------------------------------------------------------ */

      if (
        !result.success
      ) {
        addErrorMessage(
          result.message,
          predictedAgent
        );

        return;
      }

      /* ------------------------------------------------------
         BACKEND AUTHORITY
      ------------------------------------------------------ */

      addAssistantMessage(
        result.data
      );
    } catch (error) {
      console.error(
        "LUXORA AI UI ERROR:",
        error
      );

      addErrorMessage(
        "I couldn't connect to LUXORA AI right now. Please try again.",
        predictedAgent
      );
    } finally {
      setIsProcessing(
        false
      );
    }
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    sendMessage();
  };

  /* ==========================================================
     PRODUCT CLICK
  ========================================================== */

  const handleProductClick = (
    product
  ) => {
    const productId =
      getProductId(
        product
      );

    if (
      productId === null
    ) {
      return;
    }

    setIsOpen(
      false
    );

    navigate(
      `/product/${productId}`
    );
  };

  /* ==========================================================
     ADD PRODUCT TO CART
  ========================================================== */

  const handleAddToCart = (
    product
  ) => {
    if (!product) {
      return;
    }

    addToCart(
      product
    );

    setMessages(
      (current) => [
        ...current,
        {
          id: `cart-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: `${product.name} has been added to your cart.`,
          products: [],
          agent: "cart",
          agents: [
            "cart",
          ],
          agentChain: [
            {
              agent:
                "cart",
              name:
                "CART AGENT",
              status:
                "completed",
            },
          ],
          constraints: {},
          isCartConfirmation: true,
        },
      ]
    );

    setActiveAgent(
      "cart"
    );

    setResponseAgent(
      "cart"
    );

    setResponseAgents([
      "cart",
    ]);

    setAgentChain([
      {
        agent: "cart",
        name: "CART AGENT",
        status: "completed",
      },
    ]);
  };

  /* ==========================================================
     CLEAR CONVERSATION
  ========================================================== */

  const clearConversation =
    () => {
      setMessages([]);
      setMessage("");

      setActiveAgent(
        "shopping"
      );

      setResponseAgent(
        null
      );

      setResponseAgents(
        []
      );

      setAgentChain(
        []
      );

      setIsProcessing(
        false
      );

      setProcessStep(
        0
      );

      /*
       * Create a completely new backend conversation.
       */
      startNewConversation();
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      {/* =====================================================
          FLOATING AI BUTTON
      ===================================================== */}

      <motion.button
        type="button"
        onClick={() =>
          setIsOpen(true)
        }
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={{
          y: -3,
        }}
        whileTap={{
          scale: 0.97,
        }}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 border border-black/10 bg-black px-5 py-3.5 text-white shadow-xl transition-shadow hover:shadow-2xl"
        aria-label="Open LUXORA AI"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
          <Bot
            size={15}
            strokeWidth={1.6}
          />

          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400" />
        </span>

        <span className="mono text-[9px] font-medium tracking-[0.14em]">
          ASK LUXORA AI
        </span>
      </motion.button>

      {/* =====================================================
          AI PANEL
      ===================================================== */}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP */}

            <motion.button
              type="button"
              aria-label="Close LUXORA AI"
              onClick={() =>
                setIsOpen(
                  false
                )
              }
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-[95] bg-black/20 backdrop-blur-sm"
            />

            {/* =================================================
                PANEL
            ================================================= */}

            <motion.aside
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              transition={{
                duration: 0.28,
                ease: "easeOut",
              }}
              className="fixed bottom-4 right-4 z-[100] flex h-[min(720px,calc(100vh-32px))] w-[min(440px,calc(100vw-32px))] flex-col overflow-hidden border border-black/10 bg-[#fafaf9] shadow-2xl sm:bottom-6 sm:right-6"
            >
              {/* =================================================
                  HEADER
              ================================================= */}

              <header className="flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Bot
                      size={18}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold tracking-[-0.02em]">
                        LUXORA AI
                      </p>

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>

                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      Your personal commerce intelligence.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:bg-black hover:text-white"
                  aria-label="Close LUXORA AI"
                >
                  <X
                    size={17}
                  />
                </button>
              </header>

              {/* =================================================
                  CONTENT
              ================================================= */}

              <div className="flex min-h-0 flex-1 flex-col">
                {/* =================================================
                    AGENT STATUS BAR

                    Appears after the first message.
                ================================================= */}

                {messages.length >
                  0 && (
                  <AgentStatusBar
                    activeAgent={
                      activeAgent
                    }
                    isProcessing={
                      isProcessing
                    }
                    responseAgents={
                      responseAgents
                    }
                    agentChain={
                      agentChain
                    }
                  />
                )}

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {messages.length ===
                  0 &&
                  !isProcessing && (
                    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-7">
                      <div className="border border-black/10 bg-white p-5">
                        <p className="mono text-[8px] tracking-[0.2em] text-neutral-400">
                          AI COMMERCE
                        </p>

                        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                          Tell me what you want.
                        </h2>

                        <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
                          Describe your budget,
                          use case, style
                          or preferences
                          and I&apos;ll
                          search the
                          LUXORA catalog
                          for you.
                        </p>
                      </div>

                      <div className="mt-7">
                        <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                          TRY ASKING
                        </p>

                        <div className="mt-3 grid gap-2">
                          {SUGGESTED_PROMPTS.map(
                            (
                              prompt
                            ) => (
                              <button
                                key={
                                  prompt
                                }
                                type="button"
                                onClick={() =>
                                  sendMessage(
                                    prompt
                                  )
                                }
                                className="flex items-center justify-between border border-black/10 bg-white px-4 py-3.5 text-left text-xs transition-colors hover:border-black"
                              >
                                <span>
                                  {
                                    prompt
                                  }
                                </span>

                                <ArrowUp
                                  size={
                                    13
                                  }
                                  className="rotate-45 text-neutral-400"
                                />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-7">
                        <p className="text-[9px] leading-5 text-neutral-400">
                          LUXORA AI uses
                          your actual
                          LUXORA catalog.
                          It does not
                          invent
                          products,
                          prices or
                          payment
                          status.
                        </p>
                      </div>
                    </div>
                  )}

                {/* =================================================
                    CONVERSATION
                ================================================= */}

                {(messages.length >
                  0 ||
                  isProcessing) && (
                  <div className="flex-1 overflow-y-auto px-4 py-5">
                    <div className="space-y-5">
                      {messages.map(
                        (item) => {
                          const itemAgent =
                            getAgentConfig(
                              item.agent
                            );

                          const itemAgents =
                            Array.isArray(
                              item.agents
                            )
                              ? item.agents
                              : item.agent
                                ? [
                                    item.agent,
                                  ]
                                : [];

                          return (
                            <div
                              key={
                                item.id
                              }
                              className={
                                item.role ===
                                "user"
                                  ? "flex justify-end"
                                  : "flex justify-start"
                              }
                            >
                              <div
                                className={
                                  item.role ===
                                  "user"
                                    ? "max-w-[84%] bg-black px-4 py-3 text-sm leading-6 text-white"
                                    : "w-full max-w-[96%]"
                                }
                              >
                                {item.role ===
                                "user" ? (
                                  <p>
                                    {
                                      item.content
                                    }
                                  </p>
                                ) : (
                                  <div
                                    className={`border ${
                                      item.isError
                                        ? "border-red-200 bg-red-50"
                                        : "border-black/10 bg-white"
                                    } p-4`}
                                  >
                                    {/* AI RESPONSE HEADER */}

                                    <div className="flex items-start gap-3">
                                      {!item.isError &&
                                        !item.isCartConfirmation && (
                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                                            <Bot
                                              size={
                                                13
                                              }
                                            />
                                          </div>
                                        )}

                                      {item.isCartConfirmation && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                          <Check
                                            size={
                                              13
                                            }
                                          />
                                        </div>
                                      )}

                                      {item.isError && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                                          <X
                                            size={
                                              13
                                            }
                                          />
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        {/* AGENT LABEL */}

                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                          <span className="mono text-[7px] font-semibold tracking-[0.13em] text-neutral-400">
                                            {
                                              itemAgent.fullName
                                            }
                                          </span>

                                          {itemAgents.length >
                                            1 && (
                                            <>
                                              <span className="text-[9px] text-neutral-300">
                                                /
                                              </span>

                                              <span className="mono text-[7px] tracking-[0.1em] text-neutral-400">
                                                {
                                                  itemAgents.length
                                                }{" "}
                                                AGENTS
                                              </span>
                                            </>
                                          )}
                                        </div>

                                        <p className="whitespace-pre-line text-sm leading-6 text-neutral-700">
                                          {
                                            item.content
                                          }
                                        </p>
                                      </div>
                                    </div>

                                    {/* =================================================
                                        AGENT PARTICIPATION
                                    ================================================= */}

                                    {itemAgents.length >
                                      1 && (
                                      <div className="mt-4 border-t border-black/10 pt-3">
                                        <div className="flex flex-wrap gap-1.5">
                                          {itemAgents.map(
                                            (
                                              agentKey
                                            ) => {
                                              const agent =
                                                getAgentConfig(
                                                  agentKey
                                                );

                                              return (
                                                <span
                                                  key={
                                                    agentKey
                                                  }
                                                  className="mono inline-flex items-center gap-1.5 border border-black/10 bg-[#fafaf9] px-2 py-1 text-[6.5px] tracking-[0.08em] text-neutral-500"
                                                >
                                                  <Check
                                                    size={
                                                      8
                                                    }
                                                  />
                                                  {
                                                    agent.label
                                                  }
                                                </span>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* =================================================
                                        PRODUCT RESULTS
                                    ================================================= */}

                                    {item.products
                                      ?.length >
                                      0 && (
                                      <div className="mt-5 space-y-3">
                                        {item.products.map(
                                          (
                                            product
                                          ) => {
                                            const matchScore =
                                              getMatchScore(
                                                product
                                              );

                                            return (
                                              <article
                                                key={
                                                  product.id
                                                }
                                                className="overflow-hidden border border-black/10 bg-[#fafaf9]"
                                              >
                                                <div className="flex gap-3 p-3">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleProductClick(
                                                        product
                                                      )
                                                    }
                                                    className="h-24 w-20 shrink-0 overflow-hidden bg-white"
                                                  >
                                                    <img
                                                      src={
                                                        product.image
                                                      }
                                                      alt={
                                                        product.name
                                                      }
                                                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                    />
                                                  </button>

                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                      <div>
                                                        <p className="mono text-[7px] tracking-[0.16em] text-neutral-400">
                                                          {product.category?.toUpperCase() ||
                                                            "LUXORA"}
                                                        </p>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            handleProductClick(
                                                              product
                                                            )
                                                          }
                                                          className="mt-1 text-left text-sm font-medium hover:underline"
                                                        >
                                                          {
                                                            product.name
                                                          }
                                                        </button>
                                                      </div>

                                                      {matchScore !==
                                                        null && (
                                                        <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">
                                                          {
                                                            matchScore
                                                          }
                                                          %{" "}
                                                          MATCH
                                                        </span>
                                                      )}
                                                    </div>

                                                    <p className="mt-2 text-sm font-medium">
                                                      {formatPrice(
                                                        product.price
                                                      )}
                                                    </p>

                                                    {product.description && (
                                                      <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-neutral-500">
                                                        {
                                                          product.description
                                                        }
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 border-t border-black/10">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleProductClick(
                                                        product
                                                      )
                                                    }
                                                    className="border-r border-black/10 px-3 py-2.5 text-[8px] font-semibold tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
                                                  >
                                                    VIEW
                                                    PRODUCT
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleAddToCart(
                                                        product
                                                      )
                                                    }
                                                    className="px-3 py-2.5 text-[8px] font-semibold tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
                                                  >
                                                    ADD
                                                    TO
                                                    CART
                                                  </button>
                                                </div>
                                              </article>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* =================================================
                          AI PROCESSING
                      ================================================= */}

                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="w-full max-w-[96%] border border-black/10 bg-white p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                                <Loader2
                                  size={
                                    13
                                  }
                                  className="animate-spin"
                                />
                              </div>

                              <div>
                                <p className="text-xs font-medium">
                                  {
                                    getAgentConfig(
                                      activeAgent
                                    ).fullName
                                  }{" "}
                                  is working
                                </p>

                                <p className="mt-0.5 text-[9px] text-neutral-400">
                                  Processing your
                                  LUXORA commerce
                                  request.
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              {PROCESS_STEPS.map(
                                (
                                  step,
                                  index
                                ) => {
                                  const completed =
                                    index <
                                    processStep;

                                  const active =
                                    index ===
                                    processStep;

                                  return (
                                    <div
                                      key={
                                        step
                                      }
                                      className="flex items-center gap-3"
                                    >
                                      <span
                                        className={`flex h-5 w-5 items-center justify-center border text-[8px] ${
                                          completed
                                            ? "border-black bg-black text-white"
                                            : active
                                              ? "border-black text-black"
                                              : "border-black/10 text-neutral-300"
                                        }`}
                                      >
                                        {completed ? (
                                          <Check
                                            size={
                                              10
                                            }
                                          />
                                        ) : active ? (
                                          <Loader2
                                            size={
                                              10
                                            }
                                            className="animate-spin"
                                          />
                                        ) : (
                                          index +
                                          1
                                        )}
                                      </span>

                                      <span
                                        className={`mono text-[8px] tracking-[0.1em] ${
                                          active ||
                                          completed
                                            ? "text-black"
                                            : "text-neutral-300"
                                        }`}
                                      >
                                        {
                                          step
                                        }
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        ref={
                          messagesEndRef
                        }
                      />
                    </div>
                  </div>
                )}

                {/* =================================================
                    INPUT
                ================================================= */}

                <div className="border-t border-black/10 bg-white p-4">
                  {messages.length >
                    0 && (
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                          LUXORA AI
                        </span>

                        {responseAgents.length >
                          1 && (
                          <>
                            <span className="text-neutral-300">
                              /
                            </span>

                            <span className="mono text-[7px] tracking-[0.1em] text-neutral-400">
                              {
                                responseAgents.length
                              }{" "}
                              AGENTS
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={
                          clearConversation
                        }
                        className="text-[9px] text-neutral-400 transition-colors hover:text-black"
                      >
                        CLEAR
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="flex items-end gap-2 border border-black/10 bg-[#fafaf9] p-2 focus-within:border-black/30"
                  >
                    <MessageCircle
                      size={
                        16
                      }
                      className="mb-2 ml-1 shrink-0 text-neutral-400"
                    />

                    <textarea
                      ref={
                        inputRef
                      }
                      value={
                        message
                      }
                      onChange={(
                        event
                      ) =>
                        setMessage(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();

                          sendMessage();
                        }
                      }}
                      rows={1}
                      maxLength={
                        2000
                      }
                      placeholder="Describe what you're looking for..."
                      className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-neutral-400"
                      disabled={
                        isProcessing
                      }
                    />

                    <button
                      type="submit"
                      disabled={
                        isProcessing ||
                        !message.trim()
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center bg-black text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Send message"
                    >
                      <ArrowUp
                        size={
                          16
                        }
                      />
                    </button>
                  </form>

                  <p className="mt-2 text-center text-[8px] leading-4 text-neutral-400">
                    AI recommendations are
                    based on available
                    LUXORA catalog data.
                  </p>
                </div>
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="border-t border-black/10 bg-[#fafaf9] px-5 py-2.5">
                <p className="text-center text-[8px] text-neutral-400">
                  LUXORA AI · Secure commerce
                  assistance
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default LuxoraAI;