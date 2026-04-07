import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminCategoriesSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setCategoryForm,
    setIsCategoryModalOpen,
    categorySearchTerm,
    setCategorySearchTerm,
    filteredCategories,
    startCategoryEdit,
    deleteCategory,
    isCategoryModalOpen,
    cancelEdit,
    editingIds,
    handleCategorySubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    categoryForm,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Create Category"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, categories: '' }));
          clearEntityErrors('categories');
          setCategoryForm({ name: '', description: '' });
          setIsCategoryModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-search-wrap admin-users-search-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search categories by name, source, or product count"
              value={categorySearchTerm}
              onChange={(event) => setCategorySearchTerm(event.target.value)}
            />
          </div>
        )}
      />

      <div className="table-responsive admin-data-table">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Category</th>
              <th>Source</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">No categories found</td>
              </tr>
            )}

            {filteredCategories.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.source}</td>
                <td>{item.productCount}</td>
                <td className="admin-actions-cell">
                  <div className="admin-actions-group">
                  <button
                    className="btn btn-sm admin-action-btn admin-action-btn-edit"
                    type="button"
                    onClick={() => startCategoryEdit(item.name)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm admin-action-btn admin-action-btn-delete"
                    type="button"
                    onClick={() => deleteCategory(item.name)}
                    disabled={item.source !== 'Custom'}
                    title={item.source !== 'Custom' ? 'Only custom categories can be deleted' : ''}
                  >
                    Delete
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCategoryModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('categories')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.categories ? 'Edit Category' : 'Create Category'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('categories')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleCategorySubmit}>
              <div className="col-md-6">
                <label className="form-label">Category Name</label>
                <input
                  className={getFieldClass('categories', 'name')}
                  value={categoryForm.name}
                  onChange={(event) => {
                    setCategoryForm((prev) => ({ ...prev, name: event.target.value }));
                    clearFieldError('categories', 'name');
                  }}
                />
                {getFieldError('categories', 'name') && <div className="invalid-feedback d-block">{getFieldError('categories', 'name')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Description (Optional)</label>
                <input
                  className={getFieldClass('categories', 'description')}
                  value={categoryForm.description}
                  onChange={(event) => {
                    setCategoryForm((prev) => ({ ...prev, description: event.target.value }));
                    clearFieldError('categories', 'description');
                  }}
                />
                {getFieldError('categories', 'description') && <div className="invalid-feedback d-block">{getFieldError('categories', 'description')}</div>}
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-danger" type="submit">
                  {editingIds.categories ? 'Update Category' : 'Create Category'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => cancelEdit('categories')}>
                  Cancel
                </button>
              </div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesSection;
