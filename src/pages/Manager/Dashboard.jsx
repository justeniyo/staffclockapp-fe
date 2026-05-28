import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById } from '../../config/seedUsers'
import { PageHeader, StatRow } from '../../components/ui'

export default function ManagerDashboard() {
  const { rawLeaveRequests, allUsers, user, clockActivities } = useAuth()

  const team = useMemo(() => {
    const members = Object.values(allUsers).filter(s => s.managerId === user.id)
    const ids = members.map(m => m.id)
    const requests = rawLeaveRequests.filter(r => ids.includes(r.staffId))
    const pending = requests.filter(r => r.status === 'pending')
    const thisYear = requests.filter(r => new Date(r.startDate).getFullYear() === new Date().getFullYear())
    const activities = clockActivities.filter(a => ids.includes(a.staffId)).slice(0, 5)
    return { members, pending, activities, approved: thisYear.filter(r => r.status === 'approved').length, total: thisYear.length }
  }, [allUsers, rawLeaveRequests, user.id, clockActivities])

  const myManager = user.managerId ? getUserById(user.managerId) : null

  return (
    <div>
      <PageHeader title="Manager Dashboard" subtitle={`Managing ${team.members.length} member${team.members.length !== 1 ? 's' : ''} in ${user.department}${myManager ? ` · Reports to ${getFullName(myManager)}` : ''}`} />
      <div className="page-content">
        <StatRow stats={[
          { icon: 'fa-users', color: 'primary', value: team.members.length, label: 'Team Members' },
          { icon: 'fa-user-check', color: 'success', value: team.members.filter(m => m.isClockedIn).length, label: 'Active' },
          { icon: 'fa-clock', color: 'warning', value: team.pending.length, label: 'Pending Requests' },
          { icon: 'fa-calendar-alt', color: 'info', value: team.total, label: 'Total Requests', extra: 'This Year' },
        ]} />

        <div className="card mb-4"><div className="card-header"><h6 className="mb-0"><i className="fas fa-bolt me-2"></i>Quick Actions</h6></div>
          <div className="card-body"><div className="row g-3">
            {[['/manager/leave-requests','fa-calendar-check','Leave Requests','primary',team.pending.length],['/staff/request-leave','fa-calendar-plus','My Leave','secondary'],['/staff-dashboard','fa-user','Staff Portal','info'],['/clock','fa-clock','Clock In/Out','success']].map(([to,icon,lbl,v,badge]) =>
              <div key={to} className="col-md-3"><Link to={to} className={`btn btn-outline-${v} w-100`}><i className={`fas ${icon} me-2`}></i>{lbl}{badge > 0 && <span className="badge bg-warning text-dark ms-2">{badge}</span>}</Link></div>
            )}
          </div></div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card"><div className="card-header"><h6 className="mb-0"><i className="fas fa-users me-2"></i>Team</h6></div>
              <div className="card-body">
                {team.members.length === 0 ? <p className="text-muted text-center py-4">No team members.</p> :
                  team.members.slice(0, 5).map(m => (
                    <div key={m.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div><div className="fw-semibold">{getFullName(m)}</div><small className="text-muted">{m.jobTitle || m.role}</small></div>
                      <span className={`badge ${m.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>{m.isClockedIn ? 'Active' : 'Offline'}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card"><div className="card-header"><h6 className="mb-0"><i className="fas fa-history me-2"></i>Recent Activity</h6></div>
              <div className="card-body">
                {team.activities.length === 0 ? <p className="text-muted text-center py-4">No recent activity.</p> :
                  team.activities.map(a => (
                    <div key={a.id} className="d-flex align-items-center py-2 border-bottom">
                      <i className={`fas ${a.action === 'clock_in' ? 'fa-sign-in-alt text-success' : 'fa-sign-out-alt text-danger'} me-3`}></i>
                      <div className="flex-grow-1"><div className="fw-semibold small">{a.staffName}</div><small className="text-muted">{a.action.replace('_', ' ').toUpperCase()} · {a.location}</small></div>
                      <small className="text-muted">{new Date(a.timestamp).toLocaleDateString()}</small>
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
