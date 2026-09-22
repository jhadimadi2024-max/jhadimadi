import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

/**
 * Jhadimadi.com - Super Admin Account Seeding & Emergency Override Script
 * Run via: npm run seed:admin
 * Or: npx tsx scripts/seed-admin.ts
 *
 * Can be customized with environment variables:
 * ADMIN_USERNAME=jhadimadi
 * ADMIN_EMAIL=jhadimadi2024@gmail.com
 * ADMIN_PASSWORD=Admin@jhadimadi2024
 * ADMIN_PHONE=01870592699
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'admin_credentials.json');

const adminUsername = process.env.ADMIN_USERNAME || 'jhadimadi';
const adminEmail = (process.env.ADMIN_EMAIL || 'jhadimadi2024@gmail.com').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@jhadimadi2024';
const adminPhone = process.env.ADMIN_PHONE || '01870592699';

console.log('------------------------------------------------------');
console.log('Jhadimadi.com - Admin Credential Seeding Engine');
console.log('------------------------------------------------------');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Generate standard bcrypt hash
  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(adminPassword, saltRounds);

  const payload = {
    isSetupComplete: true,
    username: adminUsername,
    email: adminEmail,
    phone: adminPhone,
    role: 'super_admin',
    passwordHash: passwordHash,
    lastLoginTime: null,
    lastPasswordChangeTime: new Date().toISOString(),
    tokenEpoch: Date.now(),
    sessions: [
      {
        id: 'sess_init_' + Date.now(),
        ip: '127.0.0.1',
        userAgent: 'Seed Script Initializer',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }
    ]
  };

  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(payload, null, 2), 'utf-8');

  console.log('✔ Admin credentials successfully seeded in:', CREDENTIALS_FILE);
  console.log('======================================================');
  console.log('SUPER ADMIN CREDENTIALS:');
  console.log(`Username:  ${adminUsername}`);
  console.log(`Email:     ${adminEmail}`);
  console.log(`Password:  ${adminPassword}`);
  console.log(`Phone:     ${adminPhone}`);
  console.log(`Role:      super_admin`);
  console.log(`Hash Type: bcrypt (${passwordHash.substring(0, 15)}...)`);
  console.log('======================================================');
  console.log('You can now log in using EITHER the Username OR Email!');
} catch (error) {
  console.error('✖ Failed to seed admin credentials:', error);
  process.exit(1);
}
