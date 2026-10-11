import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);
  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    function clearExpiredSession() {
      setSessionExpired(true);
      queryClient.setQueryData(['me'], null);
      queryClient.removeQueries({ queryKey: ['admin-me'] });
      queryClient.removeQueries({ queryKey: ['account-orders'] });
      queryClient.removeQueries({ queryKey: ['account-addresses'] });
      queryClient.removeQueries({ queryKey: ['wishlist'] });
    }

    function refreshRoleAfterForbiddenRequest() {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['admin-me'] });
    }

    window.addEventListener('bagiroo:session-expired', clearExpiredSession);
    window.addEventListener('bagiroo:admin-forbidden', refreshRoleAfterForbiddenRequest);
    return () => {
      window.removeEventListener('bagiroo:session-expired', clearExpiredSession);
      window.removeEventListener('bagiroo:admin-forbidden', refreshRoleAfterForbiddenRequest);
    };
  }, [queryClient]);

  async function logout() {
    await api.post('/auth/logout', {});
    setSessionExpired(false);
    queryClient.setQueryData(['me'], null);
    queryClient.removeQueries({
      predicate: query => {
        const key = String(query.queryKey[0] || '');
        return key === 'admin-me' || key.startsWith('admin-') || key.startsWith('account-') || ['addresses', 'wishlist', 'cart'].includes(key);
      },
    });
  }

  const value = {
    user: query.data?.user || null,
    isAuthenticated: Boolean(query.data?.user),
    isLoading: query.isLoading,
    isError: query.isError,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
    refreshUser: query.refetch,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
