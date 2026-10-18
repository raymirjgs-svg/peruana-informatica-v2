import crypto from 'crypto';

// Crockford-like base excluding ambiguous characters 0, 1, I, L, O, U
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 10;
const MAX_BYTE = Math.floor(256 / ALPHABET.length) * ALPHABET.length;

export function generateTrackingCode(): string {
  let chars = '';
  while (chars.length < CODE_LENGTH) {
    for (const byte of crypto.randomBytes(16)) {
      if (byte >= MAX_BYTE) continue;
      chars += ALPHABET[byte % ALPHABET.length];
      if (chars.length === CODE_LENGTH) break;
    }
  }
  return `PX-${chars.slice(0, 5)}-${chars.slice(5, CODE_LENGTH)}`;
}
