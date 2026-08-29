import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Check,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function VendorLogin() {
  const navigate = useNavigate();
  const { loginVendor } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    const nextErrors = {};

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      nextErrors.email = "Business email is required.";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)
    ) {
      nextErrors.email =
        "Please enter a valid Gmail address ending with @gmail.com.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || isSuccess) {
      return;
    }

    setLoginError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginVendor({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!result?.success) {
        setLoginError(
          result?.message ||
            result?.error ||
            "Unable to sign in as a business."
        );

        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      window.setTimeout(() => {
        navigate("/vendor/dashboard", {
          replace: true,
        });
      }, 700);
    } catch (error) {
      console.error(
        "Vendor login page error:",
        error
      );

      setLoginError(
        "Unable to connect to the LUXORA business portal."
      );

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      <header className="border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <Link
            to="/login"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            CUSTOMER LOGIN
          </Link>
        </div>
      </header>

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
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-black/10 bg-white">
              <Building2
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <p className="mono mt-7 text-[9px] tracking-[0.22em] text-neutral-500">
              LUXORA BUSINESS
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
              Sign in.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Access your LUXORA business dashboard,
              products, inventory and orders.
            </p>
          </div>

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
                className="mt-10 flex items-center gap-3 border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check size={15} />
                </span>

                <div>
                  <p className="font-medium">
                    Business sign in successful.
                  </p>

                  <p className="mt-0.5 text-xs text-green-600">
                    Opening your business dashboard...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className="mt-12"
            noValidate
          >
            <div>
              <label
                htmlFor="vendor-login-email"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                BUSINESS GMAIL
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
                  id="vendor-login-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="business@gmail.com"
                  autoComplete="email"
                  disabled={isSubmitting || isSuccess}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mt-7">
              <label
                htmlFor="vendor-login-password"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                PASSWORD
              </label>

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
                  id="vendor-login-password"
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
                  disabled={isSubmitting || isSuccess}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={isSubmitting || isSuccess}
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
                <p className="mt-2 text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

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
                  SIGNED IN
                  <Check size={14} />
                </>
              ) : isSubmitting ? (
                <>
                  SIGNING IN...
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                </>
              ) : (
                <>
                  BUSINESS SIGN IN
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-black/10 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              New business to LUXORA?
            </p>

            <Link
              to="/vendor/register"
              className="mono mt-4 inline-block border-b border-black pb-1 text-[9px] tracking-[0.15em] transition-opacity hover:opacity-50"
            >
              BECOME A LUXORA PARTNER
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="mono text-[8px] tracking-[0.12em] text-neutral-400 hover:text-black"
            >
              CUSTOMER LOGIN →
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default VendorLogin;