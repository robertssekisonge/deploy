import { Router } from 'express';
import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs';

const router = Router();

// Convert data URI/base64 to Buffer and content type
function parseBase64DataUri(base64Data: string, defaultExt: string): { buffer: Buffer; mime: string; ext: string } {
  const match = /^data:(.*?);base64,(.*)$/i.exec(base64Data || '');
  const mime = match?.[1] || (defaultExt === 'pdf' ? 'application/pdf' : 'image/jpeg');
  const dataPart = match ? match[2] : (base64Data || '').replace(/^data:.*?;base64,/, '');
  const buffer = Buffer.from(dataPart, 'base64');
  const ext = defaultExt;
  return { buffer, mime, ext };
}

// Create staff record
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      role,
      dateOfBirth,
      village,
      nextOfKin,
      nextOfKinPhone,
      nationalId,
      medicalIssues,
      contractDurationMonths,
      amountToPay,
      hrNotes,
      bankAccountName,
      bankAccountNumber,
      bankName,
      bankBranch,
      mobileMoneyNumber,
      mobileMoneyProvider,
      cvFile, // { fileData, fileType }
      passportPhoto, // { fileData, fileType }
      attachments, // JSON string or array
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const data: any = {
      name,
      phone: phone || null,
      email: email || null,
      role: role || null,
      dateOfBirth: dateOfBirth || null,
      village: village || null,
      nextOfKin: nextOfKin || null,
      nextOfKinPhone: nextOfKinPhone || null,
      nationalId: nationalId || null,
      medicalIssues: medicalIssues || null,
      contractDurationMonths: contractDurationMonths ?? null,
      hrNotes: hrNotes || null,
      bankAccountName: bankAccountName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankName: bankName || null,
      bankBranch: bankBranch || null,
      mobileMoneyNumber: mobileMoneyNumber || null,
      mobileMoneyProvider: mobileMoneyProvider || null,
      attachments: attachments ? (Array.isArray(attachments) ? JSON.stringify(attachments) : attachments) : null,
      notes: notes || null
    };

    if (cvFile && cvFile.fileData) {
      const parsed = parseBase64DataUri(cvFile.fileData, 'pdf');
      data.cvFileName = `cv_${Date.now()}.pdf`;
      data.cvFilePath = data.cvFileName;
      // File type and data set via raw SQL below
    }

    if (passportPhoto && passportPhoto.fileData) {
      const parsed = parseBase64DataUri(passportPhoto.fileData, 'jpg');
      data.passportPhotoFileName = `passport_${Date.now()}.jpg`;
      data.passportPhotoFilePath = data.passportPhotoFileName;
      // File type and data set via raw SQL below
    }

    const staff = await prisma.staff.create({ data });
    // Set extra fields via raw SQL to avoid Prisma client mismatches and to store binaries
    try {
      if (nationalId) {
        await prisma.$executeRawUnsafe(`UPDATE "Staff" SET "nationalId" = $1 WHERE id = $2`, nationalId, staff.id);
      }
      // Set amountToPay via raw SQL to avoid Prisma client version mismatch
      if (amountToPay !== undefined && amountToPay !== null) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "amountToPay" = $1 WHERE id = $2`,
          Number(amountToPay),
          staff.id
        );
      }
      if (cvFile && cvFile.fileData) {
        const parsed = parseBase64DataUri(cvFile.fileData, 'pdf');
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "cvFileData" = $1, "cvFileType" = $2 WHERE id = $3`,
          parsed.buffer,
          parsed.mime,
          staff.id
        );
      }
      if (passportPhoto && passportPhoto.fileData) {
        const parsed = parseBase64DataUri(passportPhoto.fileData, 'jpg');
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "passportPhotoData" = $1, "passportPhotoType" = $2 WHERE id = $3`,
          parsed.buffer,
          parsed.mime,
          staff.id
        );
      }
    } catch (e) {
      console.warn('Could not set nationalId on create (will still continue):', e);
    }
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// List staff
router.get('/', async (_req, res) => {
  try {
    const staff = await prisma.staff.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(staff);
  } catch (error) {
    console.error('Error listing staff:', error);
    res.status(500).json({ error: 'Failed to list staff' });
  }
});

// Get staff by id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Not found' });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Return passport photo as base64 data URI (no filesystem)
router.get('/:id/passport-base64', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Not found' });
    // Fetch binary and type via raw SQL for compatibility
    const rows: any = await prisma.$queryRawUnsafe(`SELECT "passportPhotoData" AS data, "passportPhotoType" AS type FROM "Staff" WHERE id = $1`, id);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (!row || !row.data) return res.json({ fileData: null, fileType: null });
    const base64 = Buffer.from(row.data).toString('base64');
    const dataUri = `data:${row.type || 'image/jpeg'};base64,${base64}`;
    res.json({ fileData: dataUri, fileType: row.type || 'image/jpeg' });
  } catch (error) {
    console.error('Error loading staff passport photo:', error);
    res.status(500).json({ error: 'Failed to load passport photo' });
  }
});

// Return CV as base64 data URI (PDF)
router.get('/:id/cv-base64', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Not found' });
    const rows: any = await prisma.$queryRawUnsafe(`SELECT "cvFileData" AS data, "cvFileType" AS type FROM "Staff" WHERE id = $1`, id);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (!row || !row.data) return res.json({ fileData: null, fileType: null });
    const base64 = Buffer.from(row.data).toString('base64');
    const dataUri = `data:${row.type || 'application/pdf'};base64,${base64}`;
    res.json({ fileData: dataUri, fileType: row.type || 'application/pdf' });
  } catch (error) {
    console.error('Error loading staff CV:', error);
    res.status(500).json({ error: 'Failed to load CV' });
  }
});

// Download CV as attachment
router.get('/:id/cv-download', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Not found' });
    const rows: any = await prisma.$queryRawUnsafe(`SELECT "cvFileData" AS data, "cvFileType" AS type, "cvFileName" AS name FROM "Staff" WHERE id = $1`, id);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (!row || !row.data) return res.status(404).json({ error: 'CV not found' });
    res.setHeader('Content-Type', row.type || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${row.name || 'cv.pdf'}"`);
    res.send(Buffer.from(row.data));
  } catch (error) {
    console.error('Error downloading staff CV:', error);
    res.status(500).json({ error: 'Failed to download CV' });
  }
});

// Record a staff payment as a FinancialRecord using a staff-scoped id
router.post('/:id/pay', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, description, method } = req.body || {};
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    // Verify staff exists
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    // Use FinancialRecord as generalized ledger, with staff-scoped key
    const record = await prisma.financialRecord.create({
      data: {
        studentId: `staff:${id}`,
        type: 'staff_payment',
        billingType: 'staff_salary',
        billingAmount: Number(amount),
        amount: Number(amount),
        description: description || `Salary payment to ${staff.name}`,
        date: new Date(),
        paymentDate: new Date(),
        paymentMethod: method || 'cash',
        status: 'paid',
        receiptNumber: null,
        balance: 0,
      }
    });
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error paying staff:', error);
    res.status(500).json({ error: 'Failed to record staff payment' });
  }
});

// List recent staff payments (optional role/category filter)
router.get('/payments/list', async (req, res) => {
  try {
    const { role } = req.query as any;
    // Load financial records for staff payments
    const records = await prisma.financialRecord.findMany({
      where: { type: 'staff_payment' },
      orderBy: { date: 'desc' },
      take: 200
    });
    // Optionally enrich with staff names
    const result = [] as any[];
    for (const r of records) {
      const match = /^staff:(\d+)$/.exec(r.studentId || '');
      const staffId = match ? parseInt(match[1]) : null;
      let staffInfo: any = null;
      if (staffId) {
        staffInfo = await prisma.staff.findUnique({ where: { id: staffId } });
      }
      if (role && staffInfo && staffInfo.role !== role) continue;
      result.push({ ...r, staff: staffInfo, staffId });
    }
    res.json(result);
  } catch (error) {
    console.error('Error listing staff payments:', error);
    res.status(500).json({ error: 'Failed to list staff payments' });
  }
});

// Staff payment summary and history
router.get('/:id/payments/summary', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const records = await prisma.financialRecord.findMany({
      where: { type: 'staff_payment', studentId: `staff:${id}` },
      orderBy: { date: 'desc' }
    });
    const totalPaid = records.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const original = Number(staff.amountToPay || 0);
    const remaining = original > 0 ? Math.max(0, original - totalPaid) : 0;
    return res.json({ staff: { id: staff.id, name: staff.name, role: staff.role, amountToPay: staff.amountToPay }, totalPaid, remaining, payments: records });
  } catch (error) {
    console.error('Error fetching staff payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch staff payment summary' });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      phone,
      email,
      role,
      dateOfBirth,
      village,
      nextOfKin,
      nextOfKinPhone,
      nationalId,
      medicalIssues,
      contractDurationMonths,
      amountToPay,
      hrNotes,
      bankAccountName,
      bankAccountNumber,
      bankName,
      bankBranch,
      mobileMoneyNumber,
      mobileMoneyProvider,
      cvFile,
      passportPhoto,
      attachments,
      notes
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth;
    if (village !== undefined) data.village = village;
    if (nextOfKin !== undefined) data.nextOfKin = nextOfKin;
    if (nextOfKinPhone !== undefined) data.nextOfKinPhone = nextOfKinPhone;
    // Do not set nationalId in Prisma update to avoid client schema mismatch
    if (medicalIssues !== undefined) data.medicalIssues = medicalIssues;
    if (contractDurationMonths !== undefined) data.contractDurationMonths = contractDurationMonths;
    if (hrNotes !== undefined) data.hrNotes = hrNotes;
    if (bankAccountName !== undefined) data.bankAccountName = bankAccountName;
    if (bankAccountNumber !== undefined) data.bankAccountNumber = bankAccountNumber;
    if (bankName !== undefined) data.bankName = bankName;
    if (bankBranch !== undefined) data.bankBranch = bankBranch;
    if (mobileMoneyNumber !== undefined) data.mobileMoneyNumber = mobileMoneyNumber;
    if (mobileMoneyProvider !== undefined) data.mobileMoneyProvider = mobileMoneyProvider;
    if (attachments !== undefined) data.attachments = Array.isArray(attachments) ? JSON.stringify(attachments) : attachments;
    if (notes !== undefined) data.notes = notes;

    if (cvFile && cvFile.fileData) {
      const parsed = parseBase64DataUri(cvFile.fileData, 'pdf');
      data.cvFileName = `cv_${id}.pdf`;
      data.cvFilePath = data.cvFileName;
    }

    if (passportPhoto && passportPhoto.fileData) {
      const parsed = parseBase64DataUri(passportPhoto.fileData, 'jpg');
      data.passportPhotoFileName = `passport_${id}.jpg`;
      data.passportPhotoFilePath = data.passportPhotoFileName;
    }

    const updated = await prisma.staff.update({ where: { id }, data });
    try {
      if (nationalId !== undefined) {
        await prisma.$executeRawUnsafe(`UPDATE "Staff" SET "nationalId" = $1 WHERE id = $2`, nationalId, id);
      }
      if (amountToPay !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "amountToPay" = $1 WHERE id = $2`,
          Number(amountToPay),
          id
        );
      }
      if (cvFile && cvFile.fileData) {
        const parsed = parseBase64DataUri(cvFile.fileData, 'pdf');
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "cvFileData" = $1, "cvFileType" = $2 WHERE id = $3`,
          parsed.buffer,
          parsed.mime,
          id
        );
      }
      if (passportPhoto && passportPhoto.fileData) {
        const parsed = parseBase64DataUri(passportPhoto.fileData, 'jpg');
        await prisma.$executeRawUnsafe(
          `UPDATE "Staff" SET "passportPhotoData" = $1, "passportPhotoType" = $2 WHERE id = $3`,
          parsed.buffer,
          parsed.mime,
          id
        );
      }
    } catch (e) {
      console.warn('Could not set nationalId on update (will still continue):', e);
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.staff.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

export default router;


