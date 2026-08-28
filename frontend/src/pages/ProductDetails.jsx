import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import products from "../data/products";
import { useShop } from "../context/ShopContext";
import ProductImage from "../components/ProductImage";
import ReviewSection from "../components/ReviewSection";
import DeliveryEstimator from "../components/DeliveryEstimator";
import ProductCard from "../components/ProductCard";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    cart,
    addToCart,
    updateQuantity,
    toggleWishlist,
    isInWishlist,
    recentlyViewed,
    addRecentlyViewed,
  } = useShop();

  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  /*
   * Find the current product using the URL id.
   */
  const product = useMemo(() => {
    return products.find(
      (item) => String(item.id) === String(id)
    );
  }, [id]);

  /*
   * Product images.
   */
  const productImages = useMemo(() => {
    if (!product) {
      return [];
    }

    return Array.isArray(product.images) &&
      product.images.length > 0
      ? product.images
      : [product.image];
  }, [product]);

  /*
   * Add the current product to recently viewed.
   *
   * This effect synchronizes the current product with
   * the recently-viewed list. It does not synchronously
   * update local component state.
   */
  useEffect(() => {
    if (!product) {
      return;
    }

    addRecentlyViewed(product.id);
  }, [addRecentlyViewed, product]);

  /*
   * Find this product inside the cart.
   */
  const cartItem = useMemo(() => {
    return cart.find(
      (item) =>
        String(item.id) === String(id)
    );
  }, [cart, id]);

  /*
   * Convert recently viewed IDs into products.
   */
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewed
      .filter(
        (recentId) =>
          String(recentId) !== String(id)
      )
      .map((recentId) =>
        products.find(
          (item) =>
            String(item.id) === String(recentId)
        )
      )
      .filter(Boolean)
      .slice(0, 4);
  }, [recentlyViewed, id]);

  /*
   * Related products are based on category.
   */
  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    return products
      .filter(
        (item) =>
          item.category === product.category &&
          String(item.id) !== String(product.id)
      )
      .slice(0, 4);
  }, [product]);

  /*
   * Product not found page.
   */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafaf9] px-6 py-32 text-center">
        <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
          PRODUCT NOT FOUND
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          We couldn't find that product.
        </h1>

        <Link
          to="/shop"
          className="mt-8 inline-flex bg-black px-6 py-3 text-[10px] font-semibold tracking-[0.15em] text-white"
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  /*
   * Keep selected image valid if the current product
   * has fewer images than the previous product.
   */
  const safeSelectedImage =
    selectedImage >= productImages.length
      ? 0
      : selectedImage;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* =====================================================
          MAIN PRODUCT
      ===================================================== */}

      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-16">
        {/* BACK TO SHOP */}

        <Link
          to="/shop"
          className="mb-10 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} />
          Back to shop
        </Link>

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
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${product.id}-${safeSelectedImage}`}
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
                      productImages[safeSelectedImage]
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* BADGE */}

              {product.badge && (
                <span className="mono absolute left-5 top-5 z-10 bg-white px-4 py-2 text-[8px] tracking-[0.15em]">
                  {product.badge}
                </span>
              )}

              {/* PREVIOUS / NEXT */}

              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((current) =>
                        current === 0
                          ? productImages.length - 1
                          : current - 1
                      )
                    }
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105"
                    aria-label="Previous image"
                  >
                    <ArrowLeft size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((current) =>
                        current === productImages.length - 1
                          ? 0
                          : current + 1
                      )
                    }
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105"
                    aria-label="Next image"
                  >
                    <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAILS */}

            {productImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() =>
                      setSelectedImage(index)
                    }
                    className={`aspect-square overflow-hidden border transition ${
                      safeSelectedImage === index
                        ? "border-black"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ProductImage
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
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
            {/* CATEGORY */}

            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              {product.category?.toUpperCase()}
            </p>

            {/* NAME */}

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              {product.name}
            </h1>

            {/* RATING */}

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

            {/* PRICE */}

            <div className="mt-7 flex items-baseline gap-4">
              <p className="text-2xl font-semibold">
                ₹
                {Number(
                  product.price || 0
                ).toLocaleString("en-IN")}
              </p>

              {product.originalPrice && (
                <p className="text-sm text-neutral-400 line-through">
                  ₹
                  {Number(
                    product.originalPrice
                  ).toLocaleString("en-IN")}
                </p>
              )}

              {product.discount && (
                <span className="mono border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-emerald-700">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-neutral-400">
              Inclusive of all applicable taxes
            </p>

            {/* DESCRIPTION */}

            <p className="mt-7 max-w-lg text-sm leading-7 text-neutral-500">
              {product.description}
            </p>

            {/* DELIVERY */}

            <DeliveryEstimator />

            {/* =================================================
                CART SECTION
            ================================================= */}

            {cartItem ? (
              <div className="mt-6 border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                      IN YOUR CART
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {cartItem.quantity} item
                      {cartItem.quantity > 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  {/* QUANTITY */}

                  <div className="flex items-center border border-black/10">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          cartItem.quantity - 1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center transition hover:bg-black hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="flex h-10 w-10 items-center justify-center text-sm">
                      {cartItem.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          cartItem.quantity + 1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center transition hover:bg-black hover:text-white"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* VIEW CART */}

                <Link
                  to="/cart"
                  className="mt-4 block w-full border border-black px-5 py-3 text-center text-[9px] font-semibold tracking-[0.15em] transition hover:bg-black hover:text-white"
                >
                  VIEW CART
                </Link>
              </div>
            ) : (
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={handleAddToCart}
                className="relative mt-6 flex w-full items-center justify-center gap-3 overflow-hidden bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white"
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span
                      key="added"
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -15,
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check size={15} />
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
                      <ShoppingBag size={15} />
                      ADD TO CART
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* BUY NOW */}

            <button
              type="button"
              onClick={handleBuyNow}
              className="mt-3 w-full border border-black bg-white py-4 text-[10px] font-semibold tracking-[0.15em] text-black transition-colors hover:bg-black hover:text-white"
            >
              BUY NOW
            </button>

            {/* WISHLIST */}

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={() =>
                toggleWishlist(product)
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

            {/* SERVICE INFO */}

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

      {/* =====================================================
          REVIEWS
      ===================================================== */}

      <ReviewSection product={product} />

      {/* =====================================================
          RECENTLY VIEWED
      ===================================================== */}

      {recentlyViewedProducts.length > 0 && (
        <section className="border-t border-black/10 bg-[#fafaf9] py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="mb-10">
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
                YOUR HISTORY
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                Recently Viewed
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedProducts.map((item) => (
                <ProductCard
                  key={`recent-${item.id}`}
                  product={item}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          RELATED PRODUCTS
      ===================================================== */}

      {relatedProducts.length > 0 && (
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
                to="/shop"
                className="hidden items-center gap-2 text-[9px] font-semibold tracking-[0.15em] md:flex"
              >
                VIEW ALL
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={`related-${item.id}`}
                  product={item}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetails;