import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import ProductImage from "../components/ProductImage";
import { useAuth } from "../context/AuthContext";

const trackingSteps = [
  {
    key: "placed",
    label: "Order Placed",
  },
  {
    key: "confirmed",
    label: "Confirmed",
  },
  {
    key: "packed",
    label: "Packed",
  },
  {
    key: "shipped",
    label: "Shipped",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
];

function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [searchId, setSearchId] =
    useState("");

  const [order, setOrder] =
    useState(null);

  /* =====================================================
     LOAD ORDER
  ===================================================== */

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const loadOrder = () => {
      if (
        !isAuthenticated ||
        !user?.email
      ) {
        setOrder(null);
        return;
      }

      try {
        const savedOrdersRaw =
          localStorage.getItem(
            "luxora_orders"
          );

        if (!savedOrdersRaw) {
          setOrder(null);
          return;
        }

        const parsed =
          JSON.parse(
            savedOrdersRaw
          );

        if (!Array.isArray(parsed)) {
          setOrder(null);
          return;
        }

        const requestedOrderId =
          String(id || "")
            .trim()
            .toLowerCase();

        const currentUserEmail =
          String(user.email)
            .trim()
            .toLowerCase();

        if (!requestedOrderId) {
          setOrder(null);
          return;
        }

        const matchedOrder =
          parsed.find((item) => {
            const orderId =
              String(
                item?.orderId || ""
              )
                .trim()
                .toLowerCase();

            const orderEmail =
              String(
                item?.customer?.email ||
                  item?.email ||
                  item?.userEmail ||
                  ""
              )
                .trim()
                .toLowerCase();

            return (
              orderId ===
                requestedOrderId &&
              orderEmail ===
                currentUserEmail
            );
          }) || null;

        setOrder(matchedOrder);
      } catch (error) {
        console.error(
          "Failed to load order:",
          error
        );

        setOrder(null);
      }
    };

    loadOrder();

    window.addEventListener(
      "luxoraOrdersChanged",
      loadOrder
    );

    window.addEventListener(
      "storage",
      loadOrder
    );

    return () => {
      window.removeEventListener(
        "luxoraOrdersChanged",
        loadOrder
      );

      window.removeEventListener(
        "storage",
        loadOrder
      );
    };
  }, [
    id,
    user,
    isAuthenticated,
    isLoading,
  ]);

  /* =====================================================
     STATUS INDEX
  ===================================================== */

  const getStepIndex = (
    statusStr
  ) => {
    const status =
      String(statusStr || "")
        .trim()
        .toLowerCase();

    if (status.includes("delivered")) {
      return 5;
    }

    if (
      status.includes(
        "out for delivery"
      ) ||
      status.includes(
        "out_for_delivery"
      )
    ) {
      return 4;
    }

    if (
      status.includes("shipped") ||
      status.includes("transit") ||
      status.includes("dispatch")
    ) {
      return 3;
    }

    if (
      status.includes("packed") ||
      status.includes("preparing")
    ) {
      return 2;
    }

    if (
      status.includes("confirmed") ||
      status.includes("confirm")
    ) {
      return 1;
    }

    return 0;
  };

  const currentStepIndex =
    getStepIndex(order?.status);

  /* =====================================================
     ESTIMATED DELIVERY
  ===================================================== */

  const getEstimateDate = (
    createdAt
  ) => {
    const parsedBase = createdAt
      ? new Date(createdAt)
      : new Date();

    const base = Number.isNaN(
      parsedBase.getTime()
    )
      ? new Date()
      : parsedBase;

    const start =
      new Date(base);

    start.setDate(
      start.getDate() + 3
    );

    const end =
      new Date(base);

    end.setDate(
      end.getDate() + 5
    );

    const options = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };

    return `${start.toLocaleDateString(
      "en-IN",
      options
    )} – ${end.toLocaleDateString(
      "en-IN",
      options
    )}`;
  };

  /* =====================================================
     SEARCH ORDER
  ===================================================== */

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    const trimmedId =
      searchId.trim();

    if (!trimmedId) {
      return;
    }

    navigate(
      `/track-order/${encodeURIComponent(
        trimmedId
      )}`
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] text-[#111111]">
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
      </div>
    );
  }

  /* =====================================================
     NOT AUTHENTICATED
  ===================================================== */

  if (
    !isAuthenticated ||
    !user?.email
  ) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
        <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
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

        <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[700px] items-center px-6 py-16">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="w-full border border-black/10 bg-white p-8 text-center sm:p-12"
          >
            <Package
              size={36}
              className="mx-auto text-neutral-400"
              strokeWidth={1.4}
            />

            <p className="mono mt-5 text-[9px] tracking-[0.2em] text-neutral-400">
              ACCOUNT REQUIRED
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              Sign in to track your order.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-neutral-500">
              For your security, order
              tracking is available only
              to the account that placed
              the order.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                SIGN IN
              </Link>

              <Link
                to="/orders"
                className="border border-black/15 px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                MY ORDERS
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111]">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fafaf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <Link
            to="/orders"
            className="mono flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} />
            BACK TO ORDERS
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-6 py-12 lg:px-10 lg:py-20">
        {!order ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="border border-black/10 bg-white p-8 text-center sm:p-12"
          >
            <Package
              size={36}
              className="mx-auto text-neutral-400"
              strokeWidth={1.4}
            />

            <p className="mono mt-4 text-[9px] tracking-[0.2em] text-neutral-400">
              TRACK ORDER
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              Order Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
              We couldn&apos;t find an order
              matching{" "}
              <span className="font-semibold text-black">
                #{id || "unknown"}
              </span>
              . Make sure the Order ID
              belongs to your LUXORA account.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-md border border-black/15"
            >
              <label
                htmlFor="track-order-id"
                className="sr-only"
              >
                Order ID
              </label>

              <input
                id="track-order-id"
                type="text"
                value={searchId}
                onChange={(event) =>
                  setSearchId(
                    event.target.value
                  )
                }
                placeholder="e.g. LUX-12345678"
                className="min-w-0 flex-1 bg-white px-4 py-3 text-sm outline-none"
              />

              <button
                type="submit"
                className="bg-black px-6 py-3 text-[10px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-neutral-800"
              >
                TRACK
              </button>
            </form>

            <Link
              to="/orders"
              className="mono mt-7 inline-flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              <ArrowLeft size={13} />
              VIEW MY ORDERS
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
          >
            {/* HEADER */}

            <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
              <div>
                <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
                  LIVE ORDER TRACKING
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                  Order #{order.orderId}
                </h1>

                <p className="mt-2 text-xs text-neutral-500">
                  Placed on{" "}
                  {order.createdAt
                    ? new Date(
                        order.createdAt
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month:
                            "long",
                          year:
                            "numeric",
                        }
                      )
                    : "Recently"}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start bg-neutral-900 px-4 py-2 text-xs font-medium text-white sm:self-auto">
                <Truck size={14} />

                <span>
                  {order.status ||
                    "Order Placed"}
                </span>
              </div>
            </div>

            {/* TIMELINE */}

            <div className="mt-12 border border-black/10 bg-white p-8 lg:p-10">
              <h2 className="mono mb-8 text-[9px] tracking-[0.2em] text-neutral-400">
                DELIVERY TIMELINE
              </h2>

              <div className="relative">
                {/* MOBILE LINE */}

                <div className="absolute bottom-5 left-[18px] top-5 w-0.5 bg-neutral-200 md:hidden">
                  <div
                    className="w-full bg-black transition-all duration-700"
                    style={{
                      height: `${
                        (currentStepIndex /
                          (trackingSteps.length -
                            1)) *
                        100
                      }%`,
                    }}
                  />
                </div>

                {/* DESKTOP LINE */}

                <div className="absolute left-[8%] right-[8%] top-[18px] hidden h-0.5 bg-neutral-200 md:block">
                  <div
                    className="h-full bg-black transition-all duration-700"
                    style={{
                      width: `${
                        (currentStepIndex /
                          (trackingSteps.length -
                            1)) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:gap-0">
                  {trackingSteps.map(
                    (step, idx) => {
                      const isDone =
                        idx <=
                        currentStepIndex;

                      const isCurrent =
                        idx ===
                        currentStepIndex;

                      return (
                        <div
                          key={step.key}
                          className="relative z-10 flex flex-1 items-center gap-4 text-left md:flex-col md:gap-3 md:text-center"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                              isDone
                                ? "border-black bg-black text-white"
                                : "border-neutral-300 bg-white text-neutral-400"
                            } ${
                              isCurrent
                                ? "ring-4 ring-neutral-200"
                                : ""
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2
                                size={16}
                              />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <div>
                            <p
                              className={`text-xs font-medium ${
                                isDone
                                  ? "text-black"
                                  : "text-neutral-400"
                              }`}
                            >
                              {step.label}
                            </p>

                            {isCurrent && (
                              <span className="mono mt-1 inline-block border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.1em] text-emerald-700">
                                IN PROGRESS
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="mt-10 flex items-center gap-4 border-t border-black/10 bg-[#fafaf9] p-4 pt-6 text-xs">
                <Clock
                  size={16}
                  className="shrink-0 text-neutral-500"
                />

                <div>
                  <span className="text-neutral-500">
                    Estimated Delivery
                    Window:{" "}
                  </span>

                  <span className="font-semibold text-black">
                    {getEstimateDate(
                      order.createdAt
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ITEMS + SIDEBAR */}

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* ITEMS */}

              <div className="border border-black/10 bg-white p-6 sm:p-8">
                <h2 className="mono mb-6 text-[9px] tracking-[0.2em] text-neutral-400">
                  ITEMS IN THIS SHIPMENT
                </h2>

                <div className="space-y-6">
                  {(
                    order.items ||
                    []
                  ).map(
                    (item, idx) => {
                      const quantity =
                        Number(
                          item.quantity ||
                            1
                        );

                      const price =
                        Number(
                          item.price || 0
                        );

                      return (
                        <div
                          key={`${item.id || item.name || "item"}-${idx}`}
                          className="flex gap-4 border-b border-black/10 pb-6 last:border-b-0 last:pb-0"
                        >
                          <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f0f0ed]">
                            <ProductImage
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Product"
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {item.name ||
                                "LUXORA Product"}
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                              Qty:{" "}
                              {
                                quantity
                              }
                            </p>

                            <p className="mt-2 text-sm font-medium">
                              ₹
                              {(
                                price *
                                quantity
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* SIDEBAR */}

              <div className="space-y-6">
                {/* ADDRESS */}

                <div className="border border-black/10 bg-white p-6">
                  <div className="mono mb-4 flex items-center gap-2 text-xs font-semibold">
                    <MapPin size={15} />
                    DELIVERY ADDRESS
                  </div>

                  {order.customer ? (
                    <div className="text-xs leading-6 text-neutral-600">
                      <p className="font-semibold text-black">
                        {
                          order
                            .customer
                            .firstName
                        }{" "}
                        {
                          order
                            .customer
                            .lastName
                        }
                      </p>

                      <p>
                        {
                          order
                            .customer
                            .address
                        }
                      </p>

                      <p>
                        {
                          order
                            .customer
                            .city
                        }
                        ,{" "}
                        {
                          order
                            .customer
                            .state
                        }{" "}
                        {
                          order
                            .customer
                            .pincode
                        }
                      </p>

                      {order
                        .customer
                        .phone && (
                        <p className="mt-2 text-neutral-400">
                          {
                            order
                              .customer
                              .phone
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">
                      Address on file.
                    </p>
                  )}
                </div>

                {/* PAYMENT */}

                <div className="space-y-3 border border-black/10 bg-white p-6 text-xs">
                  <div className="mono mb-4 text-[9px] font-semibold tracking-[0.2em] text-neutral-400">
                    PAYMENT BREAKDOWN
                  </div>

                  <div className="flex justify-between text-neutral-500">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      ₹
                      {Number(
                        order.subtotal ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  {Number(
                    order.discount ||
                      0
                  ) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Discount
                        {order.coupon
                          ? ` (${order.coupon})`
                          : ""}
                      </span>

                      <span>
                        -₹
                        {Number(
                          order.discount ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-500">
                    <span>
                      Delivery
                    </span>

                    <span>
                      {Number(
                        order.delivery ||
                          0
                      ) === 0
                        ? "FREE"
                        : `₹${Number(
                            order.delivery ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}`}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-black/10 pt-3 text-sm font-semibold text-black">
                    <span>
                      Total Paid
                    </span>

                    <span>
                      ₹
                      {Number(
                        order.total ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <p className="pt-2 text-[10px] text-neutral-400">
                    Payment Method:{" "}
                    {order.paymentMethod ||
                      "Cash on Delivery"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default TrackOrder;