import { Search, SlidersHorizontal } from "lucide-react";
import { categories } from "../data/products";

function ShopFilters({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
}) {
  return (
    <div className="space-y-6">

      {/* SEARCH + SORT */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative w-full lg:max-w-md">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-12 w-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition-colors focus:border-black"
          />
        </div>

        <div className="flex items-center gap-3">
          <SlidersHorizontal size={15} strokeWidth={1.5} />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-12 border border-black/10 bg-white px-4 text-xs outline-none cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      {/* CATEGORIES */}

      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-6">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`mono px-4 py-2.5 text-[9px] tracking-[0.12em] transition-all ${
              category === item
                ? "bg-black text-white"
                : "border border-black/10 bg-white text-neutral-500 hover:border-black hover:text-black"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShopFilters;