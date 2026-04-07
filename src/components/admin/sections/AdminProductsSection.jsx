import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminProductsSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setProductForm,
    setIsProductModalOpen,
    productSearchTerm,
    setProductSearchTerm,
    productCategoryFilter,
    setProductCategoryFilter,
    productCategories,
    paginatedProducts,
    getProductImageSrc,
    startEdit,
    handleDelete,
    filteredProducts,
    productPage,
    productsPerPage,
    setProductPage,
    totalProductPages,
    editingIds,
    cancelEdit,
    handleProductSubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    productForm,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Add Product"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, products: '' }));
          clearEntityErrors('products');
          setProductForm({
            name: '',
            category: 'Birthday Cakes',
            price: '',
            image: '',
            description: '',
            rating: '4.5',
            quantity: '0',
            inStock: true,
          });
          setIsProductModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-products-controls">
            <div className="admin-search-wrap">
              <i className="bi bi-search" />
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(event) => setProductSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="form-select form-control"
              value={productCategoryFilter}
              onChange={(event) => setProductCategoryFilter(event.target.value)}
            >
              <option value="all">All</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      />

      <div className="table-responsive admin-data-table admin-product-table-wrap">
        <table className="table align-middle mb-0 admin-product-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">No products found</td>
              </tr>
            )}
            {paginatedProducts.map((item) => {
              const isPopular = Number(item.rating || 0) >= 4.5;
              const quantity = Number(item.quantity || 0);
              const stockStatus = item.inStock === false || quantity <= 0
                ? 'OUT OF STOCK'
                : quantity <= 5
                  ? 'LOW STOCK'
                  : isPopular
                    ? 'POPULAR'
                    : 'NEW';
              const stockClass = item.inStock === false || quantity <= 0
                ? 'danger'
                : quantity <= 5
                  ? 'warning'
                  : isPopular
                    ? 'popular'
                    : 'new';
              return (
                <tr key={item._id}>
                  <td>
                    <img src={getProductImageSrc(item.image)} alt={item.name} className="admin-product-thumb" />
                  </td>
                  <td>
                    <div className="admin-product-name">{item.name}</div>
                    <div className="admin-product-desc">{item.description || 'No description available'}</div>
                  </td>
                  <td><span className="admin-category-pill">{item.category || 'Other'}</span></td>
                  <td>
                    <div className="admin-price-value">₹{Number(item.price || 0).toFixed(0)}</div>
                    <small className="admin-price-meta">Qty: {item.quantity || 0}</small>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${stockClass}`}>
                      {stockStatus}
                    </span>
                  </td>
                  <td>
                    <div className="admin-products-actions">
                      <button
                        className="btn btn-sm admin-action-btn admin-action-btn-edit"
                        type="button"
                        onClick={() => startEdit('products', item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm admin-action-btn admin-action-btn-delete"
                        type="button"
                        onClick={() => handleDelete('products', item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProducts.length > 0 && (
        <div className="admin-pagination mt-3">
          <p className="admin-pagination-summary mb-0">
            Showing {(productPage - 1) * productsPerPage + 1}
            {' - '}
            {Math.min(productPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length}
          </p>
          <div className="admin-pagination-controls">
            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
              disabled={productPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalProductPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`btn btn-sm ${productPage === page ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setProductPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={() => setProductPage((prev) => Math.min(prev + 1, totalProductPages))}
              disabled={productPage === totalProductPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {props.isProductModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('products')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.products ? 'Edit Product' : 'Add Product'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('products')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleProductSubmit}>
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input className={getFieldClass('products', 'name')} value={productForm.name} onChange={(e) => { setProductForm((prev) => ({ ...prev, name: e.target.value })); clearFieldError('products', 'name'); }} />
                {getFieldError('products', 'name') && <div className="invalid-feedback d-block">{getFieldError('products', 'name')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select className="form-select" value={productForm.category} onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}>
                  {productCategories.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </div>
              <div className="col-md-4"><label className="form-label">Price</label><input className={getFieldClass('products', 'price')} value={productForm.price} onChange={(e) => { setProductForm((prev) => ({ ...prev, price: e.target.value })); clearFieldError('products', 'price'); }} />{getFieldError('products', 'price') && <div className="invalid-feedback d-block">{getFieldError('products', 'price')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Rating</label><input className={getFieldClass('products', 'rating')} value={productForm.rating} onChange={(e) => { setProductForm((prev) => ({ ...prev, rating: e.target.value })); clearFieldError('products', 'rating'); }} />{getFieldError('products', 'rating') && <div className="invalid-feedback d-block">{getFieldError('products', 'rating')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Quantity</label><input className={getFieldClass('products', 'quantity')} value={productForm.quantity} onChange={(e) => { setProductForm((prev) => ({ ...prev, quantity: e.target.value })); clearFieldError('products', 'quantity'); }} />{getFieldError('products', 'quantity') && <div className="invalid-feedback d-block">{getFieldError('products', 'quantity')}</div>}</div>
              <div className="col-12"><label className="form-label">Image URL</label><input className={getFieldClass('products', 'image')} value={productForm.image} onChange={(e) => { setProductForm((prev) => ({ ...prev, image: e.target.value })); clearFieldError('products', 'image'); }} />{getFieldError('products', 'image') && <div className="invalid-feedback d-block">{getFieldError('products', 'image')}</div>}</div>
              <div className="col-12"><label className="form-label">Description</label><textarea className={getFieldClass('products', 'description')} rows="3" value={productForm.description} onChange={(e) => { setProductForm((prev) => ({ ...prev, description: e.target.value })); clearFieldError('products', 'description'); }} />{getFieldError('products', 'description') && <div className="invalid-feedback d-block">{getFieldError('products', 'description')}</div>}</div>
              <div className="col-12 form-check">
                <input className="form-check-input" type="checkbox" checked={productForm.inStock} onChange={(e) => setProductForm((prev) => ({ ...prev, inStock: e.target.checked }))} id="inStock" />
                <label htmlFor="inStock" className="form-check-label">In stock</label>
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-danger" type="submit">{editingIds.products ? 'Update Product' : 'Create Product'}</button>
                <button className="btn btn-secondary" type="button" onClick={() => cancelEdit('products')}>Cancel</button>
              </div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminProductsSection;
