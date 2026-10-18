export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
