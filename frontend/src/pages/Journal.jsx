import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";

const journalArticles = [
  {
    id: "art-1",
    title: "The Art of Everyday Objects",
    category: "DESIGN PHILOSOPHY",
    date: "August 20, 2026",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=90",
    description:
      "How intentional design transforms standard daily routines into moments of quiet contentment.",
  },
  {
    id: "art-2",
    title: "Designed for the Journey",
    category: "TRAVEL & ESSENTIALS",
    date: "August 12, 2026",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
    description:
      "Exploring minimalist carry options engineered for seamless transit across global cities.",
  },
  {
    id: "art-3",
    title: "Less, But Better",
    category: "LIFESTYLE",
    date: "July 28, 2026",
    image: "https://images.unsplash.com/photo-1441123694162-e54a981ceba5?auto=format&fit=crop&w=1200&q=90",
    description:
      "Why surrounding yourself with fewer, higher-quality possessions creates mental clarity.",
  },
  {
    id: "art-4",
    title: "Timeless Horology",
    category: "CRAFT",
    date: "July 14, 2026",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90",
    description:
      "An insider look at chronograph calibration, sapphire crystal coating, and leather strap aging.",
  },
];

function Journal() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* HEADER */}
      <header className="border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="text-xl font-extrabold tracking-[-0.07em]">
            LUXORA
          </Link>

          <Link
            to="/"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={13} />
            BACK TO STORE
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-24">
        {/* HEADER TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl border-b border-black/10 pb-12"
        >
          <div className="flex items-center gap-2 text-neutral-500 mb-4">
            <BookOpen size={16} />
            <span className="mono text-[9px] tracking-[0.22em]">
              THE JOURNAL
            </span>
          </div>

          <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.08em]">
            Objects, places and ideas that inspire us.
          </h1>

          <p className="mt-6 max-w-xl text-base text-neutral-500 leading-7">
            A curated space for reflections on design, craftsmanship, travel, and the pursuit of quiet luxury.
          </p>
        </motion.div>

        {/* ARTICLES GRID */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-2">
          {journalArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group border border-black/10 bg-white p-6 sm:p-8 flex flex-col justify-between hover:border-black transition-all"
            >
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-[#e9e9e6]">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className="mono text-[9px] tracking-[0.18em] text-neutral-400">
                    {article.category}
                  </span>
                  <span className="mono text-[9px] text-neutral-400">
                    {article.date}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] group-hover:text-neutral-600 transition-colors">
                  {article.title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-neutral-500">
                  {article.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-black/10 flex items-center justify-between">
                <span className="mono text-[9px] font-semibold tracking-[0.15em]">
                  READ STORY
                </span>
                <ArrowUpRight
                  size={15}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Journal;
