import bcrypt from 'bcryptjs';

export const hashPassword = (value: string) => bcrypt.hash(value, 10);
export const comparePassword = (value: string, hashed: string) => bcrypt.compare(value, hashed);
