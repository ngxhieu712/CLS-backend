import mongoose from 'mongoose';
import { env } from './env';

export const connectDb = async () => {
  await mongoose.connect(env.MONGO_URI, {
            dbName: "K4-MindX",              // phải khai báo dbName muốn kết nối nếu không mongoose sẽ mặc định kết nối tới db test
        });
        console.log('Connected to MongoDB');
};
