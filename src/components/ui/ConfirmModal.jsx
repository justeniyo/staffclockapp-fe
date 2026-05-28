/**
 * Reusable confirmation/action modal.
 *
 * <ConfirmModal show={true} title="Delete?" onClose={close} onConfirm={action} confirmText="Delete" variant="danger">
 *   <p>Are you sure?</p>
 * </ConfirmModal>
 */
export default function ConfirmModal({
  show, title, children, onClose, onConfirm,
  confirmText = 'Confirm', cancelText = 'Cancel',
  variant = 'warning', confirmDisabled = false, icon,
  size = '',
}) {
  if (!show) return null
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog ${size ? `modal-${size}` : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {icon && <i className={`fas ${icon} me-2`}></i>}
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="fas fa-times me-1"></i>{cancelText}
            </button>
            {onConfirm && (
              <button className={`btn btn-${variant}`} onClick={onConfirm} disabled={confirmDisabled}>
                <i className={`fas ${variant === 'danger' ? 'fa-trash' : 'fa-check'} me-1`}></i>
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
