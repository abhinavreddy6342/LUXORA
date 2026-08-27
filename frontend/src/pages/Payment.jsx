import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useShop } from "../context/ShopContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const ACCESS_TOKEN_KEY = "luxora_access_token";

const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  } catch (error) {
    console.error(
      "Failed to read access token:",
      error
    );

    return "";
  }
};

const getApiErrorMessage = async (
  response,
  fallbackMessage
) => {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(", ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch (error) {
    console.error(
      "Failed to parse API error:",
      error
    );
  }

  return fallbackMessage;
};

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const { clearCart } = useShop();

  const checkoutData =
    location.state?.checkoutData;

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  const [isProcessing, setIsProcessing] =
    useState(false);

  /* =====================================================
     NO CHECKOUT DATA
  ===================================================== */

  if (!checkoutData) {
    return (
      <main className="min-h-screen bg-[#fafaf9] text-[#111111]">
        <section className="mx-auto flex min-h-[80vh] max-w-[900px] items-center justify-center px-6">
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
            className="w-full max-w-[520px] border border-black/10 bg-white px-6 py-14 text-center sm:px-10"
          >
            <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
              PAYMENT
            </p>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">
              Checkout session expired.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500">
              Your checkout information is no longer
              available. Please return to checkout and try
              again.
            </p>

            <Link
              to="/checkout"
              className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              BACK TO CHECKOUT
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  /* =====================================================
     CREATE / REUSE BACKEND ADDRESS
  ===================================================== */

  const getOrCreateAddress = async (
    token
  ) => {
    const customer =
      checkoutData.customer || {};

    /* -----------------------------------------------------
       GET EXISTING BACKEND ADDRESSES
    ----------------------------------------------------- */

    const addressesResponse =
      await fetch(
        `${API_BASE_URL}/addresses`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

    if (
      addressesResponse.status === 401 ||
      addressesResponse.status === 403
    ) {
      throw new Error(
        "Your login session has expired. Please sign in again."
      );
    }

    if (addressesResponse.ok) {
      const backendAddresses =
        await addressesResponse.json();

      if (Array.isArray(backendAddresses)) {
        const matchingAddress =
          backendAddresses.find(
            (address) =>
              String(
                address.address_line || ""
              ).trim().toLowerCase() ===
                String(
                  customer.address || ""
                )
                  .trim()
                  .toLowerCase() &&
              String(
                address.city || ""
              ).trim().toLowerCase() ===
                String(
                  customer.city || ""
                )
                  .trim()
                  .toLowerCase() &&
              String(
                address.state || ""
              ).trim().toLowerCase() ===
                String(
                  customer.state || ""
                )
                  .trim()
                  .toLowerCase() &&
              String(
                address.postal_code || ""
              ).trim() ===
                String(
                  customer.pincode || ""
                ).trim()
          );

        if (
          matchingAddress?.id !==
          undefined
        ) {
          return matchingAddress.id;
        }
      }
    }

    /* -----------------------------------------------------
       CREATE NEW BACKEND ADDRESS
    ----------------------------------------------------- */

    const fullName =
      `${customer.firstName || ""} ${
        customer.lastName || ""
      }`.trim();

    const addressPayload = {
      name:
        fullName ||
        "LUXORA Customer",

      phone: String(
        customer.phone || ""
      ).trim(),

      address_line: String(
        customer.address || ""
      ).trim(),

      city: String(
        customer.city || ""
      ).trim(),

      state: String(
        customer.state || ""
      ).trim(),

      postal_code: String(
        customer.pincode || ""
      ).trim(),

      country: "India",

      is_default: false,
    };

    const createAddressResponse =
      await fetch(
        `${API_BASE_URL}/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            addressPayload
          ),
        }
      );

    if (
      !createAddressResponse.ok
    ) {
      const message =
        await getApiErrorMessage(
          createAddressResponse,
          "Unable to save your delivery address."
        );

      throw new Error(message);
    }

    const createdAddress =
      await createAddressResponse.json();

    if (
      createdAddress?.id ===
      undefined ||
      createdAddress?.id === null
    ) {
      throw new Error(
        "The server did not return a valid address ID."
      );
    }

    return createdAddress.id;
  };

  /* =====================================================
     CREATE REAL BACKEND ORDER
  ===================================================== */

  const createBackendOrder =
    async () => {
      const token =
        getAccessToken();

      if (!token) {
        throw new Error(
          "Your LUXORA login session is missing. Please sign in again."
        );
      }

      /* ---------------------------------------------------
         GET / CREATE ADDRESS
      --------------------------------------------------- */

      const addressId =
        await getOrCreateAddress(
          token
        );

      /* ---------------------------------------------------
         ORDER ITEMS
      --------------------------------------------------- */

      const items =
        Array.isArray(
          checkoutData.items
        )
          ? checkoutData.items
              .map((item) => ({
                product_id: Number(
                  item.id
                ),
                quantity: Math.max(
                  1,
                  Math.floor(
                    Number(
                      item.quantity
                    ) || 1
                  )
                ),
              }))
              .filter(
                (item) =>
                  Number.isFinite(
                    item.product_id
                  ) &&
                  item.product_id > 0
              )
          : [];

      if (items.length === 0) {
        throw new Error(
          "Your order does not contain any valid products."
        );
      }

      /* ---------------------------------------------------
         ORDER PAYLOAD
      --------------------------------------------------- */

      const orderPayload = {
        address_id:
          Number(addressId),

        items,

        coupon_code:
          checkoutData.coupon ||
          null,

        payment_method:
          paymentMethod,
      };

      /* ---------------------------------------------------
         CREATE ORDER
      --------------------------------------------------- */

      const response =
        await fetch(
          `${API_BASE_URL}/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
              orderPayload
            ),
          }
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "We could not create your order. Please try again."
          );

        throw new Error(message);
      }

      const createdOrder =
        await response.json();

      if (
        !createdOrder?.id
      ) {
        throw new Error(
          "The server created the order but did not return a valid order ID."
        );
      }

      return createdOrder;
    };

  /* =====================================================
     CONFIRM ORDER
  ===================================================== */

  const handleConfirmOrder =
    async () => {
      if (isProcessing) {
        return;
      }

      setIsProcessing(true);

      try {
        /* -------------------------------------------------
           CREATE REAL DATABASE ORDER
        ------------------------------------------------- */

        const createdOrder =
          await createBackendOrder();

        const backendOrderId =
          Number(createdOrder.id);

        const displayOrderId =
          `LUX-${String(
            backendOrderId
          ).padStart(8, "0")}`;

        /* -------------------------------------------------
           LOCAL ORDER OBJECT FOR UI
        ------------------------------------------------- */

        const orderData = {
          orderId:
            displayOrderId,

          backendOrderId,

          userId:
            checkoutData.userId ||
            null,

          userEmail:
            checkoutData.userEmail,

          customer:
            checkoutData.customer,

          items:
            checkoutData.items,

          subtotal:
            Number(
              createdOrder.subtotal ??
                checkoutData.subtotal
            ),

          discount:
            Number(
              createdOrder.discount ??
                checkoutData.discount
            ),

          coupon:
            createdOrder.coupon_code ||
            checkoutData.coupon ||
            null,

          delivery:
            Number(
              createdOrder.delivery_charge ??
                checkoutData.delivery
            ),

          total:
            Number(
              createdOrder.total ??
                checkoutData.total
            ),

          paymentMethod,

          status:
            createdOrder.status ||
            "confirmed",

          createdAt:
            createdOrder.created_at ||
            new Date().toISOString(),

          receiptEmail:
            checkoutData.userEmail,

          receiptSent: Boolean(
            createdOrder?.email_sent
          ),
        };

        /* -------------------------------------------------
           SAVE ORDER LOCALLY FOR EXISTING UI
        ------------------------------------------------- */

        let existingOrders = [];

        try {
          const existingOrdersRaw =
            localStorage.getItem(
              "luxora_orders"
            );

          if (
            existingOrdersRaw
          ) {
            const parsedOrders =
              JSON.parse(
                existingOrdersRaw
              );

            if (
              Array.isArray(
                parsedOrders
              )
            ) {
              existingOrders =
                parsedOrders;
            }
          }
        } catch (error) {
          console.warn(
            "Could not read previous local orders:",
            error
          );
        }

        existingOrders.unshift(
          orderData
        );

        try {
          localStorage.setItem(
            "luxora_orders",
            JSON.stringify(
              existingOrders
            )
          );
        } catch (error) {
          console.warn(
            "Could not save local order:",
            error
          );
        }

        /* -------------------------------------------------
           CLEAR CART ONLY AFTER BACKEND SUCCESS
        ------------------------------------------------- */

        clearCart();

        /* -------------------------------------------------
           GO TO SUCCESS PAGE
        ------------------------------------------------- */

        const isEmailSent = Boolean(
          createdOrder?.email_sent
        );

        navigate(
          "/order-success",
          {
            replace: true,
            state: {
              ...orderData,

              receiptMessage: isEmailSent
                ? `Payment/order confirmation receipt sent to ${checkoutData.userEmail}.`
                : `Order confirmed successfully. Receipt email could not be sent to ${checkoutData.userEmail}.`,
            },
          }
        );
      } catch (error) {
        console.error(
          "Failed to create LUXORA order:",
          error
        );

        alert(
          error?.message ||
            "We could not place your order. Please try again."
        );

        setIsProcessing(false);
      }
    };

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-black/[0.06] bg-[#fafaf9]">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/checkout"
              )
            }
            disabled={isProcessing}
            className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft
              size={14}
            />
            Back to checkout
          </button>

          <Link
            to="/"
            className="text-xl font-extrabold tracking-[-0.07em]"
          >
            LUXORA
          </Link>

          <div className="flex items-center gap-2 text-neutral-400">
            <Lock
              size={14}
            />

            <span className="mono text-[8px] tracking-[0.12em]">
              SECURE
            </span>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <section className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10 lg:py-20">
        {/* PAGE INTRO */}

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
            duration: 0.6,
          }}
          className="mb-12"
        >
          <p className="mono text-[9px] tracking-[0.22em] text-neutral-400">
            PAYMENT
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
            Choose your payment.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
            Select your preferred payment method to
            complete your LUXORA order.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Check
              size={14}
              className="text-emerald-700"
            />

            <div>
              <p className="text-xs font-medium text-emerald-900">
                Receipt will be emailed
              </p>

              <p className="mt-1 text-[10px] text-emerald-700">
                {checkoutData.userEmail}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
          {/* =================================================
              PAYMENT METHODS
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
          >
            <div className="mb-6">
              <p className="mono text-[9px] tracking-[0.18em] text-neutral-400">
                01
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Payment method
              </h2>
            </div>

            <div className="space-y-3">
              {/* CASH ON DELIVERY */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "Cash on Delivery"
                  )
                }
                disabled={
                  isProcessing
                }
                className={`flex w-full items-center justify-between border bg-white p-5 text-left transition ${
                  paymentMethod ===
                  "Cash on Delivery"
                    ? "border-black"
                    : "border-black/10 hover:border-black/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center ${
                      paymentMethod ===
                      "Cash on Delivery"
                        ? "bg-black text-white"
                        : "bg-[#fafaf9]"
                    }`}
                  >
                    <Banknote
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Pay when your order arrives.
                    </p>
                  </div>
                </div>

                {paymentMethod ===
                  "Cash on Delivery" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                    <Check
                      size={13}
                    />
                  </div>
                )}
              </button>

              {/* UPI */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "UPI"
                  )
                }
                disabled={
                  isProcessing
                }
                className={`flex w-full items-center justify-between border bg-white p-5 text-left transition ${
                  paymentMethod ===
                  "UPI"
                    ? "border-black"
                    : "border-black/10 hover:border-black/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center ${
                      paymentMethod ===
                      "UPI"
                        ? "bg-black text-white"
                        : "bg-[#fafaf9]"
                    }`}
                  >
                    <Smartphone
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      UPI
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Online UPI payment.
                    </p>
                  </div>
                </div>

                {paymentMethod ===
                  "UPI" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                    <Check
                      size={13}
                    />
                  </div>
                )}
              </button>

              {/* CARD */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "Credit / Debit Card"
                  )
                }
                disabled={
                  isProcessing
                }
                className={`flex w-full items-center justify-between border bg-white p-5 text-left transition ${
                  paymentMethod ===
                  "Credit / Debit Card"
                    ? "border-black"
                    : "border-black/10 hover:border-black/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center ${
                      paymentMethod ===
                      "Credit / Debit Card"
                        ? "bg-black text-white"
                        : "bg-[#fafaf9]"
                    }`}
                  >
                    <CreditCard
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Credit / Debit Card
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Secure card payment.
                    </p>
                  </div>
                </div>

                {paymentMethod ===
                  "Credit / Debit Card" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                    <Check
                      size={13}
                    />
                  </div>
                )}
              </button>
            </div>

            {/* CURRENT METHOD */}

            <div className="mt-8 border border-black/10 bg-white p-6">
              <div className="flex items-start gap-4">
                <Lock
                  size={17}
                  className="mt-0.5 shrink-0"
                  strokeWidth={1.5}
                />

                <div>
                  <p className="text-sm font-medium">
                    {paymentMethod}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-400">
                    {paymentMethod ===
                    "Cash on Delivery"
                      ? "Your order will be confirmed immediately. You can pay when the order is delivered."
                      : "This demo currently records the selected payment method. Connect a payment gateway before accepting real online payments."}
                  </p>
                </div>
              </div>
            </div>

            {/* RECEIPT NOTICE */}

            <div className="mt-5 border border-black/10 bg-white p-5">
              <div className="flex items-start gap-3">
                <Check
                  size={16}
                  className="mt-0.5 shrink-0"
                  strokeWidth={1.7}
                />

                <div>
                  <p className="text-xs font-medium">
                    Email receipt included
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-neutral-400">
                    After your order is successfully
                    created, LUXORA will send the order
                    confirmation and payment receipt to{" "}
                    <span className="font-medium text-neutral-600">
                      {checkoutData.userEmail}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* CONFIRM */}

            <button
              type="button"
              onClick={
                handleConfirmOrder
              }
              disabled={
                isProcessing
              }
              className={`mt-8 flex w-full items-center justify-center gap-3 px-7 py-5 text-[10px] font-semibold tracking-[0.15em] text-white transition ${
                isProcessing
                  ? "cursor-not-allowed bg-neutral-500"
                  : "bg-black hover:-translate-y-0.5 hover:shadow-xl"
              }`}
            >
              {isProcessing ? (
                <>
                  <motion.span
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="block h-3 w-3 rounded-full border border-white/30 border-t-white"
                  />

                  CREATING ORDER...
                </>
              ) : (
                <>
                  CONFIRM ORDER · ₹
                  {Number(
                    checkoutData.total
                  ).toLocaleString(
                    "en-IN"
                  )}

                  <ArrowRight
                    size={14}
                  />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-neutral-400">
              <Lock
                size={11}
              />
              Secure checkout · Your information is protected.
            </p>
          </motion.section>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <motion.aside
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
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
              {checkoutData.items.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex gap-4"
                  >
                    <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f0f0ed]">
                      <img
                        src={item.image}
                        alt={
                          item.name
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Qty ·{" "}
                        {
                          item.quantity
                        }
                      </p>

                      <p className="mt-2 text-sm">
                        ₹
                        {(
                          Number(
                            item.price
                          ) *
                          Number(
                            item.quantity
                          )
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* TOTALS */}

            <div className="mt-7 space-y-4 border-t border-black/10 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span>
                  ₹
                  {Number(
                    checkoutData.subtotal
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {checkoutData.discount >
                0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>
                    Discount
                    {checkoutData.coupon
                      ? ` (${checkoutData.coupon})`
                      : ""}
                  </span>

                  <span>
                    -₹
                    {Number(
                      checkoutData.discount
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-neutral-500">
                  <Truck
                    size={14}
                  />
                  Delivery
                </span>

                <span>
                  {Number(
                    checkoutData.delivery
                  ) === 0
                    ? "FREE"
                    : `₹${Number(
                        checkoutData.delivery
                      ).toLocaleString(
                        "en-IN"
                      )}`}
                </span>
              </div>

              <div className="border-t border-black/10 pt-5">
                <div className="flex justify-between text-base font-medium">
                  <span>
                    Total
                  </span>

                  <span>
                    ₹
                    {Number(
                      checkoutData.total
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* DELIVERY */}

            <div className="mt-7 border-t border-black/10 pt-5">
              <div className="flex items-start gap-3">
                <Truck
                  size={15}
                  strokeWidth={1.4}
                  className="mt-0.5"
                />

                <div>
                  <p className="text-xs font-medium">
                    Delivery to
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-neutral-400">
                    {
                      checkoutData
                        .customer
                        .address
                    }
                    <br />
                    {
                      checkoutData
                        .customer
                        .city
                    }
                    ,{" "}
                    {
                      checkoutData
                        .customer
                        .state
                    }{" "}
                    {
                      checkoutData
                        .customer
                        .pincode
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* EMAIL */}

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-xs font-medium">
                Receipt email
              </p>

              <p className="mt-1 break-all text-[10px] text-neutral-400">
                {
                  checkoutData.userEmail
                }
              </p>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  );
}

export default Payment;