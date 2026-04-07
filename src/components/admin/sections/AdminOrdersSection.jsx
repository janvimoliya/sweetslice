import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminOrdersSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setOrderForm,
    setIsOrderModalOpen,
    orderSearchTerm,
    setOrderSearchTerm,
    filteredOrders,
    startEdit,
    handleDelete,
    handleGenerateInvoice,
    isOrderModalOpen,
    cancelEdit,
    editingIds,
    handleOrderSubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    orderForm,
    paymentMethodOptions,
    orderStatusOptions,
    paymentStatusOptions,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Create Order"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, orders: '' }));
          clearEntityErrors('orders');
          setOrderForm({
            userId: '',
            totalAmount: '',
            subtotalAmount: '',
            discountAmount: '',
            couponCode: '',
            couponTitle: '',
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'cod',
            itemsText: '[{"productId":"","name":"","price":0,"quantity":1}]',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            wantsCustomization: false,
            customizationNote: '',
            deliveryDate: '',
            deliverySlot: 'morning',
          });
          setIsOrderModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-search-wrap admin-users-search-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search orders by ID, user, total, status, payment status, method, or customization"
              value={orderSearchTerm}
              onChange={(event) => setOrderSearchTerm(event.target.value)}
            />
          </div>
        )}
      />

      <div className="table-responsive admin-data-table">
        <table className="table table-striped align-middle">
          <thead><tr><th>Order ID</th><th>User</th><th>Total</th><th>Status</th><th>Customization</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted">No orders found</td>
              </tr>
            )}
            {filteredOrders.map((item) => (
              <tr key={item._id}>
                <td>{item._id.slice(-8)}</td><td>{item.userId?.fullName || item.userId || '-'}</td><td>₹{item.totalAmount}</td><td>
                  <div className="d-flex flex-column gap-1">
                    <span>{item.status}</span>
                    {String(item.status || '').toLowerCase() === 'cancelled' && (
                      <span className={`badge rounded-pill ${String(item.cancelledBy || '').toLowerCase() === 'customer' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'}`}>
                        Cancelled by {String(item.cancelledBy || '').toLowerCase() === 'customer' ? 'Customer' : 'System/Admin'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="admin-customization-cell">
                  {(item.wantsCustomization || item.customizationNote?.trim()) ? (
                    <>
                      <span className="admin-customization-pill requested">Requested</span>
                      <p className="admin-customization-note" title={item.customizationNote?.trim() || 'Customer asked for customization'}>
                        {item.customizationNote?.trim() || 'Customer asked for customization'}
                      </p>
                    </>
                  ) : (
                    <span className="admin-customization-pill none">None</span>
                  )}
                </td>
                <td className="admin-actions-cell">
                  <div className="admin-actions-group">
                    <button className="btn btn-sm admin-action-btn admin-action-btn-edit" type="button" onClick={() => startEdit('orders', item)}>Edit</button>
                    <button className="btn btn-sm admin-action-btn admin-action-btn-delete" type="button" onClick={() => handleDelete('orders', item._id)}>Delete</button>
                    <button className="btn btn-sm admin-action-btn admin-action-btn-invoice" type="button" onClick={() => handleGenerateInvoice(item)}>Invoice PDF</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOrderModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('orders')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.orders ? 'Edit Order' : 'Create Order'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('orders')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleOrderSubmit}>
              <div className="col-md-4"><label className="form-label">User ID</label><input className={getFieldClass('orders', 'userId')} value={orderForm.userId} onChange={(e) => { setOrderForm((prev) => ({ ...prev, userId: e.target.value })); clearFieldError('orders', 'userId'); }} />{getFieldError('orders', 'userId') && <div className="invalid-feedback d-block">{getFieldError('orders', 'userId')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Total Amount</label><input className={getFieldClass('orders', 'totalAmount')} value={orderForm.totalAmount} onChange={(e) => { setOrderForm((prev) => ({ ...prev, totalAmount: e.target.value })); clearFieldError('orders', 'totalAmount'); }} />{getFieldError('orders', 'totalAmount') && <div className="invalid-feedback d-block">{getFieldError('orders', 'totalAmount')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Payment Method</label><select className="form-select" value={orderForm.paymentMethod} onChange={(e) => setOrderForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}>{paymentMethodOptions.map((option) => (<option key={option} value={option}>{option}</option>))}</select></div>
              <div className="col-md-6"><label className="form-label">Order Status</label><select className="form-select" value={orderForm.status} onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value }))}>{orderStatusOptions.map((option) => (<option key={option} value={option}>{option}</option>))}</select></div>
              <div className="col-md-6"><label className="form-label">Payment Status</label><select className="form-select" value={orderForm.paymentStatus} onChange={(e) => setOrderForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}>{paymentStatusOptions.map((option) => (<option key={option} value={option}>{option}</option>))}</select></div>
              <div className="col-md-4"><label className="form-label">Street</label><input className={getFieldClass('orders', 'street')} value={orderForm.street} onChange={(e) => { setOrderForm((prev) => ({ ...prev, street: e.target.value })); clearFieldError('orders', 'street'); }} />{getFieldError('orders', 'street') && <div className="invalid-feedback d-block">{getFieldError('orders', 'street')}</div>}</div>
              <div className="col-md-4"><label className="form-label">City</label><input className={getFieldClass('orders', 'city')} value={orderForm.city} onChange={(e) => { setOrderForm((prev) => ({ ...prev, city: e.target.value })); clearFieldError('orders', 'city'); }} />{getFieldError('orders', 'city') && <div className="invalid-feedback d-block">{getFieldError('orders', 'city')}</div>}</div>
              <div className="col-md-4"><label className="form-label">State</label><input className={getFieldClass('orders', 'state')} value={orderForm.state} onChange={(e) => { setOrderForm((prev) => ({ ...prev, state: e.target.value })); clearFieldError('orders', 'state'); }} />{getFieldError('orders', 'state') && <div className="invalid-feedback d-block">{getFieldError('orders', 'state')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Zip Code</label><input className={getFieldClass('orders', 'zipCode')} value={orderForm.zipCode} onChange={(e) => { setOrderForm((prev) => ({ ...prev, zipCode: e.target.value })); clearFieldError('orders', 'zipCode'); }} />{getFieldError('orders', 'zipCode') && <div className="invalid-feedback d-block">{getFieldError('orders', 'zipCode')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Country</label><input className={getFieldClass('orders', 'country')} value={orderForm.country} onChange={(e) => { setOrderForm((prev) => ({ ...prev, country: e.target.value })); clearFieldError('orders', 'country'); }} />{getFieldError('orders', 'country') && <div className="invalid-feedback d-block">{getFieldError('orders', 'country')}</div>}</div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-danger" type="submit">{editingIds.orders ? 'Update Order' : 'Create Order'}</button><button className="btn btn-secondary" type="button" onClick={() => cancelEdit('orders')}>Cancel</button></div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersSection;
