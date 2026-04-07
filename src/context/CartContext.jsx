import { useState, useEffect } from "react";
import { CartContext } from "./CartContextDefinition";

export function CartProvider({ children }) {
  const apiBaseUrl = "http://localhost:5000";
  const getUserId = () => localStorage.getItem("userId");
  const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
  const getProductId = (product) => product?._id || product?.productId || product?.id;
  const getCartStorageKey = (userId) => (userId ? `cart_${userId}` : "cart_guest");
  const readLocalCart = (userId) => {
    try {
      const savedCart = localStorage.getItem(getCartStorageKey(userId));
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  };

  const mapServerCartItems = (serverItems = []) =>
    serverItems.map((item) => ({
      id: item.productId?._id || item.productId || item.id,
      productId: item.productId?._id || item.productId || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
    }));

  const [currentUserId, setCurrentUserId] = useState(() => getUserId());
  const [cart, setCart] = useState(() => readLocalCart(getUserId()));

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
    localStorage.setItem(getCartStorageKey(currentUserId), JSON.stringify(cart));
  }, [cart, currentUserId]);

  useEffect(() => {
    let isCancelled = false;

    const loadCart = async () => {
      const userId = currentUserId;

      // Load cached cart for this specific user before DB fetch.
      setCart(readLocalCart(userId));

      if (!userId) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/cart/${userId}`);
        const result = await response.json().catch(() => ({}));

        if (!isCancelled && response.ok && result?.data?.items) {
          setCart(mapServerCartItems(result.data.items));
          return;
        }

        if (!isCancelled && response.status === 404) {
          setCart([]);
        }
      } catch (error) {
        console.error("[Cart] Failed to load cart from DB:", error);
      }
    };

    loadCart();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId]);

  const addToCart = async (product, quantity = 1) => {
    const userId = currentUserId;
    const productId = getProductId(product);

    if (userId && isObjectId(productId)) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, productId, quantity }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Failed to add item to cart");
        }

        setCart(mapServerCartItems(result?.data?.items || []));
        return;
      } catch (error) {
        console.error("[Cart] Failed to add item in DB, using local fallback:", error);
      }
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, { ...product, id: productId, productId, quantity }];
    });
  };

  const removeFromCart = async (productId) => {
    const userId = currentUserId;

    if (userId && isObjectId(productId)) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cart/${userId}/remove`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Failed to remove item from cart");
        }

        setCart(mapServerCartItems(result?.data?.items || []));
        return;
      } catch (error) {
        console.error("[Cart] Failed to remove item in DB, using local fallback:", error);
      }
    }

    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      const userId = currentUserId;

      if (userId && isObjectId(productId)) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/cart/${userId}/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });

          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.message || "Failed to update cart quantity");
          }

          setCart(mapServerCartItems(result?.data?.items || []));
          return;
        } catch (error) {
          console.error("[Cart] Failed to update quantity in DB, using local fallback:", error);
        }
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    const userId = currentUserId;

    if (userId) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cart/${userId}/clear`, {
          method: "DELETE",
        });

        if (!response.ok && response.status !== 404) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || "Failed to clear cart");
        }
      } catch (error) {
        console.error("[Cart] Failed to clear cart in DB, clearing local cart:", error);
      }
    }

    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
