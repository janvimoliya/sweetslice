import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminContactsSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setContactForm,
    setIsContactModalOpen,
    contactSearchTerm,
    setContactSearchTerm,
    filteredContacts,
    startEdit,
    handleDelete,
    isContactModalOpen,
    cancelEdit,
    editingIds,
    handleContactSubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    contactForm,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Create Contact"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, contacts: '' }));
          clearEntityErrors('contacts');
          setContactForm({
            name: '',
            email: '',
            mobile: '',
            subject: '',
            message: '',
            reply: '',
            status: 'Pending',
          });
          setIsContactModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-search-wrap admin-users-search-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search contacts by name, email, mobile, subject, message, or status"
              value={contactSearchTerm}
              onChange={(event) => setContactSearchTerm(event.target.value)}
            />
          </div>
        )}
      />

      <div className="table-responsive admin-data-table">
        <table className="table table-striped align-middle">
          <thead><tr><th>Name</th><th>Subject</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredContacts.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">No contacts found</td>
              </tr>
            )}
            {filteredContacts.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td><td>{item.subject}</td><td>{item.status}</td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                <td className="admin-actions-cell">
                  <div className="admin-actions-group">
                    <button className="btn btn-sm admin-action-btn admin-action-btn-edit" type="button" onClick={() => startEdit('contacts', item)}>Edit</button>
                    <button className="btn btn-sm admin-action-btn admin-action-btn-delete" type="button" onClick={() => handleDelete('contacts', item._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isContactModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('contacts')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.contacts ? 'Edit Contact' : 'Create Contact'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('contacts')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleContactSubmit}>
              <div className="col-md-6"><label className="form-label">Name</label><input className={getFieldClass('contacts', 'name')} value={contactForm.name} onChange={(e) => { setContactForm((prev) => ({ ...prev, name: e.target.value })); clearFieldError('contacts', 'name'); }} />{getFieldError('contacts', 'name') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'name')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Email</label><input className={getFieldClass('contacts', 'email')} type="email" value={contactForm.email} onChange={(e) => { setContactForm((prev) => ({ ...prev, email: e.target.value })); clearFieldError('contacts', 'email'); }} />{getFieldError('contacts', 'email') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'email')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Mobile</label><input className={getFieldClass('contacts', 'mobile')} value={contactForm.mobile} onChange={(e) => { setContactForm((prev) => ({ ...prev, mobile: e.target.value })); clearFieldError('contacts', 'mobile'); }} />{getFieldError('contacts', 'mobile') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'mobile')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Status</label><select className="form-select" value={contactForm.status} onChange={(e) => setContactForm((prev) => ({ ...prev, status: e.target.value }))}><option value="Pending">Pending</option><option value="Replied">Replied</option></select></div>
              <div className="col-12"><label className="form-label">Subject</label><input className={getFieldClass('contacts', 'subject')} value={contactForm.subject} onChange={(e) => { setContactForm((prev) => ({ ...prev, subject: e.target.value })); clearFieldError('contacts', 'subject'); }} />{getFieldError('contacts', 'subject') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'subject')}</div>}</div>
              <div className="col-12"><label className="form-label">Message</label><textarea className={getFieldClass('contacts', 'message')} rows="3" value={contactForm.message} onChange={(e) => { setContactForm((prev) => ({ ...prev, message: e.target.value })); clearFieldError('contacts', 'message'); }} />{getFieldError('contacts', 'message') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'message')}</div>}</div>
              <div className="col-12"><label className="form-label">Reply</label><textarea className={getFieldClass('contacts', 'reply')} rows="2" value={contactForm.reply} onChange={(e) => { setContactForm((prev) => ({ ...prev, reply: e.target.value })); clearFieldError('contacts', 'reply'); }} />{getFieldError('contacts', 'reply') && <div className="invalid-feedback d-block">{getFieldError('contacts', 'reply')}</div>}</div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-danger" type="submit">{editingIds.contacts ? 'Update Contact' : 'Create Contact'}</button><button className="btn btn-secondary" type="button" onClick={() => cancelEdit('contacts')}>Cancel</button></div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminContactsSection;
