import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ roles, requireCreate = false }) {
  const { isAuthenticated, user, canCreate } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  if (requireCreate && !canCreate) {
    return <Navigate to="/unauthorized" replace />
  }
  return <Outlet />
}
