import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatRow, DataTable, DownloadFilteredButton } from '../../components/ui'

const ACTION_LABEL = { clock_in: 'Clocked in', clock_out: 'Clocked out' }
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000   // 24h window for the side columns
const LIVE_WINDOW_MS   = 30 * 60 * 1000        // 30-min window for the live ticker
const LIVE_MAX_ITEMS   = 8

const relTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function SecurityDashboard() {
  const { allUsers, clockActivities, user, locations, saveFilterState, getFilterState } = useAuth()
  const [, setTick] = useState(0)   // re-renders to refresh "Xs ago" labels
  const prevIdsRef = useRef(new Set())

  // Refresh relative timestamps every 15s.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000)
    return () => clearInterval(t)
  }, [])

  const saved = getFilterState('security-clock-activities') || {
    staff: '', action: '', dateFrom: '', dateTo: '',
  }
  const [filters, setFilters] = useState(saved)

  const locId = user?.assignedLocationId
  const loc = locations[locId]

  const setFilter = useCallback((key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    saveFilterState('security-clock-activities', next)
  }, [filters, saveFilterState])

  const clearFilters = () => {
    const reset = { staff: '', action: '', dateFrom: '', dateTo: '' }
    setFilters(reset)
    saveFilterState('security-clock-activities', reset)
  }

  // Everything scoped to this guard's assigned location.
  const siteActivities = useMemo(
    () => clockActivities.filter((a) => a.locationId === locId),
    [clockActivities, locId]
  )

  // Recent (24h) — split into ins and outs for the side columns.
  const cutoff24h = Date.now() - RECENT_WINDOW_MS
  const recent24h = useMemo(() => {
    return siteActivities
      .filter((a) => new Date(a.timestamp).getTime() >= cutoff24h)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [siteActivities, cutoff24h])

  const recentIns  = recent24h.filter((a) => a.action === 'clock_in').slice(0, 15)
  const recentOuts = recent24h.filter((a) => a.action === 'clock_out').slice(0, 15)

  // Live ticker — latest activity in the last 30 minutes, single column,
  // newest at the top. Flashes briefly on new arrivals.
  const cutoff30m = Date.now() - LIVE_WINDOW_MS
  const liveFeed = useMemo(() => {
    return siteActivities
      .filter((a) => new Date(a.timestamp).getTime() >= cutoff30m)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, LIVE_MAX_ITEMS)
  }, [siteActivities, cutoff30m])

  // Track which IDs are "new" since the last render so we can highlight them briefly.
  const newIds = useMemo(() => {
    const curr = new Set(liveFeed.map((a) => a.id))
    const added = new Set()
    for (const id of curr) if (!prevIdsRef.current.has(id)) added.add(id)
    prevIdsRef.current = curr
    return added
  }, [liveFeed])

  const filtered = useMemo(() => {
    let arr = siteActivities
    if (filters.staff) {
      const q = filters.staff.toLowerCase()
      arr = arr.filter((a) =>
        a.staffName?.toLowerCase().includes(q) ||
        a.staffEmail?.toLowerCase().includes(q)
      )
    }
    if (filters.action) arr = arr.filter((a) => a.action === filters.action)
    if (filters.dateFrom) arr = arr.filter((a) => new Date(a.timestamp) >= new Date(filters.dateFrom))
    if (filters.dateTo)   arr = arr.filter((a) => new Date(a.timestamp) <= new Date(filters.dateTo + 'T23:59:59'))
    return arr
  }, [siteActivities, filters])

  const today = new Date().toDateString()
  const todayActs = siteActivities.filter((a) => new Date(a.timestamp).toDateString() === today)
  const staffAtSite = Object.values(allUsers).filter((u) => u.assignedLocationId === locId || u.locationId === locId)
  const onSite = staffAtSite.filter((u) => u.isClockedIn).length

  const columns = [
    { key: 'timestamp', label: 'Time', render: (a) => (
      <div>
        <div className="fw-semibold">{new Date(a.timestamp).toLocaleDateString()}</div>
        <small className="text-muted">{new Date(a.timestamp).toLocaleTimeString()}</small>
      </div>
    )},
    { key: 'staffName', label: 'Staff', render: (a) => (
      <div>
        <div className="fw-semibold">{a.staffName}</div>
        <small className="text-muted">{a.staffEmail}</small>
      </div>
    )},
    { key: 'department', label: 'Department', render: (a) => a.department
      ? <span className="tag tag-neutral">{a.department}</span>
      : <span className="text-muted">—</span>
    },
    { key: 'action', label: 'Type', render: (a) => (
      <span className={`activity-badge ${a.action === 'clock_in' ? 'clock-in' : 'clock-out'}`}>
        <i className={`fas ${a.action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'}`}></i>
        {(a.action || '').replace('_', ' ').toUpperCase()}
      </span>
    )},
  ]

  // Small rendering helper for the side-column lists.
  const renderActivityItem = (a) => (
    <div key={a.id} className="activity-item">
      <div className="activity-item-main">
        <div className="fw-semibold small">{a.staffName}</div>
        <div className="text-muted" style={{ fontSize: '.75rem' }}>{a.department || 'No department'}</div>
      </div>
      <div className="activity-item-time">
        <div className="small">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <small className="text-muted">{relTime(a.timestamp)}</small>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Security Dashboard" subtitle="Site monitoring at a glance" />
      <div className="page-content">
        {/* ───── Site information card ───── */}
        <div className="card mb-4 site-info-card">
          <div className="card-body">
            <div className="row align-items-center g-3">
              <div className="col-md-8">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="site-info-pill">
                    <i className="fas fa-shield-halved"></i>Security Post
                  </span>
                </div>
                <h4 className="mb-1 fw-bold">{loc?.name || 'No site assigned'}</h4>
                {loc?.address ? (
                  <div className="text-muted">
                    <i className="fas fa-map-marker-alt me-1 text-danger"></i>{loc.address}
                  </div>
                ) : (
                  <div className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>No address on file
                  </div>
                )}
                {loc && loc.isActive === false && (
                  <div className="text-warning small mt-2">
                    <i className="fas fa-exclamation-triangle me-1"></i>This site is currently inactive.
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="site-info-stats">
                  <div className="site-info-stat">
                    <div className="site-info-stat-value text-primary">{staffAtSite.length}</div>
                    <div className="site-info-stat-label">Affiliated Staff</div>
                  </div>
                  <div className="site-info-stat">
                    <div className="site-info-stat-value text-success">{onSite}</div>
                    <div className="site-info-stat-label">Currently On Site</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Live feed (single column, full width, steady) ───── */}
        <div className="card mb-4 live-feed-card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <span className="live-dot"></span>
              Live Activity <small className="text-muted ms-1">(last 30 min)</small>
            </h6>
            <small className="text-muted">{liveFeed.length} event{liveFeed.length === 1 ? '' : 's'}</small>
          </div>
          <div className="card-body p-0">
            {liveFeed.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="fas fa-satellite-dish d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                <small>Waiting for activity at this site…</small>
              </div>
            ) : (
              <div className="live-feed-list">
                {liveFeed.map((a) => (
                  <div key={a.id} className={`live-feed-item ${newIds.has(a.id) ? 'is-new' : ''}`}>
                    <span className={`activity-badge ${a.action === 'clock_in' ? 'clock-in' : 'clock-out'} live-feed-badge`}>
                      <i className={`fas ${a.action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'}`}></i>
                      {ACTION_LABEL[a.action] || a.action}
                    </span>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{a.staffName}</div>
                      <small className="text-muted">{a.department || 'No department'}</small>
                    </div>
                    <div className="text-end">
                      <div className="small fw-semibold">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <small className="text-muted">{relTime(a.timestamp)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ───── Recent ins / outs (two columns) ───── */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-sign-in-alt text-success me-2"></i>Recent Clock-Ins
                  <small className="text-muted ms-1">(24h)</small>
                </h6>
                <span className="activity-badge clock-in">{recentIns.length}</span>
              </div>
              <div className="card-body p-0" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {recentIns.length === 0
                  ? <div className="text-center text-muted py-4 small">No clock-ins in the last 24 hours.</div>
                  : recentIns.map(renderActivityItem)
                }
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-sign-out-alt text-danger me-2"></i>Recent Clock-Outs
                  <small className="text-muted ms-1">(24h)</small>
                </h6>
                <span className="activity-badge clock-out">{recentOuts.length}</span>
              </div>
              <div className="card-body p-0" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {recentOuts.length === 0
                  ? <div className="text-center text-muted py-4 small">No clock-outs in the last 24 hours.</div>
                  : recentOuts.map(renderActivityItem)
                }
              </div>
            </div>
          </div>
        </div>

        {/* ───── Today's totals ───── */}
        <StatRow stats={[
          { icon: 'fa-list',          color: 'primary', value: todayActs.length,                                                label: 'Activities Today' },
          { icon: 'fa-sign-in-alt',   color: 'success', value: todayActs.filter((a) => a.action === 'clock_in').length,        label: 'Check-ins Today' },
          { icon: 'fa-sign-out-alt',  color: 'danger',  value: todayActs.filter((a) => a.action === 'clock_out').length,       label: 'Check-outs Today' },
          { icon: 'fa-database',      color: 'info',    value: siteActivities.length,                                          label: 'Total Records' },
        ]} />

        {/* ───── Filters ───── */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-filter me-2"></i>Activity Filters</h6>
            <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
              <i className="fas fa-times me-1"></i>Clear
            </button>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-4">
                <label className="form-label small text-muted mb-1">Actor</label>
                <input className="form-control" placeholder="Name or email..."
                  value={filters.staff} onChange={(e) => setFilter('staff', e.target.value)} />
              </div>
              <div className="col-lg-3">
                <label className="form-label small text-muted mb-1">Type</label>
                <select className="form-select" value={filters.action} onChange={(e) => setFilter('action', e.target.value)}>
                  <option value="">All Types</option>
                  <option value="clock_in">Clock In</option>
                  <option value="clock_out">Clock Out</option>
                </select>
              </div>
              <div className="col-lg-5">
                <label className="form-label small text-muted mb-1">Time Range</label>
                <div className="input-group">
                  <input type="date" className="form-control" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} />
                  <span className="input-group-text">to</span>
                  <input type="date" className="form-control" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Full activities list ───── */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-clipboard-list me-2"></i>All Clock Activities ({filtered.length})</h6>
            <DownloadFilteredButton
              rows={filtered}
              filename={`site-activities-${loc?.name || 'site'}`}
              columns={[
                { key: 'timestamp', label: 'Timestamp' },
                { key: 'staffName', label: 'Staff' },
                { key: 'staffEmail', label: 'Email' },
                { key: 'department', label: 'Department' },
                { key: 'action', label: 'Type' },
              ]}
            />
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            defaultSort={{ key: 'timestamp', dir: 'desc' }}
            emptyIcon="fa-search"
            emptyText="No activities at this site match your filters."
            onClear={clearFilters}
          />
        </div>
      </div>
    </div>
  )
}
