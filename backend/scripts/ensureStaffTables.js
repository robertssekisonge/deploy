require('dotenv').config();
const { Client } = require('pg');

(async () => {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		const statements = [
			`CREATE TABLE IF NOT EXISTS "StaffRole" (
				"id" SERIAL PRIMARY KEY,
				"name" TEXT UNIQUE NOT NULL,
				"description" TEXT,
				"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
				"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
			);`,
			`CREATE OR REPLACE FUNCTION set_updated_at_timestamp() RETURNS TRIGGER AS $$
			BEGIN
				NEW."updatedAt" = NOW();
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;`,
			`DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_trigger WHERE tgname = 'staffrole_set_updated_at'
				) THEN
					CREATE TRIGGER staffrole_set_updated_at
					BEFORE UPDATE ON "StaffRole"
					FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
				END IF;
			END $$;`,
			`CREATE TABLE IF NOT EXISTS "Staff" (
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
				"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
				"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
			);`,
			`DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_trigger WHERE tgname = 'staff_set_updated_at'
				) THEN
					CREATE TRIGGER staff_set_updated_at
					BEFORE UPDATE ON "Staff"
					FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
				END IF;
			END $$;`
		];

		// Idempotent adds for older DBs
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;`);
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "amountToPay" DOUBLE PRECISION DEFAULT 0;`);
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "cvFileType" TEXT;`);
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "cvFileData" BYTEA;`);
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "passportPhotoType" TEXT;`);
		await client.query(`ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "passportPhotoData" BYTEA;`);

		for (const sql of statements) {
			await client.query(sql);
		}

		console.log('✅ Staff and StaffRole tables ensured');
	} catch (e) {
		console.error('❌ Failed ensuring staff tables:', e);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
})();
