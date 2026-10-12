import { describe, expect, it } from 'vitest';
import { comparePassword, hashPassword } from '../../src/utils/hash';

describe('password hashing', () => {
  it('never stores the plaintext password', async () => {
    const hashed = await hashPassword('Passw0rd!');
    expect(hashed).not.toBe('Passw0rd!');
    expect(hashed).not.toContain('Passw0rd!');
  });

  it('produces a different hash every time (salted)', async () => {
    const [first, second] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(first).not.toBe(second);
  });

  it('accepts the correct password', async () => {
    const hashed = await hashPassword('Passw0rd!');
    await expect(comparePassword('Passw0rd!', hashed)).resolves.toBe(true);
  });

  it('rejects a wrong password, including case changes and empty input', async () => {
    const hashed = await hashPassword('Passw0rd!');
    await expect(comparePassword('passw0rd!', hashed)).resolves.toBe(false);
    await expect(comparePassword('Passw0rd', hashed)).resolves.toBe(false);
    await expect(comparePassword('', hashed)).resolves.toBe(false);
  });
});
