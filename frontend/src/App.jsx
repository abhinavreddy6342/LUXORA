import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingBag,
  ArrowUpRight,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import Wishlist from "./pages/Wishlist";
import ProductDetails from "./pages/ProductDetails";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import Story from "./pages/Story";
import Journal from "./pages/Journal";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyResetCode from "./pages/VerifyResetCode";

/* ============================================================
   VENDOR PAGES
============================================================ */

import VendorLogin from "./pages/VendorLogin";
import VendorRegister from "./pages/VendorRegister";
import VendorDashboard from "./pages/VendorDashboard";

/* ============================================================
   COMPONENTS
============================================================ */

import ProductCard from "./components/ProductCard";
import SearchOverlay from "./components/SearchOverlay";
import QuickViewModal from "./components/QuickViewModal";
import ToastContainer from "./components/Toast";
import LuxoraAI from "./components/LuxoraAI";

/* ============================================================
   DATA / CONTEXT
============================================================ */

import products from "./data/products";
import { useShop } from "./context/ShopContext";

/* ============================================================
   ANIMATION VARIANTS
============================================================ */

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

const stagger = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/* ============================================================
   SCROLL TO TOP
============================================================ */

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

/* ============================================================
   FLICKER TEXT
============================================================ */

function FlickerText({ children }) {
  return (
    <motion.span
      whileHover={{
        opacity: [
          1,
          0.65,
          1,
          0.8,
          1,
        ],

        x: [
          0,
          -1,
          1,
          -0.5,
          0,
        ],

        textShadow: [
          "0 0 0 transparent",
          "1px 0 rgba(0,0,0,0.16)",
          "-1px 0 rgba(0,0,0,0.08)",
          "0 0 0 transparent",
        ],

        transition: {
          duration: 0.45,
          ease: "easeInOut",
        },
      }}
    >
      {children}
    </motion.span>
  );
}

/* ============================================================
   HOME PAGE
============================================================ */

function Home() {
  const {
    cartCount,
    wishlist,
    openSearch,
  } = useShop();

  const navigate = useNavigate();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    newsletterMessage,
    setNewsletterMessage,
  ] = useState("");

  const [
    newsletterStatus,
    setNewsletterStatus,
  ] = useState("");

  const wishlistCount =
    wishlist.length;

  /* ==========================================================
     NEWSLETTER
  ========================================================== */

  const handleNewsletterSubmit =
    (event) => {
      event.preventDefault();

      const trimmedEmail =
        email.trim();

      if (!trimmedEmail) {
        setNewsletterStatus(
          "error"
        );

        setNewsletterMessage(
          "Please enter your email address."
        );

        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          trimmedEmail
        )
      ) {
        setNewsletterStatus(
          "error"
        );

        setNewsletterMessage(
          "Please enter a valid email address."
        );

        return;
      }

      try {
        const existingSubscribers =
          JSON.parse(
            localStorage.getItem(
              "luxora_newsletter_subscribers"
            ) || "[]"
          );

        const subscribers =
          Array.isArray(
            existingSubscribers
          )
            ? existingSubscribers
            : [];

        const alreadySubscribed =
          subscribers.some(
            (subscriber) =>
              String(
                subscriber.email ||
                  ""
              )
                .toLowerCase() ===
              trimmedEmail.toLowerCase()
          );

        if (
          !alreadySubscribed
        ) {
          subscribers.push({
            email: trimmedEmail,
            joinedAt:
              new Date().toISOString(),
          });

          localStorage.setItem(
            "luxora_newsletter_subscribers",
            JSON.stringify(
              subscribers
            )
          );
        }

        setNewsletterStatus(
          "success"
        );

        setNewsletterMessage(
          alreadySubscribed
            ? "You're already part of LUXORA."
            : "You're officially part of LUXORA."
        );

        setEmail("");

        window.setTimeout(
          () => {
            setNewsletterMessage(
              ""
            );

            setNewsletterStatus(
              ""
            );
          },
          4000
        );
      } catch (error) {
        console.error(
          "Newsletter subscription error:",
          error
        );

        setNewsletterStatus(
          "error"
        );

        setNewsletterMessage(
          "Something went wrong. Please try again."
        );

        window.setTimeout(
          () => {
            setNewsletterMessage(
              ""
            );

            setNewsletterStatus(
              ""
            );
          },
          4000
        );
      }
    };

  /* ==========================================================
     OUR STORY
  ========================================================== */

  const handleOurStory =
    () => {
      navigate("/story");
    };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#111111]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <motion.header
        initial={{
          y: -60,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl"
      >
        <nav className="mx-auto grid h-[74px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-10">
          {/* LOGO */}

          <div className="justify-self-start">
            <Link
              to="/"
              className="text-xl font-extrabold tracking-[-0.07em]"
            >
              LUXORA
            </Link>
          </div>

          {/* NAVIGATION */}

          <div className="hidden items-center gap-8 md:flex">
            <Link
              to="/shop"
              className="glitch-hover mono whitespace-nowrap text-[10px] tracking-[0.08em] text-neutral-500 transition-colors hover:text-black"
            >
              SHOP
            </Link>

            <Link
              to="/story"
              className="glitch-hover mono whitespace-nowrap text-[10px] tracking-[0.08em] text-neutral-500 transition-colors hover:text-black"
            >
              OUR STORY
            </Link>

            <Link
              to="/journal"
              className="glitch-hover mono whitespace-nowrap text-[10px] tracking-[0.08em] text-neutral-500 transition-colors hover:text-black"
            >
              JOURNAL
            </Link>

            <a
              href="#about"
              className="glitch-hover mono whitespace-nowrap text-[10px] tracking-[0.08em] text-neutral-500 transition-colors hover:text-black"
            >
              ABOUT
            </a>
          </div>

          {/* ACTIONS */}

          <div className="flex items-center justify-self-end gap-1">
            <button
              type="button"
              onClick={openSearch}
              className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:text-black"
              aria-label="Search"
            >
              <Search
                size={17}
                strokeWidth={1.5}
              />
            </button>

            <Link
              to="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:text-black"
              aria-label={
                wishlistCount >
                0
                  ? `Wishlist (${wishlistCount} items)`
                  : "Wishlist"
              }
            >
              <Heart
                size={17}
                strokeWidth={1.5}
                fill={
                  wishlistCount >
                  0
                    ? "currentColor"
                    : "none"
                }
              />

              {wishlistCount >
                0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-black px-1 text-[7px] font-medium leading-none text-white">
                  {wishlistCount >
                  99
                    ? "99+"
                    : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:text-black"
              aria-label={
                cartCount > 0
                  ? `Cart (${cartCount} items)`
                  : "Cart"
              }
            >
              <ShoppingBag
                size={17}
                strokeWidth={1.5}
              />

              {cartCount >
                0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-black px-1 text-[7px] font-medium leading-none text-white">
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/orders"
              className="ml-2 hidden border border-black/15 px-4 py-2.5 text-[9px] font-semibold tracking-[0.15em] transition-colors hover:bg-black hover:text-white sm:block"
            >
              ORDERS
            </Link>

            <Link
              to="/account"
              className="ml-2 hidden border border-black bg-black px-4 py-2.5 text-[9px] font-semibold tracking-[0.15em] text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-black sm:block"
            >
              ACCOUNT
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <main id="home">
        <section className="mx-auto max-w-[1440px] px-6 py-16 sm:py-20 lg:px-10 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-[600px]"
            >
              <motion.p
                variants={fadeUp}
                className="mono mb-6 text-[10px] tracking-[0.2em] text-neutral-500"
              >
                CURATED FOR MODERN LIVING
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="max-w-[650px] text-[clamp(3.5rem,7vw,7.2rem)] font-semibold leading-[0.86] tracking-[-0.08em]"
              >
                Elevated
                <br />
                <FlickerText>
                  essentials.
                </FlickerText>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-8 max-w-[430px] text-sm leading-7 text-neutral-500"
              >
                Thoughtfully selected
                products designed
                around quality,
                simplicity and
                everyday life.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Link
                  to="/shop"
                  className="group flex items-center gap-5 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  EXPLORE COLLECTION

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/shop"
                  className="flex items-center gap-3 border border-black/15 px-7 py-4 text-[10px] font-semibold tracking-[0.14em] transition-colors hover:border-black hover:bg-white"
                >
                  VIEW NEW ARRIVALS
                  <ArrowUpRight
                    size={13}
                  />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 45,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: "easeOut",
              }}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#e9e9e6]"
            >
              <motion.img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=90"
                alt="LUXORA collection"
                className="h-full w-full object-cover"
                whileHover={{
                  scale: 1.025,
                }}
                transition={{
                  duration: 0.8,
                }}
              />

              <div className="absolute bottom-5 left-5 bg-white/90 px-5 py-4 backdrop-blur">
                <p className="mono text-[8px] tracking-[0.2em] text-neutral-500">
                  THE EDIT
                </p>

                <p className="mt-1 text-sm font-medium">
                  Objects worth keeping.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            FEATURED COLLECTION
        ==================================================== */}

        <section className="border-t border-black/[0.06] bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 lg:py-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              variants={fadeUp}
              className="flex items-end justify-between"
            >
              <div>
                <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                  FEATURED COLLECTION
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
                  Selected pieces.
                </h2>
              </div>

              <Link
                to="/shop"
                className="glitch-hover mono hidden border-b border-black pb-1 text-[9px] tracking-[0.15em] md:block"
              >
                VIEW ALL
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.1,
              }}
              variants={stagger}
              className="mt-14 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
            >
              {products
                .filter(
                  (product) =>
                    product.featured
                )
                .map(
                  (product) => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                    />
                  )
                )}
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            STANDARD
        ==================================================== */}

        <section className="bg-[#111111] text-white">
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              variants={fadeUp}
            >
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                THE LUXORA STANDARD
              </p>

              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-6xl">
                Less noise.
                <br />
                More meaning.
              </h2>

              <p className="mt-7 max-w-md text-sm leading-7 text-neutral-400">
                We believe the
                things around you
                should be thoughtfully
                made, beautifully
                designed and built to
                last.
              </p>

              <button
                type="button"
                onClick={
                  handleOurStory
                }
                className="glitch-hover mono mt-9 inline-flex cursor-pointer items-center gap-3 border border-white/20 px-7 py-4 text-[9px] tracking-[0.15em] transition-all duration-300 hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Read the LUXORA story"
              >
                OUR STORY
                <ArrowUpRight
                  size={13}
                />
              </button>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 40,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="aspect-[4/3] overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1441123694162-e54a981ceba5?auto=format&fit=crop&w=1400&q=85"
                alt="Minimal product collection"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            ABOUT
        ==================================================== */}

        <section
          id="about"
          className="bg-[#fafaf9]"
        >
          <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 lg:py-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={fadeUp}
            >
              <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
                WHY LUXORA
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
                Designed around you.
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={stagger}
              className="mt-16 grid border-t border-black/10 md:grid-cols-3"
            >
              {[
                [
                  "01",
                  "Curated quality",
                  "Every product earns its place.",
                ],

                [
                  "02",
                  "Simple experience",
                  "Shopping without unnecessary friction.",
                ],

                [
                  "03",
                  "Made to last",
                  "Products chosen for everyday longevity.",
                ],
              ].map(
                ([
                  number,
                  title,
                  description,
                ]) => (
                  <motion.div
                    key={number}
                    variants={
                      fadeUp
                    }
                    className="border-b border-black/10 py-10 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
                  >
                    <span className="mono text-[10px] text-neutral-400">
                      {number}
                    </span>

                    <h3 className="mt-8 text-lg font-medium">
                      {title}
                    </h3>

                    <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-500">
                      {
                        description
                      }
                    </p>
                  </motion.div>
                )
              )}
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            NEWSLETTER
        ==================================================== */}

        <section className="border-t border-black/[0.06] bg-white">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
            }}
            variants={fadeUp}
            className="mx-auto max-w-[800px] px-6 py-24 text-center lg:py-32"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              STAY IN THE LOOP
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
              Good things,
              occasionally.
            </h2>

            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-neutral-500">
              New collections,
              thoughtful stories
              and early access.
              Nothing more.
            </p>

            <form
              onSubmit={
                handleNewsletterSubmit
              }
              className="mx-auto mt-9 max-w-md"
              noValidate
            >
              <div className="flex border-b border-black">
                <label
                  htmlFor="luxora-newsletter-email"
                  className="sr-only"
                >
                  Email address
                </label>

                <input
                  id="luxora-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event.target
                        .value
                    );

                    if (
                      newsletterMessage
                    ) {
                      setNewsletterMessage(
                        ""
                      );

                      setNewsletterStatus(
                        ""
                      );
                    }
                  }}
                  placeholder="Your email address"
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
                />

                <button
                  type="submit"
                  className="glitch-hover mono cursor-pointer px-1 text-[9px] tracking-[0.15em] transition-opacity hover:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30"
                  aria-label="Join LUXORA newsletter"
                >
                  JOIN →
                </button>
              </div>

              {newsletterMessage && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className={`mt-4 flex items-center justify-center gap-2 text-[10px] tracking-[0.08em] ${
                    newsletterStatus ===
                    "success"
                      ? "text-neutral-700"
                      : "text-red-600"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {newsletterStatus ===
                  "success" ? (
                    <Check
                      size={13}
                    />
                  ) : (
                    <X
                      size={13}
                    />
                  )}

                  <span>
                    {
                      newsletterMessage
                    }
                  </span>
                </motion.div>
              )}
            </form>
          </motion.div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#111111] text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div>
              <Link
                to="/"
                className="text-xl font-extrabold tracking-[-0.07em]"
              >
                LUXORA
              </Link>

              <p className="mt-4 max-w-xs text-xs leading-6 text-neutral-500">
                Elevated essentials
                for modern living.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-4">
              {[
                {
                  name: "Shop",
                  path: "/shop",
                },
                {
                  name: "Our Story",
                  path: "/story",
                },
                {
                  name: "Journal",
                  path: "/journal",
                },
                {
                  name: "Orders",
                  path: "/orders",
                },
                {
                  name: "Account",
                  path: "/account",
                },
                {
                  name: "Wishlist",
                  path: "/wishlist",
                },
                {
                  name: "Track Order",
                  path: "/track-order/search",
                },
                {
                  name: "Cart",
                  path: "/cart",
                },
              ].map(
                (item) => (
                  <Link
                    key={
                      item.name
                    }
                    to={
                      item.path
                    }
                    className="glitch-hover mono text-[9px] tracking-[0.1em] text-neutral-400 transition-colors hover:text-white"
                  >
                    {item.name.toUpperCase()}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="mono mt-14 border-t border-white/10 pt-6 text-[8px] tracking-[0.12em] text-neutral-600">
            © 2026 LUXORA. ALL RIGHTS
            RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   ROUTES
============================================================ */

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ====================================================
            CUSTOMER STORE
        ==================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/shop"
          element={<Shop />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/payment"
          element={<Payment />}
        />

        <Route
          path="/order-success"
          element={<OrderSuccess />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/story"
          element={<Story />}
        />

        <Route
          path="/journal"
          element={<Journal />}
        />

        <Route
          path="/track-order/:id"
          element={<TrackOrder />}
        />

        {/* ====================================================
            CUSTOMER AUTH
        ==================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/create-account"
          element={
            <CreateAccount />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />

        <Route
          path="/verify-reset-code"
          element={
            <VerifyResetCode />
          }
        />

        {/* ====================================================
            LUXORA BUSINESS PORTAL
        ==================================================== */}

        <Route
          path="/vendor/login"
          element={
            <VendorLogin />
          }
        />

        <Route
          path="/vendor/register"
          element={
            <VendorRegister />
          }
        />

        <Route
          path="/vendor/dashboard"
          element={
            <VendorDashboard />
          }
        />
      </Routes>
    </>
  );
}

/* ============================================================
   APP
============================================================ */

function App() {
  return (
    <>
      <AppRoutes />

      <SearchOverlay />

      <QuickViewModal />

      <ToastContainer />

      <LuxoraAI />
    </>
  );
}

export default App;