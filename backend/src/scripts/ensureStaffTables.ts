import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureStaffTables() {
  try {
    // StaffRole table (used by HR to categorize roles)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StaffRole" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Staff table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Staff" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "role" TEXT,
        "dateOfBirth" TEXT,
        "village" TEXT,
        "nextOfKin" TEXT,
        "nextOfKinPhone" TEXT,
        "nationalId" TEXT,
        "medicalIssues" TEXT,
        "contractDurationMonths" INTEGER,
        "amountToPay" DOUBLE PRECISION DEFAULT 0,
        "hrNotes" TEXT,
        "bankAccountName" TEXT,
        "bankAccountNumber" TEXT,
        "bankName" TEXT,
        "bankBranch" TEXT,
        "mobileMoneyNumber" TEXT,
        "mobileMoneyProvider" TEXT,
        "cvFileName" TEXT,
        "cvFilePath" TEXT,
        "cvFileType" TEXT,
        "cvFileData" BYTEA,
        "passportPhotoFileName" TEXT,
        "passportPhotoFilePath" TEXT,
        "passportPhotoType" TEXT,
        "passportPhotoData" BYTEA,
        "attachments" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Idempotent add columns for older DBs
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "amountToPay" DOUBLE PRECISION DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "cvFileType" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "cvFileData" BYTEA;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "passportPhotoType" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "passportPhotoData" BYTEA;`);
  } catch (err) {
    console.error('Failed to ensure Staff tables:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run when imported
ensureStaffTables();


