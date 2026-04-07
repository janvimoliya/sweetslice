import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminReviewsSection(props) {
  const {
    reviewSearchTerm,
    setReviewSearchTerm,
    reviewStatusFilter,
    setReviewStatusFilter,
    filteredReviews,
    handleModerateReview,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel={null}
        searchSlot={(
          <div className="admin-products-controls">
            <div className="admin-search-wrap">
              <i className="bi bi-search" />
              <input
                type="text"
                className="form-control"
                placeholder="Search by product, customer, comment, or status"
                value={reviewSearchTerm}
                onChange={(event) => setReviewSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="form-select form-control"
              value={reviewStatusFilter}
              onChange={(event) => setReviewStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      />

      <div className="table-responsive admin-data-table">
        <table className="table table-striped align-middle mb-0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">No reviews found</td>
              </tr>
            )}

            {filteredReviews.map((review) => (
              <tr key={review._id}>
                <td>
                  <strong>{review.productName || 'Product'}</strong>
                  <div className="text-muted small">#{String(review.productId || '').slice(-8)}</div>
                </td>
                <td>
                  <strong>{review.userName || 'Customer'}</strong>
                  <div className="text-muted small">{review.isVerifiedBuyer ? 'Verified buyer' : 'Customer'}</div>
                </td>
                <td>{Number(review.rating || 0).toFixed(1)} / 5</td>
                <td>
                  <div style={{ maxWidth: 320 }}>
                    {review.comment || '-'}
                  </div>
                </td>
                <td>
                  <span className={`badge ${review.status === 'approved' ? 'bg-success' : review.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                    {review.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleModerateReview(review, 'approved')}
                      disabled={review.status === 'approved'}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleModerateReview(review, 'rejected')}
                      disabled={review.status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminReviewsSection;
