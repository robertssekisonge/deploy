import express from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Normalize and filter fee items by student residence type
function normalizeResidence(value?: string): 'Day' | 'Boarding' | undefined {
  const raw = String(value || '').toLowerCase().trim();
  if (raw.includes('board')) return 'Boarding';
  if (raw.includes('day')) return 'Day';
  return undefined;
}

function filterFeeItemsByResidenceBackend(items: any[], residence?: 'Day' | 'Boarding') {
  const safeItems = Array.isArray(items) ? items : [];
  const normalize = (v: any) => String(v || '').toLowerCase().trim();
  
  console.log('🔍 Backend Filter Debug - Input:', { residence, itemCount: safeItems.length, items: safeItems.slice(0, 3) });

  let filtered = safeItems;
  
  // For Day students: remove boarding fees, keep lunch fees
  if (residence === 'Day') {
    console.log('🔍 Backend Filter Debug - Applying Day filter (remove boarding fees, keep lunch fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.name);
      const shouldKeep = !(label.includes('board') || label.includes('boarding'));
      console.log(`🔍 Backend Filter Debug - Day Student Item: "${it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  } 
  // For Boarding students: remove lunch fees, keep boarding fees
  else if (residence === 'Boarding') {
    console.log('🔍 Backend Filter Debug - Applying Boarding filter (remove lunch fees, keep boarding fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.name);
      const shouldKeep = !(label.includes('lunch') || label.includes('luch'));
      console.log(`🔍 Backend Filter Debug - Boarding Student Item: "${it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  }
  // Default behavior: treat as Day student (remove boarding fees)
  else {
    console.log('🔍 Backend Filter Debug - Default to Day filter (remove boarding fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.name);
      const shouldKeep = !(label.includes('board') || label.includes('boarding'));
      console.log(`🔍 Backend Filter Debug - Default Item: "${it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  }

  const total = filtered.reduce((sum, it) => sum + Number(it.amount || 0), 0);
  console.log('🔍 Backend Filter Debug - Result:', { residence, filteredCount: filtered.length, total });
  return { items: filtered, total };
}

// Find student by numeric id or accessNumber string
async function findStudentFlexible(studentIdOrAccess?: string) {
  if (!studentIdOrAccess) return null as any;
  try {
    const numericId = Number(studentIdOrAccess);
    if (!Number.isNaN(numericId) && numericId > 0) {
      const byId = await prisma.student.findUnique({ where: { id: numericId } });
      if (byId) return byId;
    }
  } catch (_e) {}
  try {
    // try by accessNumber field
    const byAccess = await prisma.student.findFirst({ where: { accessNumber: String(studentIdOrAccess) } });
    if (byAccess) return byAccess;
  } catch (_e) {}
  return null as any;
}

// Helper: resolve active fee structure for a class using current settings
async function resolveClassFeeStructure(className: string) {
  try {
    // Load current term/year from settings
    const settings = await prisma.settings.findFirst();
    const currentYear = settings?.currentYear ?? new Date().getFullYear();
    const currentTerm = settings?.currentTerm ?? 'Term 3';

    // Pull active fee items for the class from billingType table
    const fees = await prisma.billingType.findMany({
      where: { className },
      orderBy: { name: 'asc' }
    });

    // Only use fees from the current term/year - no fallback to all fees
    let filtered = fees.filter(f => String(f.year) === String(currentYear) &&
      String((f.term || '')).toLowerCase() === String(currentTerm).toLowerCase());
    
    if (filtered.length === 0) {
      console.log(`⚠️ No fees found for ${currentTerm} ${currentYear} for class ${className}`);
      // Return empty structure instead of using all fees
      return { items: [], total: 0, currentYear, currentTerm };
    }
    
    console.log(`✅ Found ${filtered.length} fees for ${currentTerm} ${currentYear} for class ${className}`);

    // Deduplicate by name, prefer highest amount
    const bestByName: Record<string, any> = {};
    for (const it of filtered) {
      const key = (it.name || '').toLowerCase();
      if (!bestByName[key] || Number(it.amount || 0) > Number(bestByName[key].amount || 0)) {
        bestByName[key] = it;
      }
    }
    const items = Object.values(bestByName);
    const total = items.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);

    return { items, total, currentYear, currentTerm };
  } catch (error) {
    // When prisma models (settings/feeStructure) are absent, return safe defaults
    const msg = (error as any)?.message || String(error);
    console.warn('Falling back: fee structure/settings unavailable. Using empty structure.', msg);
    return { items: [], total: 0, currentYear: new Date().getFullYear(), currentTerm: 'Term 3' };
  }
}

// Process payment endpoint (supports both legacy and new payloads)
router.post('/process', async (req, res) => {
  try {
    console.log('Processing payment payload:', req.body);

    // Accept new payload keys from frontend
    const studentIdFromBody: string | undefined = req.body.studentId;
    const amountFromBody: number | undefined = req.body.amount;
    const billingTypeFromBody: string | undefined = req.body.billingType; // e.g., Tuition Fee
    const paymentMethodFromBody: string | undefined = req.body.paymentMethod; // e.g., momo/cash
    const paymentReferenceFromBody: string | undefined = req.body.paymentReference;
    const descriptionFromBody: string | undefined = req.body.description;

    // Accept legacy keys for backward compatibility
    const studentNameLegacy: string | undefined = req.body.studentName;
    const paymentTypeLegacy: string | undefined = req.body.paymentType;
    const methodLegacy: string | undefined = req.body.method;
    const referenceLegacy: string | undefined = req.body.reference;
    const timestampLegacy: string | number | Date | undefined = req.body.timestamp;

    // Resolve student by numeric id or access number, then by name
    let student = null as any;
    if (studentIdFromBody) {
      student = await findStudentFlexible(String(studentIdFromBody));
    }
    if (!student && studentNameLegacy) {
      student = await prisma.student.findFirst({
        where: { name: { contains: studentNameLegacy } }
      });
    }
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const paymentAmount = Number(amountFromBody ?? 0);
    if (!paymentAmount || Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    // Map common fields
    const type = billingTypeFromBody || paymentTypeLegacy || 'payment';
    const method = (paymentMethodFromBody || methodLegacy || 'cash').toString();
    const reference = paymentReferenceFromBody || referenceLegacy || '';
    const paidDate = timestampLegacy ? new Date(timestampLegacy) : new Date();
    const description = descriptionFromBody || `Payment for ${type} - ${method}${reference ? ` (Ref: ${reference})` : ''}`;

    // Persist to financial records table if present, else to payment table
    // Prefer creating a financialRecord with richer schema when available
    try {
      // Try financialRecord model first
      const financialRecord = await prisma.financialRecord.create({
        data: {
          studentId: student.id.toString(),
          type: 'payment',
          billingType: type,
          billingAmount: paymentAmount,
          amount: paymentAmount,
          description: description,
          date: new Date(),
          paymentDate: paidDate,
          paymentTime: new Date().toLocaleTimeString(),
          paymentMethod: method,
          status: 'paid',
          receiptNumber: `RC${Date.now()}`,
          balance: 0
        }
      });

      return res.json({
        success: true,
        message: 'Payment processed successfully',
        record: financialRecord
      });
    } catch (err) {
      const msg = (err as any)?.message || String(err);
      console.warn('financialRecord model not available or failed, falling back to payment model:', msg);
    }

    // Fallback to older payment model
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id.toString(),
        amount: paymentAmount,
        type: type,
        status: 'COMPLETED',
        dueDate: new Date(),
        paidDate: paidDate,
        description: description
      }
    });

    return res.json({
      success: true,
      message: 'Payment processed successfully',
      payment
    });
  } catch (error) {
    const msg = (error as any)?.message || String(error);
    console.error('Error processing payment:', msg);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ADMIN: Clear all payments/financial records
router.delete('/admin/clear-payments', async (_req, res) => {
  try {
    const deletedFinancial = await prisma.financialRecord.deleteMany({});
    const deletedPayments = await prisma.payment.deleteMany({});
    res.json({ success: true, deleted: { financialRecords: deletedFinancial.count, payments: deletedPayments.count } });
  } catch (error) {
    console.error('Error clearing payments:', error);
    res.status(500).json({ success: false, error: 'Failed to clear payments' });
  }
});

// Get student payments
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.payment.findMany({
      where: {
        studentId: studentId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment summary for student
router.get('/summary/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Prefer financial records when available
    let financialRecords: any[] = [];
    try {
      financialRecords = await prisma.financialRecord.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (_e) {
      financialRecords = [];
    }

    // Load student and class fee structure
    const student = await findStudentFlexible(String(studentId));
    const className = student?.class || '';
    const feeDataRaw = className ? await resolveClassFeeStructure(className) : { items: [], total: 0, currentYear: new Date().getFullYear(), currentTerm: 'Term 3' };
    // Re-check latest persisted residence type each request
    const residence = normalizeResidence((student?.residenceType || undefined) as string | undefined) || 'Day';
    const feeData = filterFeeItemsByResidenceBackend(feeDataRaw.items, residence as any);
    const currentYear = (feeDataRaw as any).currentYear ?? new Date().getFullYear();
    const currentTerm = (feeDataRaw as any).currentTerm ?? 'Term 3';

    // Map paid by type (from financial records) - filter by current term/year
    const paidRecords = financialRecords.filter(r => 
      (r.type === 'payment' || r.type === 'sponsorship') && 
      r.status === 'paid' &&
      String(r.term || '').toLowerCase() === String(currentTerm).toLowerCase() &&
      String(r.year || '') === String(currentYear)
    );
    const paidByType: Record<string, number> = {};
    for (const r of paidRecords) {
      const key = (r.billingType || 'General Fee').toLowerCase();
      paidByType[key] = (paidByType[key] || 0) + Number(r.amount || 0);
    }

    // Build fee breakdown combining required and paid
    const paymentBreakdown = feeData.items.map((f: any) => {
      const key = (f.name || 'General Fee').toLowerCase();
      const required = Number(f.amount || 0);
      const paid = Number(paidByType[key] || 0);
      return {
        // Use name from billingType table
        feeName: f.name || 'General Fee',
        billingType: f.name || 'General Fee',
        required,
        paid,
        remaining: Math.max(0, required - paid),
        frequency: f.frequency || '',
        term: f.term || currentTerm,
        year: f.year || currentYear
      };
    });

    const totalPaid = paidRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalFeesRequired = feeData.total;
    const balance = Math.max(0, totalFeesRequired - totalPaid);

    return res.json({
      paymentBreakdown,
      totalPaid,
      totalFeesRequired,
      balance,
      financialRecords,
      source: 'fee_structure'
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

// Alias to support frontend path /payments/student/:studentId/summary
router.get('/student/:studentId/summary', async (req, res) => {
  // Use the same logic as the main summary endpoint to ensure consistency
  try {
    const { studentId } = req.params;

    // Prefer financial records when available
    let financialRecords: any[] = [];
    try {
      financialRecords = await prisma.financialRecord.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (_e) {
      financialRecords = [];
    }

    // Load student and class fee structure
    const student = await findStudentFlexible(String(studentId));
    const className = student?.class || '';
    const feeDataRaw = className ? await resolveClassFeeStructure(className) : { items: [], total: 0, currentYear: new Date().getFullYear(), currentTerm: 'Term 3' };
    // Re-check latest persisted residence type each request
    const residence = normalizeResidence((student?.residenceType || undefined) as string | undefined) || 'Day';
    const feeData = filterFeeItemsByResidenceBackend(feeDataRaw.items, residence as any);
    const currentYear = (feeDataRaw as any).currentYear ?? new Date().getFullYear();
    const currentTerm = (feeDataRaw as any).currentTerm ?? 'Term 3';

    // Map paid by type (from financial records) - filter by current term/year
    const paidRecords = financialRecords.filter(r => 
      (r.type === 'payment' || r.type === 'sponsorship') && 
      r.status === 'paid' &&
      String(r.term || '').toLowerCase() === String(currentTerm).toLowerCase() &&
      String(r.year || '') === String(currentYear)
    );
    const paidByType: Record<string, number> = {};
    for (const r of paidRecords) {
      const key = (r.billingType || 'General Fee').toLowerCase();
      paidByType[key] = (paidByType[key] || 0) + Number(r.amount || 0);
    }

    // Build fee breakdown combining required and paid
    const paymentBreakdown = feeData.items.map((f: any) => {
      const key = (f.name || 'General Fee').toLowerCase();
      const required = Number(f.amount || 0);
      const paid = Number(paidByType[key] || 0);
      return {
        // Use name from billingType table
        feeName: f.name || 'General Fee',
        billingType: f.name || 'General Fee',
        required,
        paid,
        remaining: Math.max(0, required - paid),
        frequency: f.frequency || '',
        term: f.term || currentTerm,
        year: f.year || currentYear
      };
    });

    const totalPaid = paidRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalFeesRequired = feeData.total;
    const balance = Math.max(0, totalFeesRequired - totalPaid);

    return res.json({
      paymentBreakdown,
      totalPaid,
      totalFeesRequired,
      balance,
      financialRecords,
      source: 'fee_structure'
    });
  } catch (error) {
    console.error('Error fetching payment summary (alias):', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

export default router;