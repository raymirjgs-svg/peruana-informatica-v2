import { generateTrackingCode } from '../utils/trackingCode';

describe('generateTrackingCode', () => {
  it('matches the expected PX-XXXXX-XXXXX format', () => {
    expect(generateTrackingCode()).toMatch(/^PX-[2-9A-HJKMNP-TV-Z]{5}-[2-9A-HJKMNP-TV-Z]{5}$/);
  });

  it('never contains ambiguous characters (0, 1, I, L, O, U)', () => {
    for (let i = 0; i < 300; i++) {
      expect(generateTrackingCode()).not.toMatch(/[01ILOU]/);
    }
  });

  it('generates unique codes across many iterations', () => {
    const codes = new Set(Array.from({ length: 5000 }, () => generateTrackingCode()));
    expect(codes.size).toBe(5000);
  });
});
