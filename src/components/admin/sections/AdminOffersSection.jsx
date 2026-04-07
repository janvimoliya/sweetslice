import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminOffersSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setOfferForm,
    setIsOfferModalOpen,
    offerSearchTerm,
    setOfferSearchTerm,
    filteredOffers,
    startEdit,
    handleDelete,
    isOfferModalOpen,
    cancelEdit,
    editingIds,
    handleOfferSubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    offerForm,
    products,
    toggleOfferApplicableProduct,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Create Offer"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, offers: '' }));
          clearEntityErrors('offers');
          setOfferForm({
            title: '',
            description: '',
            discountPercentage: '0',
            discountType: 'percentage',
            discountValue: '0',
            applicableProducts: [],
            startDate: '',
            endDate: '',
            isActive: true,
            image: '',
            code: '',
            minPurchaseAmount: '0',
            bannerText: 'Limited Time Offer',
          });
          setIsOfferModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-search-wrap admin-users-search-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search offers by title, code, description, discount, or banner text"
              value={offerSearchTerm}
              onChange={(event) => setOfferSearchTerm(event.target.value)}
            />
          </div>
        )}
      />

      <div className="table-responsive admin-data-table">
        <table className="table table-striped align-middle">
          <thead><tr><th>Title</th><th>Code</th><th>Discount</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredOffers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">No offers found</td>
              </tr>
            )}
            {filteredOffers.map((item) => (
              <tr key={item._id}>
                <td>{item.title}</td><td>{item.code || '-'}</td><td>{item.discountPercentage}%</td><td>{item.isActive ? 'Yes' : 'No'}</td>
                <td className="admin-actions-cell">
                  <div className="admin-actions-group">
                    <button className="btn btn-sm admin-action-btn admin-action-btn-edit" type="button" onClick={() => startEdit('offers', item)}>Edit</button>
                    <button className="btn btn-sm admin-action-btn admin-action-btn-delete" type="button" onClick={() => handleDelete('offers', item._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOfferModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('offers')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.offers ? 'Edit Offer' : 'Create Offer'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('offers')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleOfferSubmit}>
              <div className="col-md-6"><label className="form-label">Title</label><input className={getFieldClass('offers', 'title')} value={offerForm.title} onChange={(e) => { setOfferForm((prev) => ({ ...prev, title: e.target.value })); clearFieldError('offers', 'title'); }} />{getFieldError('offers', 'title') && <div className="invalid-feedback d-block">{getFieldError('offers', 'title')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Code</label><input className={getFieldClass('offers', 'code')} value={offerForm.code} onChange={(e) => { setOfferForm((prev) => ({ ...prev, code: e.target.value })); clearFieldError('offers', 'code'); }} />{getFieldError('offers', 'code') && <div className="invalid-feedback d-block">{getFieldError('offers', 'code')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Discount %</label><input className={getFieldClass('offers', 'discountPercentage')} value={offerForm.discountPercentage} onChange={(e) => { setOfferForm((prev) => ({ ...prev, discountPercentage: e.target.value })); clearFieldError('offers', 'discountPercentage'); }} />{getFieldError('offers', 'discountPercentage') && <div className="invalid-feedback d-block">{getFieldError('offers', 'discountPercentage')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Discount Value</label><input className={getFieldClass('offers', 'discountValue')} value={offerForm.discountValue} onChange={(e) => { setOfferForm((prev) => ({ ...prev, discountValue: e.target.value })); clearFieldError('offers', 'discountValue'); }} />{getFieldError('offers', 'discountValue') && <div className="invalid-feedback d-block">{getFieldError('offers', 'discountValue')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Type</label><select className="form-select" value={offerForm.discountType} onChange={(e) => setOfferForm((prev) => ({ ...prev, discountType: e.target.value }))}><option value="percentage">percentage</option><option value="fixed">fixed</option></select></div>
              <div className="col-md-6"><label className="form-label">Start Date</label><input className={getFieldClass('offers', 'startDate')} type="date" value={offerForm.startDate} onChange={(e) => { setOfferForm((prev) => ({ ...prev, startDate: e.target.value })); clearFieldError('offers', 'startDate'); }} />{getFieldError('offers', 'startDate') && <div className="invalid-feedback d-block">{getFieldError('offers', 'startDate')}</div>}</div>
              <div className="col-md-6"><label className="form-label">End Date</label><input className={getFieldClass('offers', 'endDate')} type="date" value={offerForm.endDate} onChange={(e) => { setOfferForm((prev) => ({ ...prev, endDate: e.target.value })); clearFieldError('offers', 'endDate'); }} />{getFieldError('offers', 'endDate') && <div className="invalid-feedback d-block">{getFieldError('offers', 'endDate')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Image URL</label><input className={getFieldClass('offers', 'image')} value={offerForm.image} onChange={(e) => { setOfferForm((prev) => ({ ...prev, image: e.target.value })); clearFieldError('offers', 'image'); }} />{getFieldError('offers', 'image') && <div className="invalid-feedback d-block">{getFieldError('offers', 'image')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Min Purchase Amount</label><input className={getFieldClass('offers', 'minPurchaseAmount')} value={offerForm.minPurchaseAmount} onChange={(e) => { setOfferForm((prev) => ({ ...prev, minPurchaseAmount: e.target.value })); clearFieldError('offers', 'minPurchaseAmount'); }} />{getFieldError('offers', 'minPurchaseAmount') && <div className="invalid-feedback d-block">{getFieldError('offers', 'minPurchaseAmount')}</div>}</div>
              <div className="col-12">
                <label className="form-label">Applicable Products (Optional)</label>
                <div className="offer-product-selector">
                  {products.length === 0 ? (
                    <p className="offer-product-selector-empty">No products available</p>
                  ) : (
                    products.map((product) => (
                      <label key={product._id} className="offer-product-option">
                        <input
                          type="checkbox"
                          checked={offerForm.applicableProducts.includes(product._id)}
                          onChange={() => toggleOfferApplicableProduct(product._id)}
                        />
                        <span>{product.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="col-12"><label className="form-label">Description</label><textarea className={getFieldClass('offers', 'description')} rows="2" value={offerForm.description} onChange={(e) => { setOfferForm((prev) => ({ ...prev, description: e.target.value })); clearFieldError('offers', 'description'); }} />{getFieldError('offers', 'description') && <div className="invalid-feedback d-block">{getFieldError('offers', 'description')}</div>}</div>
              <div className="col-12"><label className="form-label">Banner Text</label><input className="form-control" value={offerForm.bannerText} onChange={(e) => setOfferForm((prev) => ({ ...prev, bannerText: e.target.value }))} /></div>
              <div className="col-12 form-check"><input type="checkbox" className="form-check-input" checked={offerForm.isActive} onChange={(e) => setOfferForm((prev) => ({ ...prev, isActive: e.target.checked }))} id="offerActive" /><label className="form-check-label" htmlFor="offerActive">Is Active</label></div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-danger" type="submit">{editingIds.offers ? 'Update Offer' : 'Create Offer'}</button><button className="btn btn-secondary" type="button" onClick={() => cancelEdit('offers')}>Cancel</button></div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminOffersSection;
