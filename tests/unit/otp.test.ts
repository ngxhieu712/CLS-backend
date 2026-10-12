import { describe, expect, it } from 'vitest';
import { generateOtp } from '../../src/utils/otp';

describe('generateOtp', () => {
  it('  ', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it('stays inside the 6-digit range', () => {
    for (let i = 0; i < 500; i += 1) {
      const value = Number(generateOtp());
      expect(value).toBeGreaterThanOrEqual(100000);
      expect(value).toBeLessThanOrEqual(999999);
    }
  });

  it('is not a constant value', () => {
    const generated = new Set(Array.from({ length: 50 }, () => generateOtp()));
    expect(generated.size).toBeGreaterThan(1);
  });
});
