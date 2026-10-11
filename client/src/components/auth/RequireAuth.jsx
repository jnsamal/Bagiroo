import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Wraps any route that needs a logged-in user. Redirects to /login and
// remembers where the person was headed so we can send them back after
// they authenticate.
export default function RequireAuth({ children, role }) {
  const location = useLocation();
  const { user, isLoading, isError, sessionExpired } = useAuth();

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError || !user) return <Navigate to="/login" state={{ from: location, sessionExpired }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
