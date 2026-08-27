import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
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

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */

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

  /* =====================================================
     VALIDATION
  ===================================================== */

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

  /* =====================================================
     SUBMIT LOGIN
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || isSuccess) {
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

      /* =================================================
         LOGIN SUCCESS
      ================================================= */

      setIsSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        navigate("/account", {
          replace: true,
        });
      }, 1000);
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
          LOGIN CONTENT
      ================================================= */}

      <main className="flex min-h-[calc(100vh-74px)] items-center justify-center px-6 py-16">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          className="w-full max-w-[460px]"
        >
          {/* HEADING */}

          <div className="text-center">
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              WELCOME BACK
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
              Sign in.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Sign in to access your account,
              orders and saved preferences.
            </p>
          </div>

          {/* SUCCESS MESSAGE */}

          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                transition={{
                  duration: 0.35,
                }}
                className="mt-10 flex items-center gap-3 border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check
                    size={15}
                    strokeWidth={2}
                  />
                </span>

                <div>
                  <p className="font-medium">
                    Sign in successful.
                  </p>

                  <p className="mt-0.5 text-xs text-green-600">
                    Redirecting to your account...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="mt-12"
            noValidate
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                GMAIL ADDRESS
              </label>

              <div
                className={`flex items-center border-b ${
                  errors.email
                    ? "border-red-500"
                    : "border-black/20"
                } transition-colors focus-within:border-black`}
              >
                <Mail
                  size={16}
                  strokeWidth={1.5}
                  className="mr-3 text-neutral-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  disabled={
                    isSubmitting || isSuccess
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {errors.email && (
                <motion.p
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-2 text-xs text-red-500"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* PASSWORD */}

            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="mono block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  PASSWORD
                </label>

                <Link
                  to="/forgot-password"
                  className="mono text-[8px] tracking-[0.1em] text-neutral-500 underline-offset-4 transition-colors hover:text-black hover:underline"
                >
                  FORGOT PASSWORD?
                </Link>
              </div>

              <div
                className={`flex items-center border-b ${
                  errors.password
                    ? "border-red-500"
                    : "border-black/20"
                } transition-colors focus-within:border-black`}
              >
                <Lock
                  size={16}
                  strokeWidth={1.5}
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={
                    isSubmitting || isSuccess
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={
                    isSubmitting || isSuccess
                  }
                  className="flex h-10 w-10 items-center justify-center text-neutral-400 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={16}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Eye
                      size={16}
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              </div>

              {errors.password && (
                <motion.p
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-2 text-xs text-red-500"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* LOGIN ERROR */}

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
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600"
                >
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                isSubmitting || isSuccess
              }
              className={`group mt-9 flex w-full items-center justify-center gap-4 px-7 py-4 text-[10px] font-semibold tracking-[0.16em] text-white transition-all duration-300 ${
                isSuccess
                  ? "cursor-default bg-neutral-700"
                  : "bg-black hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              }`}
            >
              {isSuccess ? (
                <>
                  <Check size={14} />
                  SIGNED IN
                </>
              ) : isSubmitting ? (
                <>
                  <motion.span
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-flex"
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-white/30 border-t-white" />
                  </motion.span>

                  SIGNING IN...
                </>
              ) : (
                <>
                  SIGN IN

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* CREATE ACCOUNT */}

          <div className="mt-10 border-t border-black/10 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              Don't have a LUXORA account?
            </p>

            <Link
              to="/create-account"
              className="mono mt-4 inline-block border-b border-black pb-1 text-[9px] tracking-[0.15em] transition-opacity hover:opacity-50"
            >
              CREATE ACCOUNT
            </Link>
          </div>

          {/* SECURITY NOTE */}

          <p className="mx-auto mt-10 max-w-sm text-center text-[10px] leading-5 text-neutral-400">
            Your account information is securely
            connected to your LUXORA profile through
            backend authentication.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default Login;