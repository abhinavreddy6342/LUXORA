import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  ArrowRight,
  LogIn,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ProductImage from "../components/ProductImage";

function Orders() {
  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [orders, setOrders] = useState([]);

  /* =====================================================
     LOAD USER ORDERS
  ===================================================== */

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const loadOrders = () => {
      if (
        !isAuthenticated ||
        !user?.email
      ) {
        setOrders([]);
        return;
      }

      try {
        const savedOrdersRaw =
          localStorage.getItem(
            "luxora_orders"
          );

        if (!savedOrdersRaw) {
          setOrders([]);
          return;
        }

        const parsedOrders =
          JSON.parse(
            savedOrdersRaw
          );

        if (!Array.isArray(parsedOrders)) {
          setOrders([]);
          return;
        }

        const currentUserEmail =
          String(user.email)
            .trim()
            .toLowerCase();

        const userOrders =
          parsedOrders
            .filter((order) => {
              const orderEmail =
                String(
                  order?.customer?.email ||
                    order?.email ||
                    order?.userEmail ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              return (
                orderEmail ===
                currentUserEmail
              );
            })
            .sort((a, b) => {
              const dateA =
                new Date(
                  a?.createdAt || 0
                ).getTime();

              const dateB =
                new Date(
                  b?.createdAt || 0
                ).getTime();

              return dateB - dateA;
            });

        setOrders(userOrders);
      } catch (error) {
        console.error(
          "Failed to load LUXORA orders:",
          error
        );

        setOrders([]);
      }
    };

    loadOrders();

    window.addEventListener(
      "luxoraAuthChanged",
      loadOrders
    );

    window.addEventListener(
      "luxoraOrdersChanged",
      loadOrders
    );

    window.addEventListener(
      "storage",
      loadOrders
    );

    return () => {
      window.removeEventListener(
        "luxoraAuthChanged",
        loadOrders
      );

      window.removeEventListener(
        "luxoraOrdersChanged",
        loadOrders
      );

      window.removeEventListener(
        "storage",
        loadOrders
      );
    };
  }, [
    user,
    isAuthenticated,
    isLoading,
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
     USER NOT LOGGED IN
  ===================================================== */

  if (
    !isAuthenticated ||
    !user?.email
  ) {
    return (
      <main className="min-h-screen bg-[#fafaf9] text-[#111111]">
        <section className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center px-6 py-16 lg:px-10">
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
              ease: "easeOut",
            }}
            className="w-full max-w-[520px] border border-black/10 bg-white px-6 py-16 text-center sm:px-10"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fafaf9]">
              <User
                size={25}
                strokeWidth={1.4}
              />
            </div>

            <p className="mono mt-7 text-[9px] tracking-[0.2em] text-neutral-400">
              ACCOUNT REQUIRED
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
              Sign in to view your orders.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Your LUXORA order history is
              connected to your account.
              Sign in to view orders placed
              with your email.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <LogIn size={13} />
                SIGN IN
              </Link>

              <Link
                to="/create-account"
                className="inline-flex items-center justify-center gap-3 border border-black/15 px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                CREATE ACCOUNT
              </Link>
            </div>

            <Link
              to="/"
              className="mono mt-10 inline-flex items-center gap-2 text-[9px] tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              <ArrowLeft size={13} />
              BACK TO STORE
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#111111]">
      <section className="mx-auto max-w-[1100px] px-6 py-16 lg:px-10 lg:py-24">
        {/* BACK */}

        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} />
          Back home
        </Link>

        {/* HEADER */}

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
        >
          <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
            ACCOUNT
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em]">
            Your orders.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-6 text-neutral-500">
            Orders placed using{" "}
            <span className="font-medium text-black">
              {user.email}
            </span>{" "}
            will appear here.
          </p>
        </motion.div>

        {/* NO ORDERS */}

        {orders.length === 0 ? (
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
              delay: 0.1,
            }}
            className="mt-14 border border-black/10 bg-white px-6 py-16 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fafaf9]">
              <Package
                size={25}
                strokeWidth={1.4}
              />
            </div>

            <p className="mono mt-7 text-[9px] tracking-[0.2em] text-neutral-400">
              NO ORDERS YET
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.04em]">
              Nothing here yet.
            </h2>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500">
              Once you place an order with
              this account, your order history
              will appear here.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              START SHOPPING
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        ) : (
          <div className="mt-14 space-y-5">
            {orders.map(
              (order, index) => {
                const orderTotal =
                  Number(
                    order.total || 0
                  );

                const orderSubtotal =
                  Number(
                    order.subtotal || 0
                  );

                const orderDelivery =
                  Number(
                    order.delivery || 0
                  );

                return (
                  <motion.article
                    key={
                      order.orderId ||
                      index
                    }
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
                      delay:
                        index * 0.08,
                    }}
                    className="border border-black/10 bg-white"
                  >
                    {/* ORDER HEADER */}

                    <div className="flex flex-col gap-4 border-b border-black/10 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                          ORDER ID
                        </p>

                        <p className="mt-2 text-sm font-medium">
                          {order.orderId ||
                            "LUX-ORDER"}
                        </p>

                        {order.createdAt && (
                          <p className="mt-1 text-[10px] text-neutral-400">
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month:
                                  "short",
                                year:
                                  "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-black" />

                          <span className="text-xs font-medium">
                            {order.status ||
                              "Order Placed"}
                          </span>
                        </div>

                        <Link
                          to={`/track-order/${encodeURIComponent(
                            order.orderId
                          )}`}
                          className="mono bg-black px-4 py-2 text-[8px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-neutral-800"
                        >
                          TRACK ORDER
                        </Link>
                      </div>
                    </div>

                    {/* ORDER BODY */}

                    <div className="p-6">
                      {/* PRODUCTS */}

                      <div className="space-y-5">
                        {(
                          order.items ||
                          []
                        ).map(
                          (
                            item,
                            itemIndex
                          ) => {
                            const quantity =
                              Number(
                                item.quantity ||
                                  1
                              );

                            const price =
                              Number(
                                item.price ||
                                  0
                              );

                            return (
                              <div
                                key={`${item.id || item.name || "item"}-${itemIndex}`}
                                className="flex gap-4"
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
                                    Qty ·{" "}
                                    {
                                      quantity
                                    }
                                  </p>

                                  <p className="mt-2 text-sm">
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

                      {/* ORDER INFORMATION */}

                      <div className="mt-7 grid gap-6 border-t border-black/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                            SUBTOTAL
                          </p>

                          <p className="mt-2 text-sm">
                            ₹
                            {orderSubtotal.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                            DELIVERY
                          </p>

                          <p className="mt-2 text-sm">
                            {orderDelivery ===
                            0
                              ? "FREE"
                              : `₹${orderDelivery.toLocaleString(
                                  "en-IN"
                                )}`}
                          </p>
                        </div>

                        <div>
                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                            PAYMENT
                          </p>

                          <p className="mt-2 text-sm">
                            {order.paymentMethod ||
                              "Cash on Delivery"}
                          </p>
                        </div>

                        <div>
                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                            TOTAL
                          </p>

                          <p className="mt-2 text-sm font-medium">
                            ₹
                            {orderTotal.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* DELIVERY ADDRESS */}

                      {order.customer && (
                        <div className="mt-6 border-t border-black/10 pt-6">
                          <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                            DELIVERY TO
                          </p>

                          <p className="mt-3 text-sm font-medium">
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

                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            {
                              order
                                .customer
                                .address
                            }
                            <br />
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
                            <p className="mt-2 text-xs text-neutral-500">
                              {
                                order
                                  .customer
                                  .phone
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              }
            )}
          </div>
        )}

        {/* CONTINUE SHOPPING */}

        {orders.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 border border-black/15 px-7 py-4 text-[10px] font-semibold tracking-[0.15em] transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
            >
              CONTINUE SHOPPING
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Orders;