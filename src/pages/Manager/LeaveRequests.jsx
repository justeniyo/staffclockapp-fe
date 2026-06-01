import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, DataTable, ConfirmModal, DownloadFilteredButton } from '../../components/ui'

export default function LeaveRequests() {
  const { leaveRequests, processLeaveRequest, user, allUsers, saveFilterState, getFilterState } = useAuth()
  const saved = getFilterState('manager-leave-requests') || { search: '', type: '', status: 'all', dateFrom: '', dateTo: '' }
  const [filters, setFilters] = useState(saved)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [action, setAction] = useState('')

  const teamIds = useMemo(() => Object.values(allUsers).filter(s => s.managerId === user.id).map(m => m.id), [allUsers, user.id])

  const filtered = useMemo(() => {
    let arr = leaveRequests.filter(r => teamIds.includes(r.staffId))
    if (filters.search) arr = arr.filter(r => r.staffName?.toLowerCase().includes(filters.search.toLowerCase()))
    if (filters.type) arr = arr.filter(r => r.type === filters.type)
    if (filters.status !== 'all') arr = arr.filter(r => r.status === filters.status)
    if (filters.dateFrom) arr = arr.filter(r => new Date(r.startDate) >= new Date(filters.dateFrom))
    if (filters.dateTo) arr = arr.filter(r => new Date(r.startDate) <= new Date(filters.dateTo))
    return arr
  }, [leaveRequests, teamIds, filters])

  const setFilter = useCallback((k, v) => { const n = { ...filters, [k]: v }; setFilters(n); saveFilterState('manager-leave-requests', n) }, [filters, saveFilterState])
  const clearFilters = () => { const d = { search: '', type: '', status: 'all', dateFrom: '', dateTo: '' }; setFilters(d); saveFilterState('manager-leave-requests', d) }

  const handleProcess = (status) => { processLeaveRequest(selected.id, status, notes); setSelected(null); setNotes(''); setAction('') }

  const statusBadge = (s) => ({ pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' }[s] || 'bg-secondary')
  const typeIcon = (t) => ({ Annual: 'fa-calendar', Sick: 'fa-thermometer-half', Personal: 'fa-user', Emergency: 'fa-exclamation-triangle' }[t] || 'fa-question')
  const days = (s, e) => Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1

  const columns = [
    { key: 'staffName', label: 'Employee', render: (r) => <div><div className="fw-semibold">{r.staffName}</div><small className="text-muted">{r.department}</small></div> },
    { key: 'type', label: 'Type', render: (r) => <span className="badge bg-light text-dark"><i className={`fas ${typeIcon(r.type)} me-1`}></i>{r.type}</span> },
    { key: 'startDate', label: 'Dates', render: (r) => <div><div className="fw-semibold">{r.startDate}</div><small className="text-muted">to {r.endDate}</small></div> },
    { key: 'duration', label: 'Duration', sortable: false, render: (r) => <span className="badge bg-info">{days(r.startDate, r.endDate)}d</span> },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span> },
    { key: 'requestDate', label: 'Requested', render: (r) => <small>{new Date(r.requestDate).toLocaleDateString()}</small> },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => r.status === 'pending' ? (
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-success" onClick={() => { setSelected(r); setAction('approve') }}><i className="fas fa-check"></i></button>
        <button className="btn btn-outline-danger" onClick={() => { setSelected(r); setAction('reject') }}><i className="fas fa-times"></i></button>
      </div>
    ) : <button className="btn btn-outline-primary btn-sm" onClick={() => { setSelected(r); setAction('') }}><i className="fas fa-eye"></i></button> },
  ]

  return (
    <div>
      <PageHeader title="Team Leave Requests" subtitle={`${filtered.length} requests`} />
      <div className="page-content">
        <div className="card mb-4"><div className="card-header"><div className="d-flex justify-content-between align-items-center"><h6 className="mb-0">Filters</h6><button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}><i className="fas fa-times me-1"></i>Clear</button></div></div>
          <div className="card-body"><div className="row g-3">
            <div className="col-lg-3"><input className="form-control" placeholder="Employee name..." value={filters.search} onChange={e => setFilter('search', e.target.value)} /></div>
            <div className="col-lg-2"><select className="form-select" value={filters.type} onChange={e => setFilter('type', e.target.value)}><option value="">All Types</option>{['Annual','Sick','Personal','Emergency'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="col-lg-2"><select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
            <div className="col-lg-5"><div className="input-group"><input type="date" className="form-control" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} /><span className="input-group-text">to</span><input type="date" className="form-control" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} /></div></div>
          </div></div>
        </div>
        <div className="card"><div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Leave Requests</h6>
            <DownloadFilteredButton
              rows={filtered}
              filename="leave-requests"
              columns={[
                { key: 'staffName', label: 'Employee' },
                { key: 'department', label: 'Department' },
                { key: 'type', label: 'Type' },
                { key: 'startDate', label: 'Start Date' },
                { key: 'endDate', label: 'End Date' },
                { key: 'status', label: 'Status' },
                { key: 'reason', label: 'Reason' },
                { key: 'processedByName', label: 'Reviewed By' },
                { key: 'processedDate', label: 'Reviewed At' },
                { key: 'processingNotes', label: 'Review Notes' },
              ]}
            />
          </div>
          <DataTable data={filtered} columns={columns} defaultSort={{ key: 'requestDate', dir: 'desc' }} emptyIcon="fa-calendar-times" emptyText="No leave requests found." onClear={clearFilters} />
        </div>

        <ConfirmModal show={!!selected} title={`${action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Review'} Leave`} icon="fa-calendar-check" size="lg"
          variant={action === 'reject' ? 'danger' : 'success'} confirmText={action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : null}
          confirmDisabled={action === 'reject' && !notes.trim()}
          onClose={() => { setSelected(null); setNotes(''); setAction('') }}
          onConfirm={action ? () => handleProcess(action === 'approve' ? 'approved' : 'rejected') : undefined}>
          {selected && (<div className="row g-3">
            {[['Employee', selected.staffName],['Type', selected.type],['Dates', `${selected.startDate} to ${selected.endDate}`],['Status', selected.status]].map(([l, v]) =>
              <div key={l} className="col-md-6"><label className="form-label fw-bold">{l}</label><div className="p-2 bg-light rounded">{v}</div></div>
            )}
            {selected.status === 'pending' && <div className="col-12"><label className="form-label fw-bold">{action === 'reject' ? 'Rejection Reason *' : 'Notes'}</label>
              <textarea className="form-control" value={notes} onChange={e => setNotes(e.target.value)} rows="3" placeholder={action === 'reject' ? 'Reason for rejection...' : 'Optional notes...'} /></div>}
          </div>)}
        </ConfirmModal>
      </div>
    </div>
  )
}
