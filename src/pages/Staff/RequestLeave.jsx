import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/seedUsers'
import { LEAVE_TYPES, getLeaveType, leaveTypeRequiresReason } from '../../config/leaveTypes'
import { PageHeader, StatRow, ConfirmModal, LeaveStatusBadge } from '../../components/ui'

const ANNUAL_ALLOWANCE = 18

export default function RequestLeave() {
  const { submitLeaveRequest, updateLeaveRequest, cancelLeaveRequest, rawLeaveRequests, user } = useAuth()

  const empty = { type: 'annual', startDate: '', endDate: '', reason: '' }
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)         // ID of the request being edited
  const [showOptionalReason, setShowOptionalReason] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)   // request pending cancellation

  const myReqs = rawLeaveRequests
    .filter((r) => r.staffId === user.id)
    .sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))

  const annual = useMemo(() => {
    const year = new Date().getFullYear()
    const used = myReqs
      .filter((r) => r.type?.toLowerCase() === 'annual' && new Date(r.startDate).getFullYear() === year && ['approved', 'pending'].includes(r.status))
      .reduce((t, r) => t + Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1, 0)
    return { used, remaining: Math.max(0, ANNUAL_ALLOWANCE - used) }
  }, [myReqs])

  const days = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1)
    : 0

  const reasonRequired = leaveTypeRequiresReason(form.type)
  const typeInfo = getLeaveType(form.type)
  const reasonVisible = reasonRequired || showOptionalReason

  useEffect(() => {
    if (reasonRequired) {
      setShowOptionalReason(false)
    } else if (!editingId) {
      setShowOptionalReason(false)
      setForm((prev) => (prev.reason ? { ...prev, reason: '' } : prev))
    }
  }, [form.type, reasonRequired, editingId])

  const beginEdit = (req) => {
    setEditingId(req.id)
    setForm({
      type: (req.type || 'annual').toLowerCase(),
      startDate: req.startDate || '',
      endDate: req.endDate || '',
      reason: req.reason || '',
    })
    setShowOptionalReason(!!req.reason && !leaveTypeRequiresReason((req.type || '').toLowerCase()))
    setError(''); setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(empty)
    setShowOptionalReason(false)
    setError(''); setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.startDate || !form.endDate) return setError('Please pick both a start and end date.')
    if (new Date(form.endDate) < new Date(form.startDate)) return setError('End date must be on or after start date.')
    if (reasonRequired && !form.reason.trim()) return setError(`Please provide a reason for ${typeInfo.label.toLowerCase()} leave.`)
    if (!editingId && form.type === 'annual' && days > annual.remaining && !isCEO(user)) {
      return setError(`This request (${days} day${days !== 1 ? 's' : ''}) exceeds your remaining annual allowance of ${annual.remaining} day${annual.remaining !== 1 ? 's' : ''}.`)
    }

    setSubmitting(true)
    try {
      const trimmedReason = form.reason.trim()
      const payload = {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      }

      if (editingId) {
        await updateLeaveRequest(editingId, payload)
        setSuccess('Request updated.')
      } else {
        await submitLeaveRequest(payload)
        setSuccess(isCEO(user) ? 'Leave auto-approved.' : 'Leave request submitted for review.')
      }
      setForm(empty)
      setEditingId(null)
      setShowOptionalReason(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelLeaveRequest(cancelTarget.id)
      if (editingId === cancelTarget.id) cancelEdit()
      setCancelTarget(null)
    } catch (err) {
      setError(err.message)
      setCancelTarget(null)
    }
  }


  const annualExhausted = !editingId && !isCEO(user) && form.type === 'annual' && annual.remaining === 0

  return (
    <div>
      <PageHeader title="Request Leave" subtitle={isCEO(user) ? 'Executive leave with auto-approval' : 'Submit and manage your leave requests'} />
      <div className="page-content">
        <StatRow stats={[
          { value: ANNUAL_ALLOWANCE, label: 'Annual Days/Year', color: 'primary' },
          { value: annual.used, label: 'Used / Pending', color: 'warning' },
          { value: annual.remaining, label: 'Remaining', color: annual.remaining > 5 ? 'success' : 'danger' },
        ]} />

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{editingId ? 'Edit Request' : 'New Request'}</h5>
                {editingId && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>
                    <i className="fas fa-times me-1"></i>Cancel edit
                  </button>
                )}
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select className="form-select" value={form.type} disabled={submitting}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                      {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {typeInfo && <small className="text-muted">{typeInfo.description}</small>}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" required value={form.startDate}
                        min={editingId ? undefined : new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                        disabled={submitting} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" required value={form.endDate}
                        min={form.startDate || (editingId ? undefined : new Date().toISOString().split('T')[0])}
                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                        disabled={submitting} />
                    </div>
                  </div>

                  {reasonVisible ? (
                    <div className="mb-3">
                      <label className="form-label">
                        Reason {reasonRequired && <span className="text-danger">*</span>}
                        {!reasonRequired && (
                          <button type="button" className="btn btn-link btn-sm p-0 ms-2 text-decoration-none"
                            onClick={() => { setShowOptionalReason(false); setForm((p) => ({ ...p, reason: '' })) }}
                            disabled={submitting}>Remove</button>
                        )}
                      </label>
                      <textarea className="form-control" rows="3" required={reasonRequired}
                        value={form.reason}
                        onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                        disabled={submitting}
                        placeholder={reasonRequired
                          ? `Briefly explain your ${typeInfo.label.toLowerCase()} leave request`
                          : 'Add any context for your manager (optional)'}
                        maxLength={1000} />
                      <small className="text-muted">{form.reason.length}/1000 characters</small>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none"
                        onClick={() => setShowOptionalReason(true)} disabled={submitting}>
                        <i className="fas fa-plus me-1"></i>Add a note for your manager (optional)
                      </button>
                    </div>
                  )}

                  {days > 0 && (
                    <div className="p-2 bg-light rounded mb-3">
                      <span className="text-muted me-2">Duration:</span>
                      <span className="days-badge">
                        <i className="fas fa-calendar-day"></i>
                        {days} day{days !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  {success && <div className="alert alert-success py-2">{success}</div>}

                  <button type="submit" className="btn btn-warning w-100" disabled={submitting || annualExhausted}>
                    {submitting
                      ? <><i className="fas fa-spinner fa-spin me-2"></i>{editingId ? 'Saving…' : 'Submitting…'}</>
                      : <><i className={`fas ${editingId ? 'fa-save' : 'fa-paper-plane'} me-2`}></i>
                          {editingId ? 'Save Changes' : (isCEO(user) ? 'Submit & Auto-Approve' : 'Submit')}</>}
                  </button>
                  {annualExhausted && (
                    <small className="d-block text-danger text-center mt-2">
                      You've used your full annual allowance for this year.
                    </small>
                  )}
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card">
              <div className="card-header"><h5 className="mb-0">My Requests ({myReqs.length})</h5></div>
              <div className="card-body" style={{ maxHeight: 600, overflowY: 'auto' }}>
                {myReqs.length === 0 ? (
                  <p className="text-muted text-center py-4">No leave requests yet.</p>
                ) : myReqs.map((r) => {
                  const info = getLeaveType((r.type || '').toLowerCase())
                  const isPending = r.status === 'pending'
                  const isEditing = editingId === r.id
                  return (
                    <div key={r.id} className={`border rounded p-3 mb-3 ${isEditing ? 'border-warning bg-warning-subtle' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{info?.label || r.type} Leave</div>
                          <small className="text-muted d-block">{r.startDate} → {r.endDate} ({r.dayCount || 0} day{(r.dayCount || 0) !== 1 ? 's' : ''})</small>
                          {r.requestDate && (
                            <small className="text-muted d-block">
                              <i className="fas fa-clock me-1"></i>
                              Submitted {new Date(r.requestDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </small>
                          )}
                          {r.reason && <div className="small text-muted mt-1 fst-italic">"{r.reason}"</div>}
                          {r.processedByName && (
                            <div className="small text-muted mt-1">
                              {r.status} by {r.processedByName}
                              {r.processedDate && <span> on {new Date(r.processedDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>}
                              {r.processingNotes && <span> · "{r.processingNotes}"</span>}
                            </div>
                          )}
                        </div>
                        <LeaveStatusBadge status={r.status} />
                      </div>
                      {isPending && (
                        <div className="d-flex gap-2 mt-2">
                          {!isEditing && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => beginEdit(r)}>
                              <i className="fas fa-pen me-1"></i>Edit
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelTarget(r)}>
                            <i className="fas fa-ban me-1"></i>Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {cancelTarget && (
          <ConfirmModal
            title="Cancel Leave Request"
            confirmLabel="Yes, cancel it"
            confirmVariant="danger"
            onConfirm={confirmCancel}
            onCancel={() => setCancelTarget(null)}
          >
            <p>Cancel your {getLeaveType((cancelTarget.type || '').toLowerCase())?.label} leave for{' '}
              <strong>{cancelTarget.startDate}</strong> to <strong>{cancelTarget.endDate}</strong>?</p>
            <p className="text-muted small mb-0">This can't be undone, but you can submit a new request afterwards.</p>
          </ConfirmModal>
        )}
      </div>
    </div>
  )
}
