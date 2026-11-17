export type AuthScope = 'admin' | 'customer';

const TOKEN_KEYS: Record<AuthScope, string> = {
  admin: 'adminToken',
  customer: 'customerToken',
};

export function getAuthToken(scope: AuthScope): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEYS[scope]);
}

export function setAuthToken(scope: AuthScope, token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEYS[scope], token);
}

export function clearAuthToken(scope: AuthScope): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEYS[scope]);
}

export function getAuthHeaders(scope: AuthScope): Record<string, string> {
  const token = getAuthToken(scope);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
