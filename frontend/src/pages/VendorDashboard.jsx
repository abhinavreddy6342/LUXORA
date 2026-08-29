
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Box,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Eye,
  Loader2,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://luxora-backend-9fsz.onrender.com";

const ACCESS_TOKEN_KEY = "luxora_access_token";

const EMPTY_PRODUCT_FORM = {
  name: "",
  brand: "",
  description: "",
  category: "",
  subcategory: "",
  price: "",
  original_price: "",
  image: "",
  images: "",
  stock: "0",
  sku: "",
  specifications: "",
};

const INITIAL_PROFILE_FORM = {
  business_name: "",
  business_description: "",
  business_phone: "",
  business_address: "",
  logo: "",
};

/* ============================================================
   HELPERS
============================================================ */

function getToken() {
  try {
    return (
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) || ""
    );
  } catch {
    return "";
  }
}

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function normalizeProduct(product) {
  if (
    !product ||
    product.id === undefined ||
    product.id === null
  ) {
    return null;
  }

  const images =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  let specifications = {};

  if (
    product.specifications &&
    typeof product.specifications ===
      "object" &&
    !Array.isArray(product.specifications)
  ) {
    specifications =
      product.specifications;
  }

  return {
    ...product,
    id: Number(product.id),
    vendor_id:
      product.vendor_id ?? null,
    name:
      product.name || "",
    brand:
      product.brand || "",
    description:
      product.description || "",
    category:
      product.category || "",
    subcategory:
      product.subcategory || "",
    price:
      Number(product.price || 0),
    original_price:
      product.original_price !==
        null &&
      product.original_price !==
        undefined
        ? Number(
            product.original_price
          )
        : null,
    image:
      product.image ||
      images[0] ||
      "",
    images,
    stock:
      Number(product.stock || 0),
    sku:
      product.sku || "",
    specifications,
    rating:
      Number(product.rating || 0),
    review_count:
      Number(
        product.review_count || 0
      ),
    is_active:
      product.is_active !== false,
    vendor_name:
      product.vendor_name || "",
  };
}

function productToForm(product) {
  return {
    name:
      product?.name || "",
    brand:
      product?.brand || "",
    description:
      product?.description || "",
    category:
      product?.category || "",
    subcategory:
      product?.subcategory || "",
    price:
      product?.price !==
      undefined
        ? String(
            product.price
          )
        : "",
    original_price:
      product?.original_price !==
        null &&
      product?.original_price !==
        undefined
        ? String(
            product.original_price
          )
        : "",
    image:
      product?.image || "",
    images:
      Array.isArray(
        product?.images
      )
        ? product.images.join("\n")
        : "",
    stock:
      product?.stock !==
      undefined
        ? String(
            product.stock
          )
        : "0",
    sku:
      product?.sku || "",
    specifications:
      product?.specifications &&
      typeof product.specifications ===
        "object"
        ? JSON.stringify(
            product.specifications,
            null,
            2
          )
        : "",
  };
}

function buildProductPayload(formData) {
  let specifications = {};

  const specificationText =
    String(
      formData.specifications || ""
    ).trim();

  if (specificationText) {
    try {
      const parsed =
        JSON.parse(
          specificationText
        );

      if (
        !parsed ||
        typeof parsed !==
          "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error();
      }

      specifications =
        parsed;
    } catch {
      throw new Error(
        'Specifications must be valid JSON, for example {"Material":"Leather"}.'
      );
    }
  }

  const images =
    String(
      formData.images || ""
    )
      .split(/\r?\n|,/)
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);

  const primaryImage =
    String(
      formData.image || ""
    ).trim() ||
    images[0] ||
    "";

  if (!primaryImage) {
    throw new Error(
      "Please provide a primary product image URL."
    );
  }

  const name =
    String(
      formData.name || ""
    ).trim();

  const category =
    String(
      formData.category || ""
    ).trim();

  if (!name) {
    throw new Error(
      "Product name is required."
    );
  }

  if (!category) {
    throw new Error(
      "Product category is required."
    );
  }

  const price =
    Number(
      formData.price
    );

  if (
    !Number.isFinite(
      price
    ) ||
    price < 0
  ) {
    throw new Error(
      "Please enter a valid product price."
    );
  }

  const originalPriceText =
    String(
      formData.original_price ||
        ""
    ).trim();

  const originalPrice =
    originalPriceText === ""
      ? null
      : Number(
          originalPriceText
        );

  if (
    originalPrice !== null &&
    (!Number.isFinite(
      originalPrice
    ) ||
      originalPrice < 0)
  ) {
    throw new Error(
      "Please enter a valid original price."
    );
  }

  const stock =
    Math.max(
      0,
      Math.floor(
        Number(
          formData.stock
        ) || 0
      )
    );

  return {
    name,
    brand:
      String(
        formData.brand || ""
      ).trim() || null,
    description:
      String(
        formData.description ||
          ""
      ).trim() || null,
    category,
    subcategory:
      String(
        formData.subcategory ||
          ""
      ).trim() || null,
    price,
    original_price:
      originalPrice,
    image:
      primaryImage,
    images,
    stock,
    sku:
      String(
        formData.sku || ""
      ).trim() || null,
    specifications,
  };
}

/* ============================================================
   API
============================================================ */

async function vendorFetch(
  path,
  options = {}
) {
  const token =
    getToken();

  if (!token) {
    throw new Error(
      "Your business login session is missing. Please sign in again."
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        cache: "no-store",
        headers: {
          Accept:
            "application/json",
          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
          Authorization:
            `Bearer ${token}`,
          ...(options.headers || {}),
        },
      }
    );

  const rawText =
    await response.text();

  let data = null;

  if (rawText) {
    try {
      data =
        JSON.parse(
          rawText
        );
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let detail =
      "Unable to complete the request.";

    if (
      typeof data?.detail ===
      "string"
    ) {
      detail =
        data.detail;
    } else if (
      Array.isArray(
        data?.detail
      )
    ) {
      detail =
        data.detail
          .map(
            (item) =>
              item?.msg
          )
          .filter(Boolean)
          .join(", ") ||
        detail;
    } else if (
      typeof data?.message ===
      "string"
    ) {
      detail =
        data.message;
    } else if (
      rawText
    ) {
      detail =
        rawText;
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        "Your business login session has expired. Please sign in again."
      );
    }

    throw new Error(
      detail
    );
  }

  return data;
}

function getTabRefreshMessage(
  activeTab
) {
  switch (activeTab) {
    case "PRODUCTS":
      return "Products refreshed successfully.";
    case "ORDERS":
      return "Orders refreshed successfully.";
    case "INVENTORY":
      return "Inventory refreshed successfully.";
    case "PROFILE":
      return "Business profile refreshed successfully.";
    default:
      return "Business overview refreshed successfully.";
  }
}

/* ============================================================
   COMPONENT
============================================================ */

function VendorDashboard() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "OVERVIEW"
  );

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    toast,
    setToast,
  ] = useState(null);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  const [
    modal,
    setModal,
  ] = useState(null);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

  const [
    productForm,
    setProductForm,
  ] = useState(
    EMPTY_PRODUCT_FORM
  );

  const [
    stockProduct,
    setStockProduct,
  ] = useState(null);

  const [
    stockAmount,
    setStockAmount,
  ] = useState("1");

  const [
    profileForm,
    setProfileForm,
  ] = useState(
    INITIAL_PROFILE_FORM
  );

  const [
    isEditingProfile,
    setIsEditingProfile,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    productActionId,
    setProductActionId,
  ] = useState(null);

  const [
    stockActionId,
    setStockActionId,
  ] = useState(null);

  const [
    archiveActionId,
    setArchiveActionId,
  ] = useState(null);

  const [
    statusActionId,
    setStatusActionId,
  ] = useState(null);

  const [
    expandedOrders,
    setExpandedOrders,
  ] = useState(
    () => new Set()
  );

  /* ============================================================
     TOAST
  ============================================================ */

  const showToast =
    useCallback(
      (
        message,
        type = "success"
      ) => {
        const id =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

        setToast({
          id,
          message,
          type,
        });

        window.setTimeout(
          () => {
            setToast(
              (current) =>
                current?.id === id
                  ? null
                  : current
            );
          },
          3500
        );
      },
      []
    );

  /* ============================================================
     LOAD DASHBOARD
  ============================================================ */

  const loadDashboard =
    useCallback(
      async (
        showSuccess = false
      ) => {
        setError("");

        setIsLoading(true);

        try {
          const [
            profileData,
            dashboardData,
            productsData,
            ordersData,
          ] =
            await Promise.all([
              vendorFetch(
                "/vendor/profile"
              ),
              vendorFetch(
                "/vendor/dashboard"
              ),
              vendorFetch(
                "/vendor/products"
              ),
              vendorFetch(
                "/vendor/orders"
              ),
            ]);

          setProfile(
            profileData
          );

          setDashboard(
            dashboardData
          );

          setProducts(
            Array.isArray(
              productsData
            )
              ? productsData
                  .map(
                    normalizeProduct
                  )
                  .filter(Boolean)
              : []
          );

          setOrders(
            Array.isArray(
              ordersData
            )
              ? ordersData
              : []
          );

          setProfileForm({
            business_name:
              profileData?.business_name ||
              "",
            business_description:
              profileData?.business_description ||
              "",
            business_phone:
              profileData?.business_phone ||
              "",
            business_address:
              profileData?.business_address ||
              "",
            logo:
              profileData?.logo ||
              "",
          });

          setLastUpdated(
            new Date()
          );

          if (showSuccess) {
            showToast(
              getTabRefreshMessage(
                activeTab
              )
            );
          }
        } catch (
          requestError
        ) {
          console.error(
            "Vendor dashboard load error:",
            requestError
          );

          const message =
            requestError?.message ||
            "Unable to load the business dashboard.";

          setError(
            message
          );

          if (showSuccess) {
            showToast(
              message,
              "error"
            );
          }
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        activeTab,
        showToast,
      ]
    );

  /* ============================================================
     AUTH / INITIAL LOAD
  ============================================================ */

    useEffect(() => {
    if (!user) {
        navigate("/vendor/login", {
        replace: true,
        });
        return;
    }

    const role = String(user.role || "")
        .trim()
        .toLowerCase();

    if (role !== "vendor") {
        navigate("/login", {
        replace: true,
        });
        return;
    }

    const timer = window.setTimeout(() => {
        loadDashboard(false);
    }, 0);

    return () => {
        window.clearTimeout(timer);
    };
}, [user, navigate, loadDashboard]);
  /* ============================================================
     DERIVED VALUES
  ============================================================ */

  const businessName =
    profile?.business_name ||
    dashboard?.business_name ||
    user?.name ||
    "LUXORA Business";

  const activeProductCount =
    products.filter(
      (product) =>
        product.is_active
    ).length;

  const archivedProductCount =
    products.filter(
      (product) =>
        !product.is_active
    ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        product.is_active &&
        Number(
          product.stock || 0
        ) <= 0
    ).length;

  const stats =
    useMemo(
      () => [
        {
          label:
            "TOTAL PRODUCTS",
          value:
            dashboard?.total_products ??
            products.length,
          icon:
            Package,
        },
        {
          label:
            "ACTIVE PRODUCTS",
          value:
            dashboard?.active_products ??
            activeProductCount,
          icon:
            CheckCircle2,
        },
        {
          label:
            "OUT OF STOCK",
          value:
            dashboard?.out_of_stock ??
            outOfStockCount,
          icon:
            Box,
        },
        {
          label:
            "ORDER ITEMS",
          value:
            dashboard?.total_order_items ??
            0,
          icon:
            ShoppingBag,
        },
        {
          label:
            "REVENUE",
          value:
            formatPrice(
              dashboard?.total_revenue
            ),
          icon:
            BarChart3,
        },
      ],
      [
        dashboard,
        products.length,
        activeProductCount,
        outOfStockCount,
      ]
    );

  /* ============================================================
     ORDER EXPANSION
  ============================================================ */

  const toggleOrderExpanded =
    (orderId) => {
      setExpandedOrders(
        (current) => {
          const next =
            new Set(
              current
            );

          if (
            next.has(
              orderId
            )
          ) {
            next.delete(
              orderId
            );
          } else {
            next.add(
              orderId
            );
          }

          return next;
        }
      );
    };

  /* ============================================================
     PRODUCT MODAL
  ============================================================ */

  const openCreateProduct =
    () => {
      if (
        actionLoading ||
        archiveActionId !== null ||
        stockActionId !== null
      ) {
        return;
      }

      setEditingProduct(
        null
      );

      setProductForm({
        ...EMPTY_PRODUCT_FORM,
      });

      setModal(
        "product"
      );
    };

  const openEditProduct =
    (product) => {
      if (
        productActionId !== null ||
        archiveActionId !== null ||
        stockActionId !== null
      ) {
        return;
      }

      setEditingProduct(
        product
      );

      setProductForm(
        productToForm(
          product
        )
      );

      setModal(
        "product"
      );
    };

  const closeModal =
    () => {
      if (
        actionLoading ||
        stockActionId !== null ||
        archiveActionId !== null
      ) {
        return;
      }

      setModal(
        null
      );

      setEditingProduct(
        null
      );

      setStockProduct(
        null
      );

      setStockAmount(
        "1"
      );
    };

  /* ============================================================
     PRODUCT FORM
  ============================================================ */

  const handleProductFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setProductForm(
        (current) => ({
          ...current,
          [name]:
            value,
        })
      );
    };

  const handleSaveProduct =
    async (event) => {
      event.preventDefault();

      if (
        actionLoading
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        const payload =
          buildProductPayload(
            productForm
          );

        const editingId =
          editingProduct?.id ??
          null;

        setProductActionId(
          editingId
        );

        const savedProduct =
          editingProduct
            ? await vendorFetch(
                `/vendor/products/${editingProduct.id}`,
                {
                  method:
                    "PUT",
                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              )
            : await vendorFetch(
                "/vendor/products",
                {
                  method:
                    "POST",
                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );

        const normalized =
          normalizeProduct(
            savedProduct
          );

        if (
          !normalized
        ) {
          throw new Error(
            "Invalid product response received from the server."
          );
        }

        setProducts(
          (current) => {
            const index =
              current.findIndex(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    normalized.id
                  )
              );

            if (
              index === -1
            ) {
              return [
                normalized,
                ...current,
              ];
            }

            const next = [
              ...current,
            ];

            next[index] =
              normalized;

            return next;
          }
        );

        setModal(
          null
        );

        setEditingProduct(
          null
        );

        showToast(
          editingId
            ? "Product updated successfully."
            : "Product published successfully to the LUXORA marketplace."
        );

        /*
         * Refresh server state separately.
         * A successful product mutation must not be
         * reported as failed just because a later refresh
         * encounters an unrelated error.
         */
        try {
          await loadDashboard(
            false
          );
        } catch (
          refreshError
        ) {
          console.warn(
            "Post-save refresh failed:",
            refreshError
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Product save error:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Unable to save the product.",
          "error"
        );
      } finally {
        setProductActionId(
          null
        );

        setActionLoading(
          false
        );
      }
    };

  /* ============================================================
     DELETE / ARCHIVE PRODUCT
  ============================================================ */

  const handleDeleteProduct =
    async (product) => {
      if (
        !product
      ) {
        return;
      }

      if (
        archiveActionId !==
          null ||
        actionLoading
      ) {
        return;
      }

      const productId =
        Number(
          product.id
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        showToast(
          "Invalid product ID.",
          "error"
        );

        return;
      }

      if (
        !product.is_active
      ) {
        showToast(
          "This product is already archived.",
          "info"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Archive "${product.name}" from the live LUXORA marketplace?\n\nThe product will remain in your vendor dashboard as ARCHIVED, but customers will no longer be able to see or purchase it.`
        );

      if (!confirmed) {
        return;
      }

      try {
        /*
         * Lock only this product's archive operation.
         */
        setArchiveActionId(
          productId
        );

        setError("");

        console.log(
          "[LUXORA] Archiving vendor product:",
          productId
        );

        const result =
          await vendorFetch(
            `/vendor/products/${productId}`,
            {
              method:
                "DELETE",
            }
          );

        console.log(
          "[LUXORA] Archive API response:",
          result
        );

        /*
         * The backend DELETE endpoint is a SOFT DELETE.
         *
         * Expected response:
         * {
         *   success: true,
         *   product_id: <id>,
         *   ...
         * }
         */

        if (
          result &&
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "The server rejected the archive request."
          );
        }

        /*
         * IMPORTANT:
         *
         * Update the visible vendor product immediately.
         * Do not wait for another GET request.
         */
        setProducts(
          (current) =>
            current.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  productId
                )
                  ? {
                      ...item,
                      is_active:
                        false,
                    }
                  : item
            )
        );

        /*
         * Recalculate the visible dashboard figures immediately.
         */
        setDashboard(
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,

              active_products:
                Math.max(
                  0,
                  Number(
                    current.active_products ??
                      0
                  ) - 1
                ),

              out_of_stock:
                product.is_active &&
                Number(
                  product.stock ||
                    0
                ) <= 0
                  ? Math.max(
                      0,
                      Number(
                        current.out_of_stock ??
                          0
                      ) - 1
                    )
                  : Number(
                      current.out_of_stock ??
                        0
                    ),
            };
          }
        );

        /*
         * SUCCESS MUST BE SHOWN HERE.
         *
         * A successful DELETE request has already completed.
         */
        showToast(
          `"${product.name}" was archived successfully.`
        );

        /*
         * Refresh from server after the successful mutation.
         *
         * IMPORTANT:
         * A refresh failure must NOT undo the successful
         * local archive state.
         */
        try {
          await loadDashboard(
            false
          );
        } catch (
          refreshError
        ) {
          console.warn(
            "[LUXORA] Dashboard refresh after archive failed:",
            refreshError
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "[LUXORA] Archive product failed:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Unable to archive the product.",
          "error"
        );
      } finally {
        setArchiveActionId(
          null
        );
      }
    };

  /* ============================================================
     STOCK MODAL
  ============================================================ */

  const openStockModal =
    (product) => {
      if (
        !product
      ) {
        return;
      }

      if (
        stockActionId !==
        null
      ) {
        return;
      }

      if (
        !product.is_active
      ) {
        showToast(
          "Archived products cannot receive additional stock.",
          "error"
        );

        return;
      }

      setStockProduct(
        product
      );

      setStockAmount(
        "1"
      );

      setModal(
        "stock"
      );
    };

  /* ============================================================
     INCREASE STOCK
  ============================================================ */

  const handleIncreaseStock =
    async (event) => {
      event.preventDefault();

      if (
        !stockProduct ||
        stockActionId !==
          null
      ) {
        return;
      }

      const quantity =
        Number(
          stockAmount
        );

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        showToast(
          "Enter a whole stock quantity of at least 1.",
          "error"
        );

        return;
      }

      const productId =
        Number(
          stockProduct.id
        );

      try {
        setStockActionId(
          productId
        );

        setError("");

        const updatedProduct =
          await vendorFetch(
            `/vendor/products/${productId}/stock`,
            {
              method:
                "PUT",
              body:
                JSON.stringify({
                  quantity,
                }),
            }
          );

        const normalized =
          normalizeProduct(
            updatedProduct
          );

        if (
          !normalized
        ) {
          throw new Error(
            "Invalid product response received after stock update."
          );
        }

        /*
         * Replace with server-truth product.
         */
        setProducts(
          (current) =>
            current.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  normalized.id
                )
                  ? normalized
                  : item
            )
        );

        setDashboard(
          (current) =>
            current
              ? {
                  ...current,
                  out_of_stock:
                    normalized.is_active &&
                    Number(
                      normalized.stock ||
                        0
                    ) <= 0
                      ? Number(
                          current.out_of_stock ??
                            0
                        )
                      : stockProduct.is_active &&
                          Number(
                            stockProduct.stock ||
                              0
                          ) <= 0
                        ? Math.max(
                            0,
                            Number(
                              current.out_of_stock ??
                                0
                            ) - 1
                          )
                        : Number(
                            current.out_of_stock ??
                              0
                          ),
                }
              : current
        );

        setModal(
          null
        );

        setStockProduct(
          null
        );

        setStockAmount(
          "1"
        );

        showToast(
          `Stock increased by ${quantity}. New stock: ${normalized.stock}.`
        );

        try {
          await loadDashboard(
            false
          );
        } catch (
          refreshError
        ) {
          console.warn(
            "Post-stock refresh failed:",
            refreshError
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Increase stock error:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Unable to increase stock.",
          "error"
        );
      } finally {
        setStockActionId(
          null
        );
      }
    };

  /* ============================================================
     ORDER STATUS
  ============================================================ */

  const handleOrderStatusChange =
    async (
      orderId,
      newStatus
    ) => {
      if (
        statusActionId !==
          null ||
        actionLoading
      ) {
        return;
      }

      try {
        setStatusActionId(
          orderId
        );

        await vendorFetch(
          `/vendor/orders/${orderId}/status?new_status=${encodeURIComponent(
            newStatus
          )}`,
          {
            method:
              "PUT",
          }
        );

        setOrders(
          (current) =>
            current.map(
              (order) =>
                String(
                  order.order_id
                ) ===
                String(
                  orderId
                )
                  ? {
                      ...order,
                      order_status:
                        newStatus,
                    }
                  : order
            )
        );

        showToast(
          `Order #${orderId} updated to ${newStatus}.`
        );

        try {
          await loadDashboard(
            false
          );
        } catch (
          refreshError
        ) {
          console.warn(
            "Post-status refresh failed:",
            refreshError
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Order status update error:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Unable to update order status.",
          "error"
        );
      } finally {
        setStatusActionId(
          null
        );
      }
    };

  /* ============================================================
     PROFILE
  ============================================================ */

  const handleProfileChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setProfileForm(
        (current) => ({
          ...current,
          [name]:
            value,
        })
      );
    };

  const handleStartEditProfile =
    () => {
      setProfileForm({
        business_name:
          profile?.business_name ||
          "",
        business_description:
          profile?.business_description ||
          "",
        business_phone:
          profile?.business_phone ||
          "",
        business_address:
          profile?.business_address ||
          "",
        logo:
          profile?.logo ||
          "",
      });

      setIsEditingProfile(
        true
      );
    };

  const handleCancelEditProfile =
    () => {
      setProfileForm({
        business_name:
          profile?.business_name ||
          "",
        business_description:
          profile?.business_description ||
          "",
        business_phone:
          profile?.business_phone ||
          "",
        business_address:
          profile?.business_address ||
          "",
        logo:
          profile?.logo ||
          "",
      });

      setIsEditingProfile(
        false
      );
    };

  const handleSaveProfile =
    async (event) => {
      event.preventDefault();

      if (
        actionLoading
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        const payload = {
          business_name:
            profileForm.business_name.trim(),

          business_description:
            profileForm.business_description.trim() ||
            null,

          business_phone:
            profileForm.business_phone.trim(),

          business_address:
            profileForm.business_address.trim() ||
            null,

          logo:
            profileForm.logo.trim() ||
            null,
        };

        if (
          payload.business_name.length <
          2
        ) {
          throw new Error(
            "Business name must contain at least 2 characters."
          );
        }

        if (
          !/^\d{10,15}$/.test(
            payload.business_phone
          )
        ) {
          throw new Error(
            "Please enter a valid 10–15 digit business phone number."
          );
        }

        const updatedProfile =
          await vendorFetch(
            "/vendor/profile",
            {
              method:
                "PUT",
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        setProfile(
          updatedProfile
        );

        setProfileForm({
          business_name:
            updatedProfile?.business_name ||
            "",
          business_description:
            updatedProfile?.business_description ||
            "",
          business_phone:
            updatedProfile?.business_phone ||
            "",
          business_address:
            updatedProfile?.business_address ||
            "",
          logo:
            updatedProfile?.logo ||
            "",
        });

        setIsEditingProfile(
          false
        );

        showToast(
          "Business profile updated successfully."
        );
      } catch (
        requestError
      ) {
        console.error(
          "Profile update error:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Unable to update the business profile.",
          "error"
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* ============================================================
     REFRESH / LOGOUT
  ============================================================ */

  const handleRefresh =
    async () => {
      if (
        isLoading
      ) {
        return;
      }

      await loadDashboard(
        true
      );
    };

  const handleLogout =
    () => {
      logout();

      navigate(
        "/vendor/login",
        {
          replace: true,
        }
      );
    };

  const handleViewStore =
    () => {
      navigate(
        "/shop?vendor_store=1"
      );
    };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#111111]">

      {/* ======================================================
          TOAST
      ====================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            className={`fixed right-5 top-5 z-[100] flex max-w-md items-center gap-3 border px-4 py-3 text-xs shadow-2xl ${
              toast.type ===
              "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : toast.type ===
                    "info"
                  ? "border-black/10 bg-white text-neutral-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.type ===
            "error" ? (
              <X size={15} />
            ) : toast.type ===
                "info" ? (
              <Eye size={15} />
            ) : (
              <Check size={15} />
            )}

            <span>
              {
                toast.message
              }
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1500px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xl font-extrabold tracking-[-0.07em]"
            >
              LUXORA
            </Link>

            <span className="hidden h-5 w-px bg-black/10 sm:block" />

            <span className="mono hidden text-[8px] tracking-[0.18em] text-neutral-400 sm:block">
              BUSINESS PORTAL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={
                handleViewStore
              }
              className="hidden items-center gap-2 border border-black/10 px-4 py-2.5 text-[9px] font-semibold tracking-[0.14em] transition-colors hover:border-black hover:bg-black hover:text-white sm:flex"
            >
              <Eye size={13} />
              VIEW STORE
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-[9px] font-semibold tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black"
            >
              <LogOut size={13} />
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-74px)] max-w-[1500px] lg:grid-cols-[230px_1fr]">

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside className="border-b border-black/10 bg-white lg:border-b-0 lg:border-r">
          <div className="p-5 lg:sticky lg:top-[74px]">

            <div className="border border-black/10 bg-[#fafaf9] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-black text-white">
                  <Building2
                    size={17}
                    strokeWidth={1.5}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {
                      businessName
                    }
                  </p>

                  <p className="mono mt-1 text-[7px] tracking-[0.14em] text-neutral-400">
                    VERIFIED PARTNER
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {[
                {
                  key: "OVERVIEW",
                  label: "Overview",
                  icon: BarChart3,
                },
                {
                  key: "PRODUCTS",
                  label: "Products",
                  icon: Package,
                },
                {
                  key: "ORDERS",
                  label: "Orders",
                  icon: ShoppingBag,
                },
                {
                  key: "INVENTORY",
                  label: "Inventory",
                  icon: Box,
                },
                {
                  key: "PROFILE",
                  label: "Business Profile",
                  icon: User,
                },
              ].map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    activeTab ===
                    item.key;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          item.key
                        )
                      }
                      className={`flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        active
                          ? "bg-black text-white"
                          : "border border-black/10 bg-white text-neutral-500 hover:border-black hover:text-black"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          size={14}
                        />

                        <span className="mono text-[8px] tracking-[0.12em]">
                          {item.label.toUpperCase()}
                        </span>
                      </span>

                      {active && (
                        <ChevronRight
                          size={13}
                        />
                      )}
                    </button>
                  );
                }
              )}
            </nav>

            <div className="mt-8 border-t border-black/10 pt-5">
              <p className="mono text-[7px] leading-5 tracking-[0.13em] text-neutral-400">
                SELL WITH LUXORA
                <br />
                MANAGE YOUR CATALOG
                <br />
                SERVE YOUR CUSTOMERS
              </p>
            </div>
          </div>
        </aside>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="min-w-0 p-5 sm:p-7 lg:p-10">
          <div className="mx-auto max-w-[1180px]">

            <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-7 md:flex-row md:items-end">
              <div>
                <p className="mono text-[8px] tracking-[0.22em] text-neutral-400">
                  LUXORA BUSINESS
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] md:text-5xl">
                  {activeTab ===
                    "OVERVIEW" &&
                    "Business overview."}

                  {activeTab ===
                    "PRODUCTS" &&
                    "Your products."}

                  {activeTab ===
                    "ORDERS" &&
                    "Your orders."}

                  {activeTab ===
                    "INVENTORY" &&
                    "Inventory."}

                  {activeTab ===
                    "PROFILE" &&
                    "Business profile."}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                  {activeTab ===
                    "OVERVIEW" &&
                    "Manage your LUXORA marketplace business from one place."}

                  {activeTab ===
                    "PRODUCTS" &&
                    "Create, edit, publish and archive your marketplace products."}

                  {activeTab ===
                    "ORDERS" &&
                    "View customers, delivery information and fulfill your orders."}

                  {activeTab ===
                    "INVENTORY" &&
                    "Monitor stock and increase inventory whenever new stock arrives."}

                  {activeTab ===
                    "PROFILE" &&
                    "Manage your business identity and marketplace profile."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  isLoading
                }
                className="mono flex w-fit items-center gap-2 border border-black/10 bg-white px-4 py-3 text-[8px] tracking-[0.12em] transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={
                    isLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                REFRESH
              </button>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  className="mt-6 flex items-start justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setError("")
                    }
                    className="shrink-0 text-red-500 hover:text-red-800"
                    aria-label="Dismiss error"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeTab ===
              "OVERVIEW" && (
              <div className="mt-8">

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {stats.map(
                    (
                      stat
                    ) => {
                      const Icon =
                        stat.icon;

                      return (
                        <motion.div
                          key={
                            stat.label
                          }
                          initial={{
                            opacity: 0,
                            y: 12,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="border border-black/10 bg-white p-5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="mono text-[7px] tracking-[0.13em] text-neutral-400">
                              {
                                stat.label
                              }
                            </span>

                            <Icon
                              size={14}
                              className="text-neutral-300"
                            />
                          </div>

                          <p className="mt-6 text-2xl font-semibold tracking-[-0.05em]">
                            {
                              stat.value
                            }
                          </p>
                        </motion.div>
                      );
                    }
                  )}
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">

                  <section className="border border-black/10 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mono text-[8px] tracking-[0.16em] text-neutral-400">
                          CATALOG
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                          Manage products
                        </h2>
                      </div>

                      <Package
                        size={19}
                        className="text-neutral-300"
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-neutral-500">
                      Publish and manage
                      products in the
                      shared LUXORA
                      marketplace.
                      Changes are
                      reflected in the
                      customer store.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            "PRODUCTS"
                          )
                        }
                        className="group flex items-center gap-3 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white"
                      >
                        MANAGE PRODUCTS

                        <ChevronRight
                          size={13}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={
                          openCreateProduct
                        }
                        className="flex items-center gap-2 border border-black/10 px-5 py-3 text-[9px] font-semibold tracking-[0.14em] transition-colors hover:border-black"
                      >
                        <Plus size={13} />

                        ADD PRODUCT
                      </button>
                    </div>
                  </section>

                  <section className="border border-black/10 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mono text-[8px] tracking-[0.16em] text-neutral-400">
                          ORDERS
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                          Fulfil customer orders
                        </h2>
                      </div>

                      <ShoppingBag
                        size={19}
                        className="text-neutral-300"
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-neutral-500">
                      See who purchased
                      your products,
                      their delivery
                      information and
                      manage fulfillment.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "ORDERS"
                        )
                      }
                      className="group mt-6 flex items-center gap-3 border border-black/15 px-5 py-3 text-[9px] font-semibold tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
                    >
                      VIEW ORDERS

                      <ChevronRight
                        size={13}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                  </section>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <div className="border border-black/10 bg-white p-5">
                    <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                      LIVE PRODUCTS
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        activeProductCount
                      }
                    </p>

                    <p className="mt-1 text-[9px] text-neutral-400">
                      Published to marketplace
                    </p>
                  </div>

                  <div className="border border-black/10 bg-white p-5">
                    <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                      LOW / OUT OF STOCK
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        outOfStockCount
                      }
                    </p>

                    <p className="mt-1 text-[9px] text-neutral-400">
                      Review inventory regularly
                    </p>
                  </div>

                  <div className="border border-black/10 bg-white p-5">
                    <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                      ARCHIVED
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        archivedProductCount
                      }
                    </p>

                    <p className="mt-1 text-[9px] text-neutral-400">
                      Not visible to customers
                    </p>
                  </div>
                </div>

                <div className="mt-5 border border-black/10 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                        LAST SYNC
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {lastUpdated
                          ? lastUpdated.toLocaleString()
                          : "Not available"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 size={14} />

                      <span className="mono text-[7px] tracking-[0.12em]">
                        MARKETPLACE CONNECTED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {activeTab ===
              "PRODUCTS" && (
              <div className="mt-8">

                <div className="flex flex-col justify-between gap-4 border border-black/10 bg-white p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                      YOUR CATALOG
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      {
                        products.length
                      }{" "}
                      product
                      {products.length ===
                      1
                        ? ""
                        : "s"}{" "}
                      owned by your
                      business.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      openCreateProduct
                    }
                    className="flex items-center justify-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white transition hover:bg-neutral-800"
                  >
                    <Plus size={14} />

                    ADD PRODUCT
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {products.length ===
                  0 ? (
                    <div className="border border-dashed border-black/15 bg-white p-10 text-center">
                      <Package
                        size={30}
                        className="mx-auto text-neutral-300"
                      />

                      <p className="mt-4 text-sm font-medium">
                        No products
                        yet.
                      </p>

                      <p className="mt-2 text-xs leading-5 text-neutral-400">
                        Publish your
                        first product
                        to the LUXORA
                        marketplace.
                      </p>

                      <button
                        type="button"
                        onClick={
                          openCreateProduct
                        }
                        className="mt-5 inline-flex items-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white"
                      >
                        <Plus size={13} />

                        ADD YOUR FIRST
                        PRODUCT
                      </button>
                    </div>
                  ) : (
                    products.map(
                      (
                        product
                      ) => {
                        const isStockUpdating =
                          stockActionId ===
                          Number(
                            product.id
                          );

                        const isArchiving =
                          archiveActionId ===
                          Number(
                            product.id
                          );

                        return (
                          <motion.div
                            key={
                              product.id
                            }
                            layout
                            className="border border-black/10 bg-white p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                              <div className="h-24 w-24 shrink-0 overflow-hidden bg-[#fafaf9]">
                                {product.image ? (
                                  <img
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                                    <Package
                                      size={22}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="text-base font-medium">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <span
                                    className={`mono px-2 py-1 text-[7px] tracking-[0.1em] ${
                                      product.is_active
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-neutral-100 text-neutral-400"
                                    }`}
                                  >
                                    {product.is_active
                                      ? "ACTIVE"
                                      : "ARCHIVED"}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {product.brand
                                    ? `${product.brand} · `
                                    : ""}

                                  {
                                    product.category
                                  }

                                  {product.subcategory
                                    ? ` · ${product.subcategory}`
                                    : ""}
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                  {formatPrice(
                                    product.price
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-neutral-400">
                                  SKU:{" "}
                                  {product.sku ||
                                    "Not set"}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-2 lg:min-w-[300px]">

                                <div className="border border-black/10 px-3 py-3">
                                  <p className="mono text-[7px] text-neutral-400">
                                    STOCK
                                  </p>

                                  <p className="mt-1 text-lg font-semibold">
                                    {
                                      product.stock
                                    }
                                  </p>
                                </div>

                                <div className="border border-black/10 px-3 py-3">
                                  <p className="mono text-[7px] text-neutral-400">
                                    RATING
                                  </p>

                                  <p className="mt-1 text-lg font-semibold">
                                    {
                                      product.rating
                                    }
                                  </p>
                                </div>

                                <div className="border border-black/10 px-3 py-3">
                                  <p className="mono text-[7px] text-neutral-400">
                                    ID
                                  </p>

                                  <p className="mt-1 text-lg font-semibold">
                                    #
                                    {
                                      product.id
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 border-t border-black/10 pt-4">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditProduct(
                                    product
                                  )
                                }
                                disabled={
                                  actionLoading ||
                                  isStockUpdating ||
                                  isArchiving
                                }
                                className="flex items-center gap-2 border border-black/10 px-4 py-2.5 text-[8px] font-semibold tracking-[0.12em] transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit3
                                  size={13}
                                />

                                EDIT
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openStockModal(
                                    product
                                  )
                                }
                                disabled={
                                  !product.is_active ||
                                  actionLoading ||
                                  isStockUpdating ||
                                  isArchiving
                                }
                                className="flex items-center gap-2 border border-black/10 px-4 py-2.5 text-[8px] font-semibold tracking-[0.12em] transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isStockUpdating ? (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Plus
                                    size={13}
                                  />
                                )}

                                INCREASE STOCK
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product
                                  )
                                }
                                disabled={
                                  !product.is_active ||
                                  actionLoading ||
                                  isArchiving ||
                                  isStockUpdating
                                }
                                className="flex items-center gap-2 border border-red-200 px-4 py-2.5 text-[8px] font-semibold tracking-[0.12em] text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isArchiving ? (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={13}
                                  />
                                )}

                                DELETE / ARCHIVE
                              </button>

                            </div>
                          </motion.div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                ORDERS
            ================================================= */}

            {activeTab ===
              "ORDERS" && (
              <div className="mt-8 space-y-4">
                {orders.length ===
                0 ? (
                  <div className="border border-dashed border-black/15 bg-white p-12 text-center">
                    <ShoppingBag
                      size={30}
                      className="mx-auto text-neutral-300"
                    />

                    <p className="mt-4 text-sm font-medium">
                      No customer
                      orders yet.
                    </p>

                    <p className="mt-2 text-xs text-neutral-400">
                      Orders containing
                      your products
                      will appear
                      here.
                    </p>
                  </div>
                ) : (
                  orders.map(
                    (
                      order
                    ) => {
                      const expanded =
                        expandedOrders.has(
                          order.order_id
                        );

                      const changingStatus =
                        statusActionId ===
                        order.order_id;

                      return (
                        <motion.section
                          key={
                            order.order_id
                          }
                          layout
                          className="border border-black/10 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleOrderExpanded(
                                order.order_id
                              )
                            }
                            className="w-full p-5 text-left"
                          >
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                              <div>
                                <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                                  ORDER #
                                  {
                                    order.order_id
                                  }
                                </p>

                                <h2 className="mt-2 text-lg font-semibold">
                                  {
                                    order.customer_name
                                  }
                                </h2>

                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                                  <span>
                                    {
                                      order.customer_email
                                    }
                                  </span>

                                  <span>
                                    {
                                      order.customer_phone ||
                                      "Phone unavailable"
                                    }
                                  </span>

                                  <span>
                                    {order.created_at
                                      ? new Date(
                                          order.created_at
                                        ).toLocaleString()
                                      : "Date unavailable"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="mono bg-black px-3 py-2 text-[7px] tracking-[0.12em] text-white">
                                  {String(
                                    order.order_status ||
                                      ""
                                  ).toUpperCase()}
                                </span>

                                <ChevronRight
                                  size={15}
                                  className={`transition-transform ${
                                    expanded
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                animate={{
                                  height:
                                    "auto",
                                  opacity: 1,
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-black/10 p-5">

                                  <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

                                    <div>
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                                            CUSTOMER
                                            PRODUCTS
                                          </p>

                                          <p className="mt-1 text-xs text-neutral-500">
                                            {
                                              order.items?.length ||
                                              0
                                            }{" "}
                                            line item
                                            {order.items?.length ===
                                            1
                                              ? ""
                                              : "s"}
                                          </p>
                                        </div>

                                        <select
                                          value={
                                            order.order_status ||
                                            "confirmed"
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            handleOrderStatusChange(
                                              order.order_id,
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          onClick={(
                                            event
                                          ) =>
                                            event.stopPropagation()
                                          }
                                          disabled={
                                            changingStatus ||
                                            actionLoading
                                          }
                                          className="border border-black/10 bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-black disabled:opacity-50"
                                        >
                                          <option value="confirmed">
                                            CONFIRMED
                                          </option>

                                          <option value="processing">
                                            PROCESSING
                                          </option>

                                          <option value="shipped">
                                            SHIPPED
                                          </option>

                                          <option value="delivered">
                                            DELIVERED
                                          </option>
                                        </select>
                                      </div>

                                      <div className="mt-4 space-y-2">
                                        {order.items?.map(
                                          (
                                            item,
                                            index
                                          ) => (
                                            <div
                                              key={`${order.order_id}-${item.product_id}-${item.product_name}-${index}`}
                                              className="border border-black/10 bg-[#fafaf9] p-4"
                                            >
                                              <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                  <p className="text-sm font-medium">
                                                    {
                                                      item.product_name
                                                    }
                                                  </p>

                                                  <p className="mt-1 text-[10px] text-neutral-400">
                                                    Product
                                                    ID: #
                                                    {
                                                      item.product_id
                                                    }
                                                  </p>

                                                  <p className="mt-2 text-xs text-neutral-500">
                                                    Qty{" "}
                                                    {
                                                      item.quantity
                                                    }{" "}
                                                    ×{" "}
                                                    {formatPrice(
                                                      item.price
                                                    )}
                                                  </p>
                                                </div>

                                                <p className="shrink-0 text-sm font-semibold">
                                                  {formatPrice(
                                                    item.total
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">

                                      <div className="border border-black/10 p-4">
                                        <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                                          CUSTOMER
                                        </p>

                                        <div className="mt-3 space-y-2 text-xs leading-5 text-neutral-600">
                                          <p>
                                            <span className="text-neutral-400">
                                              NAME
                                            </span>
                                            <br />
                                            <strong>
                                              {
                                                order.customer_name
                                              }
                                            </strong>
                                          </p>

                                          <p>
                                            <span className="text-neutral-400">
                                              EMAIL
                                            </span>
                                            <br />
                                            <strong>
                                              {
                                                order.customer_email
                                              }
                                            </strong>
                                          </p>

                                          <p>
                                            <span className="text-neutral-400">
                                              PHONE
                                            </span>
                                            <br />
                                            <strong>
                                              {
                                                order.customer_phone ||
                                                "Not available"
                                              }
                                            </strong>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="border border-black/10 p-4">
                                        <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                                          DELIVERY
                                        </p>

                                        <div className="mt-3 space-y-2 text-xs leading-5 text-neutral-600">

                                          <p>
                                            <span className="text-neutral-400">
                                              DELIVERY NAME
                                            </span>
                                            <br />
                                            <strong>
                                              {
                                                order.delivery_name ||
                                                order.customer_name
                                              }
                                            </strong>
                                          </p>

                                          <p>
                                            <span className="text-neutral-400">
                                              DELIVERY PHONE
                                            </span>
                                            <br />
                                            <strong>
                                              {
                                                order.delivery_phone ||
                                                order.customer_phone ||
                                                "Not available"
                                              }
                                            </strong>
                                          </p>

                                          <p>
                                            <span className="text-neutral-400">
                                              ADDRESS
                                            </span>
                                            <br />

                                            <strong className="whitespace-pre-line">
                                              {
                                                order.delivery_address ||
                                                "Address not available"
                                              }
                                            </strong>
                                          </p>

                                          <p>
                                            <span className="text-neutral-400">
                                              LOCATION
                                            </span>
                                            <br />

                                            <strong>
                                              {order.delivery_city ||
                                                "—"}

                                              {order.delivery_state
                                                ? `, ${order.delivery_state}`
                                                : ""}

                                              {order.delivery_postal_code
                                                ? ` - ${order.delivery_postal_code}`
                                                : ""}
                                            </strong>
                                          </p>

                                          {order.delivery_country && (
                                            <p>
                                              <span className="text-neutral-400">
                                                COUNTRY
                                              </span>
                                              <br />

                                              <strong>
                                                {
                                                  order.delivery_country
                                                }
                                              </strong>
                                            </p>
                                          )}

                                        </div>
                                      </div>

                                      <div className="border border-black/10 bg-[#fafaf9] p-4">
                                        <p className="mono text-[8px] tracking-[0.15em] text-neutral-400">
                                          PAYMENT
                                        </p>

                                        <p className="mt-2 text-sm font-medium">
                                          {
                                            order.payment_method
                                          }
                                        </p>

                                        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
                                          <span className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                                            YOUR ORDER VALUE
                                          </span>

                                          <span className="font-semibold">
                                            {formatPrice(
                                              order.vendor_subtotal
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.section>
                      );
                    }
                  )
                )}
              </div>
            )}

            {/* =================================================
                INVENTORY
            ================================================= */}

            {activeTab ===
              "INVENTORY" && (
              <div className="mt-8 space-y-3">
                {products.length ===
                0 ? (
                  <div className="border border-dashed border-black/15 bg-white p-10 text-center">
                    <Box
                      size={28}
                      className="mx-auto text-neutral-300"
                    />

                    <p className="mt-4 text-sm font-medium">
                      No products in
                      inventory.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openCreateProduct
                      }
                      className="mt-5 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white"
                    >
                      ADD PRODUCT
                    </button>
                  </div>
                ) : (
                  products.map(
                    (
                      product
                    ) => {
                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      const inventoryStatus =
                        stock <=
                        0
                          ? "OUT OF STOCK"
                          : stock <=
                              5
                            ? "LOW STOCK"
                            : "IN STOCK";

                      const isStockUpdating =
                        stockActionId ===
                        Number(
                          product.id
                        );

                      const isArchiving =
                        archiveActionId ===
                        Number(
                          product.id
                        );

                      return (
                        <motion.div
                          key={
                            product.id
                          }
                          layout
                          className="border border-black/10 bg-white p-5"
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">

                                <p className="truncate text-sm font-semibold">
                                  {
                                    product.name
                                  }
                                </p>

                                {!product.is_active && (
                                  <span className="mono bg-neutral-100 px-2 py-1 text-[7px] tracking-[0.1em] text-neutral-400">
                                    ARCHIVED
                                  </span>
                                )}

                              </div>

                              <p className="mt-1 text-[10px] text-neutral-400">
                                Product #
                                {
                                  product.id
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">

                              <span
                                className={`mono px-3 py-2 text-[7px] tracking-[0.1em] ${
                                  stock <=
                                  0
                                    ? "bg-red-50 text-red-600"
                                    : stock <=
                                        5
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {
                                  inventoryStatus
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  openStockModal(
                                    product
                                  )
                                }
                                disabled={
                                  !product.is_active ||
                                  isStockUpdating ||
                                  isArchiving ||
                                  actionLoading
                                }
                                className="flex items-center gap-2 bg-black px-4 py-2.5 text-[8px] font-semibold tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isStockUpdating ? (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Plus
                                    size={13}
                                  />
                                )}

                                INCREASE STOCK
                              </button>

                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-3">

                            <div className="border border-black/10 p-4">
                              <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                                AVAILABLE STOCK
                              </p>

                              <p className="mt-2 text-3xl font-semibold">
                                {
                                  stock
                                }
                              </p>
                            </div>

                            <div className="border border-black/10 p-4">
                              <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                                PRICE
                              </p>

                              <p className="mt-2 text-lg font-semibold">
                                {formatPrice(
                                  product.price
                                )}
                              </p>
                            </div>

                            <div className="border border-black/10 p-4">
                              <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                                SKU
                              </p>

                              <p className="mt-2 text-sm font-semibold">
                                {
                                  product.sku ||
                                  "Not set"
                                }
                              </p>
                            </div>

                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditProduct(
                                  product
                                )
                              }
                              disabled={
                                actionLoading ||
                                isStockUpdating ||
                                isArchiving
                              }
                              className="flex items-center gap-2 border border-black/10 px-4 py-2.5 text-[8px] tracking-[0.1em] transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Edit3
                                size={12}
                              />

                              EDIT PRODUCT
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteProduct(
                                  product
                                )
                              }
                              disabled={
                                !product.is_active ||
                                actionLoading ||
                                isStockUpdating ||
                                isArchiving
                              }
                              className="flex items-center gap-2 border border-red-200 px-4 py-2.5 text-[8px] tracking-[0.1em] text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isArchiving ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={12}
                                />
                              )}

                              ARCHIVE
                            </button>

                          </div>
                        </motion.div>
                      );
                    }
                  )
                )}
              </div>
            )}

            {/* =================================================
                PROFILE
            ================================================= */}

            {activeTab ===
              "PROFILE" &&
              (!isEditingProfile ? (
                <section className="mt-8 max-w-3xl border border-black/10 bg-white p-6 sm:p-8">

                  <div className="flex flex-col gap-6 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      {profile?.logo ? (
                        <div className="h-16 w-16 overflow-hidden border border-black/10 bg-white p-1">
                          <img
                            src={
                              profile.logo
                            }
                            alt={`${businessName} logo`}
                            className="h-full w-full object-contain"
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center bg-black text-white">
                          <Building2
                            size={24}
                          />
                        </div>
                      )}

                      <div>
                        <h2 className="text-xl font-semibold">
                          {
                            businessName
                          }
                        </h2>

                        <p className="mt-1 text-xs text-neutral-400">
                          {
                            profile?.business_email ||
                            user?.email
                          }
                        </p>

                        <span className="mono mt-2 inline-block bg-emerald-50 px-2 py-0.5 text-[8px] font-semibold tracking-[0.12em] text-emerald-700">
                          {(
                            profile?.status ||
                            "ACTIVE"
                          ).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleStartEditProfile
                      }
                      className="flex items-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white transition hover:bg-neutral-800"
                    >
                      <Edit3 size={13} />
                      EDIT BUSINESS PROFILE
                    </button>

                  </div>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">

                    <div className="border border-black/10 bg-[#fafaf9] p-4">
                      <p className="mono text-[8px] tracking-[0.14em] text-neutral-400">
                        BUSINESS PHONE
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {
                          profile?.business_phone ||
                          "Not set"
                        }
                      </p>
                    </div>

                    <div className="border border-black/10 bg-[#fafaf9] p-4">
                      <p className="mono text-[8px] tracking-[0.14em] text-neutral-400">
                        VENDOR STATUS
                      </p>

                      <p className="mt-2 text-sm font-medium capitalize">
                        {
                          profile?.status ||
                          "Active"
                        }
                      </p>
                    </div>

                    <div className="border border-black/10 bg-[#fafaf9] p-4 sm:col-span-2">
                      <p className="mono text-[8px] tracking-[0.14em] text-neutral-400">
                        BUSINESS ADDRESS
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                        {
                          profile?.business_address ||
                          "Not set"
                        }
                      </p>
                    </div>

                    <div className="border border-black/10 bg-[#fafaf9] p-4 sm:col-span-2">
                      <p className="mono text-[8px] tracking-[0.14em] text-neutral-400">
                        BUSINESS DESCRIPTION
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                        {
                          profile?.business_description ||
                          "No description provided."
                        }
                      </p>
                    </div>

                    {profile?.created_at && (
                      <div className="border border-black/10 bg-[#fafaf9] p-4 sm:col-span-2">
                        <p className="mono text-[8px] tracking-[0.14em] text-neutral-400">
                          ACCOUNT CREATED
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          {new Date(
                            profile.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              year:
                                "numeric",
                              month:
                                "long",
                              day:
                                "numeric",
                            }
                          )}
                        </p>
                      </div>
                    )}

                  </div>
                </section>
              ) : (
                <form
                  onSubmit={
                    handleSaveProfile
                  }
                  className="mt-8 max-w-3xl"
                >

                  <section className="border border-black/10 bg-white p-6 sm:p-8">

                    <div className="flex items-center justify-between border-b border-black/10 pb-5">

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center bg-black text-white">
                          <Building2
                            size={19}
                          />
                        </div>

                        <div>

                          <p className="text-lg font-semibold">
                            {
                              businessName
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-400">
                            {
                              profile?.business_email
                            }
                          </p>

                        </div>
                      </div>

                      <span className="mono bg-amber-50 px-2.5 py-1 text-[8px] font-semibold tracking-[0.12em] text-amber-700">
                        EDITING MODE
                      </span>

                    </div>

                    <div className="mt-6 space-y-6">

                      <div>
                        <label
                          htmlFor="business_name"
                          className="mono mb-2 block text-[8px] tracking-[0.14em] text-neutral-400"
                        >
                          BUSINESS NAME
                        </label>

                        <input
                          id="business_name"
                          name="business_name"
                          value={
                            profileForm.business_name
                          }
                          onChange={
                            handleProfileChange
                          }
                          disabled={
                            actionLoading
                          }
                          className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="business_description"
                          className="mono mb-2 block text-[8px] tracking-[0.14em] text-neutral-400"
                        >
                          BUSINESS DESCRIPTION
                        </label>

                        <textarea
                          id="business_description"
                          name="business_description"
                          rows={5}
                          value={
                            profileForm.business_description
                          }
                          onChange={
                            handleProfileChange
                          }
                          disabled={
                            actionLoading
                          }
                          className="w-full resize-none border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="business_phone"
                          className="mono mb-2 block text-[8px] tracking-[0.14em] text-neutral-400"
                        >
                          BUSINESS PHONE
                        </label>

                        <input
                          id="business_phone"
                          name="business_phone"
                          value={
                            profileForm.business_phone
                          }
                          onChange={
                            handleProfileChange
                          }
                          disabled={
                            actionLoading
                          }
                          inputMode="numeric"
                          className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="business_address"
                          className="mono mb-2 block text-[8px] tracking-[0.14em] text-neutral-400"
                        >
                          BUSINESS ADDRESS
                        </label>

                        <textarea
                          id="business_address"
                          name="business_address"
                          rows={4}
                          value={
                            profileForm.business_address
                          }
                          onChange={
                            handleProfileChange
                          }
                          disabled={
                            actionLoading
                          }
                          className="w-full resize-none border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="logo"
                          className="mono mb-2 block text-[8px] tracking-[0.14em] text-neutral-400"
                        >
                          BUSINESS LOGO URL
                        </label>

                        <input
                          id="logo"
                          name="logo"
                          type="url"
                          value={
                            profileForm.logo
                          }
                          onChange={
                            handleProfileChange
                          }
                          placeholder="https://..."
                          disabled={
                            actionLoading
                          }
                          className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>

                      {profileForm.logo && (
                        <div className="border border-black/10 bg-[#fafaf9] p-4">

                          <p className="mono text-[7px] tracking-[0.12em] text-neutral-400">
                            LOGO PREVIEW
                          </p>

                          <div className="mt-3 flex h-24 w-24 items-center justify-center overflow-hidden border border-black/10 bg-white">
                            <img
                              src={
                                profileForm.logo
                              }
                              alt={`${businessName} logo`}
                              className="h-full w-full object-contain"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          </div>

                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">

                        <button
                          type="submit"
                          disabled={
                            actionLoading
                          }
                          className="flex items-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Save size={13} />
                          )}

                          SAVE BUSINESS PROFILE
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleCancelEditProfile
                          }
                          disabled={
                            actionLoading
                          }
                          className="border border-black/10 px-5 py-3 text-[9px] font-semibold tracking-[0.14em] text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-50"
                        >
                          CANCEL
                        </button>

                      </div>
                    </div>
                  </section>
                </form>
              ))}
          </div>
        </main>
      </div>

      {/* ======================================================
          PRODUCT MODAL
      ====================================================== */}

      <AnimatePresence>
        {modal ===
          "product" && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 25,
              }}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white"
            >

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-6 py-5">

                <div>
                  <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                    {editingProduct
                      ? "EDIT PRODUCT"
                      : "NEW PRODUCT"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                    {editingProduct
                      ? "Update product."
                      : "Add a product."}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    actionLoading
                  }
                  className="flex h-9 w-9 items-center justify-center border border-black/10 text-neutral-400 hover:border-black hover:text-black disabled:opacity-50"
                  aria-label="Close product form"
                >
                  <X size={15} />
                </button>
              </div>

              <form
                onSubmit={
                  handleSaveProduct
                }
                className="space-y-5 p-6"
              >

                <div className="grid gap-5 sm:grid-cols-2">

                  {[
                    {
                      id: "product-name",
                      name: "name",
                      label: "PRODUCT NAME",
                      placeholder:
                        "Premium Running Shoes",
                      required: true,
                    },
                    {
                      id: "product-brand",
                      name: "brand",
                      label: "BRAND",
                      placeholder:
                        "Nike",
                    },
                    {
                      id: "product-category",
                      name: "category",
                      label: "CATEGORY",
                      placeholder:
                        "Footwear",
                      required: true,
                    },
                    {
                      id: "product-subcategory",
                      name: "subcategory",
                      label: "SUBCATEGORY",
                      placeholder:
                        "Running",
                    },
                  ].map(
                    (field) => (
                      <div
                        key={
                          field.id
                        }
                      >
                        <label
                          htmlFor={
                            field.id
                          }
                          className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                        >
                          {
                            field.label
                          }
                        </label>

                        <input
                          id={
                            field.id
                          }
                          name={
                            field.name
                          }
                          value={
                            productForm[
                              field.name
                            ]
                          }
                          onChange={
                            handleProductFormChange
                          }
                          placeholder={
                            field.placeholder
                          }
                          required={
                            field.required
                          }
                          disabled={
                            actionLoading
                          }
                          className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                        />
                      </div>
                    )
                  )}

                  <div>
                    <label
                      htmlFor="product-price"
                      className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                    >
                      PRICE
                    </label>

                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        productForm.price
                      }
                      onChange={
                        handleProductFormChange
                      }
                      required
                      disabled={
                        actionLoading
                      }
                      className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-original-price"
                      className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                    >
                      ORIGINAL PRICE
                    </label>

                    <input
                      id="product-original-price"
                      name="original_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        productForm.original_price
                      }
                      onChange={
                        handleProductFormChange
                      }
                      disabled={
                        actionLoading
                      }
                      className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-stock"
                      className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                    >
                      INITIAL STOCK
                    </label>

                    <input
                      id="product-stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        productForm.stock
                      }
                      onChange={
                        handleProductFormChange
                      }
                      disabled={
                        actionLoading
                      }
                      className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-sku"
                      className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                    >
                      SKU
                    </label>

                    <input
                      id="product-sku"
                      name="sku"
                      value={
                        productForm.sku
                      }
                      onChange={
                        handleProductFormChange
                      }
                      placeholder="LUX-NIKE-001"
                      disabled={
                        actionLoading
                      }
                      className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="product-image"
                    className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                  >
                    PRIMARY IMAGE URL
                  </label>

                  <input
                    id="product-image"
                    name="image"
                    type="url"
                    value={
                      productForm.image
                    }
                    onChange={
                      handleProductFormChange
                    }
                    placeholder="https://..."
                    required
                    disabled={
                      actionLoading
                    }
                    className="w-full border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-images"
                    className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                  >
                    ADDITIONAL IMAGE URLS
                  </label>

                  <textarea
                    id="product-images"
                    name="images"
                    rows={4}
                    value={
                      productForm.images
                    }
                    onChange={
                      handleProductFormChange
                    }
                    placeholder="One URL per line"
                    disabled={
                      actionLoading
                    }
                    className="w-full resize-none border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-description"
                    className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                  >
                    DESCRIPTION
                  </label>

                  <textarea
                    id="product-description"
                    name="description"
                    rows={5}
                    value={
                      productForm.description
                    }
                    onChange={
                      handleProductFormChange
                    }
                    placeholder="Describe the product..."
                    disabled={
                      actionLoading
                    }
                    className="w-full resize-none border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-specifications"
                    className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                  >
                    SPECIFICATIONS JSON
                  </label>

                  <textarea
                    id="product-specifications"
                    name="specifications"
                    rows={6}
                    value={
                      productForm.specifications
                    }
                    onChange={
                      handleProductFormChange
                    }
                    placeholder={`{"Material":"Mesh","Color":"Black","Weight":"280g"}`}
                    disabled={
                      actionLoading
                    }
                    className="w-full resize-none border border-black/10 bg-[#fafaf9] px-4 py-3 font-mono text-xs outline-none focus:border-black disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-black/10 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      actionLoading
                    }
                    className="border border-black/10 px-5 py-3 text-[9px] font-semibold tracking-[0.13em] disabled:opacity-50"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoading
                    }
                    className="flex items-center justify-center gap-2 bg-black px-5 py-3 text-[9px] font-semibold tracking-[0.13em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : editingProduct ? (
                      <Save size={13} />
                    ) : (
                      <Plus size={13} />
                    )}

                    {editingProduct
                      ? "SAVE CHANGES"
                      : "PUBLISH PRODUCT"}
                  </button>

                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* ====================================================
            STOCK MODAL
        ==================================================== */}

        {modal ===
          "stock" &&
          stockProduct && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            >
              <motion.form
                onSubmit={
                  handleIncreaseStock
                }
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                }}
                className="w-full max-w-md bg-white p-6"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="mono text-[8px] tracking-[0.18em] text-neutral-400">
                      INVENTORY UPDATE
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                      Increase stock.
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      {
                        stockProduct.name
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      stockActionId !==
                      null
                    }
                    className="flex h-9 w-9 items-center justify-center border border-black/10 disabled:opacity-50"
                    aria-label="Close inventory form"
                  >
                    <X size={15} />
                  </button>

                </div>

                <div className="mt-6 border border-black/10 bg-[#fafaf9] p-4">

                  <p className="mono text-[8px] tracking-[0.13em] text-neutral-400">
                    CURRENT STOCK
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {
                      stockProduct.stock
                    }
                  </p>

                </div>

                <div className="mt-5">

                  <label
                    htmlFor="stock-amount"
                    className="mono mb-2 block text-[8px] tracking-[0.13em] text-neutral-400"
                  >
                    STOCK TO ADD
                  </label>

                  <input
                    id="stock-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      stockAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setStockAmount(
                        event.target.value
                      )
                    }
                    disabled={
                      stockActionId !==
                      null
                    }
                    className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-60"
                  />

                  <p className="mt-2 text-[9px] text-neutral-400">
                    New total stock:{" "}
                    <strong>
                      {Number(
                        stockProduct.stock ||
                          0
                      ) +
                        Math.max(
                          0,
                          Math.floor(
                            Number(
                              stockAmount
                            ) || 0
                          )
                        )}
                    </strong>
                  </p>

                </div>

                <div className="mt-6 flex gap-2">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      stockActionId !==
                      null
                    }
                    className="flex-1 border border-black/10 px-4 py-3 text-[9px] font-semibold tracking-[0.13em] disabled:opacity-50"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={
                      stockActionId !==
                      null
                    }
                    className="flex flex-1 items-center justify-center gap-2 bg-black px-4 py-3 text-[9px] font-semibold tracking-[0.13em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {stockActionId !==
                    null ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus size={13} />
                    )}

                    ADD STOCK
                  </button>

                </div>
              </motion.form>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

export default VendorDashboard;
