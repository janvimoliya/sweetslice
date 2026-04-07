import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import CakeParticlesLayer from '../components/CakeParticlesLayer';
import '../styles/OffersPage.css';

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/offers/active');
      const data = await response.json();

      if (data.success) {
        setOffers(data.data);
      } else {
        setError(data.message || 'Failed to load offers');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const isUserLoggedIn = Boolean(localStorage.getItem("userToken") || localStorage.getItem("userId"));
    if (!isUserLoggedIn) {
      navigate('/login');
      return;
    }

    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  const handleCopyCode = async (code) => {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) return;

    try {
      await navigator.clipboard.writeText(normalizedCode);
      setCopiedCode(normalizedCode);
      window.setTimeout(() => setCopiedCode(''), 1800);
    } catch {
      const temporaryInput = document.createElement('input');
      temporaryInput.value = normalizedCode;
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand('copy');
      document.body.removeChild(temporaryInput);
      setCopiedCode(normalizedCode);
      window.setTimeout(() => setCopiedCode(''), 1800);
    }
  };

  if (loading) {
    return (
      <div className="offers-page">
        <div className="offers-header">
          <h2>Special Offers & Deals</h2>
          <p>Don't miss our limited-time exclusive promotions</p>
        </div>
        <div className="loading">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="offers-page">
      <div className="offers-header">
        <CakeParticlesLayer />
        <h2>Special Offers & Deals</h2>
        <p>Don't miss our limited-time exclusive promotions on delicious cakes</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {offers.length === 0 ? (
        <div className="no-offers">
          <p>No active offers at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map((offer) => (
            <div key={offer._id} className="offer-card">
              {offer.image && (
                <div className="offer-image">
                  <img src={offer.image} alt={offer.title} />
                </div>
              )}

              <div className="offer-badge">
                <span className="discount">
                  {offer.discountType === 'percentage'
                    ? `${offer.discountPercentage}% OFF`
                    : `₹${offer.discountValue} OFF`}
                </span>
              </div>

              <div className="offer-content">
                <h3>{offer.title}</h3>
                <p className="banner-text">{offer.bannerText}</p>
                <p className="description">{offer.description}</p>

                {offer.code && (
                  <div className="offer-code">
                    <span className="code-label">Code:</span>
                    <span className="code-value">{offer.code}</span>
                    <button
                      type="button"
                      className="copy-code-btn"
                      onClick={() => handleCopyCode(offer.code)}
                    >
                      {copiedCode === offer.code ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {offer.minPurchaseAmount > 0 && (
                  <p className="min-purchase">
                    Minimum purchase: ₹{offer.minPurchaseAmount}
                  </p>
                )}

                <div className="offer-dates">
                  <p>
                    Valid until{' '}
                    {new Date(offer.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {offer.applicableProducts && offer.applicableProducts.length > 0 && (
                  <div className="applicable-products">
                    <h4>Applicable Products:</h4>
                    <div className="products-list">
                      {offer.applicableProducts.map((product) => (
                        <div key={product._id} className="product-item">
                          {product.image && (
                            <img src={product.image} alt={product.name} />
                          )}
                          <div className="product-info">
                            <p>{product.name}</p>
                            <button
                              className="add-to-cart-btn"
                              onClick={() => handleAddToCart(product)}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="shop-now-btn"
                  onClick={() => navigate('/shop')}
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OffersPage;
