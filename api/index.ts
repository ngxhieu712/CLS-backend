import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';
import { connectDb } from '../src/config/db';

let isDbConnected = false;

const ensureDbConnected = async () => {
  if (isDbConnected) return;
  await connectDb();
  isDbConnected = true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbConnected();
  return app(req, res);
}
