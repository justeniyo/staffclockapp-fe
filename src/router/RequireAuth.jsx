import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO } from '../config/seedUsers'

export function RequireAuth({ roles, requireCEO = false }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/" replace />

  // CEO-specific routes
  if (requireCEO) {
    if (!isCEO(user)) return <Navigate to="/" replace />
    return <Outlet />
  }

  // Regular role check
  if (roles && !roles.includes(user.role)) {
    // CEO can access staff routes (multi-portal: CEO → Staff + Manager)
    if (isCEO(user) && roles.includes('staff')) {
      return <Outlet />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
