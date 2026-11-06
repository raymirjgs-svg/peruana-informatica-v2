// Shared admin API utility — injects the admin JWT token automatically

export function getAdminApiBase(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('adminToken') || '';
}

export function getAdminHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Wrapper over fetch that automatically injects the admin Authorization header.
 * Usage: adminFetch('/admin/products') instead of fetch(`${getApiBase()}/admin/products`)
 */
export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const base = getAdminApiBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const token = getAdminToken();

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Don't override Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}
