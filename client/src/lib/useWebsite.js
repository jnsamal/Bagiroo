import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function usePublicSettings() {
  const { data } = useQuery({ queryKey: ['settings', 'public'], queryFn: () => api.get('/settings/public') });
  return data;
}

export function useWebsite() {
  return usePublicSettings()?.website || {};
}
