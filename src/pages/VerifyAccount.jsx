import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await verifyOTP(email, otp); setSuccess('Verified! Redirecting...'); setTimeout(() => navigate(`/reset-password?email=${email}&verified=true`), 2000) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page login-staff"><div className="card login-card">
      <div className="card-header"><div className="login-logo">StaffClock</div></div>
      <div className="card-body">
        <div className="login-title"><i className="fas fa-user-check me-2"></i>Verify Account</div>
        <form onSubmit={handleVerify}>
          <div className="mb-3"><label className="form-label">Email</label><input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="mb-3"><label className="form-label">Code</label>
            <div className="input-group"><input className="form-control text-center" value={otp} onChange={e => setOtp(e.target.value)} required maxLength="6" placeholder="6-digit code" />
            <button type="button" className="btn btn-outline-warning" onClick={() => resendOTP(email)}><i className="fas fa-redo"></i></button></div></div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <button className="btn btn-warning w-100 mb-3" type="submit" disabled={loading || !otp.trim()}>Verify</button>
        </form>
        <div className="text-center"><Link to="/" className="text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back</Link></div>
      </div>
    </div></div>
  )
}
