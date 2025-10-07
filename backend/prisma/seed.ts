import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@school.com';
  const password = 'superadmin123';
  const name = 'Super Admin';
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
        accountLocked: false
      }
    });
    console.log('✅ New admin created:', email);
  }

  // Add sample users
  const sampleUsers = [
    {
      email: 'teacher1@school.com',
      password: 'teacher123',
      name: 'John Smith',
      role: 'USER',
      status: 'ACTIVE',
      gender: 'male',
      age: 35,
      residence: 'Kampala'
    },
    {
      email: 'teacher2@school.com',
      password: 'teacher123',
      name: 'Mary Johnson',
      role: 'USER',
      status: 'ACTIVE',
      gender: 'female',
      age: 28,
      residence: 'Kampala'
    },
    {
      email: 'parent1@school.com',
      password: 'parent123',
      name: 'David Wilson',
      role: 'PARENT',
      status: 'ACTIVE',
      gender: 'male',
      age: 45,
      residence: 'Kampala'
    },
    {
      email: 'nurse@school.com',
      password: 'nurse123',
      name: 'Sarah Brown',
      role: 'NURSE',
      status: 'ACTIVE',
      gender: 'female',
      age: 32,
      residence: 'Kampala'
    },
    {
      email: 'sponsor@school.com',
      password: 'sponsor123',
      name: 'Michael Davis',
      role: 'SPONSOR',
      status: 'ACTIVE',
      gender: 'male',
      age: 50,
      residence: 'Kampala'
    }
  ];

  for (const userData of sampleUsers) {
    const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!existingUser) {
      const userHash = await bcrypt.hash(userData.password, 10);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: userHash,
          name: userData.name,
          role: userData.role,
          status: userData.status,
          gender: userData.gender,
          age: userData.age,
          residence: userData.residence,
          accountLocked: false
        }
      });
      console.log('✅ Sample user created:', userData.email);
    } else {
      console.log('⏭️ User already exists:', userData.email);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { 
  console.error(e); 
  prisma.$disconnect(); 
}); 