import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/seedUsers'
import { PageHeader, StatRow } from '../../components/ui'

export default function RequestLeave() {
  const { submitLeaveRequest, rawLeaveRequests, user, LEAVE_TYPES } = useAuth()
  const [form, setForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const myReqs = rawLeaveRequests.filter(r => r.staffId === user.id)
  const annual = useMemo(() => {
    const year = new Date().getFullYear()
    const used = myReqs.filter(r => r.type === 'Annual' && new Date(r.startDate).getFullYear() === year && ['approved','pending'].includes(r.status))
      .reduce((t, r) => t + Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1, 0)
    return { used, remaining: 18 - used }
  }, [myReqs])

  const days = form.startDate && form.endDate ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1 : 0
  const needsReason = form.type === 'Emergency' || form.type === 'Sick'

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      if (new Date(form.endDate) < new Date(form.startDate)) throw new Error('End date must be after start date')
      if (needsReason && !form.reason.trim()) throw new Error(`Reason required for ${form.type} leave`)
      if (form.type === 'Annual' && days > annual.remaining && !isCEO(user)) throw new Error(`Exceeds limit: ${annual.remaining} days remaining`)
      await submitLeaveRequest({ ...form, type: form.type.toLowerCase() })
      setSuccess(isCEO(user) ? 'Leave auto-approved!' : 'Leave request submitted!')
      setForm({ type: 'Annual', startDate: '', endDate: '', reason: '' })
    } catch (err) { setError(err.message) }
  }

  const statusBadge = (s) => ({ pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' }[s] || 'bg-secondary')

  return (
    <div>
      <PageHeader title="Request Leave" subtitle={isCEO(user) ? 'Executive Leave with Auto-Approval' : 'Submit leave requests for approval'} />
      <div className="page-content">
        <StatRow stats={[
          { value: 18, label: 'Annual Days/Year', color: 'primary' },
          { value: annual.used, label: 'Used/Pending', color: 'warning' },
          { value: annual.remaining, label: 'Remaining', color: annual.remaining > 5 ? 'success' : 'danger' },
        ]} />

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card"><div className="card-header"><h5 className="mb-0">New Request</h5></div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3"><label className="form-label">Leave Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, reason: '' }))}>{LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="row g-3 mb-3">
                    <div className="col-6"><label className="form-label">Start</label><input type="date" className="form-control" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} required /></div>
                    <div className="col-6"><label className="form-label">End</label><input type="date" className="form-control" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} min={form.startDate || new Date().toISOString().split('T')[0]} required /></div>
                  </div>
                  {needsReason && <div className="mb-3"><label className="form-label">Reason *</label><textarea className="form-control" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows="3" required /></div>}
                  {days > 0 && <div className="p-2 bg-light rounded mb-3"><span className="text-muted">Duration:</span> <span className="badge bg-info">{days} day{days !== 1 ? 's' : ''}</span></div>}
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  {success && <div className="alert alert-success py-2">{success}</div>}
                  <button type="submit" className="btn btn-warning w-100" disabled={!isCEO(user) && form.type === 'Annual' && annual.remaining === 0}><i className="fas fa-paper-plane me-2"></i>{isCEO(user) ? 'Submit & Auto-Approve' : 'Submit'}</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card"><div className="card-header"><h5 className="mb-0">My Requests</h5></div>
              <div className="card-body">
                {myReqs.length === 0 ? <p className="text-muted text-center py-4">No leave requests yet.</p> :
                  myReqs.map(r => (
                    <div key={r.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between"><div><div className="fw-semibold">{r.type} Leave</div><small className="text-muted">{r.startDate} to {r.endDate}</small></div>
                        <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
