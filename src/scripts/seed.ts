#!/usr/bin/env tsx
/**
 * Seed script: Tạo demo accounts và sample data
 * Usage: npm run seed
 */
import { connect, disconnect } from 'mongoose';
import { UserModel } from '../models/user.model';
import { TeamModel } from '../models/team.model';
import { TournamentModel } from '../models/tournament.model';
import { env } from '../config/env';

const DAY_MS = 24 * 60 * 60 * 1000;

const seed = async () => {
  try {
    // Chặn chạy nhầm trên môi trường production vì script sẽ xóa dữ liệu
    if (env.nodeEnv === 'production') {
      throw new Error('Refusing to run seed in production');
    }

    console.log('🌱 Starting seed script...\n');

    await connect(env.mongoUri, {
      dbName: 'K4-MindX', // Same database as backend
    });
    console.log('✓ Connected to MongoDB: K4-MindX');

    // Clear existing data
    await UserModel.deleteMany({});
    await TeamModel.deleteMany({});
    await TournamentModel.deleteMany({});
    console.log('✓ Cleared existing data\n');

    // 0. Create Tournament (web hiện chỉ phục vụ 1 giải)
    const tournament = await TournamentModel.create({
      name: 'Demo Champions League',
      description: 'Giải đấu demo để test hệ thống',
      status: 'registration',
      advancingPerGroup: 2,
      startDate: new Date(Date.now() + 14 * DAY_MS),
      endDate: new Date(Date.now() + 45 * DAY_MS),
    });
    console.log(`✓ Created tournament: ${tournament.name}\n`);

    // 1. Create Admin
    await UserModel.create({
      email: 'admin@example.com',
      password: 'admin1234',
      fullName: 'Admin User',
      role: 'admin',
      status: 'active',
    });
    console.log('✓ Created admin account');
    console.log(`  📧 admin@example.com / admin1234\n`);

    // 2. Create Demo Team Manager with approved team
    const demoManager = await UserModel.create({
      email: 'demo@example.com',
      password: 'demo1234',
      fullName: 'Demo Manager',
      role: 'teamManager',
      status: 'active',
    });

    const demoTeam = await TeamModel.create({
      name: 'Demo Esports',
      tag: 'DEMO',
      logo: '',
      description: 'Demo team for testing',
      organization: 'Demo University',
      contactEmail: 'demo@example.com',
      contactPhone: '0123456789',
      manager: demoManager._id,
      tournament: tournament._id,
      profileStatus: 'approved',
      registeredAt: new Date(),
    });

    demoManager.teamId = demoTeam._id;
    demoManager.teamProfileStatus = 'approved';
    await demoManager.save();

    console.log('✓ Created demo team manager');
    console.log(`  📧 demo@example.com / demo1234`);
    console.log(`  🏆 Team: ${demoTeam.name} [${demoTeam.tag}]\n`);

    // 3. Create 12 Student Team Managers (pending approval)
    console.log('✓ Creating 12 student team managers...');
    for (let i = 1; i <= 12; i++) {
      const num = i.toString().padStart(2, '0');

      const student = await UserModel.create({
        email: `student${num}@example.com`,
        password: 'student1234',
        fullName: `Student ${num}`,
        role: 'teamManager',
        status: 'pending',
      });

      const team = await TeamModel.create({
        name: `Team ${num}`,
        tag: `T${num}`,
        logo: '',
        description: `Student team ${num} for testing`,
        organization: `University ${num}`,
        contactEmail: `student${num}@example.com`,
        contactPhone: `01234567${num}`,
        manager: student._id,
        tournament: tournament._id,
        profileStatus: 'pending',
        registeredAt: new Date(),
      });

      student.teamId = team._id;
      student.teamProfileStatus = 'pending';
      await student.save();

      console.log(`  ${i}/12 student${num}@example.com / student1234`);
    }

    // 4. Create 2 Referees
    await UserModel.create({
      email: 'referee1@example.com',
      password: 'referee1234',
      fullName: 'Referee One',
      role: 'referee',
      status: 'active',
    });

    await UserModel.create({
      email: 'referee2@example.com',
      password: 'referee1234',
      fullName: 'Referee Two',
      role: 'referee',
      status: 'active',
    });

    console.log('\n✓ Created 2 referees');
    console.log(`  📧 referee1@example.com / referee1234`);
    console.log(`  📧 referee2@example.com / referee1234\n`);

    // 5. Create 1 Editor
    await UserModel.create({
      email: 'editor@example.com',
      password: 'editor1234',
      fullName: 'Editor User',
      role: 'editor',
      status: 'active',
    });

    console.log('✓ Created 1 editor');
    console.log(`  📧 editor@example.com / editor1234\n`);

    // Summary
    const counts = await Promise.all([
      UserModel.countDocuments({ role: 'admin' }),
      UserModel.countDocuments({ role: 'teamManager' }),
      UserModel.countDocuments({ role: 'referee' }),
      UserModel.countDocuments({ role: 'editor' }),
      TeamModel.countDocuments({ profileStatus: 'approved' }),
      TeamModel.countDocuments({ profileStatus: 'pending' }),
      TournamentModel.countDocuments({}),
    ]);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Tournaments: ${counts[6]}`);
    console.log(`   Admins: ${counts[0]}`);
    console.log(`   Team Managers: ${counts[1]}`);
    console.log(`   Referees: ${counts[2]}`);
    console.log(`   Editors: ${counts[3]}`);
    console.log(`   Teams (Approved): ${counts[4]}`);
    console.log(`   Teams (Pending): ${counts[5]}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 You can now login with:');
    console.log('   Admin: admin@example.com / admin1234');
    console.log('   Demo:  demo@example.com / demo1234\n');

    await disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
};

seed();