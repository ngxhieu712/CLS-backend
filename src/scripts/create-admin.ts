#!/usr/bin/env tsx
/**
 * Script tạo tài khoản admin nhanh
 * Usage: npm run create-admin
 */
import 'dotenv/config';
import { connect } from 'mongoose';
import { UserModel } from '../models/user.model';
import { env } from '../config/env';

const createAdmin = async () => {
  try {
    await connect(env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Thay đổi email và password tại đây
    const email = 'admin@example.com';
    const password = 'admin1234';
    const fullName = 'Admin User';

    // Kiểm tra xem admin đã tồn tại chưa
    const existing = await UserModel.findOne({ email });
    if (existing) {
      console.log(`✗ Admin ${email} đã tồn tại!`);
      console.log(`  ID: ${existing._id}`);
      console.log(`  Role: ${existing.role}`);
      console.log(`  Status: ${existing.status}`);
      process.exit(0);
    }

    // Tạo admin mới
    const admin = await UserModel.create({
      email,
      password, // Will be hashed by pre-save hook
      fullName,
      role: 'admin',
      status: 'active',
    });

    console.log('✓ Tạo admin thành công!');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Full Name: ${admin.fullName}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  ID: ${admin._id}`);
    console.log('\n🚀 Bạn có thể đăng nhập ngay bây giờ!');

    process.exit(0);
  } catch (error) {
    console.error('✗ Lỗi:', error);
    process.exit(1);
  }
};

createAdmin();
