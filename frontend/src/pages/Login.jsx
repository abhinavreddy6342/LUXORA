import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setLoginError("");
  };

  const validate = () => {
    const newErrors = {};

    const email = String(
      formData.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.password || ""
    );

    if (!email) {
      newErrors.email =
        "Email address is required.";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(
        email
      )
    ) {
      newErrors.email =
        "Please enter a valid Gmail address ending with @gmail.com.";
    }

    if (!password) {
      newErrors.password =
        "Password is required.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      isSubmitting ||
      isSuccess
    ) {
      return;
    }

    setLoginError("");
    setIsSuccess(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const email = String(
      formData.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.password || ""
    );

    try {
      const result = await login({
        email,
        password,
      });

      if (!result?.success) {
        setLoginError(
          result?.message ||
            result?.error ||
            "Unable to sign in. Please check your details."
        );

        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      window.setTimeout(() => {
        navigate("/account", {
          replace: true,
        });
      }, 800);
    } catch (error) {
      console.error(
        "Login page error:",
        error
      );

      setLoginError(
        "Unable to connect to the LUXORA server. Please make sure the backend is running."
      );

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* =================================================
          TOP BAR
      ================================================= */}

      <header className="border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <Link
            to="/"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BACK TO STORE
          </Link>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto flex w-full max-w-[1100px] justify-center px-6 py-14 lg:py-20">
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          className="w-full"
        >
          {/* =================================================
              PAGE HEADING
          ================================================= */}

          <div className="mx-auto max-w-[600px] text-center">
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              LUXORA ACCESS
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
              Sign in.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-neutral-500">
              Choose how you access LUXORA.
              Customers can shop and manage
              orders, while businesses can
              manage products and fulfillment.
            </p>
          </div>

          {/* =================================================
              TWO ACCESS CARDS
          ================================================= */}

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {/* =================================================
                CUSTOMER
            ================================================= */}

            <motion.section
              initial={{
                opacity: 0,
                x: -15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="border border-black/10 bg-white p-6 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-black text-white">
                  <UserIcon />
                </div>

                <div>
                  <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                    CUSTOMER
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                    Shop LUXORA.
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    Access your products,
                    wishlist, cart, orders,
                    addresses and
                    personalized AI shopping
                    assistance.
                  </p>
                </div>
              </div>

              {/* CUSTOMER FORM */}

              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mt-7 flex items-center gap-3 border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check size={14} />
                    </span>

                    <div>
                      <p className="font-medium">
                        Sign in successful.
                      </p>

                      <p className="mt-0.5 text-[10px] text-green-600">
                        Redirecting...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleSubmit}
                className="mt-8"
                noValidate
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mono mb-2 block text-[8px] tracking-[0.15em] text-neutral-500"
                  >
                    GMAIL ADDRESS
                  </label>

                  <div
                    className={`flex items-center border-b ${
                      errors.email
                        ? "border-red-500"
                        : "border-black/20"
                    } focus-within:border-black`}
                  >
                    <Mail
                      size={15}
                      className="mr-3 text-neutral-400"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="you@gmail.com"
                      autoComplete="email"
                      disabled={
                        isSubmitting ||
                        isSuccess
                      }
                      className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-neutral-400 disabled:opacity-50"
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-2 text-[10px] text-red-500">
                      {
                        errors.email
                      }
                    </p>
                  )}
                </div>

                {/* PASSWORD */}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="mono text-[8px] tracking-[0.15em] text-neutral-500"
                    >
                      PASSWORD
                    </label>

                    <Link
                      to="/forgot-password"
                      className="mono text-[7px] tracking-[0.1em] text-neutral-400 underline-offset-4 hover:text-black hover:underline"
                    >
                      FORGOT PASSWORD?
                    </Link>
                  </div>

                  <div
                    className={`flex items-center border-b ${
                      errors.password
                        ? "border-red-500"
                        : "border-black/20"
                    } focus-within:border-black`}
                  >
                    <Lock
                      size={15}
                      className="mr-3 text-neutral-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={
                        isSubmitting ||
                        isSuccess
                      }
                      className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-neutral-400 disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                      disabled={
                        isSubmitting ||
                        isSuccess
                      }
                      className="flex h-9 w-9 items-center justify-center text-neutral-400 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={
                            15
                          }
                        />
                      ) : (
                        <Eye
                          size={
                            15
                          }
                        />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-2 text-[10px] text-red-500">
                      {
                        errors.password
                      }
                    </p>
                  )}
                </div>

                {/* ERROR */}

                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-[10px] leading-5 text-red-600"
                    >
                      {
                        loginError
                      }
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SIGN IN */}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isSuccess
                  }
                  className={`mt-7 flex w-full items-center justify-center gap-3 px-6 py-4 text-[9px] font-semibold tracking-[0.16em] text-white transition-all ${
                    isSuccess
                      ? "bg-neutral-700"
                      : "bg-black hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check size={13} />
                      SIGNED IN
                    </>
                  ) : isSubmitting ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                      SIGNING IN...
                    </>
                  ) : (
                    <>
                      SIGN IN
                      <span>
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* CREATE CUSTOMER ACCOUNT */}

              <div className="mt-7 border-t border-black/10 pt-6 text-center">
                <p className="text-xs text-neutral-500">
                  Don't have a customer account?
                </p>

                <Link
                  to="/create-account"
                  className="mono mt-3 inline-block border-b border-black pb-1 text-[8px] tracking-[0.14em] hover:opacity-50"
                >
                  CREATE CUSTOMER ACCOUNT
                </Link>
              </div>
            </motion.section>

            {/* =================================================
                BUSINESS
            ================================================= */}

            <motion.section
              initial={{
                opacity: 0,
                x: 15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.15,
              }}
              className="border border-black/10 bg-[#111111] p-6 text-white sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-black">
                  <Building2
                    size={18}
                    strokeWidth={1.5}
                  />
                </div>

                <div>
                  <p className="mono text-[8px] tracking-[0.18em] text-neutral-500">
                    BUSINESS
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                    Sell on LUXORA.
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Manage your business,
                    publish products, track
                    inventory and fulfil customer
                    orders through the LUXORA
                    marketplace.
                  </p>
                </div>
              </div>

              {/* BUSINESS LOGIN */}

              <Link
                to="/vendor/login"
                className="group mt-9 flex w-full items-center justify-between border border-white/20 px-5 py-4 text-[9px] font-semibold tracking-[0.15em] transition-all hover:bg-white hover:text-black"
              >
                <span>
                  BUSINESS LOGIN
                </span>

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              {/* BUSINESS REGISTRATION */}

              <Link
                to="/vendor/register"
                className="group mt-3 flex w-full items-center justify-between border border-white/10 bg-white/5 px-5 py-4 text-[9px] font-semibold tracking-[0.15em] text-white transition-all hover:bg-white hover:text-black"
              >
                <span>
                  CREATE BUSINESS ACCOUNT
                </span>

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-start gap-3">
                  <Store
                    size={15}
                    className="mt-0.5 shrink-0 text-neutral-500"
                  />

                  <p className="text-[10px] leading-5 text-neutral-500">
                    Join LUXORA as a business
                    partner and make your products
                    available to customers across
                    the marketplace.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <p className="mx-auto mt-10 max-w-xl text-center text-[10px] leading-5 text-neutral-400">
            Customer and business accounts are
            separated by role-based access control.
            Business users can access the vendor
            portal, while customers use the standard
            shopping account.
          </p>

          {/* =================================================
              BACK
          ================================================= */}

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="mono inline-flex items-center gap-2 text-[8px] tracking-[0.12em] text-neutral-400 hover:text-black"
            >
              <ArrowLeft size={11} />
              RETURN TO LUXORA
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/* ============================================================
   SMALL USER ICON
============================================================ */

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export default Login;