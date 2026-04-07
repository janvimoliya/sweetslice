import { useState, useEffect, useCallback } from "react";
import { WishlistContext } from "./WishlistContextDefinition";

export function WishlistProvider({ children }) {
  const apiBaseUrl = "http://localhost:5000";
  const getUserId = () => localStorage.getItem("userId");
  const getWishlistStorageKey = (userId) => (userId ? `wishlist_${userId}` : "wishlist_guest");
  const readLocalWishlist = (userId) => {
    try {
      const savedWishlist = localStorage.getItem(getWishlistStorageKey(userId));
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  };
  const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
  const getProductId = useCallback(
    (product) => product?._id || product?.productId || product?.id,
    []
  );
  const normalizeId = useCallback((value) => String(value ?? "").trim(), []);

  const mapServerWishlistItems = useCallback(
    (serverItems = []) =>
      serverItems.map((item) => ({
        id: normalizeId(item.productId?._id || item.productId || item.id),
        productId: normalizeId(item.productId?._id || item.productId || item.id),
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        rating: item.rating,
        image: item.image,
      })),
    [normalizeId]
  );

  const [currentUserId, setCurrentUserId] = useState(() => getUserId());
  const [wishlist, setWishlist] = useState(() => readLocalWishlist(getUserId()));

  useEffect(() => {
    const syncAuthState = () => {
      setCurrentUserId(getUserId());
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-changed", syncAuthState);
    };
  }, []);

  // Keep local cache for faster UI rendering and guest users.
  useEffect(() => {
    localStorage.setItem(getWishlistStorageKey(currentUserId), JSON.stringify(wishlist));
  }, [wishlist, currentUserId]);

  useEffect(() => {
    let isCancelled = false;

    const loadWishlist = async () => {
      const userId = currentUserId;

      // Load cached wishlist for this specific user before DB fetch.
      setWishlist(readLocalWishlist(userId));

      if (!userId) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/wishlist/${userId}`);
        const result = await response.json().catch(() => ({}));

        if (!isCancelled && response.ok && result?.data?.items) {
          setWishlist(mapServerWishlistItems(result.data.items));
          return;
        }

        if (!isCancelled && response.status === 404) {
          setWishlist([]);
        }
      } catch (error) {
        console.error("[Wishlist] Failed to load wishlist from DB:", error);
      }
    };

    loadWishlist();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, mapServerWishlistItems]);

  const addToWishlist = async (product) => {
    const userId = currentUserId;
    const productId = normalizeId(getProductId(product));

    if (!productId) {
      return;
    }

    if (userId && isObjectId(productId)) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/wishlist/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, productId }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Failed to add item to wishlist");
        }

        setWishlist(mapServerWishlistItems(result?.data?.items || []));
        return;
      } catch (error) {
        console.error("[Wishlist] Failed to add item in DB, using local fallback:", error);
      }
    }

    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((item) => normalizeId(item.id) === productId);
      if (exists) {
        return prevWishlist;
      }
      return [...prevWishlist, { ...product, id: productId, productId }];
    });
  };

  const removeFromWishlist = async (productIdInput) => {
    const userId = currentUserId;
    const productId = normalizeId(productIdInput);

    if (!productId) {
      return;
    }

    if (userId && isObjectId(productId)) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/wishlist/${userId}/remove`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Failed to remove item from wishlist");
        }

        setWishlist(mapServerWishlistItems(result?.data?.items || []));
        return;
      } catch (error) {
        console.error("[Wishlist] Failed to remove item in DB, using local fallback:", error);
      }
    }

    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => normalizeId(item.id) !== productId)
    );
  };

  const isInWishlist = (productIdInput) => {
    const productId = normalizeId(productIdInput);
    if (!productId) {
      return false;
    }
    return wishlist.some((item) => normalizeId(item.id) === productId);
  };

  const clearWishlist = async () => {
    const userId = currentUserId;

    if (userId) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/wishlist/${userId}/clear`, {
          method: "DELETE",
        });

        if (!response.ok && response.status !== 404) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || "Failed to clear wishlist");
        }
      } catch (error) {
        console.error("[Wishlist] Failed to clear wishlist in DB, clearing local wishlist:", error);
      }
    }

    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
