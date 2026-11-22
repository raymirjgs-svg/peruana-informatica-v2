import { getAuthToken } from './authTokens';

/**
 * Extrae el email del admin del JWT del backend (guardado en localStorage).
 *
 * El token siempe incluye `email`, asi que funciona aunque la sesion de
 * NextAuth sea anterior al ultimo despliegue (esa cookie no lo lleva).
 */
export function getAdminEmailFromToken(): string {
  if (typeof window === 'undefined') return '';

  const token = getAuthToken('admin');
  if (!token) return '';

  try {
    const payload = token.split('.')[1];
    if (!payload) return '';

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const data = JSON.parse(atob(padded));

    return typeof data?.email === 'string' ? data.email : '';
  } catch {
    return '';
  }
}
