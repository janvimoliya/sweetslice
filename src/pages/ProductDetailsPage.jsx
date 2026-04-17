import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import CakeParticlesLayer from "../components/CakeParticlesLayer";
import ProductReviewsModal from "../components/ProductReviewsModal";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { products as fallbackProducts } from "../data/products";
import "../styles/ProductDetailsPage.css";

function ProductDetailsPage() {
  const apiBaseUrl = "http://localhost:5000";
  const localFallbackImage = "/cake-placeholder.svg";
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReviewProduct, setActiveReviewProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const normalizeProductKey = (item) => String(item?._id || item?.id || item?.productId || "").trim();

  const getProductImageSrc = (item) => {
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
      const normalizedPath = imageCandidate.startsWith("/") ? imageCandidate : `/${imageCandidate}`;
      return `${apiBaseUrl}${normalizedPath}`;
    }

    if (imageCandidate.startsWith("/")) {
      return imageCandidate;
    }

    return localFallbackImage;
  };

  const getStockMeta = (item) => {
    const quantity = Number(item?.quantity ?? -1);
    const hasExplicitStock = Number.isFinite(quantity) && quantity >= 0;
    const isOutOfStock = item?.inStock === false || (hasExplicitStock && quantity === 0);
    const isLowStock = hasExplicitStock && quantity > 0 && quantity <= 5;

    if (isOutOfStock) {
      return { label: "Out of Stock", className: "stock-out", canBuy: false };
    }

    if (isLowStock) {
      return { label: `Only ${quantity} left`, className: "stock-low", canBuy: true };
    }

    return { label: "In Stock", className: "stock-ok", canBuy: true };
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2200);
  };

  const isMongoId = /^[a-f\d]{24}$/i.test(String(productId || ""));

  useEffect(() => {
    const loadProductDetails = async () => {
      setLoading(true);

      try {
        const allProductsResponse = await fetch(`${apiBaseUrl}/api/products/all`);
        const allProductsResult = await allProductsResponse.json().catch(() => ({}));

        const list = allProductsResponse.ok && Array.isArray(allProductsResult?.data)
          ? allProductsResult.data
          : fallbackProducts;

        setAllProducts(list);

        const selectedFromList = list.find((item) => normalizeProductKey(item) === String(productId));
        if (selectedFromList) {
          setProduct(selectedFromList);
          return;
        }

        if (isMongoId) {
          const productResponse = await fetch(`${apiBaseUrl}/api/products/${productId}`);
          const productResult = await productResponse.json().catch(() => ({}));

          if (productResponse.ok && productResult?.data) {
            setProduct(productResult.data);
            return;
          }
        }

        setProduct(null);
      } catch (error) {
        console.error("[ProductDetailsPage] Failed to load product details:", error);
        const selectedFromFallback = fallbackProducts.find(
          (item) => normalizeProductKey(item) === String(productId)
        );
        setAllProducts(fallbackProducts);
        setProduct(selectedFromFallback || null);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [apiBaseUrl, isMongoId, productId]);

  const similarProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts) || allProducts.length === 0) {
      return [];
    }

    const currentKey = normalizeProductKey(product);
    const currentCategory = String(product.category || "").trim().toLowerCase();
    const currentPrice = Number(product.price || 0);
    const currentRating = Number(product.rating || 0);

    const strictPriceBand = Math.max(100, currentPrice * 0.25);
    const relaxedPriceBand = Math.max(160, currentPrice * 0.4);

    const pool = allProducts.filter((item) => normalizeProductKey(item) !== currentKey);

    const strictMatches = pool.filter((item) => {
      const itemCategory = String(item.category || "").trim().toLowerCase();
      const itemPrice = Number(item.price || 0);
      const itemRating = Number(item.rating || 0);
      return (
        itemCategory === currentCategory &&
        Math.abs(itemPrice - currentPrice) <= strictPriceBand &&
        Math.abs(itemRating - currentRating) <= 0.8
      );
    });

    const relaxedMatches = pool.filter((item) => {
      const itemCategory = String(item.category || "").trim().toLowerCase();
      const itemPrice = Number(item.price || 0);
      const itemRating = Number(item.rating || 0);
      return (
        itemCategory === currentCategory &&
        Math.abs(itemPrice - currentPrice) <= relaxedPriceBand &&
        Math.abs(itemRating - currentRating) <= 1.2
      );
    });

    const categoryMatches = pool.filter(
      (item) => String(item.category || "").trim().toLowerCase() === currentCategory
    );

    const ranked = [...strictMatches, ...relaxedMatches, ...categoryMatches]
      .filter((item, index, array) => array.findIndex((entry) => normalizeProductKey(entry) === normalizeProductKey(item)) === index)
      .sort((a, b) => {
        const aPriceDelta = Math.abs(Number(a.price || 0) - currentPrice);
        const bPriceDelta = Math.abs(Number(b.price || 0) - currentPrice);
        const aRatingDelta = Math.abs(Number(a.rating || 0) - currentRating);
        const bRatingDelta = Math.abs(Number(b.rating || 0) - currentRating);

        if (aPriceDelta !== bPriceDelta) {
          return aPriceDelta - bPriceDelta;
        }

        if (aRatingDelta !== bRatingDelta) {
          return aRatingDelta - bRatingDelta;
        }

        return Number(b.rating || 0) - Number(a.rating || 0);
      });

    return ranked.slice(0, 6);
  }, [allProducts, product]);

  const handleAddToCart = (item) => {
    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate("/login", { state: { redirectTo: location.pathname } });
      return;
    }

    addToCart(item, 1);
    showToast(`${item.name} added to cart`);
  };

  const handleToggleWishlist = async (item) => {
    const itemKey = normalizeProductKey(item);
    if (!itemKey) {
      return;
    }

    if (isInWishlist(itemKey)) {
      await removeFromWishlist(itemKey);
      return;
    }

    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate("/login", { state: { redirectTo: location.pathname } });
      return;
    }

    await addToWishlist({ ...item, id: itemKey, productId: itemKey });
  };

  if (loading) {
    return (
      <section className="product-details-page product-details-loading">
        <p>Loading cake details...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-details-page product-details-empty">
        <h2>Cake not found</h2>
        <p>We could not find this product. Explore all cakes and pick your favorite.</p>
        <Link to="/shop" className="btn btn-danger">Browse Cakes</Link>
      </section>
    );
  }

  const stockMeta = getStockMeta(product);

  return (
    <div className="product-details-page">
      <CakeParticlesLayer />

      <div className="product-details-shell">
        <div className="product-details-hero">
          <div className="product-media">
            <img
              src={getProductImageSrc(product)}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = localFallbackImage;
              }}
            />
          </div>

          <div className="product-details-content">
            <p className="details-category">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="details-description">{product.description || "Freshly crafted cake made with premium ingredients."}</p>

            <div className="details-meta-row">
              <span className="details-price">₹{Number(product.price || 0).toFixed(0)}</span>
              <span className="details-rating">⭐ {Number(product.rating || 0).toFixed(1)}</span>
            </div>

            <div className="details-trust-row">
              <span className={`details-pill ${stockMeta.className}`}>{stockMeta.label}</span>
              <span className="details-pill">Freshly Baked Daily</span>
            </div>

            <div className="details-actions">
              <button
                type="button"
                className="btn btn-danger"
                disabled={!stockMeta.canBuy}
                onClick={() => handleAddToCart(product)}
              >
                {stockMeta.canBuy ? "Add to Cart" : "Unavailable"}
              </button>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => handleToggleWishlist(product)}
              >
                {isInWishlist(normalizeProductKey(product)) ? "Remove Wishlist" : "Add Wishlist"}
              </button>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setActiveReviewProduct(product)}
              >
                View Reviews
              </button>
            </div>
          </div>
        </div>

        <section className="similar-products-section">
          <div className="similar-header">
            <h2>Similar Cakes</h2>
            <p>Matched by category, close price range, and rating profile.</p>
          </div>

          {similarProducts.length > 0 ? (
            <div className="similar-grid">
              {similarProducts.map((item) => {
                const itemKey = normalizeProductKey(item);
                const itemStockMeta = getStockMeta(item);
                return (
                  <article key={itemKey} className="similar-card">
                    <button
                      type="button"
                      className="similar-image-btn"
                      onClick={() => navigate(`/product/${itemKey}`)}
                    >
                      <img
                        src={getProductImageSrc(item)}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = localFallbackImage;
                        }}
                      />
                    </button>

                    <div className="similar-content">
                      <h3>{item.name}</h3>
                      <p className="similar-category">{item.category}</p>
                      <div className="similar-meta">
                        <span>₹{Number(item.price || 0).toFixed(0)}</span>
                        <span>⭐ {Number(item.rating || 0).toFixed(1)}</span>
                      </div>
                      <span className={`details-pill ${itemStockMeta.className}`}>{itemStockMeta.label}</span>
                      <div className="similar-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => navigate(`/product/${itemKey}`)}
                        >
                          More Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={!itemStockMeta.canBuy}
                          onClick={() => handleAddToCart(item)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="similar-empty">No close matches found yet. Check the full collection for more cakes.</p>
          )}
        </section>
      </div>

      <ProductReviewsModal
        isOpen={Boolean(activeReviewProduct)}
        product={activeReviewProduct}
        onClose={() => setActiveReviewProduct(null)}
        onReviewSubmitted={async () => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/products/all`);
            const result = await response.json().catch(() => ({}));
            if (response.ok && Array.isArray(result?.data)) {
              setAllProducts(result.data);
              const refreshed = result.data.find((item) => normalizeProductKey(item) === String(productId));
              if (refreshed) {
                setProduct(refreshed);
              }
            }
          } catch {
            // Keep current state when refresh fails
          }
        }}
      />

      {toast && (
        <div className={`app-toast ${toast.type === "error" ? "is-error" : "is-success"}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;
