import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    const redirectPath = profile?.role === 'worker'
      ? '/dashboard/worker'
      : '/dashboard/restaurant'
    return <Navigate to={redirectPath} replace />
  }

  return children
}
