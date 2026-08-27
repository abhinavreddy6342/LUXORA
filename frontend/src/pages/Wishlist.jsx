import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowLeft,
  ShoppingBag,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import ProductImage from "../components/ProductImage";

function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const [addedProduct, setAddedProduct] = useState(null);

  const handleAddToCart = (product) => {
    addToCart(product);

    setAddedProduct(product.id);

    setTimeout(() => {
      setAddedProduct(null);
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* HEADER */}
      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-28">
        <Link
          to="/shop"
          className="mb-12 flex w-fit items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} />
          Continue Shopping
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
            YOUR COLLECTION
          </p>

          <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.08em]">
            Your
            <br />
            <span className="text-neutral-400">favourites.</span>
          </h1>
        </motion.div>
      </section>

      {/* WISHLIST */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
          {wishlist.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <Heart size={34} strokeWidth={1} />

              <p className="mono mt-6 text-[9px] tracking-[0.2em] text-neutral-400">
                YOUR WISHLIST IS EMPTY
              </p>

              <h2 className="mt-3 text-2xl font-medium">
                Nothing saved yet.
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
                Save products you love and come back to them whenever you want.
              </p>

              <Link
                to="/shop"
                className="mt-8 bg-black px-7 py-4 text-[9px] font-semibold tracking-[0.15em] text-white"
              >
                EXPLORE PRODUCTS
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 flex items-center justify-between">
                <p className="mono text-[9px] tracking-[0.15em] text-neutral-400">
                  {wishlist.length} SAVED{" "}
                  {wishlist.length === 1 ? "PRODUCT" : "PRODUCTS"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                {wishlist.map((product) => {
                  const isAdded = addedProduct === product.id;

                  return (
                    <motion.article
                      key={product.id}
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ y: -5 }}
                      className="group min-w-0"
                    >
                      {/* IMAGE */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0ed]">
                        {/* PRODUCT LINK */}
                        <Link to={`/product/${product.id}`} className="block h-full w-full">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>

                        {/* WISHLIST BUTTON */}
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 hover:scale-105"
                          aria-label="Remove from wishlist"
                        >
                          <Heart
                            size={16}
                            strokeWidth={1.5}
                            fill="currentColor"
                          />
                        </button>

                        {/* ADD TO CART */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isAdded}
                          className={`absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 ${
                            isAdded
                              ? "translate-y-0 bg-neutral-800 opacity-100"
                              : "translate-y-2 bg-black opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          }`}
                        >
                          <AnimatePresence mode="wait">
                            {isAdded ? (
                              <motion.span
                                key="added"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center gap-2"
                              >
                                <Check size={14} />
                                ADDED TO CART
                              </motion.span>
                            ) : (
                              <motion.span
                                key="add"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                              >
                                <ShoppingBag size={13} />
                                ADD TO CART
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>

                      {/* PRODUCT INFORMATION */}
                      <div className="pt-5">
                        <p className="mono text-[9px] tracking-[0.2em] text-neutral-500">
                          {product.category.toUpperCase()}
                        </p>

                        {/* PRODUCT NAME + PRICE */}
                        <Link
                          to={`/product/${product.id}`}
                          className="block"
                        >
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <h3 className="text-sm font-medium transition-colors hover:text-neutral-500">
                              {product.name}
                            </h3>

                            <span className="whitespace-nowrap text-sm font-medium">
                              ₹{product.price.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </Link>

                        {/* RATING */}
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="tracking-wide">
                            ★★★★★
                          </span>

                          <span className="text-neutral-400">
                            {product.rating} ({product.reviews})
                          </span>
                        </div>

                        {/* VIEW PRODUCT */}
                        <Link
                          to={`/product/${product.id}`}
                          className="mt-4 flex w-fit items-center gap-2 text-[9px] font-semibold tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
                        >
                          VIEW PRODUCT
                          <ArrowUpRight size={12} strokeWidth={1.5} />
                        </Link>

                        {/* QUICK ADD */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="mt-3 flex items-center gap-2 text-[9px] font-semibold tracking-[0.15em] text-neutral-400 transition-colors hover:text-black"
                        >
                          {isAdded ? "ADDED TO CART" : "QUICK ADD"}
                          {isAdded ? (
                            <Check size={11} />
                          ) : (
                            <ShoppingBag size={11} />
                          )}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Wishlist;