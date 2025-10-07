import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Ensure StaffRole table exists (best-effort, idempotent)
async function ensureStaffRoleTableExists() {
  // This is a safety net for environments where migrations haven't run yet.
  // It creates the table if it does not exist, matching the Prisma model minimally.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StaffRole" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  // Keep updatedAt in sync on update
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION set_updated_at_timestamp() RETURNS TRIGGER AS $$
    BEGIN
      NEW."updatedAt" = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'staffrole_set_updated_at'
      ) THEN
        CREATE TRIGGER staffrole_set_updated_at
        BEFORE UPDATE ON "StaffRole"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
      END IF;
    END $$;
  `);
}

// List roles
router.get('/', async (_req, res) => {
  try {
    let roles = await prisma.staffRole.findMany({ orderBy: { name: 'asc' } });
    res.json(roles);
  } catch (error) {
    try {
      // Attempt auto-initialize and retry once
      await ensureStaffRoleTableExists();
      const roles = await prisma.staffRole.findMany({ orderBy: { name: 'asc' } });
      return res.json(roles);
    } catch (e) {
      console.error('Error listing staff roles:', e);
      return res.status(500).json({ error: 'Failed to list staff roles' });
    }
  }
});

// Create role
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });
    const role = await prisma.staffRole.create({ data: { name, description: description || null } });
    res.status(201).json(role);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Role already exists' });
    }
    try {
      // If table missing or not migrated, auto-create then retry once
      await ensureStaffRoleTableExists();
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Role name is required' });
      const role = await prisma.staffRole.create({ data: { name, description: description || null } });
      return res.status(201).json(role);
    } catch (e: any) {
      console.error('Error creating staff role:', e);
      return res.status(500).json({ error: 'Failed to create staff role' });
    }
  }
});

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.staffRole.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff role:', error);
    res.status(500).json({ error: 'Failed to delete staff role' });
  }
});

export default router;


