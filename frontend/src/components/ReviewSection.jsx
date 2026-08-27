import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, X, SlidersHorizontal, MessageSquarePlus } from "lucide-react";
import { useShop } from "../context/ShopContext";

function ReviewSection({ product }) {
  const { customReviews, addReview } = useShop();
  const [sort, setSort] = useState("recent");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Combine default demo reviews from product data + custom user-submitted reviews from LocalStorage
  const allReviews = useMemo(() => {
    const defaultList = product.reviewItems || [];
    const customList = customReviews[String(product.id)] || [];
    return [...customList, ...defaultList];
  }, [product, customReviews]);

  // Sorted reviews
  const sortedReviews = useMemo(() => {
    const list = [...allReviews];
    if (sort === "highest") {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (sort === "lowest") {
      return list.sort((a, b) => a.rating - b.rating);
    }
    // Default: most recent
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [allReviews, sort]);

  // Star breakdown calculation
  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const ratingKey = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[ratingKey] = (counts[ratingKey] || 0) + 1;
    });
    const total = allReviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] || 0,
      percentage: Math.round(((counts[star] || 0) / total) * 100),
    }));
  }, [allReviews]);

  return (
    <section className="border-t border-black/10 bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-black/10 pb-10">
          <div>
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              CUSTOMER REVIEWS
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.06em]">
              Verified Feedback
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-all hover:-translate-y-0.5"
          >
            <MessageSquarePlus size={15} />
            WRITE A REVIEW
          </button>
        </div>

        {/* STATS BREAKDOWN GRID */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[300px_1fr] items-start">
          <div className="border border-black/10 bg-[#fafaf9] p-7">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-[-0.06em]">
                {product.rating}
              </span>
              <span className="text-sm text-neutral-400">/ 5.0</span>
            </div>

            <div className="mt-3 flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                />
              ))}
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Based on {allReviews.length} reviews
            </p>

            {/* BREAKDOWN BARS */}
            <div className="mt-6 space-y-2 border-t border-black/10 pt-6">
              {breakdown.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-neutral-500 mono">{star} ★</span>
                  <div className="flex-1 h-2 bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-neutral-400 text-[10px] mono">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div>
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <span className="mono text-[9px] tracking-[0.15em] text-neutral-400">
                {sortedReviews.length} {sortedReviews.length === 1 ? "REVIEW" : "REVIEWS"}
              </span>

              <div className="flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-neutral-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-transparent text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="recent">MOST RECENT</option>
                  <option value="highest">HIGHEST RATED</option>
                  <option value="lowest">LOWEST RATED</option>
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              {sortedReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="border-b border-black/10 pb-8 text-neutral-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 text-sm">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </span>
                      <span className="text-xs font-semibold">{rev.title}</span>
                    </div>

                    <span className="mono text-[10px] text-neutral-400">{rev.date}</span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    "{rev.comment}"
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="font-medium text-black">{rev.name}</span>
                    {rev.verified && (
                      <span className="mono flex items-center gap-1 text-[8px] tracking-[0.1em] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Check size={10} />
                        VERIFIED PURCHASE
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <WriteReviewModal
            productId={product.id}
            productName={product.name}
            onClose={() => setIsWriteModalOpen(false)}
            onSave={(data) => {
              addReview(product.id, data);
              setIsWriteModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function WriteReviewModal({ productName, onClose, onSave }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a review title.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setError("Please enter a review comment (minimum 10 characters).");
      return;
    }
    onSave({ name, rating, title, comment });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-lg bg-[#fafaf9] border border-black/10 p-6 sm:p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-black transition-colors"
        >
          <X size={18} />
        </button>

        <p className="mono text-[9px] tracking-[0.2em] text-neutral-500">
          SUBMIT REVIEW
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
          Review {productName}
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mono block text-[9px] tracking-[0.15em] text-neutral-500 mb-2">
              RATING
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 transition-transform hover:scale-110"
                >
                  <Star
                    size={22}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mono block text-[9px] tracking-[0.15em] text-neutral-500 mb-2">
              YOUR NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun M."
              className="w-full border border-black/15 bg-white p-3 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="mono block text-[9px] tracking-[0.15em] text-neutral-500 mb-2">
              REVIEW TITLE
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exceptional build & aesthetic"
              className="w-full border border-black/15 bg-white p-3 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="mono block text-[9px] tracking-[0.15em] text-neutral-500 mb-2">
              YOUR REVIEW
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with this product..."
              className="w-full border border-black/15 bg-white p-3 text-sm outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black py-4 text-[10px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
          >
            SUBMIT REVIEW
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default ReviewSection;
