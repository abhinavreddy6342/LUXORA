import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";

import { useShop } from "../context/ShopContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    cartSubtotal,
    couponDiscount,
    appliedCoupon,
    deliveryCharge,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useShop();

  const [couponInput, setCouponInput] = useState("");

  /* ================= TOTAL ITEMS ================= */

  const totalItems = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  /* ================= GO TO CHECKOUT ================= */

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }

    navigate("/checkout");
  };

  /* ================= EMPTY CART ================= */

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#fafaf9]">
        <section className="mx-auto flex min-h-[70vh] max-w-[1440px] items-center justify-center px-6">
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
              duration: 0.6,
            }}
            className="text-center"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
              YOUR CART
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em]">
              Your cart is empty.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-neutral-500">
              Discover something worth keeping.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              CONTINUE SHOPPING
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-24">

        {/* BACK TO SHOP */}

        <Link
          to="/shop"
          className="mb-10 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} />
          Continue shopping
        </Link>

        <div className="grid gap-14 lg:grid-cols-[1fr_380px]">

          {/* CART ITEMS */}

          <div>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
                  SHOPPING CART
                </p>

                <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em]">
                  Your items.
                </h1>
              </div>

              <span className="text-sm text-neutral-400">
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            {/* CLEAR CART */}

            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={clearCart}
                className="mono text-[8px] tracking-[0.15em] text-neutral-400 transition-colors hover:text-black"
              >
                CLEAR CART
              </button>
            </div>

            <div className="border-t border-black/10">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                  }}
                  className="flex gap-5 border-b border-black/10 py-7"
                >

                  {/* IMAGE */}

                  <Link
                    to={`/product/${item.id}`}
                    className="h-32 w-28 shrink-0 overflow-hidden bg-[#f0f0ed]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  {/* PRODUCT INFO */}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                      {item.category?.toUpperCase()}
                    </p>

                    <Link
                      to={`/product/${item.id}`}
                      className="mt-2 text-sm font-medium transition-colors hover:text-neutral-500"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-2 text-sm font-medium">
                      ₹
                      {Number(
                        item.price || 0
                      ).toLocaleString("en-IN")}
                    </p>

                    {/* QUANTITY */}

                    <div className="mt-auto flex flex-wrap items-center gap-4">
                      <div className="flex h-9 items-center border border-black/10">

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Number(
                                item.quantity
                              ) - 1
                            )
                          }
                          className="flex h-full w-9 items-center justify-center transition-colors hover:bg-black hover:text-white"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={12} />
                        </button>

                        <span className="flex h-full w-9 items-center justify-center text-xs">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Number(
                                item.quantity
                              ) + 1
                            )
                          }
                          className="flex h-full w-9 items-center justify-center transition-colors hover:bg-black hover:text-white"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                        className="flex items-center gap-2 text-[9px] tracking-[0.12em] text-neutral-400 transition-colors hover:text-black"
                      >
                        <Trash2 size={12} />
                        REMOVE
                      </button>
                    </div>
                  </div>

                  {/* ITEM TOTAL */}

                  <p className="text-sm font-medium">
                    ₹
                    {(
                      Number(
                        item.price || 0
                      ) *
                      Number(
                        item.quantity || 0
                      )
                    ).toLocaleString("en-IN")}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY */}

          <aside className="h-fit border border-black/10 bg-white p-7">
            <p className="mono text-[9px] tracking-[0.2em] text-neutral-400">
              ORDER SUMMARY
            </p>

            <div className="mt-7 space-y-4 text-sm">

              {/* SUBTOTAL */}

              <div className="flex justify-between">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span>
                  ₹
                  {cartSubtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {/* DELIVERY */}

              <div className="flex justify-between">
                <span className="text-neutral-500">
                  Delivery
                </span>

                <span>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge.toLocaleString(
                        "en-IN"
                      )}`}
                </span>
              </div>

              {/* PROMO CODE */}
              <div className="border-t border-black/10 pt-4">
                <p className="mono text-[8px] tracking-[0.15em] text-neutral-400 mb-2">
                  PROMO CODE
                </p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <div>
                      <span className="font-semibold">{appliedCoupon.code}</span>
                      <span className="ml-1 text-[10px]">({appliedCoupon.discountPercent}% OFF)</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-neutral-500 hover:text-black font-semibold text-[10px]"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyCoupon(couponInput);
                      setCouponInput("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Try LUXORA10"
                      className="flex-1 border border-black/15 bg-white px-3 py-1.5 text-xs uppercase outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      className="mono bg-black px-3 py-1.5 text-[9px] font-semibold tracking-[0.1em] text-white hover:bg-neutral-800"
                    >
                      APPLY
                    </button>
                  </form>
                )}
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {/* FREE DELIVERY MESSAGE */}

              {deliveryCharge > 0 && (
                <p className="border border-black/5 bg-[#fafaf9] px-3 py-3 text-[10px] leading-5 text-neutral-400">
                  Add ₹
                  {(
                    999 - cartSubtotal
                  ).toLocaleString(
                    "en-IN"
                  )}{" "}
                  more to unlock free delivery.
                </p>
              )}

              {/* TOTAL */}

              <div className="border-t border-black/10 pt-5">
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>

                  <span>
                    ₹
                    {cartTotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* CHECKOUT */}

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-8 w-full bg-black px-6 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              PROCEED TO CHECKOUT
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 text-neutral-400">
              Secure checkout · Cash on Delivery
            </p>

            {/* SERVICE INFORMATION */}

            <div className="mt-8 border-t border-black/10 pt-6">

              <div className="flex items-center gap-3">
                <Truck
                  size={16}
                  strokeWidth={1.3}
                />

                <div>
                  <p className="text-xs font-medium">
                    Fast delivery
                  </p>

                  <p className="mt-1 text-[9px] text-neutral-400">
                    Free delivery above ₹999
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <ShieldCheck
                  size={16}
                  strokeWidth={1.3}
                />

                <div>
                  <p className="text-xs font-medium">
                    Secure checkout
                  </p>

                  <p className="mt-1 text-[9px] text-neutral-400">
                    Your order is protected
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Cart;