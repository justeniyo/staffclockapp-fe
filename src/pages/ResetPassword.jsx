import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { if (!searchParams.get('verified') || !email) navigate('/forgot-password') }, [])

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Min 8 characters'); return }
    setSuccess('Password updated! Redirecting...')
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="login-page login-staff"><div className="card login-card">
      <div className="card-header"><div className="login-logo">StaffClock</div></div>
      <div className="card-body">
        <div className="login-title"><i className="fas fa-shield-alt me-2"></i>Set New Password</div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3"><label className="form-label">Email</label><input className="form-control" type="email" value={email} disabled /></div>
          <div className="mb-3"><label className="form-label">New Password</label><input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="8" /></div>
          <div className="mb-3"><label className="form-label">Confirm</label><input className="form-control" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <button className="btn btn-warning w-100 mb-3" type="submit">Update Password</button>
        </form>
        <div className="text-center"><Link to="/" className="text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back</Link></div>
      </div>
    </div></div>
  )
}
