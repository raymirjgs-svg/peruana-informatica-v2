import { getAuthHeaders } from '@/lib/authTokens';

export function getAdminAuthHeaders(): Record<string, string> {
  return getAuthHeaders('admin');
}
