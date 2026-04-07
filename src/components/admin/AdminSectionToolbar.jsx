function AdminSectionToolbar({
  searchSlot,
  actionLabel,
  onAction,
  actionPrefix = '+',
  actionButtonType = 'button',
  className = '',
}) {
  return (
    <div className={`admin-section-toolbar ${className}`.trim()}>
      <div className="admin-section-toolbar-search">{searchSlot}</div>
      {actionLabel ? (
        <button
          type={actionButtonType}
          className="admin-add-btn admin-section-toolbar-action"
          onClick={onAction}
        >
          {actionPrefix ? <span>{actionPrefix}</span> : null}
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

export default AdminSectionToolbar;
