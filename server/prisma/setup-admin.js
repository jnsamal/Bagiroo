require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
async function main() {
  const loginId = process.env.ADMIN_LOGIN_ID || 'bagiroo-admin';
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(18).toString('base64url');
  if (password.length < 12 || Buffer.byteLength(password) > 72) throw Error('Admin password must be at least 12 characters and at most 72 bytes.');
  if (await prisma.user.findUnique({ where: { loginId } })) throw Error('This login ID already exists. Use the admin password screen to change its password.');
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN', loginId: null, deletedAt: null, isActive: true } });
  const data = { loginId, passwordHash: await bcrypt.hash(password, 12) };
  if (existing) await prisma.user.update({ where: { id: existing.id }, data });
  else await prisma.user.create({ data: { ...data, phone: process.env.ADMIN_PHONE || '+910000000000', role: 'ADMIN', name: 'Store administrator' } });
  const directory = path.join(__dirname, '../../.local');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'admin-credentials.txt'), `Admin portal: http://localhost:5173/admin/login\nLogin ID: ${loginId}\nPassword: ${password}\n\nChange the password in Admin → Security after signing in.\n`, { mode: 0o600 });
  console.log('Admin account created. Credentials saved in .local/admin-credentials.txt (excluded from git).');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
