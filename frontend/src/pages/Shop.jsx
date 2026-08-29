import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { useShop } from "../context/ShopContext";
import fallbackProducts from "../data/products";
import ProductCard from "../components/ProductCard";
import ShopFilters from "../components/ShopFilters";
import { chatWithLuxoraAI } from "../services/aiService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

/* ============================================================
   HELPERS
============================================================ */

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
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

/* ============================================================
   NORMALIZE PRODUCT
============================================================ */

function normalizeProduct(product) {
  if (
    !product ||
    product.id === undefined ||
    product.id === null
  ) {
    return null;
  }

  const images =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  return {
    ...product,

    id: Number(product.id),

    name:
      product.name ||
      "LUXORA Product",

    description:
      product.description || "",

    category:
      product.category ||
      "Collection",

    subcategory:
      product.subcategory ||
      "",

    brand:
      product.brand ||
      "",

    price:
      Number(product.price || 0),

    originalPrice:
      product.originalPrice !==
      undefined
        ? Number(
            product.originalPrice || 0
          )
        : product.original_price !==
            undefined
          ? Number(
              product.original_price || 0
            )
          : null,

    original_price:
      product.original_price !==
      undefined
        ? Number(
            product.original_price || 0
          )
        : product.originalPrice !==
            undefined
          ? Number(
              product.originalPrice || 0
            )
          : null,

    image:
      product.image ||
      images[0] ||
      "",

    images,

    stock:
      Number(product.stock || 0),

    rating:
      Number(product.rating || 0),

    reviews:
      Number(
        product.reviews ??
          product.review_count ??
          0
      ),

    review_count:
      Number(
        product.review_count ??
          product.reviews ??
          0
      ),

    featured:
      Boolean(product.featured),

    badge:
      product.badge ||
      (product.vendor_id
        ? "MARKETPLACE"
        : null),

    is_active:
      product.is_active !==
      undefined
        ? Boolean(
            product.is_active
          )
        : true,

    vendor_id:
      product.vendor_id ??
      null,

    vendor_name:
      product.vendor_name ||
      "",
  };
}

/* ============================================================
   MARKETPLACE API
============================================================ */

async function fetchMarketplaceProducts() {
  const response =
    await fetch(
      `${API_BASE_URL}/products?_=${Date.now()}`,
      {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept:
            "application/json",

          "Cache-Control":
            "no-cache",

          Pragma:
            "no-cache",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Product API returned ${response.status}`
    );
  }

  const data =
    await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "Product API returned an invalid response."
    );
  }

  return data
    .map(
      normalizeProduct
    )
    .filter(Boolean)
    .filter(
      (product) =>
        product.is_active !==
        false
    );
}

/* ============================================================
   SHOP
============================================================ */

function Shop() {
  const [searchParams] =
    useSearchParams();

  const urlSearch =
    searchParams.get("search") ||
    "";

  /*
   * Vendor dashboard opens:
   *
   * /shop?vendor_store=1
   *
   * This is only a customer-facing preview
   * of the same live marketplace catalog.
   */
  const isVendorStore =
    searchParams.get(
      "vendor_store"
    ) === "1";

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [sort, setSort] =
    useState("featured");

  /* ==========================================================
     LIVE PRODUCTS
  ========================================================== */

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [
    productsError,
    setProductsError,
  ] = useState("");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    marketplaceMessage,
    setMarketplaceMessage,
  ] = useState("");

  /* ==========================================================
     AI SEARCH
  ========================================================== */

  const [
    aiQuery,
    setAiQuery,
  ] = useState("");

  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  const [
    aiError,
    setAiError,
  ] = useState("");

  const [
    aiResult,
    setAiResult,
  ] = useState(null);

  const {
    addToCart,
  } = useShop();

  const effectiveSearch =
    search || urlSearch;

  /* ==========================================================
     SUCCESS MESSAGE
  ========================================================== */

  const showMarketplaceMessage =
    useCallback(
      (message) => {
        setMarketplaceMessage(
          message
        );

        window.setTimeout(() => {
          setMarketplaceMessage(
            ""
          );
        }, 3500);
      },
      []
    );

  /* ==========================================================
     LOAD LIVE MARKETPLACE
  ========================================================== */

  const loadMarketplace =
    useCallback(
      async ({
        showLoading = true,
        showSuccess = false,
      } = {}) => {
        if (showLoading) {
          setProductsLoading(
            true
          );
        }

        if (showSuccess) {
          setRefreshing(true);
        }

        setProductsError("");

        try {
          const liveProducts =
            await fetchMarketplaceProducts();

          setProducts(
            liveProducts
          );

          if (showSuccess) {
            showMarketplaceMessage(
              isVendorStore
                ? "Store refreshed successfully."
                : "Marketplace refreshed successfully."
            );
          }
        } catch (error) {
          console.error(
            "LUXORA marketplace product load failed:",
            error
          );

          const normalizedFallback =
            fallbackProducts
              .map(
                normalizeProduct
              )
              .filter(Boolean)
              .filter(
                (product) =>
                  product.is_active !==
                  false
              );

          setProducts(
            normalizedFallback
          );

          setProductsError(
            "The live marketplace could not be reached. Showing the local catalog."
          );
        } finally {
          setProductsLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        isVendorStore,
        showMarketplaceMessage,
      ]
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadMarketplace({
          showLoading: true,
          showSuccess: false,
        });
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadMarketplace]);

  /* ==========================================================
     NORMAL PRODUCT FILTERING
  ========================================================== */

  const filteredProducts =
    useMemo(() => {
      let result = [
        ...products,
      ];

      /* ================= CATEGORY ================= */

      if (
        category !==
        "All"
      ) {
        result =
          result.filter(
            (product) =>
              String(
                product.category ||
                  ""
              ).toLowerCase() ===
              String(
                category || ""
              ).toLowerCase()
          );
      }

      /* ================= SEARCH ================= */

      if (
        effectiveSearch.trim()
      ) {
        const query =
          effectiveSearch
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (product) => {
              const name =
                product.name?.toLowerCase() ||
                "";

              const productCategory =
                product.category?.toLowerCase() ||
                "";

              const subcategory =
                product.subcategory?.toLowerCase() ||
                "";

              const brand =
                product.brand?.toLowerCase() ||
                "";

              const description =
                product.description?.toLowerCase() ||
                "";

              const vendorName =
                product.vendor_name?.toLowerCase() ||
                "";

              return (
                name.includes(
                  query
                ) ||
                productCategory.includes(
                  query
                ) ||
                subcategory.includes(
                  query
                ) ||
                brand.includes(
                  query
                ) ||
                description.includes(
                  query
                ) ||
                vendorName.includes(
                  query
                )
              );
            }
          );
      }

      /* ================= SORT ================= */

      switch (sort) {
        case "newest":
          result.sort(
            (a, b) =>
              Number(
                b.id || 0
              ) -
              Number(
                a.id || 0
              )
          );
          break;

        case "reviews":
          result.sort(
            (a, b) =>
              Number(
                b.reviews || 0
              ) -
              Number(
                a.reviews || 0
              )
          );
          break;

        case "price-low":
          result.sort(
            (a, b) =>
              Number(
                a.price || 0
              ) -
              Number(
                b.price || 0
              )
          );
          break;

        case "price-high":
          result.sort(
            (a, b) =>
              Number(
                b.price || 0
              ) -
              Number(
                a.price || 0
              )
          );
          break;

        case "rating":
          result.sort(
            (a, b) =>
              Number(
                b.rating || 0
              ) -
              Number(
                a.rating || 0
              )
          );
          break;

        case "name":
          result.sort(
            (a, b) =>
              String(
                a.name || ""
              ).localeCompare(
                String(
                  b.name || ""
                )
              )
          );
          break;

        default:
          result.sort(
            (a, b) =>
              Number(
                Boolean(
                  b.featured
                )
              ) -
              Number(
                Boolean(
                  a.featured
                )
              )
          );
          break;
      }

      return result;
    }, [
      products,
      effectiveSearch,
      category,
      sort,
    ]);

  /* ==========================================================
     AI SEARCH
  ========================================================== */

  const handleAiSearch =
    async (event) => {
      event?.preventDefault();

      const query =
        aiQuery.trim();

      if (
        !query ||
        aiLoading
      ) {
        return;
      }

      setAiLoading(true);
      setAiError("");
      setAiResult(null);

      try {
        const result =
          await chatWithLuxoraAI({
            message: query,
          });

        if (!result.success) {
          setAiError(
            result.message ||
              "LUXORA AI could not process your request."
          );

          return;
        }

        setAiResult(
          result.data
        );
      } catch (error) {
        console.error(
          "LUXORA AI search error:",
          error
        );

        setAiError(
          "I couldn't complete your AI search. Please try again."
        );
      } finally {
        setAiLoading(
          false
        );
      }
    };

  /* ==========================================================
     CLEAR AI SEARCH
  ========================================================== */

  const clearAiSearch =
    () => {
      setAiQuery("");
      setAiResult(null);
      setAiError("");
    };

  /* ==========================================================
     AI RESULT PRODUCTS
  ========================================================== */

  const aiProducts =
    Array.isArray(
      aiResult?.products
    )
      ? aiResult.products
          .map(
            normalizeProduct
          )
          .filter(Boolean)
          .filter(
            (product) =>
              product.is_active !==
              false
          )
      : [];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#111111]">

      {/* ====================================================
          REFRESH SUCCESS
      ==================================================== */}

      {marketplaceMessage && (
        <motion.div
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="fixed right-5 top-5 z-[100] flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 shadow-xl"
        >
          <CheckCircleIcon />

          <span>
            {marketplaceMessage}
          </span>
        </motion.div>
      )}

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="border-b border-black/[0.06]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-5xl"
          >

            {/* =================================================
                BACK NAVIGATION
            ================================================= */}

            <div className="mb-12">
              <Link
                to={
                  isVendorStore
                    ? "/vendor/dashboard"
                    : "/"
                }
                className="group inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors duration-300 hover:text-black"
              >
                <ArrowLeft
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />

                <span>
                  {isVendorStore
                    ? "BACK TO DASHBOARD"
                    : "BACK TO STORE"}
                </span>
              </Link>
            </div>

            {/* =================================================
                TITLE
            ================================================= */}

            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                  {isVendorStore
                    ? "LUXORA MARKETPLACE"
                    : "THE COLLECTION"}
                </p>

                <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.08em]">
                  {isVendorStore ? (
                    <>
                      Your
                      <br />
                      <span className="text-neutral-400">
                        live store.
                      </span>
                    </>
                  ) : (
                    <>
                      Discover
                      <br />
                      <span className="text-neutral-400">
                        the collection.
                      </span>
                    </>
                  )}
                </h1>
              </div>

              {/* =================================================
                  REFRESH
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  loadMarketplace({
                    showLoading: false,
                    showSuccess: true,
                  })
                }
                disabled={
                  refreshing
                }
                className="mono flex w-fit items-center gap-2 border border-black/10 bg-white px-4 py-3 text-[8px] tracking-[0.12em] transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "REFRESHING"
                  : isVendorStore
                    ? "REFRESH STORE"
                    : "REFRESH MARKETPLACE"}
              </button>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p className="mt-8 max-w-xl text-sm leading-7 text-neutral-500">
              {isVendorStore
                ? "This is the live customer marketplace preview. Products published by your business appear here automatically after they are saved to the marketplace."
                : "Explore thoughtfully selected essentials from LUXORA and products published by verified marketplace partners."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====================================================
          MARKETPLACE ERROR
      ==================================================== */}

      {productsError && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-[1440px] px-6 py-3 lg:px-10">
            <p className="text-xs text-amber-800">
              {productsError}
            </p>
          </div>
        </div>
      )}

      {/* ====================================================
          VENDOR STORE INFO
      ==================================================== */}

      {isVendorStore && (
        <section className="border-b border-black/[0.06] bg-black text-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <div>
              <p className="mono text-[8px] tracking-[0.18em] text-neutral-500">
                LIVE MARKETPLACE PREVIEW
              </p>

              <p className="mt-1 text-sm text-neutral-200">
                This view uses the same live
                <br className="sm:hidden" />
                customer catalog endpoint.
              </p>
            </div>

            <div className="mono text-[8px] tracking-[0.12em] text-neutral-500">
              {products.length}{" "}
              {products.length ===
              1
                ? "PRODUCT"
                : "PRODUCTS"}{" "}
              AVAILABLE
            </div>
          </div>
        </section>
      )}

      {/* ====================================================
          AI DISCOVERY
      ==================================================== */}

      <section className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-14 lg:px-10 lg:py-16">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.6,
            }}
            className="border border-black/10 bg-[#fafaf9]"
          >
            <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">

              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Bot
                      size={17}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <p className="mono text-[8px] tracking-[0.2em] text-neutral-400">
                      LUXORA AI
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      AI-powered product
                      discovery
                    </p>
                  </div>
                </div>

                <h2 className="mt-7 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Don&apos;t search.
                  <br />

                  <span className="text-neutral-400">
                    Describe what you need.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
                  Tell LUXORA about your
                  budget, style, use case
                  or preferences. The AI
                  searches the live
                  marketplace catalog.
                </p>
              </div>

              <div className="w-full lg:max-w-[600px]">
                <form
                  onSubmit={
                    handleAiSearch
                  }
                  className="border border-black/15 bg-white"
                >
                  <div className="flex items-start gap-3 p-3">
                    <Search
                      size={17}
                      strokeWidth={1.5}
                      className="mt-3 shrink-0 text-neutral-400"
                    />

                    <textarea
                      value={aiQuery}
                      onChange={(
                        event
                      ) =>
                        setAiQuery(
                          event.target.value
                        )
                      }
                      rows={2}
                      maxLength={2000}
                      placeholder='Try "Nike shoes under ₹10000 for running"'
                      className="min-h-[58px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-neutral-400"
                      disabled={
                        aiLoading
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-black/10 px-3 py-3">
                    <p className="text-[9px] text-neutral-400">
                      Search the live
                      marketplace with
                      natural language
                    </p>

                    <button
                      type="submit"
                      disabled={
                        aiLoading ||
                        !aiQuery.trim()
                      }
                      className="flex items-center gap-2 bg-black px-5 py-2.5 text-[9px] font-semibold tracking-[0.12em] text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                          SEARCHING
                        </>
                      ) : (
                        <>
                          <Sparkles
                            size={12}
                          />
                          SEARCH WITH AI
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* =================================================
                QUICK PROMPTS
            ================================================= */}

            <div className="border-t border-black/10 px-6 py-5 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono mr-1 text-[8px] tracking-[0.14em] text-neutral-400">
                  TRY
                </span>

                {[
                  "Premium watch under ₹20000",
                  "Something for travel",
                  "Everyday footwear",
                  "A premium bag",
                  "Nike products",
                ].map(
                  (prompt) => (
                    <button
                      key={
                        prompt
                      }
                      type="button"
                      onClick={() =>
                        setAiQuery(
                          prompt
                        )
                      }
                      className="border border-black/10 bg-white px-3 py-2 text-[9px] text-neutral-500 transition-colors hover:border-black hover:text-black"
                    >
                      {prompt}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* =================================================
              AI LOADING
          ================================================= */}

          {aiLoading && (
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-6 border border-black/10 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <Loader2
                  size={15}
                  className="animate-spin"
                />

                <div>
                  <p className="text-xs font-medium">
                    LUXORA AI is finding
                    your matches.
                  </p>

                  <p className="mt-1 text-[9px] text-neutral-400">
                    Searching the live
                    LUXORA marketplace
                    catalog.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* =================================================
              AI ERROR
          ================================================= */}

          {aiError &&
            !aiLoading && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-6 border border-red-200 bg-red-50 p-5"
              >
                <p className="mono text-[8px] tracking-[0.15em] text-red-500">
                  AI SEARCH ERROR
                </p>

                <p className="mt-2 text-sm text-red-800">
                  {aiError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleAiSearch()
                  }
                  disabled={
                    !aiQuery.trim()
                  }
                  className="mt-4 border border-red-300 bg-white px-4 py-2 text-[9px] font-semibold tracking-[0.12em] text-red-700 transition hover:border-red-500 disabled:opacity-40"
                >
                  TRY AGAIN
                </button>
              </motion.div>
            )}

          {/* =================================================
              AI RESULTS
          ================================================= */}

          {aiResult &&
            !aiLoading && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-8"
              >
                <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={14}
                      />

                      <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                        AI SEARCH RESULTS
                      </p>
                    </div>

                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                      {aiProducts.length >
                      0
                        ? `I found ${aiProducts.length} strong ${
                            aiProducts.length ===
                            1
                              ? "match"
                              : "matches"
                          }.`
                        : "No exact matches."}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      clearAiSearch
                    }
                    className="self-start border border-black/10 px-4 py-2 text-[8px] font-semibold tracking-[0.12em] text-neutral-500 transition hover:border-black hover:text-black sm:self-auto"
                  >
                    CLEAR AI SEARCH
                  </button>
                </div>

                {/* =================================================
                    AI MESSAGE
                ================================================= */}

                {aiResult.message && (
                  <div className="mt-5 border border-black/10 bg-[#fafaf9] p-5">
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                        <Bot
                          size={13}
                        />
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-neutral-600">
                        {
                          aiResult.message
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* =================================================
                    AI PRODUCTS
                ================================================= */}

                {aiProducts.length >
                0 ? (
                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {aiProducts.map(
                      (
                        product
                      ) => {
                        const matchScore =
                          getMatchScore(
                            product
                          );

                        return (
                          <div
                            key={
                              product.id
                            }
                            className="relative"
                          >
                            {matchScore !==
                              null && (
                              <div className="absolute right-3 top-3 z-20 border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[8px] font-semibold text-emerald-700">
                                {
                                  matchScore
                                }
                                % AI MATCH
                              </div>
                            )}

                            <ProductCard
                              product={
                                product
                              }
                            />

                            <div className="mt-3 border border-black/10 bg-white p-3">
                              {product.description && (
                                <p className="line-clamp-2 text-[10px] leading-5 text-neutral-500">
                                  {
                                    product.description
                                  }
                                </p>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  addToCart(
                                    product
                                  )
                                }
                                className="mt-3 flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-[8px] font-semibold tracking-[0.12em] text-white transition hover:bg-neutral-800"
                              >
                                ADD AI MATCH TO CART
                              </button>

                              <p className="mt-2 text-center text-[8px] text-neutral-400">
                                {formatPrice(
                                  product.price
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="mt-8 border border-black/10 bg-white p-10 text-center">
                    <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                      NO EXACT MATCHES
                    </p>

                    <h3 className="mt-3 text-xl font-medium">
                      Let&apos;s try a
                      different
                      description.
                    </h3>
                  </div>
                )}
              </motion.div>
            )}
        </div>
      </section>

      {/* ====================================================
          PRODUCT CATALOG
      ==================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-14 lg:px-10 lg:py-16">

          <ShopFilters
            search={
              search
            }
            setSearch={
              setSearch
            }
            category={
              category
            }
            setCategory={
              setCategory
            }
            sort={
              sort
            }
            setSort={
              setSort
            }
          />

          {/* =================================================
              RESULT COUNT
          ================================================= */}

          <div className="mb-8 mt-10 flex items-center justify-between border-t border-black/[0.06] pt-6">
            <div>
              <p className="mono text-[9px] tracking-[0.15em] text-neutral-400">
                {
                  filteredProducts.length
                }{" "}
                {filteredProducts.length ===
                1
                  ? "PRODUCT"
                  : "PRODUCTS"}
              </p>

              {!productsLoading &&
                products.length >
                  0 && (
                  <p className="mt-1 text-[9px] text-neutral-400">
                    {isVendorStore
                      ? "LIVE CUSTOMER STORE"
                      : "LIVE LUXORA MARKETPLACE"}
                  </p>
                )}
            </div>

            {productsLoading && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2
                  size={13}
                  className="animate-spin"
                />

                <span className="mono text-[8px] tracking-[0.12em]">
                  LOADING CATALOG
                </span>
              </div>
            )}
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {productsLoading ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (item) => (
                  <div
                    key={
                      item
                    }
                    className="animate-pulse"
                  >
                    <div className="aspect-[4/5] bg-[#f0f0ed]" />

                    <div className="pt-5">
                      <div className="h-2 w-20 bg-[#eeeeeb]" />

                      <div className="mt-3 h-4 w-40 bg-[#eeeeeb]" />

                      <div className="mt-3 h-3 w-24 bg-[#eeeeeb]" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : filteredProducts.length >
            0 ? (

            /* =================================================
               PRODUCTS
            ================================================= */

            <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(
                (product) => (
                  <div
                    key={
                      product.id
                    }
                    className="relative"
                  >
                    {/* =============================================
                        MARKETPLACE BADGE
                    ============================================= */}

                    {product.vendor_id && (
                      <span className="pointer-events-none absolute left-4 top-4 z-30 bg-black px-3 py-1.5 text-[7px] font-semibold tracking-[0.12em] text-white">
                        {product.vendor_name
                          ? product.vendor_name.toUpperCase()
                          : "MARKETPLACE"}
                      </span>
                    )}

                    <ProductCard
                      product={
                        product
                      }
                    />
                  </div>
                )
              )}
            </div>

          ) : (

            /* =================================================
               NO RESULTS
            ================================================= */

            <div className="flex min-h-[350px] items-center justify-center border border-black/10">
              <div className="text-center">
                <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
                  NO RESULTS
                </p>

                <h2 className="mt-3 text-xl font-medium">
                  Nothing matched your
                  search.
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory(
                      "All"
                    );
                    setSort(
                      "featured"
                    );
                  }}
                  className="mt-6 bg-black px-6 py-3 text-[9px] font-semibold tracking-[0.15em] text-white transition-transform hover:-translate-y-0.5"
                >
                  CLEAR FILTERS
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   SUCCESS ICON
============================================================ */

function CheckCircleIcon() {
  return (
    <span className="inline-flex">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export default Shop;