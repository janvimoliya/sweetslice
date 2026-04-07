import AdminSectionToolbar from '../AdminSectionToolbar';

function AdminUsersSection(props) {
  const {
    setEditingIds,
    clearEntityErrors,
    setUserForm,
    setIsUserModalOpen,
    userSearchTerm,
    setUserSearchTerm,
    usersStats,
    filteredUsers,
    startEdit,
    handleDelete,
    isUserModalOpen,
    cancelEdit,
    editingIds,
    handleUserSubmit,
    getFieldClass,
    getFieldError,
    clearFieldError,
    userForm,
  } = props;

  return (
    <div className="admin-section-shell card p-4 mb-4">
      <AdminSectionToolbar
        className="mb-4"
        actionLabel="Create User"
        onAction={() => {
          setEditingIds((prev) => ({ ...prev, users: '' }));
          clearEntityErrors('users');
          setUserForm({
            email: '',
            fullName: '',
            mobile: '',
            password: '',
            gender: 'other',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            profilePicture: '',
          });
          setIsUserModalOpen(true);
        }}
        searchSlot={(
          <div className="admin-search-wrap admin-users-search-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              className="form-control"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(event) => setUserSearchTerm(event.target.value)}
            />
          </div>
        )}
      />

      <div className="dashboard-grid mb-4">
        <article className="dashboard-kpi-card">
          <p className="dashboard-kpi-value">{usersStats.total}</p>
          <p className="dashboard-kpi-label">Total Users</p>
        </article>
        <article className="dashboard-kpi-card">
          <p className="dashboard-kpi-value text-success">{usersStats.newThisMonth}</p>
          <p className="dashboard-kpi-label">New This Month</p>
        </article>
        <article className="dashboard-kpi-card">
          <p className="dashboard-kpi-value text-primary">{usersStats.active}</p>
          <p className="dashboard-kpi-label">Active Users</p>
        </article>
      </div>

      <div className="table-responsive admin-data-table">
        <table className="table align-middle mb-0 admin-product-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">No users found</td>
              </tr>
            )}
            {filteredUsers.map((item) => (
              <tr key={item._id}>
                <td>{String(item._id || '').slice(-8).toUpperCase()}</td>
                <td>{item.fullName || '-'}</td>
                <td>{item.email || '-'}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <span className={`admin-status-pill ${item.isActive === false ? 'inactive' : 'active'}`}>
                    {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                  </span>
                </td>
                <td>
                  <div className="admin-products-actions">
                    <button className="btn btn-sm admin-action-btn admin-action-btn-edit" type="button" onClick={() => startEdit('users', item)}>
                      Edit
                    </button>
                    <button className="btn btn-sm admin-action-btn admin-action-btn-delete" type="button" onClick={() => handleDelete('users', item._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isUserModalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => cancelEdit('users')}>
          <article className="admin-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h5>{editingIds.users ? 'Edit User' : 'Create User'}</h5>
              <button type="button" className="admin-modal-close" onClick={() => cancelEdit('users')}>
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <form className="row g-3 admin-entity-form admin-product-modal-form" onSubmit={handleUserSubmit}>
              <div className="col-md-6"><label className="form-label">Full Name</label><input className={getFieldClass('users', 'fullName')} value={userForm.fullName} onChange={(e) => { setUserForm((prev) => ({ ...prev, fullName: e.target.value })); clearFieldError('users', 'fullName'); }} />{getFieldError('users', 'fullName') && <div className="invalid-feedback d-block">{getFieldError('users', 'fullName')}</div>}</div>
              <div className="col-md-6"><label className="form-label">Email</label><input className={getFieldClass('users', 'email')} type="email" value={userForm.email} onChange={(e) => { setUserForm((prev) => ({ ...prev, email: e.target.value })); clearFieldError('users', 'email'); }} />{getFieldError('users', 'email') && <div className="invalid-feedback d-block">{getFieldError('users', 'email')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Mobile</label><input className={getFieldClass('users', 'mobile')} value={userForm.mobile} onChange={(e) => { setUserForm((prev) => ({ ...prev, mobile: e.target.value })); clearFieldError('users', 'mobile'); }} />{getFieldError('users', 'mobile') && <div className="invalid-feedback d-block">{getFieldError('users', 'mobile')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Password</label><input className={getFieldClass('users', 'password')} type="password" value={userForm.password} placeholder={editingIds.users ? 'Leave blank to keep current password' : ''} onChange={(e) => { setUserForm((prev) => ({ ...prev, password: e.target.value })); clearFieldError('users', 'password'); }} />{getFieldError('users', 'password') && <div className="invalid-feedback d-block">{getFieldError('users', 'password')}</div>}</div>
              <div className="col-md-4"><label className="form-label">Gender</label><select className="form-select" value={userForm.gender} onChange={(e) => setUserForm((prev) => ({ ...prev, gender: e.target.value }))}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div className="col-md-3"><label className="form-label">City</label><input className="form-control" value={userForm.city} onChange={(e) => setUserForm((prev) => ({ ...prev, city: e.target.value }))} /></div>
              <div className="col-md-3"><label className="form-label">State</label><input className="form-control" value={userForm.state} onChange={(e) => setUserForm((prev) => ({ ...prev, state: e.target.value }))} /></div>
              <div className="col-md-3"><label className="form-label">Zip</label><input className={getFieldClass('users', 'zipCode')} value={userForm.zipCode} onChange={(e) => { setUserForm((prev) => ({ ...prev, zipCode: e.target.value })); clearFieldError('users', 'zipCode'); }} />{getFieldError('users', 'zipCode') && <div className="invalid-feedback d-block">{getFieldError('users', 'zipCode')}</div>}</div>
              <div className="col-md-3"><label className="form-label">Profile Picture URL</label><input className={getFieldClass('users', 'profilePicture')} value={userForm.profilePicture} onChange={(e) => { setUserForm((prev) => ({ ...prev, profilePicture: e.target.value })); clearFieldError('users', 'profilePicture'); }} />{getFieldError('users', 'profilePicture') && <div className="invalid-feedback d-block">{getFieldError('users', 'profilePicture')}</div>}</div>
              <div className="col-12"><label className="form-label">Address</label><textarea className="form-control" rows="2" value={userForm.address} onChange={(e) => setUserForm((prev) => ({ ...prev, address: e.target.value }))} /></div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-danger" type="submit">{editingIds.users ? 'Update User' : 'Create User'}</button><button className="btn btn-secondary" type="button" onClick={() => cancelEdit('users')}>Cancel</button></div>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminUsersSection;
