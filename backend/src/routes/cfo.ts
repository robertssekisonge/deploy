import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Ensure CFO financial tables exist
async function ensureCFOTables() {
  try {
    // School Funding table (Postgres compatible)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SchoolFunding" (
        "id" SERIAL PRIMARY KEY,
        "fundType" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "recordedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Foundation Funding table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FoundationFunding" (
        "id" SERIAL PRIMARY KEY,
        "fundType" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "recordedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Farm Income table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FarmIncome" (
        "id" SERIAL PRIMARY KEY,
        "incomeType" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "recordedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Clinic Income table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClinicIncome" (
        "id" SERIAL PRIMARY KEY,
        "incomeType" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "recordedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Expenditure table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Expenditure" (
        "id" SERIAL PRIMARY KEY,
        "expenseType" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "fundSource" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "recordedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "receiptNumber" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Fund Allocation table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FundAllocation" (
        "id" SERIAL PRIMARY KEY,
        "fundSource" TEXT NOT NULL,
        "allocatedAmount" DOUBLE PRECISION NOT NULL,
        "allocatedFor" TEXT NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "allocatedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Financial Statement table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FinancialStatement" (
        "id" SERIAL PRIMARY KEY,
        "statementType" TEXT NOT NULL,
        "period" TEXT NOT NULL,
        "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "netIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "generatedBy" TEXT NOT NULL,
        "generatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ CFO financial tables ensured');
  } catch (error) {
    console.error('❌ Error ensuring CFO tables:', error);
  }
}

// Initialize tables on startup
ensureCFOTables();

// Get all financial data for dashboard
router.get('/dashboard-data', async (req, res) => {
  try {
    const [
      schoolFunding,
      foundationFunding,
      farmIncome,
      clinicIncome,
      expenditures,
      fundAllocations
    ] = await Promise.all([
      prisma.$queryRaw`SELECT * FROM "SchoolFunding" WHERE status = 'active' ORDER BY date DESC`,
      prisma.$queryRaw`SELECT * FROM "FoundationFunding" WHERE status = 'active' ORDER BY date DESC`,
      prisma.$queryRaw`SELECT * FROM "FarmIncome" WHERE status = 'active' ORDER BY date DESC`,
      prisma.$queryRaw`SELECT * FROM "ClinicIncome" WHERE status = 'active' ORDER BY date DESC`,
      prisma.$queryRaw`SELECT * FROM "Expenditure" WHERE status = 'active' ORDER BY date DESC`,
      prisma.$queryRaw`SELECT * FROM "FundAllocation" WHERE status = 'active' ORDER BY date DESC`
    ]);

    res.json({
      schoolFunding,
      foundationFunding,
      farmIncome,
      clinicIncome,
      expenditures,
      fundAllocations
    });
  } catch (error) {
    console.error('Error fetching CFO dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Record School Funding
router.post('/school-funding', async (req, res) => {
  try {
    const { fundType, source, amount, description, recordedBy, date, originalAmount, originalCurrency, exchangeRate } = req.body;

    // If a custom date is provided, include it explicitly; otherwise rely on DB default
    let result;
    if (date) {
      const rec = await prisma.$queryRaw`INSERT INTO "SchoolFunding" ("fundType","source","amount","description","date","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${fundType}, ${source}, ${amount}, ${description}, ${new Date(date)}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    } else {
      const rec = await prisma.$queryRaw`INSERT INTO "SchoolFunding" ("fundType","source","amount","description","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${fundType}, ${source}, ${amount}, ${description}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    }

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error recording school funding:', error);
    res.status(500).json({ error: 'Failed to record school funding' });
  }
});

// Update School Funding
router.put('/school-funding/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fundType, source, amount, description, date } = req.body;

    await prisma.$executeRaw`UPDATE "SchoolFunding" SET "fundType" = ${fundType}, "source" = ${source}, "amount" = ${amount}, "description" = ${description}, "date" = ${date ? new Date(date) : undefined}, "updatedAt" = NOW() WHERE id = ${id} AND status = 'active'`;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating school funding:', error);
    res.status(500).json({ error: 'Failed to update school funding' });
  }
});

// Soft Delete School Funding
router.delete('/school-funding/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE "SchoolFunding" SET status = 'deleted', "updatedAt" = NOW() WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting school funding:', error);
    res.status(500).json({ error: 'Failed to delete school funding' });
  }
});

// Record Foundation Funding
router.post('/foundation-funding', async (req, res) => {
  try {
    const { fundType, source, amount, description, recordedBy, date } = req.body;

    let result;
    if (date) {
      const rec = await prisma.$queryRaw`INSERT INTO "FoundationFunding" ("fundType","source","amount","description","date","recordedBy") VALUES (${fundType}, ${source}, ${amount}, ${description}, ${new Date(date)}, ${recordedBy}) RETURNING id`;
      result = rec?.[0]?.id;
    } else {
      const rec = await prisma.$queryRaw`INSERT INTO "FoundationFunding" ("fundType","source","amount","description","recordedBy") VALUES (${fundType}, ${source}, ${amount}, ${description}, ${recordedBy}) RETURNING id`;
      result = rec?.[0]?.id;
    }

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error recording foundation funding:', error);
    res.status(500).json({ error: 'Failed to record foundation funding' });
  }
});

// Update Foundation Funding
router.put('/foundation-funding/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fundType, source, amount, description, date } = req.body;
    await prisma.$executeRaw`UPDATE "FoundationFunding" SET "fundType" = ${fundType}, "source" = ${source}, "amount" = ${amount}, "description" = ${description}, "date" = ${date ? new Date(date) : undefined}, "updatedAt" = NOW() WHERE id = ${id} AND status = 'active'`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating foundation funding:', error);
    res.status(500).json({ error: 'Failed to update foundation funding' });
  }
});

// Soft Delete Foundation Funding
router.delete('/foundation-funding/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE "FoundationFunding" SET status = 'deleted', "updatedAt" = NOW() WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting foundation funding:', error);
    res.status(500).json({ error: 'Failed to delete foundation funding' });
  }
});

// Record Farm Income
router.post('/farm-income', async (req, res) => {
  try {
    const { incomeType, source, amount, description, recordedBy, date, originalAmount, originalCurrency, exchangeRate } = req.body;

    let result;
    if (date) {
      const rec = await prisma.$queryRaw`INSERT INTO "FarmIncome" ("incomeType","source","amount","description","date","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${incomeType}, ${source}, ${amount}, ${description}, ${new Date(date)}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    } else {
      const rec = await prisma.$queryRaw`INSERT INTO "FarmIncome" ("incomeType","source","amount","description","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${incomeType}, ${source}, ${amount}, ${description}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    }

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error recording farm income:', error);
    res.status(500).json({ error: 'Failed to record farm income' });
  }
});

// Update Farm Income
router.put('/farm-income/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { incomeType, source, amount, description, date } = req.body;
    await prisma.$executeRaw`UPDATE "FarmIncome" SET "incomeType" = ${incomeType}, "source" = ${source}, "amount" = ${amount}, "description" = ${description}, "date" = ${date ? new Date(date) : undefined}, "updatedAt" = NOW() WHERE id = ${id} AND status = 'active'`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating farm income:', error);
    res.status(500).json({ error: 'Failed to update farm income' });
  }
});

// Soft Delete Farm Income
router.delete('/farm-income/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE "FarmIncome" SET status = 'deleted', "updatedAt" = NOW() WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting farm income:', error);
    res.status(500).json({ error: 'Failed to delete farm income' });
  }
});

// Record Clinic Income
router.post('/clinic-income', async (req, res) => {
  try {
    const { incomeType, source, amount, description, recordedBy, date, originalAmount, originalCurrency, exchangeRate } = req.body;

    let result;
    if (date) {
      const rec = await prisma.$queryRaw`INSERT INTO "ClinicIncome" ("incomeType","source","amount","description","date","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${incomeType}, ${source}, ${amount}, ${description}, ${new Date(date)}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    } else {
      const rec = await prisma.$queryRaw`INSERT INTO "ClinicIncome" ("incomeType","source","amount","description","recordedBy","originalAmount","originalCurrency","exchangeRate") VALUES (${incomeType}, ${source}, ${amount}, ${description}, ${recordedBy}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
      result = rec?.[0]?.id;
    }

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error recording clinic income:', error);
    res.status(500).json({ error: 'Failed to record clinic income' });
  }
});

// Update Clinic Income
router.put('/clinic-income/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { incomeType, source, amount, description, date } = req.body;
    await prisma.$executeRaw`UPDATE "ClinicIncome" SET "incomeType" = ${incomeType}, "source" = ${source}, "amount" = ${amount}, "description" = ${description}, "date" = ${date ? new Date(date) : undefined}, "updatedAt" = NOW() WHERE id = ${id} AND status = 'active'`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating clinic income:', error);
    res.status(500).json({ error: 'Failed to update clinic income' });
  }
});

// Soft Delete Clinic Income
router.delete('/clinic-income/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE "ClinicIncome" SET status = 'deleted', "updatedAt" = NOW() WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting clinic income:', error);
    res.status(500).json({ error: 'Failed to delete clinic income' });
  }
});

// Record Expenditure
router.post('/expenditure', async (req, res) => {
  try {
    const { expenseType, category, amount, description, fundSource, recordedBy, receiptNumber, originalAmount, originalCurrency, exchangeRate } = req.body;

    const rec = await prisma.$queryRaw`INSERT INTO "Expenditure" ("expenseType","category","amount","description","fundSource","recordedBy","receiptNumber","originalAmount","originalCurrency","exchangeRate") VALUES (${expenseType}, ${category}, ${amount}, ${description}, ${fundSource}, ${recordedBy}, ${receiptNumber}, ${originalAmount || amount}, ${originalCurrency || 'UGX'}, ${exchangeRate || 1.0}) RETURNING id`;
    const result = rec?.[0]?.id;

    // If this is a Salary expenditure, mirror it into a Salary Fund Allocation
    // so that the Accountant's Pay Staff window can immediately reflect it.
    if (typeof expenseType === 'string' && expenseType.toLowerCase() === 'salaries') {
      try {
        await prisma.$queryRaw`INSERT INTO "FundAllocation" ("fundSource","allocatedAmount","allocatedFor","description","allocatedBy") VALUES (${fundSource || 'N/A'}, ${Number(amount) || 0}, ${'Salaries'}, ${description || 'Allocated via Expenditure (Salaries)'}, ${recordedBy || 'system'})`;
      } catch (e) {
        console.warn('Failed to mirror Salary expenditure to FundAllocation:', (e as any)?.message || e);
      }
    }

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error recording expenditure:', error);
    res.status(500).json({ error: 'Failed to record expenditure' });
  }
});

// Update Expenditure
router.put('/expenditure/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { expenseType, category, amount, description, fundSource, receiptNumber, date } = req.body || {};
    const dateParam = date ? new Date(date) : null;
    await prisma.$executeRawUnsafe(
      `UPDATE "Expenditure"
       SET "expenseType" = $1,
           "category" = $2,
           "amount" = $3,
           "description" = $4,
           "fundSource" = $5,
           "receiptNumber" = $6,
           "date" = COALESCE($7, "date"),
           "updatedAt" = NOW()
       WHERE id = $8 AND status = 'active'`,
      expenseType, category, Number(amount), description, fundSource, receiptNumber, dateParam, id
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expenditure:', error);
    res.status(500).json({ error: 'Failed to update expenditure' });
  }
});

// Soft Delete Expenditure
router.delete('/expenditure/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE "Expenditure" SET status='deleted', "updatedAt"=NOW() WHERE id=${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ error: 'Failed to delete expenditure' });
  }
});

// Allocate Funds
router.post('/fund-allocation', async (req, res) => {
  try {
    const { fundSource, allocatedAmount, allocatedFor, allocatedTo, description, allocatedBy } = req.body;

    const rec = await prisma.$queryRaw`INSERT INTO "FundAllocation" ("fundSource","allocatedAmount","allocatedFor","allocatedTo","description","allocatedBy") VALUES (${fundSource}, ${allocatedAmount}, ${allocatedFor}, ${allocatedTo}, ${description}, ${allocatedBy}) RETURNING id`;
    const result = rec?.[0]?.id;

    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Error allocating funds:', error);
    res.status(500).json({ error: 'Failed to allocate funds' });
  }
});

// Get Salary Allocations (case-insensitive, substring match to tolerate input variations)
router.get('/salary-allocations', async (req, res) => {
  try {
    // Return real FundAllocation rows plus synthesized rows from Expenditure that look like salary/payroll
    const allocations = await prisma.$queryRawUnsafe(`
      SELECT id, "fundSource", "allocatedAmount", "allocatedFor", "description", "date", "allocatedBy", status,
             false as "isDerived"
      FROM "FundAllocation"
      WHERE status = 'active' AND (
        LOWER(COALESCE("allocatedFor", '')) LIKE '%salar%'
        OR LOWER(COALESCE("allocatedFor", '')) LIKE '%payroll%'
        OR LOWER(COALESCE("allocatedFor", '')) LIKE '%pay roll%'
        OR (LOWER(COALESCE("allocatedFor", '')) LIKE '%pay%' AND LOWER(COALESCE("allocatedFor", '')) LIKE '%staff%')
        OR LOWER(COALESCE("description", '')) LIKE '%salar%'
        OR LOWER(COALESCE("description", '')) LIKE '%payroll%'
        OR LOWER(COALESCE("description", '')) LIKE '%pay roll%'
        OR (LOWER(COALESCE("description", '')) LIKE '%pay%' AND LOWER(COALESCE("description", '')) LIKE '%staff%')
      )
      UNION ALL
      SELECT 
        (-1 * e.id) as id,               -- negative id to avoid collision and indicate synthesized
        COALESCE(e."fundSource", 'N/A') as "fundSource",
        e.amount as "allocatedAmount",
        COALESCE(e."expenseType", e.category) as "allocatedFor",
        COALESCE(e."description", 'Derived from Expenditure') as description,
        e."date" as date,
        e."recordedBy" as "allocatedBy",
        e.status as status,
        true as "isDerived"
      FROM "Expenditure" e
      WHERE e.status = 'active' AND (
        LOWER(COALESCE(e."expenseType", '')) LIKE '%salar%'
        OR LOWER(COALESCE(e.category, '')) LIKE '%salar%'
        OR LOWER(COALESCE(e."expenseType", '')) LIKE '%payroll%'
        OR LOWER(COALESCE(e.category, '')) LIKE '%payroll%'
        OR LOWER(COALESCE(e."expenseType", '')) LIKE '%pay roll%'
        OR LOWER(COALESCE(e.category, '')) LIKE '%pay roll%'
      )
      ORDER BY date DESC
    `);
    res.json(allocations as any);
  } catch (error) {
    console.error('Error fetching salary allocations:', error);
    res.status(500).json({ error: 'Failed to fetch salary allocations' });
  }
});

// Update Salary Allocation (deduct when paying staff)
router.put('/salary-allocation/:id/deduct', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Get current allocation
    const allocation = await prisma.$queryRaw`SELECT * FROM "FundAllocation" WHERE id = ${parseInt(id)} AND status = 'active'`;
    
    if (!allocation || allocation.length === 0) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    const currentAllocation = allocation[0];
    const newRemainingAmount = currentAllocation.allocatedAmount - amount;

    if (newRemainingAmount < 0) {
      return res.status(400).json({ error: 'Insufficient allocated funds' });
    }

    // Update the allocation with remaining amount
    await prisma.$queryRaw`UPDATE "FundAllocation" SET "allocatedAmount" = ${newRemainingAmount} WHERE id = ${parseInt(id)}`;

    res.json({ 
      success: true, 
      remainingAmount: newRemainingAmount,
      deductedAmount: amount 
    });
  } catch (error) {
    console.error('Error deducting from salary allocation:', error);
    res.status(500).json({ error: 'Failed to deduct from allocation' });
  }
});

// Delete Fund Allocation
router.delete('/fund-allocation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting status to inactive
    await prisma.$queryRaw`UPDATE "FundAllocation" SET status = 'inactive' WHERE id = ${parseInt(id)}`;
    
    res.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

// Generate Financial Statement
router.post('/financial-statement', async (req, res) => {
  try {
    const { statementType, period, generatedBy } = req.body;

    // Calculate totals
    const [totalIncomeResult, totalExpensesResult] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(amount), 0) as schoolFunding,
          (SELECT COALESCE(SUM(amount), 0) FROM FoundationFunding WHERE status = 'active') as foundationFunding,
          (SELECT COALESCE(SUM(amount), 0) FROM FarmIncome WHERE status = 'active') as farmIncome,
          (SELECT COALESCE(SUM(amount), 0) FROM ClinicIncome WHERE status = 'active') as clinicIncome
        FROM SchoolFunding 
        WHERE status = 'active'
      `,
      prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM Expenditure WHERE status = 'active'`
    ]);

    const incomeData = totalIncomeResult[0] as any;
    const expensesData = totalExpensesResult[0] as any;

    const totalIncome = incomeData.schoolFunding + incomeData.foundationFunding + incomeData.farmIncome + incomeData.clinicIncome;
    const totalExpenses = expensesData.totalExpenses;
    const netIncome = totalIncome - totalExpenses;

    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO FinancialStatement (statementType, period, totalIncome, totalExpenses, netIncome, generatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `, statementType, period, totalIncome, totalExpenses, netIncome, generatedBy);

    res.json({ 
      success: true, 
      id: result,
      statement: {
        totalIncome,
        totalExpenses,
        netIncome,
        breakdown: {
          schoolFunding: incomeData.schoolFunding,
          foundationFunding: incomeData.foundationFunding,
          farmIncome: incomeData.farmIncome,
          clinicIncome: incomeData.clinicIncome
        }
      }
    });
  } catch (error) {
    console.error('Error generating financial statement:', error);
    res.status(500).json({ error: 'Failed to generate financial statement' });
  }
});

// Get Financial Statements
router.get('/financial-statements', async (req, res) => {
  try {
    const statements = await prisma.$queryRaw`SELECT * FROM FinancialStatement WHERE status = 'active' ORDER BY generatedAt DESC`;
    res.json(statements);
  } catch (error) {
    console.error('Error fetching financial statements:', error);
    res.status(500).json({ error: 'Failed to fetch financial statements' });
  }
});

// Get Fund Sources for allocation
router.get('/fund-sources', async (req, res) => {
  try {
    const [schoolFunding, foundationFunding, farmIncome, clinicIncome] = await Promise.all([
      prisma.$queryRaw`SELECT DISTINCT "fundType" as source, 'School Funding' as category FROM "SchoolFunding" WHERE status = 'active'`,
      prisma.$queryRaw`SELECT DISTINCT "fundType" as source, 'Foundation Funding' as category FROM "FoundationFunding" WHERE status = 'active'`,
      prisma.$queryRaw`SELECT DISTINCT "incomeType" as source, 'Farm Income' as category FROM "FarmIncome" WHERE status = 'active'`,
      prisma.$queryRaw`SELECT DISTINCT "incomeType" as source, 'Clinic Income' as category FROM "ClinicIncome" WHERE status = 'active'`
    ]);

    res.json({
      schoolFunding,
      foundationFunding,
      farmIncome,
      clinicIncome
    });
  } catch (error) {
    console.error('Error fetching fund sources:', error);
    res.status(500).json({ error: 'Failed to fetch fund sources' });
  }
});

// Get Complete Money Overview
router.get('/money-overview', async (req, res) => {
  try {
    // Get all income sources
    const [schoolFunding, foundationFunding, farmIncome, clinicIncome] = await Promise.all([
      prisma.$queryRaw`SELECT "fundType" as source, 'School Funding' as category, SUM(amount) as totalAmount FROM "SchoolFunding" WHERE status = 'active' GROUP BY "fundType"`,
      prisma.$queryRaw`SELECT "fundType" as source, 'Foundation Funding' as category, SUM(amount) as totalAmount FROM "FoundationFunding" WHERE status = 'active' GROUP BY "fundType"`,
      prisma.$queryRaw`SELECT "incomeType" as source, 'Farm Income' as category, SUM(amount) as totalAmount FROM "FarmIncome" WHERE status = 'active' GROUP BY "incomeType"`,
      prisma.$queryRaw`SELECT "incomeType" as source, 'Clinic Income' as category, SUM(amount) as totalAmount FROM "ClinicIncome" WHERE status = 'active' GROUP BY "incomeType"`
    ]);

    // Get all expenditures
    const expenditures = await prisma.$queryRaw`
      SELECT category, SUM(amount) as totalAmount, COUNT(*) as count
      FROM "Expenditure" 
      GROUP BY category
      ORDER BY totalAmount DESC
    `;

    // Get all fund allocations
    const allocations = await prisma.$queryRaw`
      SELECT 
        "allocatedTo",
        SUM("allocatedAmount") as totalAllocated,
        COUNT(*) as allocationCount
      FROM "FundAllocation" 
      WHERE "allocatedTo" IS NOT NULL
      GROUP BY "allocatedTo"
      ORDER BY totalAllocated DESC
    `;

    // Get recent transactions (last 50)
    const recentTransactions = await prisma.$queryRaw`
      SELECT 
        id,
        'expense' as type,
        description,
        amount,
        category,
        "fundSource" as source,
        date
      FROM "Expenditure"
      ORDER BY date DESC
      LIMIT 25
      
      UNION ALL
      
      SELECT 
        id,
        'income' as type,
        description,
        amount,
        "fundType" as category,
        "fundType" as source,
        date
      FROM "SchoolFunding"
      ORDER BY date DESC
      LIMIT 25
      
      ORDER BY date DESC
      LIMIT 50
    `;

    // Calculate totals
    const totalIncome = [
      ...schoolFunding,
      ...foundationFunding,
      ...farmIncome,
      ...clinicIncome
    ].reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    const totalExpenses = expenditures.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const netBalance = totalIncome - totalExpenses;

    // Process fund sources
    const allFundSources = [
      ...schoolFunding,
      ...foundationFunding,
      ...farmIncome,
      ...clinicIncome
    ];

    const fundSources = allFundSources.map(source => {
      const usedAmount = expenditures
        .filter(exp => exp.category === source.category)
        .reduce((sum, exp) => sum + Number(exp.totalAmount || 0), 0);
      
      const totalAmount = Number(source.totalAmount || 0);
      const remainingAmount = totalAmount - usedAmount;
      const percentage = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;

      return {
        source: source.source,
        category: source.category,
        totalAmount,
        usedAmount,
        remainingAmount,
        percentage
      };
    });

    // Process expense categories
    const expenseCategories = expenditures.map(expense => {
      const totalAmount = Number(expense.totalAmount || 0);
      const percentage = totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0;
      
      return {
        category: expense.category,
        totalAmount,
        count: Number(expense.count || 0),
        percentage
      };
    });

    // Process user allocations
    const userAllocations = allocations.map(allocation => {
      const totalAllocated = Number(allocation.totalAllocated || 0);
      // For now, we'll estimate used amount as 30% of allocated (in real app, this would be calculated from actual usage)
      const totalUsed = totalAllocated * 0.3;
      const remainingAmount = totalAllocated - totalUsed;

      return {
        user: allocation.allocatedTo,
        totalAllocated,
        totalUsed,
        remainingAmount,
        allocations: Number(allocation.allocationCount || 0)
      };
    });

    // Mock monthly trends (in real app, this would be calculated from actual data)
    const monthlyTrends = [
      { month: 'Jan', income: totalIncome * 0.1, expenses: totalExpenses * 0.1, net: (totalIncome - totalExpenses) * 0.1 },
      { month: 'Feb', income: totalIncome * 0.12, expenses: totalExpenses * 0.11, net: (totalIncome - totalExpenses) * 0.12 },
      { month: 'Mar', income: totalIncome * 0.15, expenses: totalExpenses * 0.13, net: (totalIncome - totalExpenses) * 0.15 },
      { month: 'Apr', income: totalIncome * 0.18, expenses: totalExpenses * 0.16, net: (totalIncome - totalExpenses) * 0.18 },
      { month: 'May', income: totalIncome * 0.2, expenses: totalExpenses * 0.18, net: (totalIncome - totalExpenses) * 0.2 },
      { month: 'Jun', income: totalIncome * 0.25, expenses: totalExpenses * 0.22, net: (totalIncome - totalExpenses) * 0.25 }
    ];

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      fundSources,
      expenseCategories,
      allocations: userAllocations,
      recentTransactions,
      monthlyTrends,
      userAllocations
    });
  } catch (error) {
    console.error('Error fetching money overview:', error);
    res.status(500).json({ error: 'Failed to fetch money overview' });
  }
});

export default router;
