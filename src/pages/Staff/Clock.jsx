import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from '../../components/ui'

export default function Clock() {
  const { user, clockIn, clockOut, addLocation, locations } = useAuth()
  const [selectedId, setSelectedId] = useState(user?.assignedLocationId || '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const available = Object.values(locations).filter(l => l.isActive)
  const current = user?.currentLocationIds?.length > 0 ? locations[user.currentLocationIds[0]] : null

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const handleClockIn = async () => { setLoading(true); try { await clockIn(selectedId); flash('Clocked in!') } finally { setLoading(false) } }
  const handleClockOut = async () => { setLoading(true); try { await clockOut(); flash('Clocked out!') } finally { setLoading(false) } }
  const handleChange = async () => { if (!user?.isClockedIn || user.currentLocationIds?.includes(selectedId)) return; setLoading(true); try { await addLocation(selectedId); flash('Location changed!') } finally { setLoading(false) } }

  return (
    <div>
      <PageHeader title="Location Clock" subtitle="Track your working hours" />
      <div className="page-content">
        <div className="row justify-content-center"><div className="col-lg-8">
          {msg && <div className="alert alert-success"><i className="fas fa-check-circle me-2"></i>{msg}</div>}

          <div className="card mb-4">
            <div className="card-body text-center py-5">
              <i className={`fas ${user?.isClockedIn ? 'fa-check-circle text-success' : 'fa-clock text-muted'} fa-4x mb-3`}></i>
              <h3 className={user?.isClockedIn ? 'text-success' : 'text-muted'}>{user?.isClockedIn ? 'On Duty' : 'Off Duty'}</h3>
              {current && <p className="text-muted">At {current.name}</p>}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><h6 className="mb-0"><i className="fas fa-map-marked-alt me-2"></i>{user?.isClockedIn ? 'Change Location' : 'Select Location'}</h6></div>
            <div className="card-body">
              <select className="form-select mb-3" value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={loading}>
                {available.map(l => <option key={l.id} value={l.id}>{l.name} - {l.type}</option>)}
              </select>
              {user?.isClockedIn && !user.currentLocationIds?.includes(selectedId) && (
                <button className="btn btn-warning w-100 mb-3" onClick={handleChange} disabled={loading}><i className="fas fa-exchange-alt me-2"></i>Change Location</button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6"><button className="btn btn-success w-100 btn-lg" onClick={handleClockIn} disabled={user?.isClockedIn || loading}><i className="fas fa-sign-in-alt me-2"></i>Clock In</button></div>
                <div className="col-6"><button className="btn btn-danger w-100 btn-lg" onClick={handleClockOut} disabled={!user?.isClockedIn || loading}><i className="fas fa-sign-out-alt me-2"></i>Clock Out</button></div>
              </div>
            </div>
          </div>
        </div></div>
      </div>
    </div>
  )
}
