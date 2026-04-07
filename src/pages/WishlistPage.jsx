import { useEffect } from "react";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import "../styles/WishlistPage.css";

function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Check if user is logged in
  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken && wishlist.length === 0) {
      navigate("/login");
    }
  }, [navigate, wishlist.length]);

  const handleAddToCart = (product) => {
    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate("/login");
      return;
    }

    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page empty-wishlist">
        <div className="empty-wishlist-content text-center">
          <h2>Your Wishlist is Empty</h2>
          <p className="text-muted mb-4">
            Start adding your favorite cakes to your wishlist!
          </p>
          <Link to="/shop" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h2 className="mb-4">My Wishlist</h2>
      <p className="text-muted mb-4">You have {wishlist.length} items in your wishlist</p>

      <div className="wishlist-items">
        {wishlist.map((item) => (
          <div key={item.id} className="wishlist-item">
            <div className="item-image">
              <img src={item.image} alt={item.name} />
            </div>

            <div className="item-details">
              <h5>{item.name}</h5>
              <p className="text-muted small">{item.category}</p>
              <p className="item-description text-muted small">
                {item.description}
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <p className="item-price fw-bold">₹{item.price}</p>
                <span className="item-rating">⭐ {item.rating}</span>
              </div>
            </div>

            <div className="item-actions">
              <button
                className="btn btn-primary btn-sm mb-2"
                onClick={() => handleAddToCart(item)}
              >
                Add to Cart
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeFromWishlist(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WishlistPage;
