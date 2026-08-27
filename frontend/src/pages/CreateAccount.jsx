import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function CreateAccount() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [accountError, setAccountError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= HANDLE INPUT ================= */

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

    setAccountError("");
  };

  /* ================= VALIDATION ================= */

  const validate = () => {
    const newErrors = {};

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    /* NAME */

    if (!name) {
      newErrors.name = "Full name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Please enter a valid name.";
    }

    /* EMAIL */

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      newErrors.email = "Email must end with @gmail.com.";
    }

    /* PHONE */

    if (!phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone =
        "Phone number must contain exactly 10 digits.";
    }

    /* PASSWORD */

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    }

    /* CONFIRM PASSWORD */

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || accountCreated) {
      return;
    }

    setAccountError("");
    setAccountCreated(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;

    try {
      /*
       * AuthContext.register() is asynchronous.
       */

      const result = await register({
        name,
        email,
        phone,
        password,
      });

      /* ================= REGISTER FAILED ================= */

      if (!result || result.success === false) {
        setAccountError(
          result?.message ||
            result?.error ||
            "Unable to create your account. Please try again."
        );

        setIsSubmitting(false);
        return;
      }

      /* ================= SUCCESS ================= */

      setAccountCreated(true);
      setIsSubmitting(false);

      /*
       * Give the user time to see the success message
       * before redirecting to the login page.
       */

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            accountCreated: true,
            email,
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Account creation failed:", error);

      setAccountError(
        error?.message ||
          "Something went wrong while creating your account."
      );

      setIsSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* ================= TOP BAR ================= */}

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

      {/* ================= MAIN ================= */}

      <main className="flex min-h-[calc(100vh-74px)] justify-center px-6 py-14 sm:py-20">
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
          className="w-full max-w-[500px]"
        >
          {/* ================= HEADING ================= */}

          <div className="text-center">
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
              JOIN LUXORA
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
              Create account.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Create your account to save your wishlist,
              track orders and enjoy a personalized
              shopping experience.
            </p>
          </div>

          {/* ================= SUCCESS MESSAGE ================= */}

          {accountCreated && (
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
              className="mt-8 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700"
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-sm font-semibold">
                  Account created successfully!
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Redirecting you to the login page...
                </p>
              </div>
            </motion.div>
          )}

          {/* ================= FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="mt-12"
            noValidate
          >
            {/* ================= NAME ================= */}

            <div>
              <label
                htmlFor="name"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                FULL NAME
              </label>

              <div
                className={`flex items-center border-b ${
                  errors.name
                    ? "border-red-500"
                    : "border-black/20"
                } transition-colors focus-within:border-black`}
              >
                <User
                  size={16}
                  strokeWidth={1.5}
                  className="mr-3 text-neutral-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  disabled={isSubmitting || accountCreated}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {errors.name && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            {/* ================= EMAIL ================= */}

            <div className="mt-7">
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
                  disabled={isSubmitting || accountCreated}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* ================= PHONE ================= */}

            <div className="mt-7">
              <label
                htmlFor="phone"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                PHONE NUMBER
              </label>

              <div
                className={`flex items-center border-b ${
                  errors.phone
                    ? "border-red-500"
                    : "border-black/20"
                } transition-colors focus-within:border-black`}
              >
                <Phone
                  size={16}
                  strokeWidth={1.5}
                  className="mr-3 text-neutral-400"
                />

                <span className="mr-2 text-sm text-neutral-400">
                  +91
                </span>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(event) => {
                    const value = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    setFormData((previous) => ({
                      ...previous,
                      phone: value,
                    }));

                    setErrors((previous) => ({
                      ...previous,
                      phone: "",
                    }));

                    setAccountError("");
                  }}
                  placeholder="10 digit number"
                  autoComplete="tel"
                  disabled={isSubmitting || accountCreated}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {errors.phone && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* ================= PASSWORD ================= */}

            <div className="mt-7">
              <label
                htmlFor="password"
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
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  disabled={isSubmitting || accountCreated}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={isSubmitting || accountCreated}
                  className="flex h-10 w-10 items-center justify-center text-neutral-400 transition-colors hover:text-black disabled:cursor-not-allowed"
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

            {/* ================= CONFIRM PASSWORD ================= */}

            <div className="mt-7">
              <label
                htmlFor="confirmPassword"
                className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
              >
                CONFIRM PASSWORD
              </label>

              <div
                className={`flex items-center border-b ${
                  errors.confirmPassword
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={isSubmitting || accountCreated}
                  className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={isSubmitting || accountCreated}
                  className="flex h-10 w-10 items-center justify-center text-neutral-400 transition-colors hover:text-black disabled:cursor-not-allowed"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
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

              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* ================= ACCOUNT ERROR ================= */}

            {accountError && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600"
              >
                {accountError}
              </motion.div>
            )}

            {/* ================= SUBMIT ================= */}

            <button
              type="submit"
              disabled={isSubmitting || accountCreated}
              className={`group mt-9 flex w-full items-center justify-center gap-4 px-7 py-4 text-[10px] font-semibold tracking-[0.16em] text-white transition-all duration-300 ${
                accountCreated
                  ? "cursor-not-allowed bg-emerald-600"
                  : isSubmitting
                  ? "cursor-wait bg-neutral-700"
                  : "bg-black hover:-translate-y-0.5 hover:shadow-xl"
              }`}
            >
              {accountCreated ? (
                <>
                  ACCOUNT CREATED
                  <CheckCircle2 size={15} />
                </>
              ) : isSubmitting ? (
                <>
                  CREATING ACCOUNT...
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                </>
              ) : (
                <>
                  CREATE ACCOUNT

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* ================= LOGIN ================= */}

          <div className="mt-10 border-t border-black/10 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              Already have a LUXORA account?
            </p>

            <Link
              to="/login"
              className="mono mt-4 inline-block border-b border-black pb-1 text-[9px] tracking-[0.15em] transition-opacity hover:opacity-50"
            >
              SIGN IN
            </Link>
          </div>

          {/* ================= NOTE ================= */}

          <p className="mx-auto mt-10 max-w-sm text-center text-[10px] leading-5 text-neutral-400">
            By creating an account, you can keep your orders
            and wishlist associated with your personal LUXORA
            profile.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default CreateAccount;