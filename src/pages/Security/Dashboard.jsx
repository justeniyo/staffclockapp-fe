import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatRow } from '../../components/ui'

export default function SecurityDashboard() {
  const { allUsers, clockActivities, user, locations } = useAuth()
  const [dateFilter, setDateFilter] = useState('today')

  const locId = user?.assignedLocationId
  const loc = locations[locId]

  const { stats, activities } = useMemo(() => {
    const now = new Date()
    let acts = clockActivities.filter(a => a.locationId === locId)

    if (dateFilter === 'today') acts = acts.filter(a => new Date(a.timestamp).toDateString() === now.toDateString())
    else if (dateFilter === 'yesterday') { const y = new Date(now - 86400000); acts = acts.filter(a => new Date(a.timestamp).toDateString() === y.toDateString()) }
    else if (dateFilter === 'week') { const w = new Date(now - 7 * 86400000); acts = acts.filter(a => new Date(a.timestamp) >= w) }

    const todayActs = clockActivities.filter(a => a.locationId === locId && new Date(a.timestamp).toDateString() === now.toDateString())
    const activeUsers = Object.values(allUsers).filter(u => u.isClockedIn && u.assignedLocationId === locId)

    return {
      stats: { total: Object.values(allUsers).filter(u => u.assignedLocationId === locId).length, active: activeUsers.length, ins: todayActs.filter(a => a.action === 'clock_in').length, outs: todayActs.filter(a => a.action === 'clock_out').length },
      activities: acts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10),
    }
  }, [clockActivities, allUsers, locId, dateFilter])

  return (
    <div>
      <PageHeader title="Security Dashboard" subtitle={`Monitoring: ${loc?.name || 'Unknown'}`}>
        <select className="form-select form-select-sm" style={{ width: 'auto' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This Week</option><option value="all">All</option>
        </select>
      </PageHeader>
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-users', color: 'primary', value: stats.total, label: 'Staff at Site' },
          { icon: 'fa-user-check', color: 'success', value: stats.active, label: 'On Site' },
          { icon: 'fa-sign-in-alt', color: 'info', value: stats.ins, label: 'Check-ins Today' },
          { icon: 'fa-sign-out-alt', color: 'warning', value: stats.outs, label: 'Check-outs Today' },
        ]} />

        <div className="alert alert-info mb-4"><i className="fas fa-info-circle me-2"></i>You can only view activities at <strong>{loc?.name}</strong>.</div>

        <div className="card">
          <div className="card-header"><h6 className="mb-0"><i className="fas fa-clock me-2"></i>Site Activities ({activities.length})</h6></div>
          <div className="card-body">
            {activities.length === 0 ? <p className="text-muted text-center py-4">No recent activities.</p> :
              activities.map(a => (
                <div key={a.id} className="d-flex align-items-center py-2 border-bottom">
                  <i className={`fas ${a.action === 'clock_in' ? 'fa-sign-in-alt text-success' : 'fa-sign-out-alt text-danger'} me-3`}></i>
                  <div className="flex-grow-1"><div className="fw-semibold">{a.staffName}</div><small className="text-muted">{a.staffEmail} · {a.department}</small></div>
                  <div className="text-end"><span className={`badge ${a.action === 'clock_in' ? 'bg-success' : 'bg-danger'}`}>{a.action.replace('_', ' ').toUpperCase()}</span>
                    <div className="small text-muted">{new Date(a.timestamp).toLocaleTimeString()}</div></div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
