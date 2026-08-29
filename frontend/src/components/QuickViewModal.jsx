import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, ArrowUpRight } from "lucide-react";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

function QuickViewModal() {
  const navigate = useNavigate();
  const {
    quickViewProduct,
    closeQuickView,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useShop();

  useEffect(() => {
    if (quickViewProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [quickViewProduct]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && quickViewProduct) {
        closeQuickView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickViewProduct, closeQuickView]);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isFav = isInWishlist(product.id);
  const isPurchasable =
    product.is_active !== false &&
    (!Number.isFinite(Number(product.stock)) ||
      Number(product.stock) > 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeQuickView}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* MODAL CONTENT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-10 grid w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#fafaf9] border border-black/10 shadow-2xl md:grid-cols-2"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={closeQuickView}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black backdrop-blur hover:bg-black hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* IMAGE */}
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0ed]">
            <ProductImage src={product.image} alt={product.name} />

            {product.badge && (
              <span className="mono absolute left-4 top-4 bg-white px-3 py-1.5 text-[8px] tracking-[0.15em]">
                {product.badge}
              </span>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <p className="mono text-[9px] tracking-[0.2em] text-neutral-500">
                {product.category?.toUpperCase()}
              </p>

              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.05em]">
                {product.name}
              </h2>

              <div className="mt-3 flex items-center gap-3 text-xs">
                <span>★★★★★</span>
                <span className="font-medium">{product.rating}</span>
                <span className="text-neutral-400">({product.reviews} reviews)</span>
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-xl font-semibold">
                  ₹{product.price?.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through">
                    ₹{product.originalPrice?.toLocaleString("en-IN")}
                  </span>
                )}
                {product.discount && (
                  <span className="mono text-[9px] tracking-[0.1em] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              <p className="mt-6 text-xs leading-6 text-neutral-500">
                {product.description}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (!isPurchasable) {
                    return;
                  }

                  addToCart(product);
                  closeQuickView();
                }}
                disabled={!isPurchasable}
                className="flex w-full items-center justify-center gap-3 bg-black py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <ShoppingBag size={14} />
                {isPurchasable ? "ADD TO CART" : "OUT OF STOCK"}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`flex w-full items-center justify-center gap-3 border py-4 text-[10px] font-semibold tracking-[0.15em] transition-colors ${
                  isFav
                    ? "border-black bg-black text-white"
                    : "border-black/15 hover:border-black hover:bg-white text-black"
                }`}
              >
                <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                {isFav ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST"}
              </button>

              <button
                type="button"
                onClick={() => {
                  closeQuickView();
                  navigate(`/product/${product.id}`);
                }}
                className="mono flex items-center justify-center gap-2 pt-2 text-[9px] tracking-[0.15em] text-neutral-500 hover:text-black transition-colors"
              >
                VIEW FULL DETAILS
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default QuickViewModal;
