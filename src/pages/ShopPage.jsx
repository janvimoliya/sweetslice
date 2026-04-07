import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { products as fallbackProducts } from "../data/products";
import CakeParticlesLayer from "../components/CakeParticlesLayer";
import ProductReviewsModal from "../components/ProductReviewsModal";
import "../styles/ShopPage.css";

function ShopPage() {
  const apiBaseUrl = "http://localhost:5000";
  const localFallbackImage = "/cake-placeholder.svg";
  const itemsPerPage = 8;
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeReviewProduct, setActiveReviewProduct] = useState(null);
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const getProductKey = (product) => product?._id || product?.id || product?.productId;
  const normalizeProductKey = (product) => String(getProductKey(product) ?? "").trim();

  const getProductImageSrc = (product) => {
    const imageCandidateRaw =
      typeof product?.image === "string"
        ? product.image.trim()
        : typeof product?.imageUrl === "string"
          ? product.imageUrl.trim()
          : "";
    const imageCandidate = imageCandidateRaw.replace(/\s+/g, "");

    if (!imageCandidate) {
      return localFallbackImage;
    }

    if (imageCandidate.includes("via.placeholder.com")) {
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
    const querySearchTerm = new URLSearchParams(search).get("search") || "";
    setSearchTerm(querySearchTerm);
  }, [search]);

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
        console.error("[ShopPage] Failed to fetch products from DB, using local data:", error);
        setProducts(fallbackProducts);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
    return ["All Products", ...dynamicCategories];
  }, [products]);

  const filteredProducts = products
    .filter((product) => {
      const categoryMatch =
        selectedCategory === "All Products" ||
        product.category === selectedCategory;
      const searchMatch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
         case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, sortBy, products]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAddToCart = (product) => {
    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate("/login", { state: { redirectTo: pathname } });
      return;
    }

    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  const toggleWishlist = async (product) => {
    const productKey = normalizeProductKey(product);
    if (!productKey) {
      return;
    }

    if (isInWishlist(productKey)) {
      await removeFromWishlist(productKey);
    } else {
      const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
      if (!isUserLoggedIn) {
        navigate("/login", { state: { redirectTo: pathname } });
        return;
      }

      await addToWishlist({ ...product, id: productKey, productId: productKey });
      navigate("/wishlist");
    }
  };

  return (
    <div className="shop-page">
      <div className="shop-header mb-4">
        <CakeParticlesLayer />
        <h2>Our Delicious Cake Collection</h2>
        <p>Browse our wide selection of freshly baked cakes</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section mb-4">
        <div className="filters-header">
          <h3>🔍 Explore Our Cakes</h3>
        </div>
        
        <div className="filters-grid">
          {/* Search Filter */}
          <div className="filter-item">
            <div className="filter-icon">🔎</div>
            <div className="filter-content">
              <label className="filter-label">Search Cakes</label>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Find your favorite cake..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="filter-item">
            <div className="filter-icon">📦</div>
            <div className="filter-content">
              <label className="filter-label">Category</label>
              <select
                className="form-select category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="filter-item">
            <div className="filter-icon">📊</div>
            <div className="filter-content">
              <label className="filter-label">Sort By</label>
              <select
                className="form-select sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-low">💰 Price (Low to High)</option>
                <option value="price-high">💰 Price (High to Low)</option>
                <option value="rating">⭐ Rating (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedCategory !== "All Products" || sortBy !== "name") && (
          <div className="active-filters">
            <span className="filter-badge">
              {filteredProducts.length} items found
            </span>
            {searchTerm && (
              <span className="filter-badge">
                Search: <strong>{searchTerm}</strong>
                <button className="badge-close" onClick={() => setSearchTerm("")}>✕</button>
              </span>
            )}
            {selectedCategory !== "All Products" && (
              <span className="filter-badge">
                Category: <strong>{selectedCategory}</strong>
                <button className="badge-close" onClick={() => setSelectedCategory("All Products")}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {loadingProducts && <div className="no-products text-center w-100"><p>Loading products...</p></div>}
        {!loadingProducts && filteredProducts.length > 0 ? (
          paginatedProducts.map((product) => (
            <div key={getProductKey(product)} className="product-card">
              <div className="product-image">
                <img
                  src={getProductImageSrc(product)}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = localFallbackImage;
                  }}
                />
                <div className="product-overlay">
                  <button
                    className="shop-overlay-cart-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="product-info">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="product-name">{product.name}</h5>
                  <button
                    type="button"
                    className={`btn btn-sm wishlist-btn ${
                      isInWishlist(normalizeProductKey(product)) ? "active" : ""
                    }`}
                    onClick={() => toggleWishlist(product)}
                    aria-pressed={isInWishlist(normalizeProductKey(product))}
                    title={
                      isInWishlist(normalizeProductKey(product))
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                  >
                    ❤️
                  </button>
                </div>

                <p className="product-category text-muted small">
                  {product.category}
                </p>
                <p className="product-description text-muted small">
                  {product.description}
                </p>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="product-price fw-bold">₹{product.price}</span>
                  <span className="product-rating">
                    ⭐ {Number(product.rating || 0).toFixed(1)} ({Number(product.approvedReviewCount || product.reviewCount || 0)})
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark mt-2"
                  onClick={() => setActiveReviewProduct(product)}
                >
                  View Reviews
                </button>
              </div>
            </div>
          ))
        ) : !loadingProducts ? (
          <div className="no-products text-center w-100">
            <p>No products found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      {!loadingProducts && filteredProducts.length > 0 && (
        <div className="pagination-wrap">
          <p className="pagination-summary">
            {/* Showing {(currentPage - 1) * itemsPerPage + 1} */}
            {/* {" - "} */}
            {/* {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} */}
          </p>
          <div className="pagination-controls" role="navigation" aria-label="Products pagination">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

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

export default ShopPage;
