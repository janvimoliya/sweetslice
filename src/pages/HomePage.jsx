import { useEffect, useState } from "react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import CakeParticlesLayer from "../components/CakeParticlesLayer";
import { products as fallbackProducts } from "../data/products";
import ProductReviewsModal from "../components/ProductReviewsModal";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  const apiBaseUrl = "http://localhost:5000";
  const localFallbackImage = "/cake-placeholder.svg";
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } =
    useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [activeReviewProduct, setActiveReviewProduct] = useState(null);

  const featuredProducts = products.slice(0, 6);
  const getProductKey = (product) => product?._id || product?.id || product?.productId;
  const normalizeProductKey = (product) => String(getProductKey(product) ?? "").trim();
  const clampDescription = (description) => {
    if (typeof description !== "string") {
      return "Freshly prepared with premium ingredients and crafted for every celebration.";
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      return "Freshly prepared with premium ingredients and crafted for every celebration.";
    }

    return trimmedDescription.length > 92
      ? `${trimmedDescription.slice(0, 89)}...`
      : trimmedDescription;
  };
  const heroSlides = [
    {
      id: "hero-1",
      image:
        "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=1400&q=80",
      name: "Fresh berry cake",
    },
    {
      id: "hero-2",
      image:
        "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1400&q=80",
      name: "Chocolate layer cake",
    },
    {
      id: "hero-3",
      image:
        "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=1400&q=80",
      name: "Celebration birthday cake",
    },
    {
      id: "hero-4",
      image:
        "https://images.unsplash.com/photo-1653936392747-cbbf97f8d45c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8UHJlbWl1bSUyMHdlZGRpbmclMjBjYWtlJTIwSEQlMjBpbWFnZXxlbnwwfHwwfHx8MA%3D%3D",
      name: "Premium wedding cake",
    },
    {
      id: "hero-5",
      image:
        "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1400&q=80",
      name: "Assorted cupcakes",
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  const getProductImageSrc = (product) => {
    const imageCandidateRaw =
      typeof product?.image === "string"
        ? product.image.trim()
        : typeof product?.imageUrl === "string"
          ? product.imageUrl.trim()
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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/products/all`);
        const result = await response.json().catch(() => ({}));

        if (response.ok && Array.isArray(result?.data)) {
          setProducts(result.data);
          return;
        }

        setProducts(fallbackProducts);
      } catch (error) {
        console.error("[HomePage] Failed to fetch products from DB, using local data:", error);
        setProducts(fallbackProducts);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined;
    }

    const sliderInterval = setInterval(() => {
      setCurrentSlide((previousSlide) =>
        (previousSlide + 1) % heroSlides.length
      );
    }, 2000);

    return () => clearInterval(sliderInterval);
  }, [heroSlides.length]);

  const handleAddToCart = (product) => {
    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate("/login", { state: { redirectTo: location.pathname } });
      return;
    }

    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  const toggleWishlist = (product) => {
    const productKey = normalizeProductKey(product);
    if (!productKey) {
      return;
    }

    if (isInWishlist(productKey)) {
      removeFromWishlist(productKey);
    } else {
      const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
      if (!isUserLoggedIn) {
        navigate("/login", { state: { redirectTo: location.pathname } });
        return;
      }

      addToWishlist({ ...product, id: productKey, productId: productKey });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <CakeParticlesLayer />
        <div className="hero-content">
          <h1>
            Delicious Cakes for
            <br />
            Every Celebration
          </h1>
          <p>
            Freshly Baked Happiness for Every Celebration
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
            <Link to="/about" className="btn btn-outline-primary btn-lg">
              Learn More
            </Link>
          </div>
        </div>

        <div className="hero-media" aria-live="polite">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.name}
              className={`hero-slide ${index === currentSlide ? "active" : ""}`}
              loading={index === 0 ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="hero-slide-indicators">
            {heroSlides.map((slide, index) => (
              <span
                key={`${slide.id}-indicator`}
                className={`hero-indicator ${index === currentSlide ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Banner */}
      <section className="offers-banner">
        <CakeParticlesLayer />
        <div className="offers-banner-content">
          <h2>🎉 Special Offers & Deals</h2>
          <p>Don't miss out on our limited-time exclusive promotions!</p>
          <Link to="/offers" className="btn btn-primary">
            View All Offers
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">🥐</div>
            <h3>Premium Quality</h3>
            <p>Made with the finest ingredients</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Delivered fresh to your door</p>
          </div>
          <div className="feature">
            <div className="feature-icon">💚</div>
            <h3>Customer Care</h3>
            <p>Your satisfaction is our priority</p>
          </div>
          <div className="feature">
            <div className="feature-icon">✨</div>
            <h3>Custom Designs</h3>
            <p>Make your celebration special</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="featured-header">
          <h2>Featured Products</h2>
          <p>Check out our most popular cakes</p>
          <Link to="/shop" className="view-all-link">
            View All Products →
          </Link>
        </div>

        <div className="featured-products">
          {featuredProducts.map((product) => (
            <div key={getProductKey(product)} className="featured-card">
              <div className="card-image">
                <img
                  src={getProductImageSrc(product)}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = localFallbackImage;
                  }}
                />
                <button
                  className={`wishlist-btn ${
                    isInWishlist(normalizeProductKey(product)) ? "active" : ""
                  }`}
                  onClick={() => toggleWishlist(product)}
                  title={
                    isInWishlist(normalizeProductKey(product))
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  ❤️
                </button>
                <span className="featured-chip">Best Seller</span>
              </div>
              <div className="card-content">
                <h4>{product.name}</h4>
                <div className="product-meta-row">
                  <p className="category">{product.category}</p>
                  <span className="rating-pill">⭐ {Number(product.rating || 0).toFixed(1)}</span>
                </div>
                <p className="description">{clampDescription(product.description)}</p>
                <div className="card-footer">
                  <div className="price-rating">
                    <span className="price">₹{product.price}</span>
                    <span className="rating">{Number(product.approvedReviewCount || product.reviewCount || 0)} reviews</span>
                  </div>
                  <div className="featured-actions">
                    <button
                      className="btn btn-sm add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => setActiveReviewProduct(product)}
                    >
                      Reviews
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          <Link to="/shop" className="category-card">
            <div className="category-icon">🎂</div>
            <h3>Birthday Cakes</h3>
            <p>5 Products</p>
          </Link>
          <Link to="/shop" className="category-card">
            <div className="category-icon">💒</div>
            <h3>Wedding Cakes</h3>
            <p>3 Products</p>
          </Link>
          <Link to="/shop" className="category-card">
            <div className="category-icon">🌟</div>
            <h3>Specialty Cakes</h3>
            <p>4 Products</p>
          </Link>
          <Link to="/shop" className="category-card">
            <div className="category-icon">🧁</div>
            <h3>Cupcakes</h3>
            <p>4 Products</p>
          </Link>
          <Link to="/shop" className="category-card">
            <div className="category-icon">✨</div>
            <h3>Mini Cakes</h3>
            <p>4 Products</p>
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <p className="stars">⭐⭐⭐⭐⭐</p>
            <p className="text">
              "The cakes are absolutely delicious! Perfect for my daughter's birthday party."
            </p>
            <p className="author">- Sarah M.</p>
          </div>
          <div className="testimonial">
            <p className="stars">⭐⭐⭐⭐⭐</p>
            <p className="text">
              "Excellent quality and the delivery was right on time. Highly recommend!"
            </p>
            <p className="author">- John D.</p>
          </div>
          <div className="testimonial">
            <p className="stars">⭐⭐⭐⭐⭐</p>
            <p className="text">
              "Custom design was exactly what I imagined. The best cake I've ever had!"
            </p>
            <p className="author">- Emma T.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Special Offer!</h2>
        <p>Get 20% off your first order with code: SWEETSLICE20</p>
        <Link to="/shop" className="btn btn-lg home-cta-btn">
          Shop Now and Save
        </Link>
      </section>

      <ProductReviewsModal
        isOpen={Boolean(activeReviewProduct)}
        product={activeReviewProduct}
        onClose={() => setActiveReviewProduct(null)}
        onReviewSubmitted={async () => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/products/all`);
            const result = await response.json().catch(() => ({}));
            if (response.ok && Array.isArray(result?.data)) {
              setProducts(result.data);
            }
          } catch {
            // Keep current list if refresh fails
          }
        }}
      />
    </div>
  );
}

export default HomePage;
