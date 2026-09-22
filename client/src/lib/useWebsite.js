import { useQuery } from '@tanstack/react-query';
import { api } from './api';
export function useWebsite() {
  const { data } = useQuery({ queryKey: ['settings', 'public'], queryFn: () => api.get('/settings/public') });
  return data?.website || {};
}
