import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/OrderSuccessPage.css';

function OrderSuccessPage() {
  const apiBaseUrl = 'http://localhost:5000';
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stateTransactionId = String(location.state?.paymentTransactionId || '').trim();

  useEffect(() => {
    let isCancelled = false;

    const loadOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}`);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load order details');
        }

        if (!isCancelled) {
          setOrder(result?.data || null);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(fetchError.message || 'Unable to load order details');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, orderId]);

  const derivedTransactionId = useMemo(() => {
    if (stateTransactionId) {
      return stateTransactionId;
    }

    return String(order?.paymentTransactionId || '').trim();
  }, [order?.paymentTransactionId, stateTransactionId]);

  if (loading) {
    return (
      <section className="order-success-page">
        <div className="order-success-shell">
          <p className="order-success-loading">Loading your order confirmation...</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="order-success-page">
        <div className="order-success-shell">
          <h2>Order Confirmation</h2>
          <p className="order-success-error">{error || 'Order not found.'}</p>
          <div className="order-success-actions">
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/profile?tab=orders')}>
              Track My Orders
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="order-success-page">
      <div className="order-success-shell">
        <div className="order-success-icon">✓</div>
        <h2>Order Confirmed</h2>
        <p className="order-success-subtitle">Thank you for ordering from SweetSlice. Your delicious cakes are being prepared.</p>

        <div className="order-success-meta">
          <div>
            <label>Order Number</label>
            <strong>{order.orderNumber || String(order._id || '').slice(-8).toUpperCase()}</strong>
          </div>
          <div>
            <label>Payment Status</label>
            <strong className={`status-${String(order.paymentStatus || 'pending').toLowerCase()}`}>
              {String(order.paymentStatus || 'pending').toUpperCase()}
            </strong>
          </div>
          <div>
            <label>Order Total</label>
            <strong>INR {Number(order.totalAmount || 0).toFixed(2)}</strong>
          </div>
          <div>
            <label>Transaction ID</label>
            <strong>{derivedTransactionId || 'Not available'}</strong>
          </div>
        </div>

        <div className="order-success-items">
          <h4>Order Summary</h4>
          {(order.items || []).map((item, index) => (
            <div key={`${item.productId || index}-${index}`} className="order-success-item-row">
              <span>{item.name || 'Cake'} x{Number(item.quantity || 0)}</span>
              <span>INR {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="order-success-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/profile?tab=orders')}>
            Track Order
          </button>
          <Link to="/shop" className="btn btn-outline-secondary">Continue Shopping</Link>
        </div>
      </div>
    </section>
  );
}

export default OrderSuccessPage;
