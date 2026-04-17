import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductReviewsModal.css';

function ProductReviewsModal({ isOpen, onClose, product, onReviewSubmitted }) {
  const apiBaseUrl = 'http://localhost:5000';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewData, setReviewData] = useState({
    averageRating: Number(product?.rating || 0),
    approvedReviewCount: Number(product?.approvedReviewCount || product?.reviewCount || 0),
    reviews: [],
  });
  const [eligibility, setEligibility] = useState({
    checked: false,
    canReview: false,
    reason: '',
  });
  const [form, setForm] = useState({ rating: '5', comment: '' });

  const productId = useMemo(() => String(product?._id || product?.id || product?.productId || '').trim(), [product]);

  useEffect(() => {
    if (!isOpen || !productId) {
      return;
    }

    let cancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/products/${productId}/reviews`);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load product reviews');
        }

        if (!cancelled) {
          setReviewData({
            averageRating: Number(result?.data?.averageRating || 0),
            approvedReviewCount: Number(result?.data?.approvedReviewCount || 0),
            reviews: Array.isArray(result?.data?.reviews) ? result.data.reviews : [],
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load product reviews');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, isOpen, productId]);

  useEffect(() => {
    if (!isOpen || !productId) {
      return;
    }

    let cancelled = false;

    const loadEligibility = async () => {
      try {
        const userToken = localStorage.getItem('userToken');
        const response = await fetch(`${apiBaseUrl}/api/products/${productId}/review-eligibility`, {
          headers: userToken
            ? {
                Authorization: `Bearer ${userToken}`,
              }
            : {},
        });
        const result = await response.json().catch(() => ({}));

        if (!cancelled) {
          setEligibility({
            checked: true,
            canReview: Boolean(result?.data?.canReview),
            reason: String(result?.data?.reason || ''),
          });
        }
      } catch {
        if (!cancelled) {
          setEligibility({ checked: true, canReview: false, reason: 'unknown' });
        }
      }
    };

    loadEligibility();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, isOpen, productId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!eligibility.canReview) {
      setError('You can review only products that you purchased and received.');
      return;
    }

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      navigate('/login');
      return;
    }

    if (String(form.comment || '').trim().length < 5) {
      setError('Please write at least 5 characters in your review comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${apiBaseUrl}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: Number(form.rating),
          comment: String(form.comment || '').trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit review');
      }

      setSuccessMessage(result.message || 'Review submitted successfully');
      setForm({ rating: '5', comment: '' });

      if (typeof onReviewSubmitted === 'function') {
        onReviewSubmitted();
      }
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reviews-modal-backdrop" role="presentation" onClick={onClose}>
      <article className="reviews-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="reviews-modal-header">
          <div>
            <h3>Customer Reviews</h3>
            <p>{product?.name || 'Product'}</p>
          </div>
          <button type="button" className="reviews-modal-close" onClick={onClose} aria-label="Close reviews modal">
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <section className="reviews-modal-summary">
          <div className="reviews-score">⭐ {Number(reviewData.averageRating || 0).toFixed(1)}</div>
          <p>{reviewData.approvedReviewCount} approved review{reviewData.approvedReviewCount === 1 ? '' : 's'}</p>
        </section>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form className="reviews-modal-form" onSubmit={handleSubmit}>
          <h4>Write a verified-buyer review</h4>
          {eligibility.checked && !eligibility.canReview ? (
            <div className="alert alert-warning" role="status">
              {eligibility.reason === 'login-required'
                ? 'Please log in and purchase this product to submit a review after delivery.'
                : 'Only users who purchased and received this product can submit a review.'}
            </div>
          ) : null}
          <div className="reviews-modal-form-grid">
            <div>
              <label className="form-label">Rating</label>
              <select
                className="form-select"
                value={form.rating}
                disabled={submitting || (eligibility.checked && !eligibility.canReview)}
                onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            <div>
              <label className="form-label">Comment</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.comment}
                disabled={submitting || (eligibility.checked && !eligibility.canReview)}
                onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder="Share your experience after receiving this cake"
                maxLength={500}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={submitting || (eligibility.checked && !eligibility.canReview)}
          >
            {submitting ? 'Submitting...' : 'Submit For Moderation'}
          </button>
        </form>

        <section className="reviews-modal-list">
          <h4>Approved Reviews</h4>
          {loading ? <p>Loading reviews...</p> : null}
          {!loading && reviewData.reviews.length === 0 ? <p className="text-muted">No approved reviews yet.</p> : null}
          {!loading && reviewData.reviews.map((review) => (
            <article key={review._id} className="review-item">
              <div className="review-item-head">
                <strong>{review.userName || 'Customer'}</strong>
                <span>{'⭐'.repeat(Number(review.rating || 0))}</span>
              </div>
              <p className="review-item-comment">{review.comment}</p>
              <small className="review-item-meta">
                {review.isVerifiedBuyer ? 'Verified buyer' : 'Customer'}
                {' • '}
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
              </small>
            </article>
          ))}
        </section>
      </article>
    </div>
  );
}

export default ProductReviewsModal;
