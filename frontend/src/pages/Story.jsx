import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldCheck, Gem, Feather } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

function Story() {
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

      <main>
        {/* HERO SECTION */}
        <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10 lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl"
          >
            <motion.p variants={fadeUp} className="mono text-[9px] tracking-[0.25em] text-neutral-500">
              ABOUT LUXORA
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.08em]"
            >
              Objects created for quiet longevity.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-base sm:text-lg leading-8 text-neutral-600 font-normal"
            >
              Founded on the belief that everyday objects should possess restraint,
              enduring material integrity, and silent functional beauty.
            </motion.p>
          </motion.div>
        </section>

        {/* EDITORIAL IMAGE BANNER */}
        <section className="border-y border-black/[0.06] bg-white py-12">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="aspect-[4/5] overflow-hidden bg-[#e9e9e6]">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=90"
                  alt="Minimal aesthetic interior"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="aspect-[4/5] overflow-hidden bg-[#e9e9e6] hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90"
                  alt="Timepiece craftsmanship"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="aspect-[4/5] overflow-hidden bg-[#e9e9e6] hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90"
                  alt="Leather craftsmanship"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: THE BEGINNING */}
        <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                01 / ORIGIN
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
                The Beginning
              </h2>
              <div className="mt-8 space-y-6 text-sm sm:text-base leading-8 text-neutral-600">
                <p>
                  LUXORA began in 2024 as an antidote to disposable excess. In a world
                  crowded with fleeting trends and loud logos, we sought to build a haven
                  of quiet elegance.
                </p>
                <p>
                  What started as a small atelier curation of precision chronographs and hand-stitched
                  leather quickly evolved into a dedicated luxury house centered on elevated everyday essentials.
                </p>
              </div>
            </div>

            <div className="aspect-[4/3] overflow-hidden bg-[#e9e9e6]">
              <img
                src="https://images.unsplash.com/photo-1441123694162-e54a981ceba5?auto=format&fit=crop&w=1400&q=85"
                alt="LUXORA studio design"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: OUR PHILOSOPHY */}
        <section className="bg-[#111111] text-white py-24 lg:py-32">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="max-w-3xl">
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
                02 / PHILOSOPHY
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
                Thoughtful design. Uncompromising longevity.
              </h2>
            </div>

            <div className="mt-16 grid gap-10 md:grid-cols-3 border-t border-white/10 pt-12">
              <div>
                <Feather className="text-neutral-400 mb-6" size={24} />
                <h3 className="text-xl font-medium">Simplicity</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  Eliminating unnecessary detail until only essential purpose remains.
                  Clean geometry that calms the everyday environment.
                </p>
              </div>

              <div>
                <Gem className="text-neutral-400 mb-6" size={24} />
                <h3 className="text-xl font-medium">Material Quality</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  Full-grain leathers, 316L stainless steel, and high-density woven textiles chosen for tactile warmth and resilience.
                </p>
              </div>

              <div>
                <ShieldCheck className="text-neutral-400 mb-6" size={24} />
                <h3 className="text-xl font-medium">Longevity</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  Items engineered to age gracefully, acquiring character and personal story over years of continuous use.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 & 4: HOW WE CHOOSE & THE LUXORA STANDARD */}
        <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div className="border border-black/10 bg-white p-8 md:p-12">
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                03 / SELECTION
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
                How We Choose
              </h3>
              <p className="mt-6 text-sm sm:text-base leading-8 text-neutral-600">
                Every piece in the LUXORA catalog undergoes rigorous evaluation.
                We inspect structural integrity, weight distribution, ergonomics, and material origin.
                If a product does not improve daily life or stand up to intense wear, it does not carry our name.
              </p>
            </div>

            <div className="border border-black/10 bg-white p-8 md:p-12">
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                04 / PROMISE
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
                The LUXORA Standard
              </h3>
              <p className="mt-6 text-sm sm:text-base leading-8 text-neutral-600">
                We believe premium e-commerce should deliver transparent value.
                Zero artificial inflation, zero disposable materials, and a commitment to customer satisfaction from unboxing to years of enjoyment.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: INSPIRATION GALLERY */}
        <section className="border-t border-black/[0.06] bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                  05 / EDITORIAL INSPIRATION
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
                  The Aesthetic Journal
                </h2>
              </div>

              <Link
                to="/shop"
                className="group flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
              >
                EXPLORE COLLECTION
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
                  title: "Designed for the Journey",
                  category: "TRAVEL",
                },
                {
                  img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90",
                  title: "Precision & Dial Clarity",
                  category: "TIMEPIECES",
                },
                {
                  img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
                  title: "Tactile Leather Grain",
                  category: "ACCESSORIES",
                },
                {
                  img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
                  title: "Modern Athletic Silhouette",
                  category: "FOOTWEAR",
                },
              ].map((item, index) => (
                <div key={index} className="group relative aspect-[4/5] overflow-hidden bg-[#e9e9e6]">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                    <span className="mono text-[8px] tracking-[0.2em] text-neutral-300">
                      {item.category}
                    </span>
                    <p className="mt-1 text-sm font-medium">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Story;
