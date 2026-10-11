import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSkeleton from '../shared/LoadingSkeleton';

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user, isLoading, sessionExpired } = useAuth();

  if (isLoading) return <LoadingSkeleton className="h-screen" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location, sessionExpired }} replace />;
  }

  if (!['ADMIN', 'STAFF'].includes(user.role)) {
    return <Navigate to="/account" state={{ adminAccessDenied: true }} replace />;
  }

  return children;
}
