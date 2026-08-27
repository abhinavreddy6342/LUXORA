import { useEffect, useRef } from "react";
import {
  Check,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const order = location.state;

  const hasSavedOrder = useRef(false);

  /* =====================================================
     SAVE ORDER
  ===================================================== */

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user?.email) {
      navigate("/login", {
        replace: true,
        state: {
          from: "/orders",
        },
      });

      return;
    }

    if (!order?.orderId) {
      navigate("/", {
        replace: true,
      });

      return;
    }

    if (hasSavedOrder.current) {
      return;
    }

    try {
      const existingOrdersRaw =
        localStorage.getItem(
          "luxora_orders"
        );

      let existingOrders = [];

      if (existingOrdersRaw) {
        const parsed =
          JSON.parse(existingOrdersRaw);

        if (Array.isArray(parsed)) {
          existingOrders = parsed;
        }
      }

      const orderId = String(
        order.orderId
      ).trim();

      const userEmail = String(
        user.email
      )
        .trim()
        .toLowerCase();

      const alreadyExists =
        existingOrders.some(
          (existingOrder) =>
            String(
              existingOrder?.orderId || ""
            )
              .trim()
              .toLowerCase() ===
            orderId.toLowerCase()
        );

      if (!alreadyExists) {
        const customer = {
          ...(order.customer || {}),
          email:
            order?.customer?.email ||
            userEmail,
        };

        const orderToSave = {
          ...order,

          orderId,

          createdAt:
            order.createdAt ||
            new Date().toISOString(),

          status:
            order.status ||
            "Order Placed",

          paymentMethod:
            order.paymentMethod ||
            "Cash on Delivery",

          customer,

          items: Array.isArray(
            order.items
          )
            ? order.items
            : [],
        };

        const updatedOrders = [
          orderToSave,
          ...existingOrders,
        ];

        localStorage.setItem(
          "luxora_orders",
          JSON.stringify(
            updatedOrders
          )
        );

        window.dispatchEvent(
          new Event("luxoraOrdersChanged")
        );
      }

      hasSavedOrder.current = true;
    } catch (error) {
      console.error(
        "Failed to save LUXORA order:",
        error
      );
    }
  }, [
    order,
    user,
    isAuthenticated,
    isLoading,
    navigate,
  ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-6 w-6 rounded-full border-2 border-black/15 border-t-black"
        />
      </main>
    );
  }

  /* =====================================================
     INVALID ORDER
  ===================================================== */

  if (
    !isAuthenticated ||
    !order?.orderId
  ) {
    return null;
  }

  const customer =
    order.customer || {};

  const subtotal =
    Number(order.subtotal || 0);

  const discount =
    Number(order.discount || 0);

  const delivery =
    Number(order.delivery || 0);

  const total =
    Number(order.total || 0);

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#111111]">
      <section className="mx-auto flex min-h-screen max-w-[900px] items-center justify-center px-6 py-16">
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
          }}
          className="w-full border border-black/10 bg-white px-7 py-14 text-center shadow-sm sm:px-12"
        >
          {/* SUCCESS ICON */}

          <motion.div
            initial={{
              scale: 0,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              delay: 0.2,
              duration: 0.5,
              type: "spring",
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white"
          >
            <Check
              size={26}
              strokeWidth={1.8}
            />
          </motion.div>

          {/* HEADER */}

          <p className="mono mt-8 text-[9px] tracking-[0.22em] text-neutral-400">
            ORDER CONFIRMED
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
            Thank you for your order.
          </h1>

          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-neutral-500">
            Your order has been placed
            successfully. We&apos;ve received
            your details and will prepare your
            items for delivery.
          </p>

          {/* ORDER DETAILS */}

          <div className="mx-auto mt-10 max-w-md border-y border-black/10 py-7">
            <div className="flex items-center justify-between text-sm">
              <span className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                ORDER ID
              </span>

              <span className="font-medium">
                {order.orderId}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                SUBTOTAL
              </span>

              <span>
                ₹
                {subtotal.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            {discount > 0 && (
              <div className="mt-5 flex items-center justify-between text-sm text-emerald-700">
                <span className="mono text-[8px] tracking-[0.15em]">
                  DISCOUNT
                </span>

                <span>
                  -₹
                  {discount.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            )}

            {order.coupon && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                <span>
                  Coupon
                </span>

                <span>
                  {order.coupon}
                </span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                DELIVERY
              </span>

              <span>
                {delivery === 0
                  ? "FREE"
                  : `₹${delivery.toLocaleString(
                      "en-IN"
                    )}`}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-5 text-base font-medium">
              <span>
                TOTAL
              </span>

              <span>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                PAYMENT
              </p>

              <p className="mt-2 text-sm font-medium">
                {order.paymentMethod ||
                  "Cash on Delivery"}
              </p>
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                ORDER STATUS
              </p>

              <p className="mt-2 text-sm font-medium">
                {order.status ||
                  "Order Placed"}
              </p>
            </div>
          </div>

          {/* DELIVERY DETAILS */}

          <div className="mx-auto mt-7 max-w-md bg-[#fafaf9] px-5 py-5 text-left">
            <div className="flex items-start gap-3">
              <ShoppingBag
                size={16}
                strokeWidth={1.4}
                className="mt-0.5"
              />

              <div>
                <p className="text-xs font-medium">
                  Delivery to
                </p>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {customer.firstName}{" "}
                  {customer.lastName}
                  <br />
                  {customer.address}
                  <br />
                  {customer.city},{" "}
                  {customer.state}{" "}
                  {customer.pincode}
                  <br />
                  {customer.phone}
                </p>
              </div>
            </div>
          </div>

          {/* EMAIL */}

          {customer.email && (
            <p className="mt-5 text-[10px] text-neutral-400">
              {order.receiptSent === false
                ? "Order confirmed. Receipt email could not be sent to "
                : "Order receipt sent to "}
              <span className="font-medium text-neutral-600">
                {customer.email}
              </span>
            </p>
          )}

          {/* BUTTONS */}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to={`/track-order/${encodeURIComponent(
                order.orderId
              )}`}
              className="inline-flex items-center justify-center gap-2 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              TRACK ORDER
              <ArrowRight size={13} />
            </Link>

            <Link
              to="/orders"
              className="inline-flex items-center justify-center border border-black/15 bg-white px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition hover:border-black hover:bg-black hover:text-white"
            >
              VIEW MY ORDERS
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center border border-black/15 bg-white px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition hover:border-black hover:bg-black hover:text-white"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

export default OrderSuccess;