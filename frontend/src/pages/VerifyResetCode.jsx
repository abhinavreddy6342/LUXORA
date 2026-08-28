import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

function VerifyResetCode() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  /* =====================================================
     CODE INPUT
  ===================================================== */

  const handleCodeChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
    setError("");
    setMessage("");
  };

  /* =====================================================
     VERIFY CODE
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      navigate("/forgot-password");
      return;
    }

    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    if (code.length !== 6) {
      setError("Verification code must contain 6 digits.");
      return;
    }

    setError("");
    setMessage("");
    setIsVerifying(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-reset-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: code,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Invalid or expired verification code."
        );
      }

      navigate("/reset-password", {
        state: {
          email,
          verified: true,
        },
      });
    } catch (error) {
      console.error(
        "Failed to verify reset code:",
        error
      );

      setError(
        error.message ||
          "Unable to verify the code. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  /* =====================================================
     RESEND CODE
  ===================================================== */

  const handleResend = async () => {
    if (!email || isResending) {
      return;
    }

    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to resend the verification code."
        );
      }

      setCode("");

      setMessage(
        "A new verification code has been sent to your email."
      );
    } catch (error) {
      console.error(
        "Failed to resend reset code:",
        error
      );

      setError(
        error.message ||
          "Unable to resend the verification code. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  /* =====================================================
     MASK EMAIL
  ===================================================== */

  const maskedEmail = email
    ? (() => {
        const [username, domain] = email.split("@");

        if (!username || !domain) {
          return email;
        }

        if (username.length <= 2) {
          return `${username[0] || ""}***@${domain}`;
        }

        const firstTwo = username.slice(0, 2);

        return `${firstTwo}${"*".repeat(
          Math.min(Math.max(username.length - 2, 3), 6)
        )}@${domain}`;
      })()
    : "";

  /* =====================================================
     UI
  ===================================================== */

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
            to="/forgot-password"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.14em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BACK
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
            <ShieldCheck
              size={20}
              strokeWidth={1.5}
            />
          </div>

          {/* HEADING */}

          <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
            VERIFY YOUR IDENTITY
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
            Enter code.
          </h1>

          <p className="mt-5 text-sm leading-7 text-neutral-500">
            Enter the 6-digit verification code sent to
          </p>

          {email ? (
            <p className="mt-1 text-sm font-medium">
              {maskedEmail}
            </p>
          ) : (
            <p className="mt-1 text-sm text-red-500">
              No email address was provided.
            </p>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="mt-10"
          >
            <label
              htmlFor="verification-code"
              className="mono mb-3 block text-[9px] tracking-[0.15em] text-neutral-500"
            >
              VERIFICATION CODE
            </label>

            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              disabled={isVerifying}
              className={`w-full border bg-white px-4 py-5 text-center text-2xl font-medium tracking-[0.5em] outline-none transition-colors placeholder:text-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/10 focus:border-black"
              }`}
            />

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
                className="mt-3 text-xs text-red-600"
              >
                {error}
              </motion.p>
            )}

            {/* SUCCESS MESSAGE */}

            {message && (
              <motion.p
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-3 text-xs text-green-600"
              >
                {message}
              </motion.p>
            )}

            {/* VERIFY BUTTON */}

            <button
              type="submit"
              disabled={
                !email ||
                code.length !== 6 ||
                isVerifying
              }
              className="group mt-6 flex w-full items-center justify-center gap-4 bg-black px-6 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isVerifying
                ? "VERIFYING..."
                : "VERIFY CODE"}

              {!isVerifying && (
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          {/* RESEND */}

          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500">
              Didn&apos;t receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={!email || isResending}
              className="glitch-hover mono mt-3 border-b border-black pb-1 text-[9px] tracking-[0.15em] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isResending
                ? "SENDING..."
                : "RESEND CODE"}
            </button>
          </div>

          {/* CHANGE EMAIL */}

          <div className="mt-10 border-t border-black/10 pt-7 text-center">
            <Link
              to="/forgot-password"
              className="mono text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              USE A DIFFERENT EMAIL
            </Link>
          </div>

          {/* SECURITY NOTE */}

          <p className="mt-8 text-center text-[10px] leading-5 text-neutral-400">
            Verification codes are temporary and should never
            be shared with anyone.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default VerifyResetCode;