// force-create-admin.cjs
const { PrismaClient } = require('./backend/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@school.com';
  const password = 'admin123';
  const name = 'System Administrator';
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hash,
        accountLocked: false,
        lockReason: null,
        passwordAttempts: 0,
        lastPasswordAttempt: null,
        status: 'ACTIVE',
        role: 'ADMIN',
        name
      }
    });
    console.log('✅ Existing admin updated:', email);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: 'ADMIN',
        status: 'ACTIVE',
        accountLocked: false,
        lockReason: null,
        passwordAttempts: 0,
        lastPasswordAttempt: null
      }
    });
    console.log('✅ New admin created:', email);
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); }); 