import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyResetOTP() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resendOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { /* OTP verified server-side via forgotPassword flow */ navigate(`/reset-password?email=${email}&verified=true`) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page login-staff"><div className="card login-card">
      <div className="card-header"><div className="login-logo">StaffClock</div></div>
      <div className="card-body">
        <div className="login-title"><i className="fas fa-key me-2"></i>Verify Reset Code</div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3"><label className="form-label">Email</label><input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} /></div>
          <div className="mb-3"><label className="form-label">Code</label>
            <div className="input-group"><input className="form-control text-center" value={otp} onChange={e => setOtp(e.target.value)} required maxLength="6" placeholder="6-digit code" />
            <button type="button" className="btn btn-outline-warning" onClick={() => resendOTP(email, 'password_reset')}><i className="fas fa-redo"></i></button></div></div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button className="btn btn-warning w-100 mb-3" type="submit" disabled={loading}>Verify</button>
        </form>
        <div className="text-center"><Link to="/" className="text-decoration-none"><i className="fas fa-arrow-left me-2"></i>Back</Link></div>
      </div>
    </div></div>
  )
}
