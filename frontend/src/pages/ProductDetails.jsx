import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  Sparkles,
  Bot,
  Loader2,
  MessageCircle,
  RefreshCw,
  X,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";

import fallbackProducts from "../data/products";
import { useShop } from "../context/ShopContext";
import ProductImage from "../components/ProductImage";
import ReviewSection from "../components/ReviewSection";
import DeliveryEstimator from "../components/DeliveryEstimator";
import ProductCard from "../components/ProductCard";
import { chatWithLuxoraAI } from "../services/aiService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

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
      ? product.images.filter(Boolean)
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

    discount:
      product.discount ||
      null,

    badge:
      product.badge ||
      (product.vendor_id
        ? "MARKETPLACE"
        : null),

    vendor_id:
      product.vendor_id ??
      null,

    vendor_name:
      product.vendor_name ||
      "",

    is_active:
      product.is_active !==
      undefined
        ? Boolean(
            product.is_active
          )
        : true,
  };
}

/* ============================================================
   FETCH LIVE PRODUCT
============================================================ */

async function fetchLiveProduct(
  productId
) {
  const response =
    await fetch(
      `${API_BASE_URL}/products/${productId}?_=${Date.now()}`,
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

  return normalizeProduct(
    data
  );
}

/* ============================================================
   FETCH LIVE MARKETPLACE CATALOG
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
      (item) =>
        item.is_active !==
        false
    );
}

/* ============================================================
   PRODUCT DETAILS
============================================================ */

function ProductDetails() {
  const { id } =
    useParams();

  const [
    searchParams,
  ] = useSearchParams();

  const navigate =
    useNavigate();

  const isVendorStore =
    searchParams.get(
      "vendor_store"
    ) === "1";

  const {
    cart,
    addToCart,
    updateQuantity,
    toggleWishlist,
    isInWishlist,
    recentlyViewed,
    addRecentlyViewed,
  } = useShop();

  /* ==========================================================
     PRODUCT STATE
  ========================================================== */

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    isLoadingProduct,
    setIsLoadingProduct,
  ] = useState(true);

  const [
    productError,
    setProductError,
  ] = useState("");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    refreshMessage,
    setRefreshMessage,
  ] = useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(0);

  const [
    added,
    setAdded,
  ] = useState(false);

  /* ==========================================================
     AI STATE
  ========================================================== */

  const [
    aiOpen,
    setAiOpen,
  ] = useState(false);

  const [
    aiMessage,
    setAiMessage,
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
    aiResponse,
    setAiResponse,
  ] = useState(null);

  /* ==========================================================
     LIVE RELATED / RECENT PRODUCTS
  ========================================================== */

  const [
    liveCatalog,
    setLiveCatalog,
  ] = useState([]);

  /* ==========================================================
     LOAD PRODUCT
  ========================================================== */

  const loadProduct =
    useCallback(
      async ({
        showLoading = true,
        showRefreshSuccess = false,
      } = {}) => {
        if (showLoading) {
          setIsLoadingProduct(
            true
          );
        }

        if (
          showRefreshSuccess
        ) {
          setRefreshing(true);
        }

        setProductError("");

        try {
          const liveProduct =
            await fetchLiveProduct(
              id
            );

          if (
            !liveProduct ||
            liveProduct.is_active ===
              false
          ) {
            throw new Error(
              "Product not found."
            );
          }

          setProduct(
            liveProduct
          );

          setSelectedImage(
            0
          );

          if (
            showRefreshSuccess
          ) {
            setRefreshMessage(
              "Product refreshed successfully."
            );

            window.setTimeout(
              () => {
                setRefreshMessage(
                  ""
                );
              },
              3500
            );
          }
        } catch (error) {
          console.error(
            "Live product load failed:",
            error
          );

          /*
           * IMPORTANT:
           * For normal customer pages we may use
           * the local catalog as a fallback.
           *
           * But vendor products are expected to
           * come from the live marketplace.
           */
          const localProduct =
            fallbackProducts.find(
              (item) =>
                String(item.id) ===
                String(id)
            );

          const normalizedLocal =
            normalizeProduct(
              localProduct
            );

          if (normalizedLocal) {
            setProduct(
              normalizedLocal
            );

            setProductError(
              "The live marketplace product could not be reached. Showing the saved catalog version."
            );
          } else {
            setProduct(null);

            setProductError(
              "This product is no longer available in the LUXORA marketplace."
            );
          }

          if (
            showRefreshSuccess
          ) {
            setRefreshMessage(
              "Refresh completed, but the live product could not be reached."
            );

            window.setTimeout(
              () => {
                setRefreshMessage(
                  ""
                );
              },
              3500
            );
          }
        } finally {
          setIsLoadingProduct(
            false
          );

          setRefreshing(false);
        }
      },
      [id]
    );

  /* ==========================================================
     INITIAL PRODUCT LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const initialize =
      async () => {
        if (cancelled) {
          return;
        }

        await loadProduct({
          showLoading: true,
          showRefreshSuccess:
            false,
        });
      };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [loadProduct]);

  /* ==========================================================
     LOAD LIVE CATALOG FOR RELATED PRODUCTS
  ========================================================== */

  const loadLiveCatalog =
    useCallback(
      async () => {
        try {
          const catalog =
            await fetchMarketplaceProducts();

          setLiveCatalog(
            catalog
          );
        } catch (error) {
          console.error(
            "Live related catalog load failed:",
            error
          );

          setLiveCatalog(
            fallbackProducts
              .map(
                normalizeProduct
              )
              .filter(Boolean)
              .filter(
                (item) =>
                  item.is_active !==
                  false
              )
          );
        }
      },
      []
    );

  useEffect(() => {
    let cancelled = false;

    const initializeCatalog =
      async () => {
        try {
          const catalog =
            await fetchMarketplaceProducts();

          if (
            cancelled
          ) {
            return;
          }

          setLiveCatalog(
            catalog
          );
        } catch (error) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Live related catalog load failed:",
            error
          );

          setLiveCatalog(
            fallbackProducts
              .map(
                normalizeProduct
              )
              .filter(Boolean)
              .filter(
                (item) =>
                  item.is_active !==
                  false
              )
          );
        }
      };

    initializeCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     RECENTLY VIEWED
  ========================================================== */

  useEffect(() => {
    if (!product) {
      return;
    }

    addRecentlyViewed(
      product.id
    );
  }, [
    product,
    addRecentlyViewed,
  ]);

  /* ==========================================================
     PRODUCT IMAGES
  ========================================================== */

  const productImages =
    useMemo(() => {
      if (!product) {
        return [];
      }

      if (
        Array.isArray(
          product.images
        ) &&
        product.images.length >
          0
      ) {
        return product.images.filter(
          Boolean
        );
      }

      return product.image
        ? [product.image]
        : [];
    }, [product]);

  /* ==========================================================
     CART ITEM
  ========================================================== */

  const cartItem =
    useMemo(() => {
      return cart.find(
        (item) =>
          String(item.id) ===
          String(id)
      );
    }, [cart, id]);

  /* ==========================================================
     RECENTLY VIEWED PRODUCTS
  ========================================================== */

  const recentlyViewedProducts =
    useMemo(() => {
      const catalog =
        liveCatalog.length >
        0
          ? liveCatalog
          : fallbackProducts
              .map(
                normalizeProduct
              )
              .filter(Boolean);

      const result = [];

      for (
        const recentId of recentlyViewed
      ) {
        if (
          String(recentId) ===
          String(id)
        ) {
          continue;
        }

        const recentProduct =
          catalog.find(
            (item) =>
              String(item.id) ===
              String(recentId)
          );

        if (
          recentProduct &&
          recentProduct.is_active !==
            false
        ) {
          result.push(
            recentProduct
          );
        }

        if (
          result.length >= 4
        ) {
          break;
        }
      }

      return result;
    }, [
      liveCatalog,
      recentlyViewed,
      id,
    ]);

  /* ==========================================================
     RELATED PRODUCTS
  ========================================================== */

  const relatedProducts =
    useMemo(() => {
      if (!product) {
        return [];
      }

      const catalog =
        liveCatalog.length >
        0
          ? liveCatalog
          : fallbackProducts
              .map(
                normalizeProduct
              )
              .filter(Boolean);

      return catalog
        .filter(
          (item) =>
            item &&
            item.is_active !==
              false &&
            item.category ===
              product.category &&
            String(item.id) !==
              String(product.id)
        )
        .slice(0, 4);
    }, [
      liveCatalog,
      product,
    ]);

  /* ==========================================================
     WISHLIST
  ========================================================== */

  const inWishlist =
    product
      ? isInWishlist(
          product.id
        )
      : false;

  /* ==========================================================
     SAFE IMAGE INDEX
  ========================================================== */

  const safeSelectedImage =
    productImages.length > 0 &&
    selectedImage >= 0 &&
    selectedImage <
      productImages.length
      ? selectedImage
      : 0;

  /* ==========================================================
     ADD TO CART
  ========================================================== */

  const handleAddToCart =
    () => {
      if (!product) {
        return;
      }

      if (
        Number(product.stock || 0) <=
        0
      ) {
        return;
      }

      addToCart(product);

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1800);
    };

  /* ==========================================================
     BUY NOW
  ========================================================== */

  const handleBuyNow =
    () => {
      if (!product) {
        return;
      }

      if (
        Number(product.stock || 0) <=
        0
      ) {
        return;
      }

      addToCart(product);

      navigate(
        "/checkout"
      );
    };

  /* ==========================================================
     ASK AI
  ========================================================== */

  const askProductAI =
    async (
      question
    ) => {
      const cleanQuestion =
        String(
          question || ""
        ).trim();

      if (
        !cleanQuestion ||
        aiLoading ||
        !product
      ) {
        return;
      }

      setAiOpen(true);
      setAiLoading(true);
      setAiError("");
      setAiResponse(null);
      setAiMessage(
        cleanQuestion
      );

      try {
        const result =
          await chatWithLuxoraAI({
            message:
              cleanQuestion,
            productId:
              product.id,
          });

        if (
          !result.success
        ) {
          setAiError(
            result.message ||
              "LUXORA AI could not answer that question."
          );

          return;
        }

        setAiResponse(
          result.data
        );
      } catch (error) {
        console.error(
          "Product AI request failed:",
          error
        );

        setAiError(
          "I couldn't connect to LUXORA AI right now. Please try again."
        );
      } finally {
        setAiLoading(
          false
        );
      }
    };

  /* ==========================================================
     REFRESH CURRENT PRODUCT
  ========================================================== */

  const handleRefreshProduct =
    async () => {
      await Promise.all([
        loadProduct({
          showLoading:
            false,
          showRefreshSuccess:
            true,
        }),
        loadLiveCatalog(),
      ]);
    };

  /* ==========================================================
     NAVIGATION BACK
  ========================================================== */

  const backToPath =
    isVendorStore
      ? "/shop?vendor_store=1"
      : "/shop";

  /* ==========================================================
     QUICK AI QUESTIONS
  ========================================================== */

  const quickQuestions = [
    "Why is this a good choice?",
    "Is this good for everyday use?",
    "What goes well with this product?",
    "Compare this with another product.",
  ];

  /* ==========================================================
     AI PRODUCTS
  ========================================================== */

  const aiProducts =
    Array.isArray(
      aiResponse?.products
    )
      ? aiResponse.products
          .map(
            normalizeProduct
          )
          .filter(Boolean)
          .filter(
            (item) =>
              item.is_active !==
              false
          )
      : [];

  const aiRelatedProducts =
    aiProducts.filter(
      (item) =>
        String(item?.id) !==
        String(product?.id)
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    isLoadingProduct
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2
            size={18}
            className="animate-spin"
          />

          <span className="mono text-[9px] tracking-[0.16em]">
            LOADING PRODUCT
          </span>
        </div>
      </div>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafaf9] px-6 py-32 text-center">
        <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
          PRODUCT NOT FOUND
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          We couldn&apos;t
          find that product.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-neutral-500">
          {productError ||
            "The product is no longer available in the LUXORA marketplace."}
        </p>

        <Link
          to={
            backToPath
          }
          className="mt-8 inline-flex bg-black px-6 py-3 text-[10px] font-semibold tracking-[0.15em] text-white"
        >
            {isVendorStore
              ? "BACK TO DASHBOARD"
              : "BACK TO SHOP"}
        </Link>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* ======================================================
          REFRESH SUCCESS
      ====================================================== */}

      <AnimatePresence>
        {refreshMessage && (
          <motion.div
            initial={{
              opacity: 0,
              y: -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -12,
            }}
            className="fixed right-5 top-5 z-[100] flex max-w-md items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 shadow-xl"
          >
            <Check
              size={14}
            />

            <span>
              {refreshMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          LIVE MARKETPLACE NOTICE
      ====================================================== */}

      {productError && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-[1440px] px-6 py-3 lg:px-10">
            <p className="text-xs text-amber-800">
              {productError}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN PRODUCT
      ====================================================== */}

      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={
              backToPath
            }
            className="group inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />

            {isVendorStore
              ? "BACK TO DASHBOARD"
              : "BACK TO SHOP"}
          </Link>

          <button
            type="button"
            onClick={
              handleRefreshProduct
            }
            disabled={
              refreshing
            }
            className="mono flex items-center gap-2 border border-black/10 bg-white px-4 py-2.5 text-[8px] tracking-[0.12em] transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
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
              : "REFRESH PRODUCT"}
          </button>
        </div>

        {isVendorStore && (
          <div className="mb-8 border border-black/10 bg-black px-5 py-4 text-white">
            <p className="mono text-[8px] tracking-[0.18em] text-neutral-500">
              LIVE STORE PREVIEW
            </p>

            <p className="mt-1 text-sm text-neutral-200">
              This is the same live marketplace
              catalog customers see.
            </p>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* =================================================
              IMAGE SECTION
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0ed]">
              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={`${product.id}-${safeSelectedImage}-${product.updated_at || ""}`}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="h-full w-full"
                >
                  <ProductImage
                    src={
                      productImages[
                        safeSelectedImage
                      ]
                    }
                    alt={
                      product.name
                    }
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {product.badge && (
                <span className="mono absolute left-5 top-5 z-10 bg-white px-4 py-2 text-[8px] tracking-[0.15em]">
                  {product.badge}
                </span>
              )}

              {product.vendor_id && (
                <span className="mono absolute bottom-5 left-5 z-10 bg-black px-4 py-2 text-[8px] tracking-[0.15em] text-white">
                  {product.vendor_name ||
                    "MARKETPLACE PARTNER"}
                </span>
              )}

              {productImages.length >
                1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        (current) =>
                          current ===
                          0
                            ? productImages.length -
                              1
                            : current -
                              1
                      )
                    }
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105"
                    aria-label="Previous image"
                  >
                    <ArrowLeft
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        (current) =>
                          current ===
                          productImages.length -
                            1
                            ? 0
                            : current +
                              1
                      )
                    }
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105"
                    aria-label="Next image"
                  >
                    <ArrowRight
                      size={15}
                    />
                  </button>
                </>
              )}
            </div>

            {productImages.length >
              1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {productImages.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() =>
                        setSelectedImage(
                          index
                        )
                      }
                      className={`aspect-square overflow-hidden border transition ${
                        safeSelectedImage ===
                        index
                          ? "border-black"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <ProductImage
                        src={
                          image
                        }
                        alt={`${product.name} ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </motion.div>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
            className="flex flex-col justify-center"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              {product.category?.toUpperCase()}
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              {product.name}
            </h1>

            {product.brand && (
              <p className="mt-3 text-sm text-neutral-400">
                {product.brand}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="tracking-wide text-amber-500">
                ★★★★★
              </span>

              <span className="text-sm font-medium">
                {product.rating}
              </span>

              <span className="text-sm text-neutral-400">
                ({product.reviews} reviews)
              </span>
            </div>

            <div className="mt-7 flex items-baseline gap-4">
              <p className="text-2xl font-semibold">
                ₹
                {Number(
                  product.price || 0
                ).toLocaleString(
                  "en-IN"
                )}
              </p>

              {product.originalPrice !==
                null &&
                product.originalPrice !==
                  undefined &&
                Number(
                  product.originalPrice
                ) >
                  Number(
                    product.price || 0
                  ) && (
                  <p className="text-sm text-neutral-400 line-through">
                    ₹
                    {Number(
                      product.originalPrice
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                )}

              {product.discount && (
                <span className="mono border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-emerald-700">
                  {product.discount}%
                  OFF
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-neutral-400">
              Inclusive of all applicable
              taxes
            </p>

            <p className="mt-7 max-w-lg text-sm leading-7 text-neutral-500">
              {product.description}
            </p>

            {product.stock <=
              0 && (
              <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                This product is currently
                out of stock.
              </div>
            )}

            {product.stock >
              0 &&
              product.stock <=
                5 && (
                <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Only{" "}
                  {product.stock}{" "}
                  left in stock.
                </div>
              )}

            {/* =================================================
                AI PRODUCT INTELLIGENCE
            ================================================= */}

            <motion.section
              layout
              className="mt-8 border border-black/10 bg-white"
            >
              <div className="flex items-start justify-between gap-4 border-b border-black/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Sparkles
                      size={15}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                      LUXORA AI
                    </p>

                    <h2 className="mt-1 text-sm font-medium">
                      Product intelligence
                    </h2>

                    <p className="mt-1 text-[10px] leading-5 text-neutral-400">
                      Ask about this exact
                      marketplace product.
                    </p>
                  </div>
                </div>

                {aiOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setAiOpen(
                        false
                      );
                      setAiResponse(
                        null
                      );
                      setAiError(
                        ""
                      );
                      setAiMessage(
                        ""
                      );
                    }}
                    className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-black"
                    aria-label="Close AI response"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Bot
                    size={14}
                    strokeWidth={1.5}
                  />

                  <p className="mono text-[8px] tracking-[0.16em] text-neutral-400">
                    WHY LUXORA RECOMMENDS THIS
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {product.name} is part
                  of the{" "}
                  {product.category?.toLowerCase()}{" "}
                  collection and is
                  currently rated{" "}
                  {product.rating}/5 based
                  on {product.reviews}{" "}
                  reviews.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {quickQuestions.map(
                    (question) => (
                      <button
                        type="button"
                        key={
                          question
                        }
                        onClick={() =>
                          askProductAI(
                            question
                          )
                        }
                        disabled={
                          aiLoading
                        }
                        className="border border-black/10 bg-[#fafaf9] px-3 py-2 text-left text-[9px] text-neutral-500 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {
                          question
                        }
                      </button>
                    )
                  )}
                </div>

                <AnimatePresence>
                  {aiOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="overflow-hidden"
                    >
                      {aiMessage && (
                        <div className="mt-5 border-t border-black/10 pt-5">
                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                            YOUR QUESTION
                          </p>

                          <p className="mt-2 text-sm font-medium">
                            {
                              aiMessage
                            }
                          </p>
                        </div>
                      )}

                      {aiLoading && (
                        <div className="mt-5 flex items-center gap-3 border border-black/10 bg-[#fafaf9] p-4">
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          <div>
                            <p className="text-xs font-medium">
                              LUXORA AI is analyzing this product.
                            </p>

                            <p className="mt-1 text-[9px] text-neutral-400">
                              Using the live LUXORA product information.
                            </p>
                          </div>
                        </div>
                      )}

                      {!aiLoading &&
                        aiError && (
                          <div className="mt-5 border border-red-200 bg-red-50 p-4">
                            <p className="text-xs leading-5 text-red-800">
                              {
                                aiError
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                askProductAI(
                                  aiMessage
                                )
                              }
                              disabled={
                                !aiMessage
                              }
                              className="mt-3 border border-red-300 bg-white px-4 py-2 text-[8px] font-semibold text-red-700"
                            >
                              TRY AGAIN
                            </button>
                          </div>
                        )}

                      {!aiLoading &&
                        !aiError &&
                        aiResponse?.message && (
                          <div className="mt-5 border border-black/10 bg-[#fafaf9] p-5">
                            <div className="flex gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                                <Bot
                                  size={13}
                                />
                              </div>

                              <p className="whitespace-pre-line text-sm leading-6 text-neutral-600">
                                {
                                  aiResponse.message
                                }
                              </p>
                            </div>
                          </div>
                        )}

                      {!aiLoading &&
                        !aiError &&
                        aiRelatedProducts.length >
                          0 && (
                          <div className="mt-5">
                            <div className="mb-3 flex items-center gap-2">
                              <MessageCircle
                                size={13}
                              />

                              <p className="mono text-[8px] tracking-[0.16em] text-neutral-400">
                                AI-SUGGESTED PRODUCTS
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {aiRelatedProducts
                                .slice(
                                  0,
                                  4
                                )
                                .map(
                                  (
                                    item
                                  ) => (
                                    <div
                                      key={`ai-${item.id}`}
                                      className="flex gap-3 border border-black/10 bg-white p-3"
                                    >
                                      <div className="h-16 w-14 shrink-0 overflow-hidden bg-[#f0f0ed]">
                                        <ProductImage
                                          src={
                                            item.image
                                          }
                                          alt={
                                            item.name
                                          }
                                          className="h-full w-full object-cover"
                                        />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">
                                          {
                                            item.name
                                          }
                                        </p>

                                        <p className="mt-1 text-[9px] text-neutral-400">
                                          {
                                            item.category
                                          }
                                        </p>

                                        <div className="mt-2 flex items-center justify-between">
                                          <span className="text-xs font-medium">
                                            ₹
                                            {Number(
                                              item.price ||
                                                0
                                            ).toLocaleString(
                                              "en-IN"
                                            )}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              addToCart(
                                                item
                                              )
                                            }
                                            disabled={
                                              Number(
                                                item.stock ||
                                                  0
                                              ) <=
                                              0
                                            }
                                            className="bg-black px-2.5 py-1.5 text-[8px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                                          >
                                            {Number(
                                              item.stock ||
                                                0
                                            ) <=
                                            0
                                              ? "OUT"
                                              : "ADD"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* =================================================
                DELIVERY
            ================================================= */}

            <DeliveryEstimator />

            {/* =================================================
                CART
            ================================================= */}

            {cartItem ? (
              <div className="mt-6 border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                      IN YOUR CART
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {
                        cartItem.quantity
                      }{" "}
                      item
                      {cartItem.quantity >
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center border border-black/10">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          cartItem.quantity -
                            1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center transition hover:bg-black hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus
                        size={14}
                      />
                    </button>

                    <span className="flex h-10 w-10 items-center justify-center text-sm">
                      {
                        cartItem.quantity
                      }
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          cartItem.quantity +
                            1
                        )
                      }
                      disabled={
                        cartItem.quantity >=
                        Number(
                          product.stock || 0
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus
                        size={14}
                      />
                    </button>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="mt-4 block w-full border border-black px-5 py-3 text-center text-[9px] font-semibold tracking-[0.15em] transition hover:bg-black hover:text-white"
                >
                  VIEW CART
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  product.stock <= 0
                }
                className="relative mt-6 flex w-full items-center justify-center gap-3 overflow-hidden bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span
                      key="added"
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        size={15}
                      />

                      ADDED TO CART
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      className="flex items-center gap-3"
                    >
                      <ShoppingBag
                        size={15}
                      />

                      {product.stock <=
                      0
                        ? "OUT OF STOCK"
                        : "ADD TO CART"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

            {/* =================================================
                BUY NOW
            ================================================= */}

            <button
              type="button"
              onClick={
                handleBuyNow
              }
              disabled={
                product.stock <= 0
              }
              className="mt-3 w-full border border-black bg-white py-4 text-[10px] font-semibold tracking-[0.15em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              BUY NOW
            </button>

            {/* =================================================
                WISHLIST
            ================================================= */}

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={() =>
                toggleWishlist(
                  product
                )
              }
              className={`mt-3 flex w-full items-center justify-center gap-3 border px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition ${
                inWishlist
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black hover:border-black hover:bg-white"
              }`}
            >
              <Heart
                size={15}
                fill={
                  inWishlist
                    ? "currentColor"
                    : "none"
                }
              />

              {inWishlist
                ? "REMOVE FROM WISHLIST"
                : "ADD TO WISHLIST"}
            </motion.button>

            {/* =================================================
                SERVICE INFORMATION
            ================================================= */}

            <div className="mt-8 grid grid-cols-1 border-y border-black/10 sm:grid-cols-3">
              <div className="flex gap-3 border-b border-black/10 py-5 sm:border-b-0 sm:border-r sm:pr-5">
                <Truck
                  size={17}
                  strokeWidth={1.3}
                />

                <div>
                  <p className="text-xs font-medium">
                    Fast Delivery
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Across India
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-b border-black/10 py-5 sm:border-b-0 sm:border-r sm:px-5">
                <ShieldCheck
                  size={17}
                  strokeWidth={1.3}
                />

                <div>
                  <p className="text-xs font-medium">
                    Secure
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Safe checkout
                  </p>
                </div>
              </div>

              <div className="flex gap-3 py-5 sm:pl-5">
                <ArrowLeft
                  size={17}
                  strokeWidth={1.3}
                />

                <div>
                  <p className="text-xs font-medium">
                    Easy Returns
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Hassle-free
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ======================================================
          REVIEWS
      ====================================================== */}

      <ReviewSection
        product={product}
      />

      {/* ======================================================
          RECENTLY VIEWED
      ====================================================== */}

      {recentlyViewedProducts.length >
        0 && (
        <section className="border-t border-black/10 bg-[#fafaf9] py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
              YOUR HISTORY
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              Recently Viewed
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedProducts.map(
                (item) => (
                  <ProductCard
                    key={`recent-${item.id}`}
                    product={
                      item
                    }
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          RELATED PRODUCTS
      ====================================================== */}

      {relatedProducts.length >
        0 && (
        <section className="border-t border-black/[0.06] bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10 lg:py-28">
            <div className="flex items-end justify-between">
              <div>
                <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                  YOU MAY ALSO LIKE
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
                  Related pieces.
                </h2>
              </div>

              <Link
                to={
                  backToPath
                }
                className="hidden items-center gap-2 text-[9px] font-semibold tracking-[0.15em] md:flex"
              >
                {isVendorStore
                  ? "BACK TO STORE"
                  : "VIEW ALL"}

                <ArrowRight
                  size={13}
                />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(
                (item) => (
                  <ProductCard
                    key={`related-${item.id}`}
                    product={
                      item
                    }
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          FINAL BACK NAVIGATION
      ====================================================== */}

      <footer className="border-t border-black/10 bg-[#fafaf9]">
        <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
          <Link
            to={
              backToPath
            }
            className="group inline-flex items-center gap-2 text-[9px] font-semibold tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft
              size={13}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />

            {isVendorStore
              ? "BACK TO DASHBOARD"
              : "BACK TO SHOP"}
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default ProductDetails;