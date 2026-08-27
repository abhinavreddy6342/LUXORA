import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.endsWith("@gmail.com")) {
      setError("Please use a valid Gmail address ending with @gmail.com.");
      return;
    }

    setError("");

    /*
      FRONTEND ONLY FOR NOW

      Later, when we build the backend:
      1. Send this email to the backend.
      2. Backend generates a verification code.
      3. Code is sent to the user's Gmail.
      4. User enters the code on the verification page.
      5. User can then create a new password.
    */

    navigate("/verify-reset-code", {
      state: {
        email: trimmedEmail,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      {/* HEADER */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-[460px]"
        >
          {/* ICON */}
          <div className="mb-8 flex h-12 w-12 items-center justify-center border border-black/10 bg-white">
            <Mail size={19} strokeWidth={1.5} />
          </div>

          {/* HEADING */}
          <p className="mono text-[9px] tracking-[0.22em] text-neutral-500">
            ACCOUNT RECOVERY
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">
            Forgot password?
          </h1>

          <p className="mt-5 max-w-[400px] text-sm leading-7 text-neutral-500">
            Enter the Gmail address associated with your LUXORA account.
            We&apos;ll send you a verification code to reset your password.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-10">
            <label
              htmlFor="email"
              className="mono mb-3 block text-[9px] tracking-[0.15em] text-neutral-500"
            >
              EMAIL ADDRESS
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@gmail.com"
              autoComplete="email"
              className={`w-full border bg-white px-4 py-4 text-sm outline-none transition-colors placeholder:text-neutral-400 ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/10 focus:border-black"
              }`}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-red-600"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="group mt-6 flex w-full items-center justify-center gap-4 bg-black px-6 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              SEND VERIFICATION CODE

              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </form>

          {/* CREATE ACCOUNT */}
          <div className="mt-10 border-t border-black/10 pt-7 text-center">
            <p className="text-xs text-neutral-500">
              Don&apos;t have a LUXORA account?
            </p>

            <Link
              to="/create-account"
              className="glitch-hover mono mt-3 inline-block border-b border-black pb-1 text-[9px] tracking-[0.15em]"
            >
              CREATE NEW ACCOUNT
            </Link>
          </div>

          {/* SECURITY NOTE */}
          <p className="mt-8 text-center text-[10px] leading-5 text-neutral-400">
            For security, verification codes will only be sent to the email
            address registered with your LUXORA account.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default ForgotPassword;