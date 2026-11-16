import crypto from 'crypto';

// Base32 sin caracteres ambiguos: no usa 0, 1, I, L, O ni U.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 12;
const MAX_BYTE = Math.floor(256 / ALPHABET.length) * ALPHABET.length;

export const TRACKING_CODE_PATTERN = /^PI-[2-9A-HJKMNP-TV-Z]{6}-[2-9A-HJKMNP-TV-Z]{6}$/;

export function generateTrackingCode(): string {
  let chars = '';

  while (chars.length < CODE_LENGTH) {
    const bytes = crypto.randomBytes(16);

    for (const byte of bytes) {
      // Rechazo de valores para evitar el sesgo del operador módulo.
      if (byte >= MAX_BYTE) continue;

      chars += ALPHABET[byte % ALPHABET.length];
      if (chars.length === CODE_LENGTH) break;
    }
  }

  return `PI-${chars.slice(0, 6)}-${chars.slice(6)}`;
}

export function normalizeTrackingCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();
  return TRACKING_CODE_PATTERN.test(normalized) ? normalized : null;
}
