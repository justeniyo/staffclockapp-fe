import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById } from '../../config/seedUsers'
import { PageHeader, StatRow } from '../../components/ui'

export default function StaffDashboard() {
  const { user, rawLeaveRequests, clockActivities } = useAuth()

  const d = useMemo(() => {
    const myReqs = rawLeaveRequests.filter(r => r.staffId === user.id)
    const myActs = clockActivities.filter(a => a.staffId === user.id).slice(0, 5)
    const year = new Date().getFullYear()
    const annualUsed = myReqs.filter(r => r.type === 'Annual' && new Date(r.startDate).getFullYear() === year && ['approved','pending'].includes(r.status))
      .reduce((t, r) => t + Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1, 0)
    return { requests: myReqs, activities: myActs, pending: myReqs.filter(r => r.status === 'pending').length, annualUsed, annualLeft: 18 - annualUsed }
  }, [rawLeaveRequests, clockActivities, user.id])

  const manager = user.managerId ? getUserById(user.managerId) : null
  const actIcon = (a) => a === 'clock_in' ? 'fa-sign-in-alt text-success' : 'fa-sign-out-alt text-danger'
  const statusBadge = (s) => ({ pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' }[s] || 'bg-secondary')

  return (
    <div>
      <PageHeader title="Staff Dashboard" subtitle={`Welcome back, ${getFullName(user)}!${user.jobTitle ? ` · ${user.jobTitle} · ${user.department}` : ''}`} />
      <div className="page-content">
        <StatRow stats={[
          { icon: user.isClockedIn ? 'fa-user-check' : 'fa-user-clock', color: user.isClockedIn ? 'success' : 'secondary', value: user.isClockedIn ? 'Clocked In' : 'Clocked Out', label: <Link to="/clock" className="btn btn-outline-warning btn-sm">{user.isClockedIn ? 'Clock Out' : 'Clock In'}</Link> },
          { icon: 'fa-calendar-alt', color: 'primary', value: d.requests.length, label: 'Leave Requests', extra: d.pending > 0 ? `${d.pending} pending` : '' },
          { icon: 'fa-calendar-check', color: 'info', value: d.annualUsed, label: 'Annual Days Used', extra: `${d.annualLeft} remaining` },
          { icon: 'fa-building', color: 'secondary', value: user.department, label: 'Department', extra: manager ? `Reports to ${getFullName(manager)}` : '' },
        ]} />

        {user.isManager && (
          <div className="alert alert-info mb-4">
            <i className="fas fa-users me-2"></i>
            <strong>Manager access enabled.</strong> Use the Manager Portal link in the sidebar to switch.
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card"><div className="card-header d-flex justify-content-between align-items-center"><h6 className="mb-0"><i className="fas fa-clock me-2"></i>Recent Activities</h6><Link to="/clock" className="btn btn-sm btn-outline-primary">Clock</Link></div>
              <div className="card-body">
                {d.activities.length === 0 ? <p className="text-muted text-center py-4">No recent activities.</p> :
                  d.activities.map(a => (
                    <div key={a.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div className="d-flex align-items-center"><i className={`fas ${actIcon(a.action)} me-3`}></i><div><div className="fw-semibold">{a.action.replace('_', ' ').toUpperCase()}</div><small className="text-muted">{a.location}</small></div></div>
                      <small className="text-muted">{new Date(a.timestamp).toLocaleDateString()}</small>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card"><div className="card-header d-flex justify-content-between align-items-center"><h6 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>Leave Requests</h6><Link to="/staff/request-leave" className="btn btn-sm btn-outline-primary">New</Link></div>
              <div className="card-body">
                {d.requests.length === 0 ? <p className="text-muted text-center py-4">No leave requests yet.</p> :
                  d.requests.slice(0, 3).map(r => (
                    <div key={r.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div><div className="fw-semibold">{r.type} Leave</div><small className="text-muted">{r.startDate} to {r.endDate}</small></div>
                      <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4"><div className="card-header"><h6 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Annual Leave ({new Date().getFullYear()})</h6></div>
          <div className="card-body"><div className="progress mb-2" style={{ height: 20 }}>
            <div className={`progress-bar ${d.annualUsed > 15 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${Math.min((d.annualUsed / 18) * 100, 100)}%` }}>{d.annualUsed} / 18 days</div>
          </div></div>
        </div>
      </div>
    </div>
  )
}
