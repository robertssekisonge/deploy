import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Ensure Inventory table exists (Postgres compatible)
async function ensureInventoryTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryItem" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "category" TEXT,
        "quantity" INTEGER NOT NULL DEFAULT 0,
        "unit" TEXT,
        "location" TEXT,
        "status" TEXT DEFAULT 'available',
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  } catch (error) {
    // Best-effort; do not block route usage
    console.error('Failed to ensure InventoryItem table:', error);
  }
}

// OPM Dashboard Data
router.get('/dashboard-data', async (req, res) => {
  try {
    // Get current user from session/auth (you may need to adjust this based on your auth setup)
    // For now, we'll return mock data that matches the OPMDashboard interface
    
    const dashboardData = {
      totalBudget: 500000,
      totalExpenses: 125000,
      totalPurchases: 45000,
      activeProjects: 3,
      completedTasks: 12,
      pendingTasks: 8,
      fundAllocations: [
        {
          id: 1,
          source: 'School Operations',
          amount: 200000,
          allocated: 150000,
          remaining: 50000,
          category: 'Operations'
        },
        {
          id: 2,
          source: 'Facilities Maintenance',
          amount: 150000,
          allocated: 75000,
          remaining: 75000,
          category: 'Maintenance'
        },
        {
          id: 3,
          source: 'Equipment & Supplies',
          amount: 100000,
          allocated: 45000,
          remaining: 55000,
          category: 'Equipment'
        }
      ],
      recentExpenses: [
        {
          id: 1,
          description: 'Building Maintenance',
          amount: 15000,
          category: 'Maintenance',
          date: new Date().toISOString(),
          status: 'Approved'
        },
        {
          id: 2,
          description: 'Office Supplies',
          amount: 2500,
          category: 'Supplies',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'Pending'
        },
        {
          id: 3,
          description: 'Equipment Repair',
          amount: 8500,
          category: 'Equipment',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'Approved'
        }
      ],
      recentPurchases: [
        {
          id: 1,
          item: 'Computer Equipment',
          amount: 12000,
          supplier: 'Tech Solutions Ltd',
          date: new Date().toISOString(),
          status: 'Delivered'
        },
        {
          id: 2,
          item: 'Cleaning Supplies',
          amount: 1800,
          supplier: 'CleanPro Supplies',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'In Transit'
        }
      ],
      activeProjectsList: [
        {
          id: 1,
          name: 'School Building Renovation',
          type: 'Construction',
          progress: 75,
          status: 'In Progress',
          budget: 150000,
          startDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          endDate: new Date(Date.now() + 2592000000).toISOString() // 30 days from now
        },
        {
          id: 2,
          name: 'Computer Lab Setup',
          type: 'Equipment',
          progress: 45,
          status: 'In Progress',
          budget: 50000,
          startDate: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
          endDate: new Date(Date.now() + 1728000000).toISOString() // 20 days from now
        },
        {
          id: 3,
          name: 'Playground Equipment',
          type: 'Infrastructure',
          progress: 90,
          status: 'Near Completion',
          budget: 30000,
          startDate: new Date(Date.now() - 3456000000).toISOString(), // 40 days ago
          endDate: new Date(Date.now() + 864000000).toISOString() // 10 days from now
        }
      ],
      upcomingDeadlines: [
        {
          id: 1,
          title: 'Budget Review Meeting',
          date: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
          priority: 'High',
          type: 'Meeting'
        },
        {
          id: 2,
          title: 'Equipment Maintenance Due',
          date: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
          priority: 'Medium',
          type: 'Maintenance'
        },
        {
          id: 3,
          title: 'Quarterly Report Submission',
          date: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
          priority: 'High',
          type: 'Report'
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching OPM dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch OPM dashboard data' });
  }
});

// OPM Budget Management
router.get('/budgets', async (req, res) => {
  try {
    // Mock budget data - replace with actual database queries
    const budgets = [
      {
        id: 1,
        name: 'School Operations Budget',
        totalAmount: 200000,
        allocatedAmount: 150000,
        remainingAmount: 50000,
        category: 'Operations',
        fiscalYear: '2024',
        status: 'Active'
      },
      {
        id: 2,
        name: 'Facilities Maintenance',
        totalAmount: 150000,
        allocatedAmount: 75000,
        remainingAmount: 75000,
        category: 'Maintenance',
        fiscalYear: '2024',
        status: 'Active'
      }
    ];

    res.json(budgets);
  } catch (error) {
    console.error('Error fetching OPM budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// OPM Expense Management
router.get('/expenses', async (req, res) => {
  try {
    // Mock expense data - replace with actual database queries
    const expenses = [
      {
        id: 1,
        description: 'Building Maintenance',
        amount: 15000,
        category: 'Maintenance',
        date: new Date().toISOString(),
        status: 'Approved',
        approvedBy: 'Admin'
      },
      {
        id: 2,
        description: 'Office Supplies',
        amount: 2500,
        category: 'Supplies',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'Pending',
        approvedBy: null
      }
    ];

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching OPM expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// OPM Construction Projects
router.get('/construction-projects', async (req, res) => {
  try {
    // Mock construction project data
    const projects = [
      {
        id: 1,
        projectName: 'Main Building Renovation',
        projectType: 'Renovation',
        description: 'Complete renovation of the main academic building including classrooms and offices',
        location: 'Main Campus - Block A',
        startDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        endDate: new Date(Date.now() + 5184000000).toISOString(), // 60 days from now
        budget: 50000000,
        spentAmount: 15000000,
        status: 'In Progress',
        priority: 'High',
        contractor: 'BuildCorp Ltd',
        progress: 30,
        materials: ['Cement', 'Steel', 'Paint', 'Tiles', 'Windows'],
        equipment: ['Crane', 'Bulldozer', 'Generator', 'Welding Machine'],
        notes: 'Phase 1 completed, starting Phase 2 next week',
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        projectName: 'New Science Laboratory',
        projectType: 'Construction',
        description: 'Construction of a new modern science laboratory with advanced equipment',
        location: 'Main Campus - Block B',
        startDate: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
        endDate: new Date(Date.now() + 3456000000).toISOString(), // 40 days from now
        budget: 75000000,
        spentAmount: 25000000,
        status: 'In Progress',
        priority: 'High',
        contractor: 'ScienceBuild Inc',
        progress: 45,
        materials: ['Concrete', 'Steel', 'Glass', 'Laboratory Equipment'],
        equipment: ['Excavator', 'Concrete Mixer', 'Crane', 'Safety Equipment'],
        notes: 'Foundation completed, starting superstructure',
        createdAt: new Date(Date.now() - 1728000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        projectName: 'Playground Equipment Installation',
        projectType: 'Construction',
        description: 'Installation of new playground equipment and safety surfaces',
        location: 'Primary School Playground',
        startDate: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
        endDate: new Date(Date.now() + 1728000000).toISOString(), // 20 days from now
        budget: 15000000,
        spentAmount: 8000000,
        status: 'In Progress',
        priority: 'Medium',
        contractor: 'PlaySafe Equipment Co',
        progress: 60,
        materials: ['Playground Equipment', 'Safety Surfacing', 'Fencing'],
        equipment: ['Installation Tools', 'Safety Equipment'],
        notes: 'Equipment delivered, installation in progress',
        createdAt: new Date(Date.now() - 864000000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    res.json(projects);
  } catch (error) {
    console.error('Error fetching construction projects:', error);
    res.status(500).json({ error: 'Failed to fetch construction projects' });
  }
});

// OPM Purchase Orders
router.get('/purchase-orders', async (req, res) => {
  try {
    // Mock purchase order data - replace with actual database queries
    const purchaseOrders = [
      {
        id: 1,
        item: 'Computer Equipment',
        amount: 12000,
        supplier: 'Tech Solutions Ltd',
        date: new Date().toISOString(),
        status: 'Delivered',
        poNumber: 'PO-2024-001'
      },
      {
        id: 2,
        item: 'Cleaning Supplies',
        amount: 1800,
        supplier: 'CleanPro Supplies',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'In Transit',
        poNumber: 'PO-2024-002'
      }
    ];

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching OPM purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// OPM Tasks
router.get('/tasks', async (req, res) => {
  try {
    // Mock task data - replace with actual database queries
    const tasks = [
      {
        id: 1,
        title: 'Complete Budget Review',
        description: 'Review and approve quarterly budget allocations',
        status: 'In Progress',
        priority: 'High',
        assignedTo: 'OPM Team',
        dueDate: new Date(Date.now() + 604800000).toISOString(),
        category: 'Budget'
      },
      {
        id: 2,
        title: 'Equipment Maintenance',
        description: 'Schedule maintenance for school equipment',
        status: 'Pending',
        priority: 'Medium',
        assignedTo: 'Maintenance Team',
        dueDate: new Date(Date.now() + 1209600000).toISOString(),
        category: 'Maintenance'
      }
    ];

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching OPM tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;

// ============= INVENTORY MANAGEMENT =============
// List inventory items
router.get('/inventory', async (req, res) => {
  try {
    await ensureInventoryTable();
    const items = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "InventoryItem" ORDER BY id DESC`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Create inventory item
router.post('/inventory', async (req, res) => {
  try {
    await ensureInventoryTable();
    const { name, category, quantity, unit, location, status, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const q = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "InventoryItem" (name, category, quantity, unit, location, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      name, category || null, q, unit || null, location || null, status || 'available', notes || null
    );
    res.status(201).json(inserted?.[0] || null);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/inventory/:id', async (req, res) => {
  try {
    await ensureInventoryTable();
    const { id } = req.params;
    const { name, category, quantity, unit, location, status, notes } = req.body || {};
    const q = Number.isFinite(Number(quantity)) ? Number(quantity) : null;
    const updated = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "InventoryItem"
       SET name = COALESCE($2, name),
           category = COALESCE($3, category),
           quantity = COALESCE($4, quantity),
           unit = COALESCE($5, unit),
           location = COALESCE($6, location),
           status = COALESCE($7, status),
           notes = COALESCE($8, notes),
           "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      Number(id), name ?? null, category ?? null, q, unit ?? null, location ?? null, status ?? null, notes ?? null
    );
    if (!updated?.length) return res.status(404).json({ error: 'Not found' });
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/inventory/:id', async (req, res) => {
  try {
    await ensureInventoryTable();
    const { id } = req.params;
    const deleted = await prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM "InventoryItem" WHERE id = $1 RETURNING *`,
      Number(id)
    );
    if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});
