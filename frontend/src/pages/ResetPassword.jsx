import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const verified = location.state?.verified || false;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !verified) {
      navigate("/forgot-password");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsResetting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            new_password: password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to reset your password. Please request a new verification code."
        );
      }

      navigate("/login", {
        state: {
          passwordReset: true,
          email,
        },
      });
    } catch (error) {
      console.error(
        "Failed to reset password:",
        error
      );

      setError(
        error.message ||
          "Unable to reset your password. Please try again."
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* HEADER */}

      <motion.header
        initial={{
          y: -40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
        className="border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl"
      >
        <nav className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <Link
            to="/login"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.14em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BACK TO LOGIN
          </Link>
        </nav>
      </motion.header>

      {/* MAIN */}

      <main className="flex min-h-[calc(100vh-74px)] items-center justify-center px-6 py-16">
        <motion.div
          initial={{
            opacity: 0,
            y: 35,
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
          {/* ICON */}

          <div className="mb-8 flex h-12 w-12 items-center justify-center border border-black/10 bg-white">
            <LockKeyhole
              size={19}
              strokeWidth={1.5}
            />
          </div>

          {/* HEADING */}

          <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
            ACCOUNT RECOVERY
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
            New password.
          </h1>

          <p className="mt-5 text-sm leading-7 text-neutral-500">
            Create a strong new password for your LUXORA account.
          </p>

          {email && (
            <p className="mt-2 text-xs text-neutral-400">
              Updating password for{" "}
              <span className="font-medium text-neutral-700">
                {email}
              </span>
            </p>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="mt-10"
          >
            {/* PASSWORD */}

            <label
              htmlFor="password"
              className="mono mb-3 block text-[9px] tracking-[0.15em] text-neutral-500"
            >
              NEW PASSWORD
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isResetting}
                className={`w-full border bg-white px-4 py-4 pr-12 text-sm outline-none transition-colors placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
                  error
                    ? "border-red-500"
                    : "border-black/10 focus:border-black"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                disabled={isResetting}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-neutral-400 transition-colors hover:text-black disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff size={17} strokeWidth={1.5} />
                ) : (
                  <Eye size={17} strokeWidth={1.5} />
                )}
              </button>
            </div>

            {/* PASSWORD REQUIREMENTS */}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PasswordRequirement
                valid={passwordChecks.length}
                text="8+ characters"
              />

              <PasswordRequirement
                valid={passwordChecks.uppercase}
                text="Uppercase letter"
              />

              <PasswordRequirement
                valid={passwordChecks.lowercase}
                text="Lowercase letter"
              />

              <PasswordRequirement
                valid={passwordChecks.number}
                text="Number"
              />

              <PasswordRequirement
                valid={passwordChecks.special}
                text="Special character"
              />
            </div>

            {/* CONFIRM PASSWORD */}

            <label
              htmlFor="confirm-password"
              className="mono mb-3 mt-7 block text-[9px] tracking-[0.15em] text-neutral-500"
            >
              CONFIRM NEW PASSWORD
            </label>

            <div className="relative">
              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isResetting}
                className={`w-full border bg-white px-4 py-4 pr-12 text-sm outline-none transition-colors placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
                  error
                    ? "border-red-500"
                    : "border-black/10 focus:border-black"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                disabled={isResetting}
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-neutral-400 transition-colors hover:text-black disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} strokeWidth={1.5} />
                ) : (
                  <Eye size={17} strokeWidth={1.5} />
                )}
              </button>
            </div>

            {/* MATCH INDICATOR */}

            {confirmPassword && (
              <p
                className={`mt-3 text-xs ${
                  password === confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {password === confirmPassword
                  ? "Passwords match."
                  : "Passwords do not match."}
              </p>
            )}

            {/* ERROR */}

            {error && (
              <motion.p
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-4 text-xs leading-5 text-red-600"
              >
                {error}
              </motion.p>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isResetting}
              className="group mt-7 flex w-full items-center justify-center gap-4 bg-black px-6 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isResetting
                ? "RESETTING..."
                : "RESET PASSWORD"}

              {!isResetting && (
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          {/* BACK */}

          <div className="mt-9 text-center">
            <Link
              to="/login"
              className="mono text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              RETURN TO LOGIN
            </Link>
          </div>

          {/* SECURITY NOTE */}

          <p className="mt-8 text-center text-[10px] leading-5 text-neutral-400">
            Your password is securely hashed before being
            stored in the LUXORA database.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function PasswordRequirement({ valid, text }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[8px] ${
          valid
            ? "border-black bg-black text-white"
            : "border-black/15 text-transparent"
        }`}
      >
        ✓
      </span>

      <span
        className={
          valid
            ? "text-neutral-700"
            : "text-neutral-400"
        }
      >
        {text}
      </span>
    </div>
  );
}

export default ResetPassword;