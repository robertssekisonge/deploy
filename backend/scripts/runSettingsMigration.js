require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    console.log('🔄 Running Settings table migration...');
    
    // Add all the missing columns
    const alterStatements = [
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolName" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolAddress" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolPhone" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolEmail" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolMotto" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolWebsite" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolPOBox" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolDistrict" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolRegion" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolCountry" TEXT DEFAULT \'Uganda\';',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolFounded" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolRegistrationNumber" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolLicenseNumber" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolTaxNumber" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "termStart" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "termEnd" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "reportingDate" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "nextTermBegins" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "attendanceStart" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "attendanceEnd" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "publicHolidays" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolNameSize" INTEGER DEFAULT 18;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolNameColor" TEXT DEFAULT \'#0f172a\';',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "mottoSize" INTEGER DEFAULT 12;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "mottoColor" TEXT DEFAULT \'#475569\';',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "schoolBadge" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "docPrimaryColor" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "docFontFamily" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "docFontSize" INTEGER;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "hrName" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "hrSignatureImage" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "bankDetailsHtml" TEXT;',
      'ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "rulesRegulationsHtml" TEXT;'
    ];
    
    for (const statement of alterStatements) {
      await client.query(statement);
      console.log('✅ Executed:', statement);
    }
    
    console.log('🎉 Settings table migration completed successfully!');
    console.log('📊 All settings now have dedicated database columns');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
})();

