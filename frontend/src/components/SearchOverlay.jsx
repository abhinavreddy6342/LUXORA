import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, History, Heart, ShoppingBag } from "lucide-react";
import { useShop } from "../context/ShopContext";
import products from "../data/products";
import ProductImage from "./ProductImage";

function SearchOverlay() {
  const navigate = useNavigate();
  const {
    isSearchOpen,
    closeSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useShop();

  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchOpen) {
        setQuery("");
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
      closeSearch();
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    addRecentSearch(term);
  };

  const filteredProducts = query.trim()
    ? products.filter((product) => {
        const q = query.toLowerCase().trim();
        const name = (product.name || "").toLowerCase();
        const category = (product.category || "").toLowerCase();
        const desc = (product.description || "").toLowerCase();
        return name.includes(q) || category.includes(q) || desc.includes(q);
      })
    : [];

  if (!isSearchOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#fafaf9]/95 backdrop-blur-2xl">
        {/* TOP BAR */}
        <header className="border-b border-black/[0.08]">
          <div className="mx-auto flex h-[80px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
            <Link
              to="/"
              onClick={closeSearch}
              className="text-xl font-extrabold tracking-[-0.07em]"
            >
              LUXORA
            </Link>

            <button
              onClick={closeSearch}
              className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-neutral-500 hover:text-black transition-colors"
            >
              CLOSE [ESC]
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* SEARCH BODY */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1000px] px-6 py-12 lg:px-10">
            {/* SEARCH FORM */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex items-center border-b-2 border-black pb-4">
                <Search size={24} strokeWidth={1.5} className="mr-4 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH LUXORA..."
                  className="w-full bg-transparent text-2xl md:text-4xl font-semibold tracking-[-0.04em] outline-none placeholder:text-neutral-300"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-2 text-neutral-400 hover:text-black transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </form>

            {/* RECENT SEARCHES (Displayed inside Search interface when query is short/empty) */}
            {!query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-neutral-400" />
                    <span className="mono text-[9px] tracking-[0.2em] text-neutral-500">
                      RECENT SEARCHES
                    </span>
                  </div>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={clearRecentSearches}
                      className="mono text-[8px] tracking-[0.15em] text-neutral-400 hover:text-black transition-colors"
                    >
                      CLEAR ALL
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="group inline-flex items-center gap-3 border border-black/15 bg-white px-5 py-3 text-xs transition-all hover:border-black"
                      >
                        <button
                          type="button"
                          onClick={() => handleRecentClick(term)}
                          className="font-medium hover:underline"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(term)}
                          className="text-neutral-400 hover:text-black"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-xs text-neutral-400">
                    No recent searches. Try searching for "watch", "leather", or "runner".
                  </p>
                )}

                {/* POPULAR SEARCH SUGGESTIONS */}
                <div className="mt-12">
                  <p className="mono text-[9px] tracking-[0.2em] text-neutral-500 border-b border-black/10 pb-4">
                    SUGGESTED COLLECTIONS
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {["Timepieces", "Accessories", "Footwear", "Travel"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleRecentClick(cat)}
                        className="mono border border-black/10 bg-white px-4 py-2.5 text-[9px] tracking-[0.15em] hover:border-black transition-colors"
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEARCH RESULTS */}
            {query.trim() && (
              <div className="mt-10">
                <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-4">
                  <p className="mono text-[9px] tracking-[0.18em] text-neutral-500">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "PRODUCT FOUND" : "PRODUCTS FOUND"}
                  </p>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const fav = isInWishlist(product.id);
                      return (
                        <div
                          key={product.id}
                          className="group border border-black/10 bg-white p-4 transition-all hover:border-black"
                        >
                          <div className="relative aspect-[4/5] overflow-hidden">
                            <ProductImage src={product.image} alt={product.name} />

                            <button
                              type="button"
                              onClick={() => toggleWishlist(product)}
                              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all ${
                                fav ? "bg-black text-white" : "bg-white/90 text-black"
                              }`}
                            >
                              <Heart size={14} fill={fav ? "currentColor" : "none"} />
                            </button>
                          </div>

                          <div className="pt-4">
                            <p className="mono text-[8px] tracking-[0.2em] text-neutral-400">
                              {product.category?.toUpperCase()}
                            </p>
                            <h3 className="mt-1 text-sm font-medium">{product.name}</h3>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                ₹{product.price?.toLocaleString("en-IN")}
                              </span>
                              <span className="text-xs text-neutral-400">
                                ★ {product.rating} ({product.reviews})
                              </span>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  closeSearch();
                                  navigate(`/product/${product.id}`);
                                }}
                                className="flex-1 border border-black py-2 text-[9px] font-semibold tracking-[0.12em] hover:bg-black hover:text-white transition-colors"
                              >
                                VIEW
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                className="flex items-center justify-center bg-black px-3 py-2 text-white hover:bg-neutral-800 transition-colors"
                                aria-label="Add to cart"
                              >
                                <ShoppingBag size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
                      NO RESULTS
                    </p>
                    <h2 className="mt-4 text-2xl font-medium">
                      We couldn't find anything matching your search.
                    </h2>
                    <p className="mt-3 text-sm text-neutral-500">
                      Try another search or explore our complete collection.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        navigate("/shop");
                      }}
                      className="mt-8 bg-black px-8 py-4 text-[9px] font-semibold tracking-[0.15em] text-white hover:-translate-y-0.5 transition-transform"
                    >
                      EXPLORE COLLECTION
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AnimatePresence>
  );
}

export default SearchOverlay;
