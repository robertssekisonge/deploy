import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get fund allocations for sponsorship coordinator
router.get('/fund-allocations', async (req, res) => {
  try {
    const allocations = await prisma.$queryRaw`
      SELECT 
        id,
        "fundSource",
        "allocatedAmount",
        "allocatedFor",
        "allocatedTo",
        description,
        date,
        "allocatedBy",
        status,
        -- Calculate used amount (mock data for now)
        ("allocatedAmount" * 0.3) as "usedAmount",
        -- Calculate remaining amount
        ("allocatedAmount" * 0.7) as "remainingAmount",
        -- Calculate utilization percentage
        30.0 as "utilizationPercentage"
      FROM "FundAllocation" 
      WHERE "allocatedTo" = 'Sponsorship Coordinator'
      ORDER BY date DESC
    `;

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching coordinator fund allocations:', error);
    res.status(500).json({ error: 'Failed to fetch fund allocations' });
  }
});

// Get sponsored children
router.get('/sponsored-children', async (req, res) => {
  try {
    const children = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        class,
        stream,
        "sponsorshipStatus",
        -- Mock sponsor information (in real app, this would come from sponsorships table)
        'John Sponsor' as "sponsorName",
        500000 as "sponsorAmount",
        '2024-01-15' as "lastPaymentDate",
        200000 as "totalPaid",
        300000 as "remainingBalance"
      FROM "Student" 
      WHERE "sponsorshipStatus" IN ('sponsored', 'pending', 'active')
      ORDER BY name
      LIMIT 20
    `;

    res.json(children);
  } catch (error) {
    console.error('Error fetching sponsored children:', error);
    res.status(500).json({ error: 'Failed to fetch sponsored children' });
  }
});

// Get sponsor payments
router.get('/sponsor-payments', async (req, res) => {
  try {
    const payments = await prisma.$queryRaw`
      SELECT 
        id,
        'John Sponsor' as "sponsorName",
        'Jane Doe' as "studentName",
        amount,
        date as "paymentDate",
        "paymentMethod",
        status,
        description
      FROM "FinancialRecord" 
      WHERE type = 'sponsorship' OR description ILIKE '%sponsor%'
      ORDER BY date DESC
      LIMIT 20
    `;

    res.json(payments);
  } catch (error) {
    console.error('Error fetching sponsor payments:', error);
    res.status(500).json({ error: 'Failed to fetch sponsor payments' });
  }
});

// Request additional funds
router.post('/request-additional-funds', async (req, res) => {
  try {
    const { allocationId, requestedAmount, reason, requestedBy } = req.body;

    // In a real app, this would create a fund request record
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: 'Additional fund request submitted successfully',
      requestId: Date.now()
    });
  } catch (error) {
    console.error('Error requesting additional funds:', error);
    res.status(500).json({ error: 'Failed to submit fund request' });
  }
});

// Get coordinator dashboard summary
router.get('/dashboard-summary', async (req, res) => {
  try {
    const [allocations, children, payments] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count, SUM("allocatedAmount") as total FROM "FundAllocation" WHERE "allocatedTo" = 'Sponsorship Coordinator'`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "Student" WHERE "sponsorshipStatus" IN ('sponsored', 'pending', 'active')`,
      prisma.$queryRaw`SELECT COUNT(*) as count, SUM(amount) as total FROM "FinancialRecord" WHERE type = 'sponsorship' OR description ILIKE '%sponsor%'`
    ]);

    res.json({
      totalAllocations: Number(allocations[0]?.count || 0),
      totalAllocated: Number(allocations[0]?.total || 0),
      totalSponsoredChildren: Number(children[0]?.count || 0),
      totalPayments: Number(payments[0]?.count || 0),
      totalPaymentAmount: Number(payments[0]?.total || 0)
    });
  } catch (error) {
    console.error('Error fetching coordinator dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;



