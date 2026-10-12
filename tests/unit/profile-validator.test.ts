import { describe, expect, it } from 'vitest';
import { updateProfileSchema } from '../../src/validators/profile.validator';

describe('updateProfileSchema', () => {
  it('accepts an empty object (every field is optional)', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it('trims incoming strings', () => {
    const result = updateProfileSchema.parse({ displayName: '  Alice  ', phone: ' 0123456 ' });
    expect(result.displayName).toBe('Alice');
    expect(result.phone).toBe('0123456');
  });

  it('rejects a displayName that is empty after trimming', () => {
    expect(updateProfileSchema.safeParse({ displayName: '   ' }).success).toBe(false);
  });

  it('enforces displayName and bio maximum lengths', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'a'.repeat(100) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ displayName: 'a'.repeat(101) }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ bio: 'b'.repeat(200) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ bio: 'b'.repeat(201) }).success).toBe(false);
  });

  it('enforces phone length boundaries', () => {
    expect(updateProfileSchema.safeParse({ phone: '123456' }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ phone: '1234567' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ phone: '1'.repeat(20) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ phone: '1'.repeat(21) }).success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(updateProfileSchema.safeParse({ displayName: 42 }).success).toBe(false);
  });
});
