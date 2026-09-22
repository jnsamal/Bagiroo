import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Wraps any route that needs a logged-in user. Redirects to /login and
// remembers where the person was headed so we can send them back after
// they authenticate.
export default function RequireAuth({ children, role }) {
  const location = useLocation();
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError || !me) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && me.user.role !== role) return <Navigate to="/" replace />;

  return children;
}
