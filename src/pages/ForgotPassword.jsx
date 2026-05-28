import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const portal = searchParams.get('portal') || 'staff'

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await forgotPassword(email); setSuccess(`Code sent to ${email}`); setTimeout(() => navigate(`/verify-reset-otp?email=${email}`), 2000) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={`login-page login-${portal}`}><div className="card login-card">
      <div className="card-header"><div className="login-logo">StaffClock</div></div>
      <div className="card-body">
        <div className="login-title"><i className="fas fa-key me-2"></i>Reset Password</div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3"><label className="form-label">Email</label><input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} /></div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <button className="btn btn-warning w-100 mb-3" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Code'}</button>
        </form>
        <div className="text-center"><Link to={portal === 'staff' ? '/' : `/${portal}`} className="text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back to Login</Link></div>
      </div>
    </div></div>
  )
}
