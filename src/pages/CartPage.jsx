import { useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CartPage.css";

function CartPage() {
  const apiBaseUrl = "http://localhost:5000";
  const localFallbackImage = "/cake-placeholder.svg";
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
                  <p className="item-price fw-bold">₹{item.price}</p>
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
                  <p className="fw-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="cart-summary">
            <h5 className="mb-3">Order Summary</h5>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping:</span>
              <span className="text-success">Free</span>
            </div>

            <div className="summary-row">
              <span>Tax:</span>
              <span>₹{(getCartTotal() * 0.08).toFixed(2)}</span>
            </div>

            <hr />

            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{(getCartTotal() * 1.08).toFixed(2)}</span>
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
