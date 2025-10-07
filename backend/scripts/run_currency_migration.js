const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Running currency migration...');
    
    // Add currency columns to SchoolFunding table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SchoolFunding" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ SchoolFunding table updated');

    // Add currency columns to FoundationFunding table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FoundationFunding" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ FoundationFunding table updated');

    // Add currency columns to FarmIncome table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FarmIncome" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ FarmIncome table updated');

    // Add currency columns to ClinicIncome table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ClinicIncome" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ ClinicIncome table updated');

    // Add currency columns to Expenditure table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Expenditure" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ Expenditure table updated');

    // Add currency columns to FundAllocation table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "FundAllocation" 
      ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT DEFAULT 'UGX',
      ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION DEFAULT 1.0;
    `);
    console.log('✅ FundAllocation table updated');

    // Create currency exchange rates table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CurrencyExchangeRates" (
        "id" SERIAL PRIMARY KEY,
        "fromCurrency" TEXT NOT NULL,
        "toCurrency" TEXT NOT NULL,
        "rate" DOUBLE PRECISION NOT NULL,
        "effectiveDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("fromCurrency", "toCurrency", "effectiveDate")
      );
    `);
    console.log('✅ CurrencyExchangeRates table created');

    // Insert default exchange rates
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CurrencyExchangeRates" ("fromCurrency", "toCurrency", "rate", "effectiveDate") VALUES
      ('USD', 'UGX', 3700.0, NOW()),
      ('EUR', 'UGX', 4000.0, NOW()),
      ('GBP', 'UGX', 4600.0, NOW()),
      ('UGX', 'UGX', 1.0, NOW())
      ON CONFLICT ("fromCurrency", "toCurrency", "effectiveDate") DO NOTHING;
    `);
    console.log('✅ Default exchange rates inserted');
    
    console.log('🎉 Currency migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();