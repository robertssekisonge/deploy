import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureSettingsTable() {
  try {
    // Create Settings table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" SERIAL PRIMARY KEY,
        "currentYear" TEXT,
        "currentTerm" TEXT,
        "securitySettings" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure updatedAt trigger
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = 'settings_set_updated_at'
        ) THEN
          CREATE OR REPLACE FUNCTION set_settings_updated_at() RETURNS TRIGGER AS $$
          BEGIN
            NEW."updatedAt" = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          CREATE TRIGGER settings_set_updated_at
          BEFORE UPDATE ON "Settings"
          FOR EACH ROW EXECUTE FUNCTION set_settings_updated_at();
        END IF;
      END $$;
    `);

    // Ensure a default row with id=1 exists
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Settings" (id, "currentYear", "currentTerm", "securitySettings")
      VALUES (1, TO_CHAR(NOW(),'YYYY'), 'Term 1', '{}')
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (err) {
    console.error('Failed to ensure Settings table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run when imported
ensureSettingsTable();



