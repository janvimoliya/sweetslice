import { useEffect, useMemo, useState } from "react";
import { useCart } from "../hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import { calculateAutomaticOfferDiscount, calculateBestOfferForItem } from "../utils/offerPricing";
import "../styles/CartPage.css";

function CartPage() {
  const apiBaseUrl = "http://localhost:5000";
  const localFallbackImage = "/cake-placeholder.svg";
  const [activeOffers, setActiveOffers] = useState([]);
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCart();

  // Check if user is logged in
  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");
    if (!userToken && !userId) {
      navigate("/login", { state: { redirectTo: "/cart" } });
    }
  }, [navigate]);

  useEffect(() => {
    let isCancelled = false;

    const loadActiveOffers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/offers/active`);
        const result = await response.json().catch(() => ({}));

        if (!isCancelled && response.ok && result?.success && Array.isArray(result?.data)) {
          setActiveOffers(result.data);
        }
      } catch {
        if (!isCancelled) {
          setActiveOffers([]);
        }
      }
    };

    loadActiveOffers();

    return () => {
      isCancelled = true;
    };
  }, []);

  const cartSubtotal = Number(getCartTotal() || 0);

  const cartOfferSummary = useMemo(
    () => calculateAutomaticOfferDiscount({
      cartItems: cart,
      offers: activeOffers,
      subtotal: cartSubtotal,
    }),
    [cart, activeOffers, cartSubtotal]
  );

  const offerDiscountAmount = Number(cartOfferSummary.discountAmount || 0);
  const discountedSubtotal = Math.max(cartSubtotal - offerDiscountAmount, 0);
  const taxAmount = discountedSubtotal * 0.08;
  const summaryTotal = discountedSubtotal + taxAmount;

  const getCartImageSrc = (item) => {
    const imageCandidateRaw =
      typeof item?.image === "string"
        ? item.image.trim()
        : typeof item?.imageUrl === "string"
          ? item.imageUrl.trim()
          : "";

    const imageCandidate = imageCandidateRaw.replace(/\s+/g, "");

    if (!imageCandidate || imageCandidate.includes("via.placeholder.com")) {
      return localFallbackImage;
    }

    if (/^https?:\/\//i.test(imageCandidate)) {
      return imageCandidate;
    }

    if (imageCandidate.startsWith("/uploads") || imageCandidate.startsWith("uploads/")) {
      const normalizedPath = imageCandidate.startsWith("/")
        ? imageCandidate
        : `/${imageCandidate}`;
      return `${apiBaseUrl}${normalizedPath}`;
    }

    if (imageCandidate.startsWith("/")) {
      return imageCandidate;
    }

    return localFallbackImage;
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
      updateQuantity(productId, quantity);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <div className="empty-cart-content text-center">
          <h2>Your Cart is Empty</h2>
          <p className="text-muted mb-4">
            Add some delicious cakes to your cart to get started!
          </p>
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="mb-4">Shopping Cart</h2>

      <div className="row">
        <div className="col-lg-8">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                {(() => {
                  const offerMeta = calculateBestOfferForItem({
                    item,
                    offers: activeOffers,
                    subtotal: cartSubtotal,
                  });

                  return (
                    <>
                <div className="item-image">
                  <img
                    src={getCartImageSrc(item)}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = localFallbackImage;
                    }}
                  />
                </div>

                <div className="item-details">
                  <h5>{item.name}</h5>
                  <p className="text-muted small">{item.category}</p>
                  {offerMeta.discountAmount > 0 ? (
                    <div className="item-price-stack">
                      <p className="item-price-original">₹{Number(item.price || 0).toFixed(2)}</p>
                      <p className="item-price fw-bold">₹{offerMeta.discountedUnitPrice.toFixed(2)}</p>
                      <p className="item-offer-note">{offerMeta.offerTitle || 'Offer applied'}</p>
                    </div>
                  ) : (
                    <p className="item-price fw-bold">₹{Number(item.price || 0).toFixed(2)}</p>
                  )}
                </div>

                <div className="item-quantity">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, e.target.value)
                    }
                    className="form-control"
                  />
                </div>

                <div className="item-total">
                  {offerMeta.discountAmount > 0 ? (
                    <>
                      <p className="item-total-original">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                      <p className="fw-bold">₹{offerMeta.discountedLineTotal.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="fw-bold">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                  )}
                </div>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="cart-summary">
            <h5 className="mb-3">Order Summary</h5>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {offerDiscountAmount > 0 && (
              <div className="summary-row">
                <span>Offer Discount:</span>
                <span className="text-success">-₹{offerDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping:</span>
              <span className="text-success">Free</span>
            </div>

            <div className="summary-row">
              <span>Tax:</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            <hr />

            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{summaryTotal.toFixed(2)}</span>
            </div>

            <button className="btn btn-secondary-action w-100 my-3" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>

            <button
              className="btn btn-secondary w-100 mb-3"
              onClick={clearCart}
            >
              Clear Cart
            </button>

            <Link to="/shop" className="btn btn-outline-primary w-100">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
