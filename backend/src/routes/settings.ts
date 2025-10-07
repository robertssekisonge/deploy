import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Settings router is working!' });
});

// Debug route to check settings persistence
router.get('/debug-persistence', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    const allSettings = await prisma.settings.findMany();
    
    console.log('📊 Settings Debug Info:');
    console.log('Settings count:', allSettings.length);
    console.log('First settings:', settings);
    
    res.json({
      settingsCount: allSettings.length,
      currentSettings: settings,
      allSettings: allSettings,
      message: 'Settings debug info retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error in settings debug:', error);
    res.status(500).json({ error: 'Failed to fetch settings debug info' });
  }
});

// Get fee structures by class (auto-syncs from Billing Types to keep them identical)
router.get('/fee-structures/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const { term, year } = req.query;
    
    try {
      const feeWhere: any = { 
        className: className,
        isActive: true 
      };
      
      // Add term and year filtering if provided
      if (term && year) {
        feeWhere.term = term;
        feeWhere.year = year;
      }
      
      const feeStructures = await prisma.feeStructure.findMany({
        where: feeWhere,
        orderBy: { feeName: 'asc' }
      });
      // Also load billing types for comparison (single source of truth)
      // Filter by term and year if provided
      const billingWhere: any = { className };
      if (term && year) {
        billingWhere.term = term;
        billingWhere.year = year;
      }
      const billing = await prisma.billingType.findMany({ where: billingWhere });

      // Determine if sync is required (different counts or any differing item names/amounts)
      const needSync = (() => {
        if (billing.length === 0) return false; // nothing to sync
        if (feeStructures.length !== billing.length) return true;
        const norm = (s: any) => String(s || '').trim().toLowerCase();
        const fsKey = (f: any) => `${norm(f.feeName || f.name)}:${Number(f.amount || 0)}`;
        const btKey = (b: any) => `${norm(b.name || b.feeName)}:${Number(b.amount || 0)}`;
        const a = new Set(feeStructures.map(fsKey));
        const b = new Set(billing.map(btKey));
        if (a.size !== b.size) return true;
        for (const k of a) if (!b.has(k)) return true;
        return false;
      })();

      let syncedList = feeStructures;
      if (needSync) {
        // Replace feeStructure rows with billing types for this class
        await prisma.feeStructure.deleteMany({ where: { className } }).catch(() => {});
        const created: any[] = [];
        for (const b of billing) {
          const row = await prisma.feeStructure.create({
            data: {
              className,
              feeName: b.name || 'General Fee',
              amount: Number(b.amount || 0),
              frequency: b.frequency || '',
              term: b.term,
              year: b.year,
              description: b.description || '',
              isActive: true
            }
          });
          created.push(row);
        }
        syncedList = created.sort((x, y) => String(x.feeName).localeCompare(String(y.feeName)));
      }

      const totalFees = syncedList.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
      return res.json({ className, feeStructures: syncedList, totalFees, feeCount: syncedList.length, synced: needSync });
    } catch (primaryErr) {
      console.warn('FeeStructure model not available or failed, falling back to BillingType:', (primaryErr as any)?.message || primaryErr);
      // Fallback: synthesize fee structures from BillingType for the class so callers don't break
      try {
        const billingWhere: any = { className };
        if (term && year) {
          billingWhere.term = term;
          billingWhere.year = year;
        }
        const billing = await prisma.billingType.findMany({ where: billingWhere });
        const synthesized = (billing || []).map((b: any) => ({
          id: b.id,
          className: b.className,
          feeName: b.name || b.feeName,
          amount: Number(b.amount || 0),
          frequency: b.frequency || '',
          term: b.term,
          year: b.year,
          description: b.description || '',
          isActive: true,
        }));
        const totalFees = synthesized.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
        return res.json({ className, feeStructures: synthesized, totalFees, feeCount: synthesized.length, source: 'billing_types_fallback' });
      } catch (fallbackErr) {
        console.error('Both FeeStructure and BillingType fetch failed:', fallbackErr);
        return res.json({ className, feeStructures: [], totalFees: 0, feeCount: 0 });
      }
    }
  } catch (error) {
    console.error('Unexpected error in fee-structures route:', error);
    res.json({ className: req.params.className, feeStructures: [], totalFees: 0, feeCount: 0 });
  }
});

// Get all fee structures
router.get('/fee-structures', async (req, res) => {
  try {
    const feeStructures = await prisma.feeStructure.findMany({
      where: { isActive: true },
      orderBy: [{ className: 'asc' }, { feeName: 'asc' }]
    });
    
    // Group by class
    const groupedByClass = feeStructures.reduce((acc, fee) => {
      if (!acc[fee.className]) {
        acc[fee.className] = [];
      }
      acc[fee.className].push(fee);
      return acc;
    }, {});
    
    // Calculate totals for each class
    const classTotals = Object.keys(groupedByClass).reduce((acc, className) => {
      acc[className] = groupedByClass[className].reduce((sum, fee) => sum + fee.amount, 0);
      return acc;
    }, {});
    
    res.json({
      feeStructures: groupedByClass,
      classTotals,
      totalClasses: Object.keys(groupedByClass).length
    });
    
  } catch (error) {
    console.error('Error fetching all fee structures:', error);
    res.status(500).json({ error: 'Failed to fetch fee structures' });
  }
});

  // Get all settings
  router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        schoolName: '',
        schoolAddress: '',
        schoolPhone: '',
        schoolEmail: '',
        schoolMotto: '',
        mottoSize: 12,
        mottoColor: '#475569',
        nextTermBegins: '',
        schoolBadge: '',
        schoolNameSize: 18,
        schoolNameColor: '#0f172a',
        attendanceStart: '',
        attendanceEnd: '',
        publicHolidays: '',
        currentYear: new Date().getFullYear(),
        currentTerm: 'Term 1'
      });
    }
    // If legacy JSON contains bank details or rules but columns are empty, migrate them
    try {
      if (settings.securitySettings && (!settings.bankDetailsHtml || !settings.rulesRegulationsHtml)) {
        const legacy = JSON.parse(settings.securitySettings || '{}');
        const needsBank = !settings.bankDetailsHtml && legacy.bankDetailsHtml;
        const needsRules = !settings.rulesRegulationsHtml && legacy.rulesRegulationsHtml;
        if (needsBank || needsRules) {
          await prisma.settings.update({
            where: { id: settings.id },
            data: {
              bankDetailsHtml: needsBank ? legacy.bankDetailsHtml : settings.bankDetailsHtml,
              rulesRegulationsHtml: needsRules ? legacy.rulesRegulationsHtml : settings.rulesRegulationsHtml
            }
          });
          // reflect in in-memory object for this response
          if (needsBank) (settings as any).bankDetailsHtml = legacy.bankDetailsHtml;
          if (needsRules) (settings as any).rulesRegulationsHtml = legacy.rulesRegulationsHtml;
        }
      }
    } catch (e) {
      console.warn('⚠️ Failed to auto-migrate legacy settings JSON to columns:', e);
    }

    // Return all settings from dedicated columns
    const response = {
      currentYear: settings.currentYear,
      currentTerm: settings.currentTerm,
      schoolName: settings.schoolName,
      schoolAddress: settings.schoolAddress,
      schoolPhone: settings.schoolPhone,
      schoolEmail: settings.schoolEmail,
      schoolMotto: settings.schoolMotto,
      mottoSize: settings.mottoSize,
      mottoColor: settings.mottoColor,
      docPrimaryColor: settings.docPrimaryColor,
      docFontFamily: settings.docFontFamily,
      docFontSize: settings.docFontSize,
      hrName: settings.hrName,
      hrSignatureImage: settings.hrSignatureImage,
      nextTermBegins: settings.nextTermBegins,
      termStart: settings.termStart,
      termEnd: settings.termEnd,
      reportingDate: settings.reportingDate,
      schoolBadge: settings.schoolBadge,
      schoolNameSize: settings.schoolNameSize,
      schoolNameColor: settings.schoolNameColor,
      attendanceStart: settings.attendanceStart,
      attendanceEnd: settings.attendanceEnd,
      publicHolidays: settings.publicHolidays,
      schoolWebsite: settings.schoolWebsite,
      schoolPOBox: settings.schoolPOBox,
      schoolDistrict: settings.schoolDistrict,
      schoolRegion: settings.schoolRegion,
      schoolCountry: settings.schoolCountry,
      schoolFounded: settings.schoolFounded,
      schoolRegistrationNumber: settings.schoolRegistrationNumber,
      schoolLicenseNumber: settings.schoolLicenseNumber,
      schoolTaxNumber: settings.schoolTaxNumber,
      bankDetailsHtml: settings.bankDetailsHtml,
      rulesRegulationsHtml: settings.rulesRegulationsHtml
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save academic settings
router.post('/academic', async (req, res) => {
  try {
    const { currentYear, currentTerm } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { currentYear: String(currentYear), currentTerm },
      create: { id: 1, currentYear: String(currentYear), currentTerm }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error saving academic settings:', error);
    res.status(500).json({ error: 'Failed to save academic settings' });
  }
});

// Save security settings
router.post('/security', async (req, res) => {
  try {
    const securitySettings = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { securitySettings: JSON.stringify(securitySettings) },
      create: { id: 1, securitySettings: JSON.stringify(securitySettings) }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error saving security settings:', error);
    res.status(500).json({ error: 'Failed to save security settings' });
  }
});

// Update general settings
router.put('/', async (req, res) => {
  try {
    const { 
      schoolName, 
      schoolAddress, 
      schoolPhone, 
      schoolEmail, 
      schoolMotto,
      mottoSize,
      mottoColor,
      // HR/Document styling fields
      docPrimaryColor,
      docFontFamily,
      docFontSize,
      hrName,
      hrSignatureImage,
      nextTermBegins,
      termStart,
      termEnd,
      reportingDate,
      schoolBadge,
      schoolNameSize,
      schoolNameColor,
      attendanceStart,
      attendanceEnd,
      publicHolidays,
      schoolWebsite,
      schoolPOBox,
      schoolDistrict,
      schoolRegion,
      schoolCountry,
      schoolFounded,
      schoolRegistrationNumber,
      schoolLicenseNumber,
      schoolTaxNumber,
      bankDetailsHtml,
      rulesRegulationsHtml,
      currentYear, 
      currentTerm 
    } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { 
        currentYear: String(currentYear), 
        currentTerm,
        // Save to dedicated columns instead of JSON
        schoolName,
        schoolAddress, 
        schoolPhone,
        schoolEmail,
        schoolMotto,
        mottoSize,
        mottoColor,
        docPrimaryColor,
        docFontFamily,
        docFontSize,
        hrName,
        hrSignatureImage,
        nextTermBegins,
        termStart,
        termEnd,
        reportingDate,
        schoolBadge,
        schoolNameSize,
        schoolNameColor,
        attendanceStart,
        attendanceEnd,
        publicHolidays,
        schoolWebsite,
        schoolPOBox,
        schoolDistrict,
        schoolRegion,
        schoolCountry,
        schoolFounded,
        schoolRegistrationNumber,
        schoolLicenseNumber,
        schoolTaxNumber,
        bankDetailsHtml,
        rulesRegulationsHtml
      },
      create: { 
        id: 1, 
        currentYear: String(currentYear), 
        currentTerm,
        // Save to dedicated columns instead of JSON
        schoolName,
        schoolAddress,
        schoolPhone, 
        schoolEmail,
        schoolMotto,
        mottoSize,
        mottoColor,
        docPrimaryColor,
        docFontFamily,
        docFontSize,
        hrName,
        hrSignatureImage,
        nextTermBegins,
        termStart,
        termEnd,
        reportingDate,
        schoolBadge,
        schoolNameSize,
        schoolNameColor,
        attendanceStart,
        attendanceEnd,
        publicHolidays,
        schoolWebsite,
        schoolPOBox,
        schoolDistrict,
        schoolRegion,
        schoolCountry,
        schoolFounded,
        schoolRegistrationNumber,
        schoolLicenseNumber,
        schoolTaxNumber,
        bankDetailsHtml,
        rulesRegulationsHtml
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

// Get billing types
router.get('/billing-types', async (req, res) => {
  try {
    console.log('Fetching billing types...');
    const billingTypes = await prisma.billingType.findMany();
    console.log('Billing types found:', billingTypes);
    res.json(billingTypes);
  } catch (error) {
    console.error('Error fetching billing types:', error);
    res.status(500).json({ error: 'Failed to fetch billing types', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add billing type
router.post('/billing-types', async (req, res) => {
  try {
    console.log('Creating billing type:', req.body);
    
    // Remove id field if it exists to let database auto-generate it
    const { id, ...billingData } = req.body;
    
    const billingType = await prisma.billingType.create({
      data: billingData
    });
    console.log('Billing type created:', billingType);
    res.json(billingType);
  } catch (error) {
    console.error('Error creating billing type:', error);
    res.status(500).json({ error: 'Failed to create billing type', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update billing type
router.put('/billing-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { id: _omit, ...billingData } = req.body || {};
    const updated = await prisma.billingType.update({
      where: { id },
      data: billingData,
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating billing type:', error);
    res.status(500).json({ error: 'Failed to update billing type', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete billing type
router.delete('/billing-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deleted = await prisma.billingType.delete({ where: { id } });
    res.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error('Error deleting billing type:', error);
    res.status(500).json({ error: 'Failed to delete billing type', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Sync Fee Structure from Billing Types (per class or all)
router.post('/fee-structures/sync-from-billing', async (req, res) => {
  try {
    const { className } = req.body || {};

    // Build filter
    const where: any = className ? { className: String(className) } : {};

    // Load billing types to mirror
    const billing = await prisma.billingType.findMany({ where });

    // Determine distinct classes to process
    const classes = Array.from(new Set(billing.map((b: any) => b.className))).filter(Boolean);

    const results: Record<string, any> = {};
    for (const cls of classes) {
      // Remove existing feeStructure rows for this class to avoid duplicates
      await prisma.feeStructure.deleteMany({ where: { className: cls } }).catch(() => {});

      const classRows = billing.filter((b: any) => b.className === cls);
      const created = [] as any[];
      for (const b of classRows) {
        const row = await prisma.feeStructure.create({
          data: {
            className: cls,
            feeName: b.name || 'General Fee',
            amount: Number(b.amount || 0),
            frequency: b.frequency || '',
            term: b.term,
            year: b.year,
            description: b.description || '',
            isActive: true
          }
        });
        created.push(row);
      }
      const totalFees = created.reduce((s, r) => s + Number(r.amount || 0), 0);
      results[cls] = { created: created.length, totalFees };
    }

    return res.json({ success: true, classes: classes.length, results });
  } catch (error) {
    console.error('Error syncing fee structures from billing types:', error);
    res.status(500).json({ success: false, error: 'Failed to sync fee structures' });
  }
});

// ADMIN: Purge all Fee Structure rows and rebuild from Billing Types
router.post('/fee-structures/admin/purge-and-rebuild', async (_req, res) => {
  try {
    // Load billing types grouped by class
    const billing = await prisma.billingType.findMany();
    const classes = Array.from(new Set(billing.map((b: any) => b.className))).filter(Boolean);

    // Purge existing fee structures
    await prisma.feeStructure.deleteMany({});

    // Recreate from billing types
    let createdCount = 0;
    for (const b of billing) {
      await prisma.feeStructure.create({
        data: {
          className: b.className || 'Default',
          feeName: b.name || 'General Fee',
          amount: Number(b.amount || 0),
          frequency: b.frequency || '',
          term: b.term,
          year: b.year,
          description: b.description || '',
          isActive: true
        }
      });
      createdCount++;
    }

    res.json({ success: true, classes: classes.length, created: createdCount });
  } catch (error) {
    console.error('Error purging/rebuilding fee structures:', error);
    res.status(500).json({ success: false, error: 'Failed to purge/rebuild fee structures' });
  }
});

export default router; 