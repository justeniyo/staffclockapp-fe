import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, DataTable, DownloadFilteredButton, StatRow, LeaveStatusBadge } from '../../components/ui'
import { LEAVE_TYPES, getLeaveType } from '../../config/leaveTypes'

// Admin-wide leave requests overview. Read-only — managers approve/reject
// from their own page; this is for company-wide visibility.
export default function AdminLeaveRequests() {
  const { leaveRequests, saveFilterState, getFilterState } = useAuth()
  const saved = getFilterState('admin-leave-requests') || { search: '', type: '', status: 'all', department: '', dateFrom: '', dateTo: '' }
  const [filters, setFilters] = useState(saved)

  const stats = useMemo(() => ({
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  }), [leaveRequests])

  const departments = useMemo(() => [...new Set(leaveRequests.map(r => r.department).filter(Boolean))].sort(), [leaveRequests])

  const filtered = useMemo(() => {
    let arr = [...leaveRequests]
    if (filters.search) {
      const q = filters.search.toLowerCase()
      arr = arr.filter(r => r.staffName?.toLowerCase().includes(q) || r.staffEmail?.toLowerCase().includes(q))
    }
    if (filters.type) arr = arr.filter(r => r.type === filters.type)
    if (filters.status !== 'all') arr = arr.filter(r => r.status === filters.status)
    if (filters.department) arr = arr.filter(r => r.department === filters.department)
    if (filters.dateFrom) arr = arr.filter(r => new Date(r.startDate) >= new Date(filters.dateFrom))
    if (filters.dateTo) arr = arr.filter(r => new Date(r.startDate) <= new Date(filters.dateTo))
    return arr
  }, [leaveRequests, filters])

  const setFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    saveFilterState('admin-leave-requests', next)
  }

  const clearFilters = () => {
    const reset = { search: '', type: '', status: 'all', department: '', dateFrom: '', dateTo: '' }
    setFilters(reset)
    saveFilterState('admin-leave-requests', reset)
  }

  const columns = [
    { key: 'staffName', label: 'Employee', render: (r) => (<>
      <div className="fw-semibold">{r.staffName}</div>
      <small className="text-muted">{r.staffEmail}</small>
    </>) },
    { key: 'department', label: 'Department', render: (r) => r.department || <span className="text-muted">—</span> },
    { key: 'managerName', label: 'Manager', render: (r) => r.managerName || <span className="text-muted">—</span> },
    { key: 'type', label: 'Type', render: (r) => <span className="text-capitalize">{getLeaveType(r.type)?.label || r.type}</span> },
    { key: 'startDate', label: 'From' },
    { key: 'endDate', label: 'To' },
    { key: 'dayCount', label: 'Period (days)', render: (r) => (
      <span className="days-badge">
        <i className="fas fa-calendar-day"></i>
        {r.dayCount} day{r.dayCount === 1 ? '' : 's'}
      </span>
    ) },
    { key: 'requestDate', label: 'Requested', render: (r) => r.requestDate
      ? new Date(r.requestDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
      : <span className="text-muted">—</span> },
    { key: 'status', label: 'Status', render: (r) => <LeaveStatusBadge status={r.status} /> },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || <span className="text-muted">—</span> },
  ]

  return (
    <div>
      <PageHeader title="Leave Requests Overview" subtitle={`${filtered.length} of ${stats.total} requests`} />
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-list',          color: 'primary', value: stats.total,    label: 'Total Requests' },
          { icon: 'fa-hourglass-half', color: 'warning', value: stats.pending,  label: 'Pending Review' },
          { icon: 'fa-check-circle',   color: 'success', value: stats.approved, label: 'Approved' },
          { icon: 'fa-times-circle',   color: 'danger',  value: stats.rejected, label: 'Rejected' },
        ]} />

        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Filters</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                <i className="fas fa-times me-1"></i>Clear
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3">
                <input className="form-control" placeholder="Search name or email..." value={filters.search} onChange={e => setFilter('search', e.target.value)} />
              </div>
              <div className="col-lg-2">
                <select className="form-select" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
                  <option value="">All Types</option>
                  {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="col-lg-2">
                <select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-lg-2">
                <select className="form-select" value={filters.department} onChange={e => setFilter('department', e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-lg-3">
                <div className="input-group">
                  <input type="date" className="form-control" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
                  <span className="input-group-text">→</span>
                  <input type="date" className="form-control" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Leave Requests</h6>
            <DownloadFilteredButton
              rows={filtered}
              filename="leave-requests"
              columns={[
                { key: 'staffName', label: 'Employee' },
                { key: 'staffEmail', label: 'Email' },
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
          <DataTable
            data={filtered}
            columns={columns}
            defaultSort={{ key: 'requestDate', dir: 'desc' }}
            emptyIcon="fa-calendar-times"
            emptyText="No leave requests found."
            onClear={clearFilters}
          />
        </div>
      </div>
    </div>
  )
}
