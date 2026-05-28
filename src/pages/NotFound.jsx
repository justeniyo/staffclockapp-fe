import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="login-page login-staff"><div className="card login-card">
      <div className="card-header"><div className="login-logo">StaffClock</div></div>
      <div className="card-body text-center">
        <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
        <h3 className="mb-3">Page Not Found</h3>
        <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-warning w-100 mb-2"><i className="fas fa-home me-2"></i>Staff Login</Link>
        <Link to="/admin" className="btn btn-outline-dark w-100"><i className="fas fa-user-shield me-2"></i>Admin</Link>
      </div>
    </div></div>
  )
}
