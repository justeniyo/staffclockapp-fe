import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatRow, DataTable, DownloadFilteredButton } from '../../components/ui'

export default function ClockActivities() {
  const { clockActivities, allUsers, locations, saveFilterState, getFilterState } = useAuth()

  const saved = getFilterState('admin-clock-activities') || { staff: '', department: '', action: '', dateFrom: '', dateTo: '', location: '' }
  const [filters, setFilters] = useState(saved)

  const departments = [...new Set(Object.values(allUsers).map(u => u.department).filter(Boolean))]

  const setFilter = useCallback((key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    saveFilterState('admin-clock-activities', next)
  }, [filters, saveFilterState])
  const clearFilters = () => { const d = { staff: '', department: '', action: '', dateFrom: '', dateTo: '', location: '' }; setFilters(d); saveFilterState('admin-clock-activities', d) }

  const filtered = useMemo(() => {
    let arr = clockActivities
    if (filters.staff) arr = arr.filter(a => a.staffName.toLowerCase().includes(filters.staff.toLowerCase()) || a.staffEmail.toLowerCase().includes(filters.staff.toLowerCase()))
    if (filters.department) arr = arr.filter(a => a.department === filters.department)
    if (filters.action) arr = arr.filter(a => a.action === filters.action)
    if (filters.location) arr = arr.filter(a => a.locationId == filters.location)
    if (filters.dateFrom) arr = arr.filter(a => new Date(a.timestamp) >= new Date(filters.dateFrom))
    if (filters.dateTo) arr = arr.filter(a => new Date(a.timestamp) <= new Date(filters.dateTo + 'T23:59:59'))
    return arr
  }, [clockActivities, filters])

  const today = new Date().toDateString()
  const todayAct = clockActivities.filter(a => new Date(a.timestamp).toDateString() === today)

  const actionBadge = (a) => ({ clock_in: 'bg-success', clock_out: 'bg-danger', location_add: 'bg-info', location_remove: 'bg-warning text-dark' }[a] || 'bg-secondary')
  const actionIcon = (a) => ({ clock_in: 'fa-sign-in-alt', clock_out: 'fa-sign-out-alt' }[a] || 'fa-question')

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (a) => (
      <div><div className="fw-semibold">{new Date(a.timestamp).toLocaleDateString()}</div><small className="text-muted">{new Date(a.timestamp).toLocaleTimeString()}</small></div>
    )},
    { key: 'staffName', label: 'Staff', render: (a) => <div><div className="fw-semibold">{a.staffName}</div><small className="text-muted">{a.staffEmail}</small></div> },
    { key: 'department', label: 'Department', render: (a) => <span className="tag tag-neutral">{a.department}</span> },
    { key: 'action', label: 'Action', render: (a) => (
      <span className={`badge ${actionBadge(a.action)}`}><i className={`fas ${actionIcon(a.action)} me-1`}></i>{a.action.replace('_', ' ').toUpperCase()}</span>
    )},
    { key: 'location', label: 'Location', render: (a) => <span><i className="fas fa-map-marker-alt me-1"></i>{a.location}</span> },
  ]

  return (
    <div>
      <PageHeader title="Clock Activities" subtitle={`${filtered.length} of ${clockActivities.length} activities`} />
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-list', color: 'primary', value: clockActivities.length, label: 'Total' },
          { icon: 'fa-clock', color: 'info', value: todayAct.length, label: 'Today' },
          { icon: 'fa-sign-in-alt', color: 'success', value: todayAct.filter(a => a.action === 'clock_in').length, label: 'Clock Ins' },
          { icon: 'fa-sign-out-alt', color: 'danger', value: todayAct.filter(a => a.action === 'clock_out').length, label: 'Clock Outs' },
        ]} />

        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center"><h6 className="mb-0">Filters</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}><i className="fas fa-times me-1"></i>Clear</button></div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3"><input className="form-control" placeholder="Name or email..." value={filters.staff} onChange={e => setFilter('staff', e.target.value)} /></div>
              <div className="col-lg-2"><select className="form-select" value={filters.department} onChange={e => setFilter('department', e.target.value)}><option value="">All Depts</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div className="col-lg-2"><select className="form-select" value={filters.action} onChange={e => setFilter('action', e.target.value)}><option value="">All Actions</option><option value="clock_in">Clock In</option><option value="clock_out">Clock Out</option></select></div>
              <div className="col-lg-2"><select className="form-select" value={filters.location} onChange={e => setFilter('location', e.target.value)}><option value="">All Locations</option>{Object.values(locations).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
              <div className="col-lg-3"><div className="input-group"><input type="date" className="form-control" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} /><span className="input-group-text">to</span><input type="date" className="form-control" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} /></div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Activity Log</h6>
            <DownloadFilteredButton
              rows={filtered}
              filename="clock-activities"
              columns={[
                { key: 'timestamp', label: 'Timestamp' },
                { key: 'staffName', label: 'Staff' },
                { key: 'staffEmail', label: 'Email' },
                { key: 'department', label: 'Department' },
                { key: 'action', label: 'Action' },
                { key: 'location', label: 'Location' },
              ]}
            />
          </div>
          <DataTable data={filtered} columns={columns} defaultSort={{ key: 'timestamp', dir: 'desc' }} emptyIcon="fa-search" emptyText="No activities found." onClear={clearFilters} />
        </div>
      </div>
    </div>
  )
}
