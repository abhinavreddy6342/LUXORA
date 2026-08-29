import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Truck,
  UserRound,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useShop } from "../context/ShopContext";

function Checkout() {
  const navigate = useNavigate();

  const {
    cart,
    cartSubtotal,
    couponDiscount,
    appliedCoupon,
    deliveryCharge,
    cartTotal,
    addresses,
    applyCoupon,
    removeCoupon,
  } = useShop();

  const [couponInput, setCouponInput] = useState("");

  /* =====================================================
     CURRENT USER
  ===================================================== */

  const [currentUser] = useState(() => {
    try {
      const savedUserRaw =
        localStorage.getItem("luxoraCurrentUser") ||
        localStorage.getItem("luxora_current_user");

      if (!savedUserRaw) {
        return null;
      }

      const user = JSON.parse(savedUserRaw);

      if (!user || typeof user !== "object" || !user.email) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("Failed to load current user:", error);
      return null;
    }
  });

  /* =====================================================
     FORM DATA
  ===================================================== */

  const [formData, setFormData] = useState(() => {
    const user = currentUser;

    const nameParts = String(user?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" "),
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    };
  });

  /* =====================================================
     FORM HANDLING
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "email") {
      return;
    }

    let cleanedValue = value;

    if (name === "phone") {
      cleanedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      cleanedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setFormData((current) => ({
      ...current,
      [name]: cleanedValue,
    }));
  };

  /* =====================================================
     SAVED ADDRESS
  ===================================================== */

  const selectSavedAddress = (address) => {
    if (!address) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      pincode: String(address.pincode || "")
        .replace(/\D/g, "")
        .slice(0, 6),
      phone: address.phone
        ? String(address.phone)
            .replace(/\D/g, "")
            .slice(0, 10)
        : previous.phone,
    }));
  };

  /* =====================================================
     CONTINUE TO PAYMENT
  ===================================================== */

  const handleSubmit = (event) => {
    event.preventDefault();

    /* -----------------------------------------------------
       AUTHENTICATION CHECK
    ----------------------------------------------------- */

    if (!currentUser?.email) {
      alert(
        "Please sign in to your LUXORA account before continuing to payment."
      );

      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });

      return;
    }

    /* -----------------------------------------------------
       CART CHECK
    ----------------------------------------------------- */

    if (!Array.isArray(cart) || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    /* -----------------------------------------------------
       GMAIL VALIDATION
    ----------------------------------------------------- */

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    const accountEmail = String(currentUser.email)
      .trim()
      .toLowerCase();

    if (!gmailRegex.test(accountEmail)) {
      alert(
        "Your LUXORA account must use a valid Gmail address ending with @gmail.com."
      );
      return;
    }

    /* -----------------------------------------------------
       CLEAN FORM VALUES
    ----------------------------------------------------- */

    const firstName = String(formData.firstName || "").trim();
    const lastName = String(formData.lastName || "").trim();
    const phone = String(formData.phone || "").trim();
    const address = String(formData.address || "").trim();
    const city = String(formData.city || "").trim();
    const state = String(formData.state || "").trim();
    const pincode = String(formData.pincode || "").trim();

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!firstName) {
      alert("Please enter your first name.");
      return;
    }

    if (firstName.length < 2) {
      alert("Please enter a valid first name.");
      return;
    }

    if (!lastName) {
      alert("Please enter your last name.");
      return;
    }

    if (lastName.length < 2) {
      alert("Please enter a valid last name.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!address) {
      alert("Please enter your delivery address.");
      return;
    }

    if (address.length < 5) {
      alert("Please enter a complete delivery address.");
      return;
    }

    if (!city) {
      alert("Please enter your city.");
      return;
    }

    if (!state) {
      alert("Please enter your state.");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    /* =====================================================
       PREPARE CHECKOUT DATA
       Order is NOT created yet.
    ===================================================== */

    const checkoutData = {
      userId: currentUser.id || currentUser.userId || null,
      userEmail: accountEmail,

      customer: {
        firstName,
        lastName,
        email: accountEmail,
        phone,
        address,
        city,
        state,
        pincode,
      },

      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(
          1,
          Math.floor(Number(item.quantity) || 1)
        ),
        image: item.image || "",
        category: item.category || "",
        vendor_id: item.vendor_id ?? null,
      })),

      subtotal: Math.max(0, Number(cartSubtotal) || 0),

      discount: Math.max(
        0,
        Number(couponDiscount) || 0
      ),

      coupon: appliedCoupon?.code || null,

      delivery: Math.max(
        0,
        Number(deliveryCharge) || 0
      ),

      total: Math.max(
        0,
        Number(cartTotal) || 0
      ),
    };

    /* -----------------------------------------------------
       GO TO PAYMENT
    ----------------------------------------------------- */

    navigate("/payment", {
      state: {
        checkoutData,
      },
    });
  };

  /* =====================================================
     ACCOUNT REQUIRED
  ===================================================== */

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#fafaf9] text-[#111111]">
        <section className="mx-auto flex min-h-[80vh] max-w-[900px] items-center justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[520px] border border-black/10 bg-white px-6 py-14 text-center sm:px-10"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fafaf9]">
              <UserRound size={25} strokeWidth={1.4} />
            </div>

            <p className="mono mt-7 text-[9px] tracking-[0.22em] text-neutral-400">
              ACCOUNT REQUIRED
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
              Sign in to checkout.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Please sign in to your LUXORA account before
              placing an order. Your order history will be
              connected to your account.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                state={{ from: "/checkout" }}
                className="inline-flex items-center justify-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                SIGN IN
                <ArrowRight size={13} />
              </Link>

              <Link
                to="/create-account"
                className="inline-flex items-center justify-center border border-black/15 px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                CREATE ACCOUNT
              </Link>
            </div>

            <Link
              to="/cart"
              className="mono mt-9 inline-flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              <ArrowLeft size={13} />
              BACK TO CART
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  /* =====================================================
     EMPTY CART
  ===================================================== */

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#fafaf9]">
        <section className="mx-auto flex min-h-[70vh] max-w-[1440px] items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
              CHECKOUT
            </p>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Your cart is empty.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-neutral-500">
              Add something to your cart before proceeding
              to checkout.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              CONTINUE SHOPPING
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  /* =====================================================
     CHECKOUT PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* HEADER */}

      <header className="border-b border-black/[0.06] bg-[#fafaf9]">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link
            to="/cart"
            className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={14} />
            Back to cart
          </Link>

          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <div className="flex items-center gap-2 text-neutral-400">
            <Lock size={14} />
            <span className="mono text-[8px] tracking-[0.12em]">
              SECURE
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10 lg:py-20">
        {/* PAGE INTRO */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
            CHECKOUT
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
            Complete your order.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
            Enter your delivery details below to continue
            to secure payment.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 border border-black/10 bg-white px-4 py-3">
            <UserRound size={13} strokeWidth={1.5} />

            <span className="text-xs text-neutral-500">
              Signed in as
            </span>

            <span className="text-xs font-medium">
              {currentUser.email}
            </span>
          </div>
        </motion.div>

        <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
          {/* LEFT SIDE */}

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
            onSubmit={handleSubmit}
            className="space-y-10"
          >
            {/* CONTACT */}

            <section>
              <div className="mb-6">
                <p className="mono text-[9px] tracking-[0.18em] text-neutral-400">
                  01
                </p>

                <h2 className="mt-2 text-xl font-medium">
                  Contact information
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  className="checkout-input"
                />

                <input
                  required
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  className="checkout-input"
                />

                <div className="sm:col-span-2">
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    autoComplete="email"
                    className="checkout-input cursor-not-allowed bg-neutral-50 text-neutral-500"
                  />

                  <p className="mt-2 text-[10px] leading-5 text-neutral-400">
                    This email is linked to your LUXORA account
                    and cannot be changed during checkout.
                  </p>
                </div>

                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Please enter a valid 10-digit phone number"
                  className="checkout-input sm:col-span-2"
                />
              </div>
            </section>

            {/* DELIVERY */}

            <section>
              <div className="mb-6">
                <p className="mono text-[9px] tracking-[0.18em] text-neutral-400">
                  02
                </p>

                <h2 className="mt-2 text-xl font-medium">
                  Delivery address
                </h2>
              </div>

              {/* SAVED ADDRESSES */}

              {addresses.length > 0 && (
                <div className="mb-6 border border-black/10 bg-white p-4">
                  <p className="mono mb-3 text-[8px] tracking-[0.15em] text-neutral-400">
                    CHOOSE FROM SAVED ADDRESSES
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() =>
                          selectSavedAddress(addr)
                        }
                        className="mono border border-black/15 bg-[#fafaf9] px-3 py-2 text-[9px] tracking-[0.1em] transition-colors hover:border-black"
                      >
                        <MapPin
                          size={11}
                          className="mr-1 inline text-neutral-500"
                        />

                        {addr.name || "Saved Address"}

                        {addr.city
                          ? ` (${addr.city})`
                          : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  autoComplete="street-address"
                  className="checkout-input"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    autoComplete="address-level2"
                    className="checkout-input"
                  />

                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    autoComplete="address-level1"
                    className="checkout-input"
                  />
                </div>

                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                  autoComplete="postal-code"
                  title="Please enter a valid 6-digit PIN code"
                  className="checkout-input"
                />
              </div>
            </section>

            {/* PAYMENT */}

            <section>
              <div className="mb-6">
                <p className="mono text-[9px] tracking-[0.18em] text-neutral-400">
                  03
                </p>

                <h2 className="mt-2 text-xl font-medium">
                  Payment
                </h2>
              </div>

              <div className="border border-black/10 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-[5px] border-black" />

                  <div>
                    <p className="text-sm font-medium">
                      Continue to secure payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                      Review your order and choose your payment
                      method on the next step.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CONTINUE */}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 bg-black px-7 py-5 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              CONTINUE TO PAYMENT
              <ArrowRight size={14} />
            </button>

            <p className="flex items-center justify-center gap-2 text-center text-[10px] text-neutral-400">
              <Lock size={11} />
              Your information is securely handled.
            </p>
          </motion.form>

          {/* RIGHT SIDE */}

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="h-fit border border-black/10 bg-white p-7 lg:sticky lg:top-8"
          >
            <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
              ORDER SUMMARY
            </p>

            {/* PRODUCTS */}

            <div className="mt-7 space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f0f0ed]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Qty · {item.quantity}
                    </p>

                    <p className="mt-2 text-sm">
                      ₹
                      {(
                        Number(item.price) *
                        Number(item.quantity)
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* COUPON */}

            <div className="mt-7 border-t border-black/10 pt-6">
              <p className="mono mb-3 text-[8px] tracking-[0.18em] text-neutral-400">
                PROMO CODE
              </p>

              {appliedCoupon ? (
                <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  <div>
                    <span className="font-semibold">
                      {appliedCoupon.code}
                    </span>

                    <span className="ml-2 text-[10px]">
                      ({appliedCoupon.discountPercent}% OFF)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[10px] font-semibold text-neutral-500 hover:text-black"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    const result =
                      applyCoupon(couponInput);

                    if (result?.success) {
                      setCouponInput("");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(event) =>
                      setCouponInput(event.target.value)
                    }
                    placeholder="Try LUXORA10"
                    className="flex-1 border border-black/15 bg-white px-3 py-2 text-xs uppercase outline-none focus:border-black"
                  />

                  <button
                    type="submit"
                    className="mono bg-black px-4 py-2 text-[9px] font-semibold tracking-[0.12em] text-white hover:bg-neutral-800"
                  >
                    APPLY
                  </button>
                </form>
              )}
            </div>

            {/* TOTALS */}

            <div className="mt-6 space-y-4 border-t border-black/10 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span>
                  ₹
                  {Number(cartSubtotal).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>
                    Discount ({appliedCoupon?.code})
                  </span>

                  <span>
                    -₹
                    {Number(couponDiscount).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-neutral-500">
                  <Truck size={14} />
                  Delivery
                </span>

                <span>
                  {Number(deliveryCharge) === 0
                    ? "FREE"
                    : `₹${Number(
                        deliveryCharge
                      ).toLocaleString("en-IN")}`}
                </span>
              </div>

              <div className="border-t border-black/10 pt-5">
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>

                  <span>
                    ₹
                    {Number(cartTotal).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ACCOUNT */}

            <div className="mt-7 border-t border-black/10 pt-5">
              <div className="flex items-center gap-3">
                <UserRound
                  size={15}
                  strokeWidth={1.4}
                />

                <div>
                  <p className="text-xs font-medium">
                    Order linked to account
                  </p>

                  <p className="mt-1 break-all text-[10px] text-neutral-400">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* SECURITY */}

            <div className="mt-5 border-t border-black/10 pt-5">
              <div className="flex items-center gap-3">
                <Lock
                  size={15}
                  strokeWidth={1.4}
                />

                <div>
                  <p className="text-xs font-medium">
                    Secure checkout
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Your information stays protected.
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  );
}

export default Checkout;