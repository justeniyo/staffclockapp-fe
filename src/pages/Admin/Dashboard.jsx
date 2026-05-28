import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatRow } from '../../components/ui'

export default function AdminDashboard() {
  const { allUsers, rawLeaveRequests, clockActivities } = useAuth()

  const d = useMemo(() => {
    const users = Object.values(allUsers).filter(u => u.role !== 'system')
    const today = new Date().toDateString()
    const todayAct = clockActivities.filter(a => new Date(a.timestamp).toDateString() === today)
    const thisYear = rawLeaveRequests.filter(r => new Date(r.startDate).getFullYear() === new Date().getFullYear())

    const roleStats = users.reduce((a, u) => ({ ...a, [u.role]: (a[u.role] || 0) + 1 }), {})
    const deptStats = users.reduce((a, u) => {
      if (!u.department) return a
      const s = a[u.department] ??= { total: 0, active: 0, managers: 0 }
      s.total++; if (u.isActive) s.active++; if (u.isManager) s.managers++
      return a
    }, {})

    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      unverified: users.filter(u => !u.verified).length,
      managers: users.filter(u => u.isManager).length,
      pending: thisYear.filter(r => r.status === 'pending').length,
      todayAct: todayAct.length,
      roleStats, deptStats,
      recentAct: clockActivities.slice(0, 5),
      verified: users.filter(u => u.verified).length,
      clockedIn: users.filter(u => u.isClockedIn).length,
      approvedLeaves: thisYear.filter(r => r.status === 'approved').length,
      totalLeaves: thisYear.length,
    }
  }, [allUsers, rawLeaveRequests, clockActivities])

  const pct = (n, t) => t > 0 ? Math.round((n / t) * 100) : 0

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System administration and user management" />
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-users', color: 'primary', value: d.total, label: 'Total Users' },
          { icon: 'fa-user-check', color: 'success', value: d.active, label: 'Active Users' },
          { icon: 'fa-user-clock', color: 'warning', value: d.unverified, label: 'Unverified' },
          { icon: 'fa-user-tie', color: 'info', value: d.managers, label: 'Managers' },
          { icon: 'fa-calendar-alt', color: 'secondary', value: d.pending, label: 'Pending Requests' },
          { icon: 'fa-clock', color: 'dark', value: d.todayAct, label: "Today's Activity" },
        ]} />

        {/* Quick Actions */}
        <div className="card mb-4">
          <div className="card-header"><h6 className="mb-0"><i className="fas fa-bolt me-2"></i>Quick Actions</h6></div>
          <div className="card-body">
            <div className="row g-3">
              {[
                ['/admin/register-staff', 'fa-user-plus', 'Register Staff', 'primary'],
                ['/admin/manage-staff', 'fa-users-cog', 'Manage Staff', 'info', d.unverified],
                ['/admin/clock-activities', 'fa-clock', 'Clock Activities', 'success'],
              ].map(([to, icon, label, v, badge]) => (
                <div key={to} className="col-md-4">
                  <Link to={to} className={`btn btn-outline-${v} w-100`}>
                    <i className={`fas ${icon} me-2`}></i>{label}
                    {badge > 0 && <span className="badge bg-warning text-dark ms-2">{badge}</span>}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Role Distribution */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header"><h6 className="mb-0"><i className="fas fa-user-tag me-2"></i>Role Distribution</h6></div>
              <div className="card-body">
                {Object.entries(d.roleStats).map(([role, count]) => (
                  <div key={role} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-capitalize">{role}</span>
                    <span className="fw-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Status */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header"><h6 className="mb-0"><i className="fas fa-building me-2"></i>Department Status</h6></div>
              <div className="card-body">
                {Object.entries(d.deptStats).map(([dept, s]) => (
                  <div key={dept} className="py-2 border-bottom">
                    <div className="d-flex justify-content-between"><span className="fw-semibold">{dept}</span><span className="badge bg-light text-dark">{s.total}</span></div>
                    <small className="text-muted">{s.active} active · {s.managers} manager{s.managers !== 1 ? 's' : ''}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header"><h6 className="mb-0"><i className="fas fa-history me-2"></i>Recent Activity</h6></div>
              <div className="card-body">
                {d.recentAct.length === 0 ? <p className="text-muted text-center py-3">No recent activities.</p> :
                  d.recentAct.map(a => (
                    <div key={a.id} className="d-flex align-items-center py-2 border-bottom">
                      <i className={`fas ${a.action === 'clock_in' ? 'fa-sign-in-alt text-success' : 'fa-sign-out-alt text-danger'} me-3`}></i>
                      <div className="flex-grow-1">
                        <div className="small fw-semibold">{a.staffName}</div>
                        <small className="text-muted">{a.action.replace('_', ' ').toUpperCase()} · {a.location}</small>
                      </div>
                      <small className="text-muted">{new Date(a.timestamp).toLocaleDateString()}</small>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="card mt-4">
          <div className="card-header"><h6 className="mb-0"><i className="fas fa-chart-bar me-2"></i>Performance Metrics</h6></div>
          <div className="card-body">
            <div className="row g-4 text-center">
              {[
                ['fa-user-check', 'success', `${pct(d.verified, d.total)}%`, 'Verification Rate', `${d.verified}/${d.total}`],
                ['fa-users', 'primary', `${pct(d.active, d.total)}%`, 'Active Users', `${d.active}/${d.total}`],
                ['fa-clock', 'info', `${pct(d.clockedIn, d.active)}%`, 'Current Engagement', `${d.clockedIn}/${d.active}`],
                ['fa-calendar-check', 'warning', `${pct(d.approvedLeaves, d.totalLeaves)}%`, 'Leave Approval', `${d.approvedLeaves}/${d.totalLeaves}`],
              ].map(([icon, color, val, label, sub]) => (
                <div key={label} className="col-md-3">
                  <i className={`fas ${icon} fa-2x text-${color} mb-2`}></i>
                  <h5 className={`text-${color}`}>{val}</h5>
                  <p className="small text-muted mb-0">{label}</p>
                  <small className="text-muted">{sub}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
