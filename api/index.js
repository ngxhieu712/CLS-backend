import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: "",              // phải khai báo dbName muốn kết nối nếu không mongoose sẽ mặc định kết nối tới db test
        });
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

startServer();