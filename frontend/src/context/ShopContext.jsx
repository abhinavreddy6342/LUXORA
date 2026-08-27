/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ShopContext = createContext(null);

const CART_STORAGE_KEY = "luxora-cart";
const WISHLIST_STORAGE_KEY = "luxora-wishlist";
const RECENT_SEARCHES_STORAGE_KEY = "luxora_recent_searches";
const RECENTLY_VIEWED_STORAGE_KEY = "luxora_recently_viewed";
const REVIEWS_STORAGE_KEY = "luxora_reviews";
const ADDRESSES_STORAGE_KEY = "luxora_addresses";
const COUPON_STORAGE_KEY = "luxora_coupon";

export function ShopProvider({ children }) {
  /* =====================================================
     CART
  ===================================================== */

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!savedCart) return [];

      const parsedCart = JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) return [];

      return parsedCart
        .filter(
          (item) =>
            item &&
            item.id !== undefined &&
            item.id !== null
        )
        .map((item) => ({
          ...item,
          id: item.id,
          price: Math.max(0, Number(item.price) || 0),
          quantity: Math.max(
            1,
            Math.floor(Number(item.quantity) || 1)
          ),
        }));
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  /* =====================================================
     WISHLIST
  ===================================================== */

  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem(
        WISHLIST_STORAGE_KEY
      );

      if (!savedWishlist) return [];

      const parsed = JSON.parse(savedWishlist);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item) =>
          item &&
          item.id !== undefined &&
          item.id !== null
      );
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      return [];
    }
  });

  /* =====================================================
     RECENT SEARCHES
  ===================================================== */

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(
        RECENT_SEARCHES_STORAGE_KEY
      );

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                typeof item === "string" &&
                item.trim()
            )
            .slice(0, 5)
        : [];
    } catch (error) {
      console.error(
        "Failed to load recent searches:",
        error
      );
      return [];
    }
  });

  /* =====================================================
     RECENTLY VIEWED
  ===================================================== */

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem(
        RECENTLY_VIEWED_STORAGE_KEY
      );

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (id) =>
            id !== undefined &&
            id !== null
        )
        .map((id) => String(id))
        .slice(0, 6);
    } catch (error) {
      console.error(
        "Failed to load recently viewed:",
        error
      );
      return [];
    }
  });

  /* =====================================================
     REVIEWS
  ===================================================== */

  const [customReviews, setCustomReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(
        REVIEWS_STORAGE_KEY
      );

      if (!saved) return {};

      const parsed = JSON.parse(saved);

      return parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (error) {
      console.error("Failed to load reviews:", error);
      return {};
    }
  });

  /* =====================================================
     ADDRESSES
  ===================================================== */

  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem(
        ADDRESSES_STORAGE_KEY
      );

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (address) =>
          address &&
          address.id !== undefined &&
          address.id !== null
      );
    } catch (error) {
      console.error("Failed to load addresses:", error);
      return [];
    }
  });

  /* =====================================================
     SEARCH / QUICK VIEW
  ===================================================== */

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [quickViewProduct, setQuickViewProduct] =
    useState(null);

  /* =====================================================
     COUPON
  ===================================================== */

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem(
        COUPON_STORAGE_KEY
      );

      if (!saved) return null;

      const parsed = JSON.parse(saved);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.code
      ) {
        return null;
      }

      const discountPercent = Number(
        parsed.discountPercent
      );

      if (
        !Number.isFinite(discountPercent) ||
        discountPercent <= 0
      ) {
        return null;
      }

      return {
        code: String(parsed.code).toUpperCase(),
        discountPercent,
      };
    } catch (error) {
      console.error("Failed to load coupon:", error);
      return null;
    }
  });

  /* =====================================================
     TOASTS
  ===================================================== */

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ]);

      window.setTimeout(() => {
        setToasts((current) =>
          current.filter(
            (toast) => toast.id !== id
          )
        );
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter(
        (toast) => toast.id !== id
      )
    );
  }, []);

  /* =====================================================
     CART ACTIONS
  ===================================================== */

  const addToCart = useCallback(
    (product, showToastNotice = true) => {
      if (
        !product ||
        product.id === undefined ||
        product.id === null
      ) {
        return;
      }

      const productId = String(product.id);

      setCart((currentCart) => {
        const existingProduct = currentCart.find(
          (item) =>
            String(item.id) === productId
        );

        if (existingProduct) {
          return currentCart.map((item) =>
            String(item.id) === productId
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 0) + 1,
                }
              : item
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            id: product.id,
            price: Math.max(
              0,
              Number(product.price) || 0
            ),
            quantity: 1,
          },
        ];
      });

      if (showToastNotice) {
        addToast(
          `Added "${product.name}" to cart`,
          "success"
        );
      }
    },
    [addToast]
  );

  const removeFromCart = useCallback(
    (productId) => {
      const id = String(productId);

      setCart((currentCart) => {
        const item = currentCart.find(
          (cartItem) =>
            String(cartItem.id) === id
        );

        if (item) {
          addToast(
            `Removed "${item.name}" from cart`,
            "info"
          );
        }

        return currentCart.filter(
          (cartItem) =>
            String(cartItem.id) !== id
        );
      });
    },
    [addToast]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => {
      const newQuantity = Math.floor(
        Number(quantity)
      );

      if (
        !Number.isFinite(newQuantity) ||
        newQuantity <= 0
      ) {
        removeFromCart(productId);
        return;
      }

      const id = String(productId);

      setCart((currentCart) =>
        currentCart.map((item) =>
          String(item.id) === id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const increaseQuantity = useCallback(
    (productId) => {
      const id = String(productId);

      setCart((currentCart) =>
        currentCart.map((item) =>
          String(item.id) === id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        )
      );
    },
    []
  );

  const decreaseQuantity = useCallback(
    (productId) => {
      const id = String(productId);

      setCart((currentCart) =>
        currentCart
          .map((item) =>
            String(item.id) === id
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 0) - 1,
                }
              : item
          )
          .filter(
            (item) =>
              Number(item.quantity) > 0
          )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  /* =====================================================
     WISHLIST ACTIONS
  ===================================================== */

  const toggleWishlist = useCallback(
    (product) => {
      if (
        !product ||
        product.id === undefined ||
        product.id === null
      ) {
        return;
      }

      const productId = String(product.id);

      setWishlist((currentWishlist) => {
        const exists = currentWishlist.some(
          (item) =>
            String(item.id) === productId
        );

        if (exists) {
          addToast(
            `Removed "${product.name}" from wishlist`,
            "info"
          );

          return currentWishlist.filter(
            (item) =>
              String(item.id) !== productId
          );
        }

        addToast(
          `Saved "${product.name}" to wishlist`,
          "success"
        );

        return [
          ...currentWishlist,
          product,
        ];
      });
    },
    [addToast]
  );

  const isInWishlist = useCallback(
    (productId) => {
      const id = String(productId);

      return wishlist.some(
        (item) =>
          String(item.id) === id
      );
    },
    [wishlist]
  );

  /* =====================================================
     SEARCH
  ===================================================== */

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const addRecentSearch = useCallback((term) => {
    const clean = String(term || "").trim();

    if (!clean) return;

    setRecentSearches((previous) => {
      const filtered = previous.filter(
        (item) =>
          String(item).toLowerCase() !==
          clean.toLowerCase()
      );

      return [
        clean,
        ...filtered,
      ].slice(0, 5);
    });
  }, []);

  const removeRecentSearch = useCallback((term) => {
    const target = String(term || "").trim();

    setRecentSearches((previous) =>
      previous.filter(
        (item) =>
          String(item).toLowerCase() !==
          target.toLowerCase()
      )
    );
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  /* =====================================================
     QUICK VIEW
  ===================================================== */

  const openQuickView = useCallback((product) => {
    if (!product) return;

    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  /* =====================================================
     RECENTLY VIEWED
  ===================================================== */

  const addRecentlyViewed = useCallback(
    (productId) => {
      if (
        productId === undefined ||
        productId === null
      ) {
        return;
      }

      const idString = String(productId);

      setRecentlyViewed((previous) => {
        const filtered = previous.filter(
          (id) =>
            String(id) !== idString
        );

        return [
          idString,
          ...filtered,
        ].slice(0, 6);
      });
    },
    []
  );

  /* =====================================================
     REVIEWS
  ===================================================== */

  const addReview = useCallback(
    (productId, reviewData = {}) => {
      if (
        productId === undefined ||
        productId === null
      ) {
        return;
      }

      const idStr = String(productId);

      const rating = Math.min(
        5,
        Math.max(
          1,
          Math.round(
            Number(reviewData.rating) || 1
          )
        )
      );

      const newReview = {
        id: `rev-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        name: String(
          reviewData.name || ""
        ).trim(),
        rating,
        title: String(
          reviewData.title || ""
        ).trim(),
        comment: String(
          reviewData.comment || ""
        ).trim(),
        date: new Date()
          .toISOString()
          .split("T")[0],
        verified: true,
      };

      setCustomReviews((previous) => {
        const existing = Array.isArray(
          previous[idStr]
        )
          ? previous[idStr]
          : [];

        return {
          ...previous,
          [idStr]: [
            newReview,
            ...existing,
          ],
        };
      });

      addToast(
        "Thank you! Your review has been published.",
        "success"
      );
    },
    [addToast]
  );

  /* =====================================================
     COUPONS
  ===================================================== */

  const applyCoupon = useCallback(
    (codeStr) => {
      const clean = String(
        codeStr || ""
      )
        .trim()
        .toUpperCase();

      if (!clean) {
        addToast(
          "Please enter a coupon code",
          "error"
        );

        return {
          success: false,
          message: "Please enter a coupon code",
        };
      }

      const coupons = {
        LUXORA10: 10,
        WELCOME15: 15,
      };

      const discountPercent =
        coupons[clean];

      if (discountPercent) {
        const coupon = {
          code: clean,
          discountPercent,
        };

        setAppliedCoupon(coupon);

        addToast(
          `Coupon ${clean} applied (${discountPercent}% OFF)`,
          "success"
        );

        return {
          success: true,
          message: `${discountPercent}% discount applied!`,
          coupon,
        };
      }

      addToast(
        "Invalid coupon code",
        "error"
      );

      return {
        success: false,
        message: "Invalid coupon code",
      };
    },
    [addToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);

    addToast(
      "Coupon removed",
      "info"
    );
  }, [addToast]);

  /* =====================================================
     ADDRESSES
  ===================================================== */

  const addAddress = useCallback(
    (addressObj = {}) => {
      setAddresses((previous) => {
        const shouldBeDefault =
          Boolean(addressObj.isDefault) ||
          previous.length === 0;

        const newAddress = {
          id: `addr_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          ...addressObj,
          isDefault: shouldBeDefault,
        };

        const updated = shouldBeDefault
          ? previous.map((address) => ({
              ...address,
              isDefault: false,
            }))
          : previous;

        return [
          newAddress,
          ...updated,
        ];
      });

      addToast(
        "Address saved successfully",
        "success"
      );
    },
    [addToast]
  );

  const updateAddress = useCallback(
    (id, addressObj = {}) => {
      setAddresses((previous) => {
        const shouldBeDefault =
          Boolean(addressObj.isDefault);

        return previous.map((address) => {
          if (
            String(address.id) ===
            String(id)
          ) {
            return {
              ...address,
              ...addressObj,
              id: address.id,
              isDefault:
                shouldBeDefault
                  ? true
                  : Boolean(address.isDefault),
            };
          }

          if (shouldBeDefault) {
            return {
              ...address,
              isDefault: false,
            };
          }

          return address;
        });
      });

      addToast(
        "Address updated",
        "success"
      );
    },
    [addToast]
  );

  const deleteAddress = useCallback(
    (id) => {
      setAddresses((previous) => {
        const deleted = previous.find(
          (address) =>
            String(address.id) ===
            String(id)
        );

        const remaining = previous.filter(
          (address) =>
            String(address.id) !==
            String(id)
        );

        if (
          deleted?.isDefault &&
          remaining.length > 0
        ) {
          remaining[0] = {
            ...remaining[0],
            isDefault: true,
          };
        }

        return remaining;
      });

      addToast(
        "Address removed",
        "info"
      );
    },
    [addToast]
  );

  const setDefaultAddress = useCallback(
    (id) => {
      setAddresses((previous) =>
        previous.map((address) => ({
          ...address,
          isDefault:
            String(address.id) ===
            String(id),
        }))
      );

      addToast(
        "Default address updated",
        "success"
      );
    },
    [addToast]
  );

  /* =====================================================
     PERSISTENCE
  ===================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error(
        "Failed to save wishlist:",
        error
      );
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(recentSearches)
      );
    } catch (error) {
      console.error(
        "Failed to save recent searches:",
        error
      );
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENTLY_VIEWED_STORAGE_KEY,
        JSON.stringify(recentlyViewed)
      );
    } catch (error) {
      console.error(
        "Failed to save recently viewed:",
        error
      );
    }
  }, [recentlyViewed]);

  useEffect(() => {
    try {
      localStorage.setItem(
        REVIEWS_STORAGE_KEY,
        JSON.stringify(customReviews)
      );
    } catch (error) {
      console.error(
        "Failed to save reviews:",
        error
      );
    }
  }, [customReviews]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ADDRESSES_STORAGE_KEY,
        JSON.stringify(addresses)
      );
    } catch (error) {
      console.error(
        "Failed to save addresses:",
        error
      );
    }
  }, [addresses]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(
          COUPON_STORAGE_KEY,
          JSON.stringify(appliedCoupon)
        );
      } else {
        localStorage.removeItem(
          COUPON_STORAGE_KEY
        );
      }
    } catch (error) {
      console.error(
        "Failed to save coupon:",
        error
      );
    }
  }, [appliedCoupon]);

  /* =====================================================
     CALCULATED VALUES
  ===================================================== */

  const wishlistCount = wishlist.length;

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const couponDiscount = useMemo(() => {
    if (
      !appliedCoupon ||
      cartSubtotal <= 0
    ) {
      return 0;
    }

    const percent = Math.min(
      100,
      Math.max(
        0,
        Number(
          appliedCoupon.discountPercent || 0
        )
      )
    );

    return Math.round(
      (cartSubtotal * percent) / 100
    );
  }, [
    appliedCoupon,
    cartSubtotal,
  ]);

  const deliveryCharge = useMemo(() => {
    if (cart.length === 0) {
      return 0;
    }

    const effectiveSubtotal = Math.max(
      0,
      cartSubtotal - couponDiscount
    );

    return effectiveSubtotal >= 999
      ? 0
      : 79;
  }, [
    cart.length,
    cartSubtotal,
    couponDiscount,
  ]);

  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        cartSubtotal -
          couponDiscount +
          deliveryCharge
      ),
    [
      cartSubtotal,
      couponDiscount,
      deliveryCharge,
    ]
  );

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = useMemo(
    () => ({
      /* Cart */
      cart,
      cartCount,
      cartSubtotal,
      couponDiscount,
      appliedCoupon,
      deliveryCharge,
      cartTotal,

      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,

      /* Wishlist */
      wishlist,
      wishlistCount,
      toggleWishlist,
      isInWishlist,

      /* Search */
      isSearchOpen,
      openSearch,
      closeSearch,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,

      /* Quick View */
      quickViewProduct,
      openQuickView,
      closeQuickView,

      /* Recently Viewed */
      recentlyViewed,
      addRecentlyViewed,

      /* Reviews */
      customReviews,
      addReview,

      /* Coupons */
      applyCoupon,
      removeCoupon,

      /* Addresses */
      addresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,

      /* Toasts */
      toasts,
      addToast,
      removeToast,
    }),
    [
      cart,
      cartCount,
      cartSubtotal,
      couponDiscount,
      appliedCoupon,
      deliveryCharge,
      cartTotal,

      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,

      wishlist,
      wishlistCount,
      toggleWishlist,
      isInWishlist,

      isSearchOpen,
      openSearch,
      closeSearch,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,

      quickViewProduct,
      openQuickView,
      closeQuickView,

      recentlyViewed,
      addRecentlyViewed,

      customReviews,
      addReview,

      applyCoupon,
      removeCoupon,

      addresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,

      toasts,
      addToast,
      removeToast,
    ]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error(
      "useShop must be used inside ShopProvider"
    );
  }

  return context;
}