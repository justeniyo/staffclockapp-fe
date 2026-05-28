import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'
import { PageHeader, StatRow } from '../../components/ui'

export default function CEODashboard() {
  const { allUsers, rawLeaveRequests, clockActivities, user } = useAuth()

  const d = useMemo(() => {
    const users = Object.values(allUsers).filter(u => u.role !== 'system')
    const today = new Date().toDateString()
    const todayAct = clockActivities.filter(a => new Date(a.timestamp).toDateString() === today)
    const thisYear = rawLeaveRequests.filter(r => new Date(r.startDate).getFullYear() === new Date().getFullYear())

    const deptStats = users.reduce((a, u) => {
      if (!u.department) return a
      const s = a[u.department] ??= { total: 0, active: 0, managers: 0, clockedIn: 0 }
      s.total++; if (u.isActive) s.active++; if (u.isManager) s.managers++; if (u.isClockedIn) s.clockedIn++
      return a
    }, {})

    const pending = thisYear.filter(r => r.status === 'pending').length
    const approved = thisYear.filter(r => r.status === 'approved').length

    return {
      totalStaff: users.length, activeNow: users.filter(u => u.isClockedIn).length,
      deptCount: Object.keys(deptStats).length, totalManagers: users.filter(u => u.isManager).length,
      approved, todayAct: todayAct.length, pending, deptStats,
      leaveTotal: thisYear.length, rejected: thisYear.filter(r => r.status === 'rejected').length,
    }
  }, [allUsers, rawLeaveRequests, clockActivities])

  const pct = (n, t) => t > 0 ? Math.round((n / t) * 100) : 0

  return (
    <div>
      <PageHeader title="Executive Dashboard" subtitle="Organization overview and strategic insights" />
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-users', color: 'primary', value: d.totalStaff, label: 'Total Staff' },
          { icon: 'fa-user-check', color: 'success', value: d.activeNow, label: 'Active Now' },
          { icon: 'fa-building', color: 'info', value: d.deptCount, label: 'Departments' },
          { icon: 'fa-user-tie', color: 'warning', value: d.totalManagers, label: 'Managers' },
          { icon: 'fa-calendar-check', color: 'success', value: d.approved, label: 'Approved', extra: 'This Year' },
          { icon: 'fa-clock', color: 'secondary', value: d.todayAct, label: 'Activities', extra: 'Today' },
        ]} />

        {d.pending > 0 && (
          <div className="alert alert-warning mb-4 d-flex justify-content-between align-items-center">
            <div><i className="fas fa-exclamation-triangle me-2"></i><strong>CEO Approval Required</strong> — {d.pending} pending</div>
            <Link to="/manager/leave-requests" className="btn btn-warning"><i className="fas fa-gavel me-2"></i>Review</Link>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header"><h6 className="mb-0"><i className="fas fa-bolt me-2"></i>Executive Actions</h6></div>
          <div className="card-body">
            <div className="row g-3">
              {[['/manager-dashboard','fa-users-cog','Manager Portal','primary'],['/staff/request-leave','fa-calendar-plus','Request Leave','secondary'],['/staff-dashboard','fa-user','Staff Portal','info'],['/clock','fa-clock','Clock In/Out','success']].map(([to,icon,lbl,v]) =>
                <div key={to} className="col-md-3"><Link to={to} className={`btn btn-outline-${v} w-100`}><i className={`fas ${icon} me-2`}></i>{lbl}</Link></div>
              )}
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header"><h6 className="mb-0"><i className="fas fa-sitemap me-2"></i>Department Overview</h6></div>
              <div className="card-body">
                {Object.entries(d.deptStats).map(([dept, s]) => (
                  <div key={dept} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                    <div><div className="fw-semibold">{dept}</div><small className="text-muted">{s.managers} mgr · {s.clockedIn} active</small></div>
                    <div className="text-end"><span className="badge bg-primary">{s.total} staff</span><div className="small text-muted">{pct(s.clockedIn, s.total)}% active</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header"><h6 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Leave Analytics</h6></div>
              <div className="card-body">
                <div className="row g-3 mb-3 text-center">
                  <div className="col-4"><h4 className="text-primary mb-1">{d.leaveTotal}</h4><small className="text-muted">Total</small></div>
                  <div className="col-4"><h4 className="text-warning mb-1">{d.pending}</h4><small className="text-muted">Pending</small></div>
                  <div className="col-4"><h4 className="text-success mb-1">{d.approved}</h4><small className="text-muted">Approved</small></div>
                </div>
                {d.leaveTotal > 0 && (
                  <div className="progress" style={{ height: 10 }}>
                    <div className="progress-bar bg-success" style={{ width: `${pct(d.approved, d.leaveTotal)}%` }}></div>
                    <div className="progress-bar bg-warning" style={{ width: `${pct(d.pending, d.leaveTotal)}%` }}></div>
                    <div className="progress-bar bg-danger" style={{ width: `${pct(d.rejected, d.leaveTotal)}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
