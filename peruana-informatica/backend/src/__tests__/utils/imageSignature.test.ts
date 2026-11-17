import fs from 'fs';
import os from 'os';
import path from 'path';
import { hasValidImageSignature } from '../../utils/imageSignature';

const writeTemp = (name: string, bytes: number[]): string => {
  const filePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'img-sig-')), name);
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
};

describe('hasValidImageSignature', () => {
  it('accepts JPEG files', () => {
    expect(hasValidImageSignature(writeTemp('a.jpg', [0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
  });

  it('accepts PNG files', () => {
    expect(hasValidImageSignature(writeTemp('a.png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  });

  it('accepts GIF files', () => {
    expect(hasValidImageSignature(writeTemp('a.gif', [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe(true);
  });

  it('accepts WebP files', () => {
    const bytes = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
    expect(hasValidImageSignature(writeTemp('a.webp', bytes))).toBe(true);
  });

  it('rejects files with an unknown signature', () => {
    expect(hasValidImageSignature(writeTemp('a.txt', [0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBe(false);
  });

  it('rejects missing files', () => {
    expect(hasValidImageSignature(path.join(os.tmpdir(), 'does-not-exist-image.png'))).toBe(false);
  });
});
