import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowUpRight,
  Check,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    openQuickView,
  } = useShop();

  const [added, setAdded] = useState(false);

  if (!product || product.id === undefined || product.id === null) {
    return null;
  }

  const productId = String(product.id);
  const productPath = `/product/${productId}`;
  const favourite = isInWishlist(product.id);

  const badgeText =
    product.badge || (product.featured ? "FEATURED" : null);

  const isPurchasable =
    product.is_active !== false &&
    (!Number.isFinite(Number(product.stock)) ||
      Number(product.stock) > 0);

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isPurchasable) {
      return;
    }

    addToCart(product);

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  /* =====================================================
     WISHLIST
  ===================================================== */

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);
  };

  /* =====================================================
     QUICK VIEW
  ===================================================== */

  const handleQuickView = (event) => {
    event.preventDefault();
    event.stopPropagation();

    openQuickView(product);
  };

  /* =====================================================
     VIEW DETAILS
  ===================================================== */

  const handleViewDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();

    navigate(productPath);
  };

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 35,
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
        ease: "easeOut",
      }}
      whileHover={{
        y: -5,
      }}
      className="group min-w-0"
    >
      {/* =================================================
          PRODUCT IMAGE
      ================================================= */}

      <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0ed]">
        <Link
          to={productPath}
          aria-label={`View ${product.name}`}
          className="block h-full w-full"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* =================================================
            BADGE
        ================================================= */}

        {badgeText && (
          <span className="mono absolute left-4 top-4 z-10 bg-white/90 px-3 py-1.5 text-[8px] font-medium tracking-[0.15em] backdrop-blur">
            {badgeText}
          </span>
        )}

        {/* =================================================
            WISHLIST
        ================================================= */}

        <motion.button
          type="button"
          onClick={handleWishlist}
          whileTap={{
            scale: 0.85,
          }}
          aria-label={
            favourite
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${
            favourite
              ? "bg-black text-white"
              : "bg-white/90 text-black hover:bg-black hover:text-white"
          }`}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={favourite ? "currentColor" : "none"}
          />
        </motion.button>

        {/* =================================================
            QUICK VIEW
        ================================================= */}

        <motion.button
          type="button"
          onClick={handleQuickView}
          whileTap={{
            scale: 0.9,
          }}
          aria-label={`Quick view ${product.name}`}
          className="absolute right-4 top-16 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 hover:bg-black hover:text-white"
        >
          <Eye
            size={16}
            strokeWidth={1.5}
          />
        </motion.button>

        {/* =================================================
            ADD TO CART
        ================================================= */}

        <motion.button
          type="button"
          onClick={handleAddToCart}
          disabled={!isPurchasable}
          whileTap={{
            scale: 0.97,
          }}
          aria-label={
            isPurchasable
              ? `Add ${product.name} to cart`
              : `${product.name} is out of stock`
          }
          className={`absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 ${
            added
              ? "translate-y-0 bg-neutral-800 opacity-100"
              : isPurchasable
                ? "translate-y-2 bg-black opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                : "translate-y-0 cursor-not-allowed bg-neutral-400 opacity-100"
          }`}
        >
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span
                key="added"
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                className="flex items-center gap-2"
              >
                <Check size={13} />
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
                className="flex items-center gap-2"
              >
                <ShoppingBag size={13} />
                {isPurchasable
                  ? "ADD TO CART"
                  : "OUT OF STOCK"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* =================================================
          PRODUCT INFORMATION
      ================================================= */}

      <div className="pt-5">
        {/* CATEGORY */}

        <p className="mono text-[9px] tracking-[0.2em] text-neutral-500">
          {product.category?.toUpperCase() || "COLLECTION"}
        </p>

        {/* PRODUCT NAME + PRICE */}

        <Link
          to={productPath}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div className="mt-2 flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium transition-colors group-hover:text-neutral-600">
              {product.name}
            </h3>

            <div className="text-right">
              <span className="whitespace-nowrap text-sm font-medium">
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </span>

              {product.originalPrice && (
                <span className="block text-[11px] text-neutral-400 line-through">
                  ₹
                  {Number(product.originalPrice).toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* =================================================
            RATING
        ================================================= */}

        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className="tracking-wide text-amber-500"
            aria-label={`${product.rating || 0} out of 5 stars`}
          >
            ★★★★★
          </span>

          <span className="text-neutral-400">
            {product.rating ?? 0} ({product.reviews ?? 0})
          </span>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-4 flex items-center justify-between gap-4">
          {/* VIEW DETAILS */}

          <button
            type="button"
            onClick={handleViewDetails}
            className="group/details flex items-center gap-2 text-[9px] font-semibold tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            VIEW DETAILS

            <ArrowUpRight
              size={12}
              strokeWidth={1.5}
              className="transition-transform duration-200 group-hover/details:translate-x-0.5 group-hover/details:-translate-y-0.5"
            />
          </button>

          {/* QUICK VIEW */}

          <button
            type="button"
            onClick={handleQuickView}
            className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.15em] text-neutral-400 transition-colors hover:text-black"
          >
            <Eye
              size={11}
              strokeWidth={1.5}
            />

            QUICK VIEW
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
