import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function VendorRegister() {
  const navigate = useNavigate();
  const { registerVendor } = useAuth();

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessDescription: "",
    businessAddress: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [registrationComplete, setRegistrationComplete] =
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

    setFormError("");
  };

  const handlePhoneChange = (event) => {
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

    setFormError("");
  };

  const validate = () => {
    const nextErrors = {};

    const businessName =
      formData.businessName.trim();

    const ownerName =
      formData.ownerName.trim();

    const email =
      formData.email.trim().toLowerCase();

    const phone =
      formData.phone.trim();

    const password =
      formData.password;

    const confirmPassword =
      formData.confirmPassword;

    if (!businessName) {
      nextErrors.businessName =
        "Business name is required.";
    } else if (businessName.length < 2) {
      nextErrors.businessName =
        "Please enter a valid business name.";
    }

    if (!ownerName) {
      nextErrors.ownerName =
        "Owner name is required.";
    } else if (ownerName.length < 2) {
      nextErrors.ownerName =
        "Please enter a valid owner name.";
    }

    if (!email) {
      nextErrors.email =
        "Business email is required.";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(
        email
      )
    ) {
      nextErrors.email =
        "Please use a valid Gmail address ending with @gmail.com.";
    }

    if (!phone) {
      nextErrors.phone =
        "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone =
        "Phone number must contain exactly 10 digits.";
    }

    if (!password) {
      nextErrors.password =
        "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      password !== confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      isSubmitting ||
      registrationComplete
    ) {
      return;
    }

    setFormError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerVendor({
        businessName:
          formData.businessName.trim(),
        ownerName:
          formData.ownerName.trim(),
        email:
          formData.email.trim().toLowerCase(),
        phone:
          formData.phone.trim(),
        password:
          formData.password,
        businessDescription:
          formData.businessDescription.trim(),
        businessAddress:
          formData.businessAddress.trim(),
      });

      if (!result?.success) {
        setFormError(
          result?.message ||
            result?.error ||
            "Unable to create your vendor account."
        );

        setIsSubmitting(false);
        return;
      }

      setRegistrationComplete(true);
      setIsSubmitting(false);

      window.setTimeout(() => {
        navigate("/vendor/dashboard", {
          replace: true,
        });
      }, 900);
    } catch (error) {
      console.error(
        "Vendor registration error:",
        error
      );

      setFormError(
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
            to="/vendor/login"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BUSINESS LOGIN
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-6 py-14 sm:py-20">
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
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-black/10 bg-white">
              <Building2
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <p className="mono mt-7 text-[9px] tracking-[0.22em] text-neutral-500">
              SELL WITH LUXORA
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] md:text-5xl">
              Become a partner.
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-neutral-500">
              Create your business account to publish
              products, manage inventory and handle your
              LUXORA orders.
            </p>
          </div>

          {registrationComplete && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-10 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700"
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-sm font-semibold">
                  Business account created.
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Opening your LUXORA business dashboard...
                </p>
              </div>
            </motion.div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-12"
            noValidate
          >
            <div className="border border-black/10 bg-white p-6 sm:p-8">
              <p className="mono text-[8px] tracking-[0.2em] text-neutral-400">
                BUSINESS INFORMATION
              </p>

              <div className="mt-6">
                <label
                  htmlFor="vendor-business-name"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  BUSINESS NAME
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.businessName
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <Building2
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <input
                    id="vendor-business-name"
                    name="businessName"
                    type="text"
                    value={
                      formData.businessName
                    }
                    onChange={handleChange}
                    placeholder="Nike"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                {errors.businessName && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.businessName}
                  </p>
                )}
              </div>

              <div className="mt-7">
                <label
                  htmlFor="vendor-owner-name"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  OWNER / CONTACT NAME
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.ownerName
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <User
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <input
                    id="vendor-owner-name"
                    name="ownerName"
                    type="text"
                    value={
                      formData.ownerName
                    }
                    onChange={handleChange}
                    placeholder="Business owner name"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                {errors.ownerName && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.ownerName}
                  </p>
                )}
              </div>

              <div className="mt-7">
                <label
                  htmlFor="vendor-email"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  BUSINESS GMAIL
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.email
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <Mail
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <input
                    id="vendor-email"
                    name="email"
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={handleChange}
                    placeholder="business@gmail.com"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
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
                  htmlFor="vendor-phone"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  PHONE NUMBER
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.phone
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <Phone
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <span className="mr-2 text-sm text-neutral-400">
                    +91
                  </span>

                  <input
                    id="vendor-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={
                      formData.phone
                    }
                    onChange={
                      handlePhoneChange
                    }
                    placeholder="10 digit number"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                {errors.phone && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="mt-7">
                <label
                  htmlFor="vendor-description"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  BUSINESS DESCRIPTION
                </label>

                <textarea
                  id="vendor-description"
                  name="businessDescription"
                  rows={4}
                  maxLength={2000}
                  value={
                    formData.businessDescription
                  }
                  onChange={handleChange}
                  placeholder="Tell customers briefly about your brand."
                  disabled={
                    isSubmitting ||
                    registrationComplete
                  }
                  className="w-full resize-none border border-black/10 bg-[#fafaf9] p-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="mt-7">
                <label
                  htmlFor="vendor-address"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  BUSINESS ADDRESS
                </label>

                <div className="flex items-start border border-black/10 bg-[#fafaf9]">
                  <MapPin
                    size={16}
                    className="ml-3 mt-3.5 shrink-0 text-neutral-400"
                  />

                  <textarea
                    id="vendor-address"
                    name="businessAddress"
                    rows={3}
                    maxLength={1000}
                    value={
                      formData.businessAddress
                    }
                    onChange={handleChange}
                    placeholder="Business address"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="min-w-0 flex-1 resize-none bg-transparent p-3 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 border border-black/10 bg-white p-6 sm:p-8">
              <p className="mono text-[8px] tracking-[0.2em] text-neutral-400">
                SECURITY
              </p>

              <div className="mt-6">
                <label
                  htmlFor="vendor-password"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  PASSWORD
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.password
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <Lock
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <input
                    id="vendor-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.password
                    }
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
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
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex h-10 w-10 items-center justify-center text-neutral-400 hover:text-black"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="mt-7">
                <label
                  htmlFor="vendor-confirm-password"
                  className="mono mb-2 block text-[9px] tracking-[0.15em] text-neutral-500"
                >
                  CONFIRM PASSWORD
                </label>

                <div
                  className={`flex items-center border-b ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-black/20"
                  } focus-within:border-black`}
                >
                  <Lock
                    size={16}
                    className="mr-3 text-neutral-400"
                  />

                  <input
                    id="vendor-confirm-password"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-neutral-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={
                      isSubmitting ||
                      registrationComplete
                    }
                    className="flex h-10 w-10 items-center justify-center text-neutral-400 hover:text-black"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {formError && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600"
              >
                {formError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                registrationComplete
              }
              className="group mt-6 flex w-full items-center justify-center gap-4 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {registrationComplete ? (
                <>
                  PARTNER ACCOUNT CREATED
                  <CheckCircle2 size={15} />
                </>
              ) : isSubmitting ? (
                <>
                  CREATING BUSINESS ACCOUNT...
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                </>
              ) : (
                <>
                  BECOME A LUXORA PARTNER
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-black/10 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              Already selling with LUXORA?
            </p>

            <Link
              to="/vendor/login"
              className="mono mt-4 inline-block border-b border-black pb-1 text-[9px] tracking-[0.15em] hover:opacity-50"
            >
              BUSINESS LOGIN
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default VendorRegister;