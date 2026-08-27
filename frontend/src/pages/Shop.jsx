import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useShop } from "../context/ShopContext";
import products from "../data/products";
import ProductCard from "../components/ProductCard";
import ShopFilters from "../components/ShopFilters";

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

function Shop() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");

  const effectiveSearch = search || urlSearch;

  const { addToCart } = useShop();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /* ================= CATEGORY FILTER ================= */

    if (category !== "All") {
      result = result.filter(
        (product) => product.category === category
      );
    }

    /* ================= SEARCH ================= */

    if (effectiveSearch.trim()) {
      const query = effectiveSearch.toLowerCase().trim();

      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const productCategory =
          product.category?.toLowerCase() || "";
        const description =
          product.description?.toLowerCase() || "";

        return (
          name.includes(query) ||
          productCategory.includes(query) ||
          description.includes(query)
        );
      });
    }

    /* ================= SORT ================= */

    switch (sort) {
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;

      case "reviews":
        result.sort((a, b) => Number(b.reviews || 0) - Number(a.reviews || 0));
        break;

      case "price-low":
        result.sort((a, b) => {
          const priceA =
            typeof a.price === "number"
              ? a.price
              : Number(String(a.price).replace(/[₹,]/g, ""));

          const priceB =
            typeof b.price === "number"
              ? b.price
              : Number(String(b.price).replace(/[₹,]/g, ""));

          return priceA - priceB;
        });
        break;

      case "price-high":
        result.sort((a, b) => {
          const priceA =
            typeof a.price === "number"
              ? a.price
              : Number(String(a.price).replace(/[₹,]/g, ""));

          const priceB =
            typeof b.price === "number"
              ? b.price
              : Number(String(b.price).replace(/[₹,]/g, ""));

          return priceB - priceA;
        });
        break;

      case "rating":
        result.sort(
          (a, b) =>
            Number(b.rating || 0) -
            Number(a.rating || 0)
        );
        break;

      case "name":
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      default:
        result.sort(
          (a, b) =>
            Number(Boolean(b.featured)) -
            Number(Boolean(a.featured))
        );
        break;
    }

    return result;
  }, [effectiveSearch, category, sort]);

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#111111]">

      {/* =====================================================
          SHOP HEADER
      ===================================================== */}

      <section className="border-b border-black/[0.06]">

        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:py-20 lg:px-10 lg:py-24">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl"
          >

            {/* BACK TO DASHBOARD */}

            <Link
              to="/"
              className="group mb-12 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors duration-300 hover:text-black"
            >
              <ArrowLeft
                size={14}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />

              <span>BACK TO DASHBOARD</span>
            </Link>

            {/* LABEL */}

            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              THE COLLECTION
            </p>

            {/* TITLE */}

            <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.08em]">
              Discover
              <br />

              <span className="text-neutral-400">
                the collection.
              </span>
            </h1>

            {/* DESCRIPTION */}

            <p className="mt-8 max-w-md text-sm leading-7 text-neutral-500">
              Explore thoughtfully selected essentials designed
              around quality, simplicity and everyday life.
            </p>

          </motion.div>

        </div>

      </section>

      {/* =====================================================
          SHOP CONTENT
      ===================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-14 lg:px-10 lg:py-16">

          {/* FILTERS */}

          <ShopFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
          />

          {/* RESULT COUNT */}

          <div className="mb-8 mt-10 flex items-center justify-between border-t border-black/[0.06] pt-6">

            <p className="mono text-[9px] tracking-[0.15em] text-neutral-400">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "PRODUCT"
                : "PRODUCTS"}
            </p>

          </div>

          {/* =================================================
              PRODUCT GRID
          ================================================= */}

          {filteredProducts.length > 0 ? (

            <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">

              {filteredProducts.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />

              ))}

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
                  Nothing matched your search.
                </h2>

                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setSort("featured");
                  }}
                  className="mt-6 bg-black px-6 py-3 text-[9px] font-semibold tracking-[0.15em] text-white transition-transform duration-300 hover:-translate-y-0.5"
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

export default Shop;