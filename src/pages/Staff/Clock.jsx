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
  const assigned = user?.assignedLocationId ? locations[user.assignedLocationId] : null
  const selected = selectedId ? locations[selectedId] : null

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const handleClockIn = async () => { setLoading(true); try { await clockIn(selectedId); flash('Clocked in!') } finally { setLoading(false) } }
  const handleClockOut = async () => { setLoading(true); try { await clockOut(); flash('Clocked out!') } finally { setLoading(false) } }
  const handleChange = async () => {
    if (!user?.isClockedIn || user.currentLocationIds?.includes(selectedId)) return
    setLoading(true)
    try { await addLocation(selectedId); flash('Location changed!') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader title="Location Clock" subtitle="Track your working hours" />
      <div className="page-content">
        <div className="row justify-content-center"><div className="col-lg-8">
          {msg && <div className="alert alert-success"><i className="fas fa-check-circle me-2"></i>{msg}</div>}

          {/* Current status card — shows clearly where the user is clocked in. */}
          <div className="card mb-4 clock-status-card">
            <div className="card-body text-center py-5">
              <i className={`fas ${user?.isClockedIn ? 'fa-check-circle text-success' : 'fa-power-off text-muted'} fa-4x mb-3`}></i>
              <h3 className={user?.isClockedIn ? 'text-success' : 'text-muted'}>
                {user?.isClockedIn ? 'On Duty' : 'Off Duty'}
              </h3>
              {user?.isClockedIn && current ? (
                <div className="mt-3">
                  <div className="fw-semibold">
                    <i className="fas fa-map-marker-alt text-danger me-2"></i>
                    Currently at <span className="text-primary">{current.name}</span>
                  </div>
                  {current.address && <small className="text-muted d-block mt-1">{current.address}</small>}
                </div>
              ) : assigned ? (
                <div className="mt-3 text-muted small">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Assigned site: <strong>{assigned.name}</strong>
                  {assigned.address && <div className="mt-1">{assigned.address}</div>}
                </div>
              ) : null}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><h6 className="mb-0"><i className="fas fa-map-marked-alt me-2"></i>{user?.isClockedIn ? 'Change Location' : 'Select Location'}</h6></div>
            <div className="card-body">
              <select className="form-select mb-2" value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={loading}>
                <option value="">— Choose a site —</option>
                {available.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {/* Show the picked site's address right below the dropdown — the
                  address is already fetched, just wasn't being surfaced. */}
              {selected?.address && (
                <small className="text-muted d-block mb-3">
                  <i className="fas fa-map-pin me-1"></i>{selected.address}
                </small>
              )}
              {user?.isClockedIn && selectedId && !user.currentLocationIds?.includes(Number(selectedId)) && (
                <button className="btn btn-warning w-100" onClick={handleChange} disabled={loading}>
                  <i className="fas fa-exchange-alt me-2"></i>Change to {selected?.name}
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <button className="btn btn-success w-100 btn-lg" onClick={handleClockIn} disabled={user?.isClockedIn || loading || !selectedId}>
                    <i className="fas fa-sign-in-alt me-2"></i>Clock In
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-danger w-100 btn-lg" onClick={handleClockOut} disabled={!user?.isClockedIn || loading}>
                    <i className="fas fa-sign-out-alt me-2"></i>Clock Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div></div>
      </div>
    </div>
  )
}
