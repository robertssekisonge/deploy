const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  try {
    const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
    students = JSON.parse(data);
    console.log(`📚 Loaded ${students.length} students from file`);
  } catch (error) {
    console.log('📚 Starting with empty students list');
    students = [];
  }
}

// Save students function
function saveStudents() {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log('💾 Students saved to file');
  } catch (error) {
    console.error('❌ Error saving students:', error);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running!',
    studentsCount: students.length 
  });
});

// Get all students
app.get('/api/students', (req, res) => {
  res.json(students);
});

// Create new student
app.post('/api/students', (req, res) => {
  try {
    console.log('📥 Received student data:', req.body);
    
    const newStudent = {
      id: `ST${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    students.push(newStudent);
    saveStudents();
    
    console.log('✅ Student saved successfully:', newStudent.name);
    
    res.status(201).json({
      success: true,
      message: `Student "${newStudent.name}" saved successfully!`,
      student: newStudent
    });
  } catch (error) {
    console.error('❌ Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: error.message
    });
  }
});

  // Process payment endpoint
  app.post('/api/payments/process', async (req, res) => {
  try {
    const { studentId, amount, billingType, paymentMethod, paymentReference, description, processedBy } = req.body;
    
    console.log('Processing payment:', { studentId, amount, billingType, paymentMethod, paymentReference });
    
    // Find student robustly: support numeric id, string id, or accessNumber
    let student = null;
    try {
      const numericId = Number(studentId);
      if (!Number.isNaN(numericId)) {
        student = await prisma.student.findFirst({ where: { id: numericId } });
      }
    } catch (e) {
      // ignore and try other lookup methods
    }
    if (!student) {
      try {
        // Some schemas use string IDs
        student = await prisma.student.findFirst({ where: { id: studentId } });
      } catch (e) {
        // ignore; fall back to accessNumber
      }
    }
    if (!student) {
      try {
        student = await prisma.student.findFirst({ where: { accessNumber: String(studentId) } });
      } catch (e) {
        // final fallback handled below
      }
    }
    
    // If student not found, we will still record the payment against the provided studentId
    // This avoids hard failures when the student exists in a different ID format
    
    // Helper to ensure table exists (for fresh SQLite setups)
    async function ensureFinancialRecordTable() {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "FinancialRecord" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "studentId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "billingType" TEXT NOT NULL,
            "billingAmount" REAL NOT NULL,
            "amount" REAL NOT NULL,
            "description" TEXT NOT NULL,
            "date" DATETIME NOT NULL,
            "paymentDate" DATETIME,
            "paymentTime" TEXT,
            "paymentMethod" TEXT,
            "status" TEXT NOT NULL,
            "receiptNumber" TEXT,
            "balance" REAL NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_financialrecord_studentId ON "FinancialRecord" ("studentId");');
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_financialrecord_status ON "FinancialRecord" ("status");');
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_financialrecord_date ON "FinancialRecord" ("date");');
      } catch (e) {
        console.error('Error ensuring FinancialRecord table:', e);
      }
    }

    // Create financial record (always allowed)
    async function createRecord() {
      return prisma.financialRecord.create({
      data: {
        studentId: studentId.toString(),
        type: 'payment',
        billingType: billingType || 'General Payment',
        billingAmount: parseFloat(amount),
        amount: parseFloat(amount),
        description: description || (student ? `Payment for ${student.name}` : `Payment for ${String(studentId)}`),
        date: new Date(),
        paymentDate: new Date(),
        paymentTime: new Date().toLocaleTimeString(),
        paymentMethod: paymentMethod || 'Cash',
        status: 'paid',
        receiptNumber: paymentReference || `PAY${Date.now()}`,
        balance: 0
      }
      });
    }

    let financialRecord;
    try {
      financialRecord = await createRecord();
    } catch (err) {
      if (String(err?.message || '').includes('no such table') || String(err?.message || '').includes('no such table: FinancialRecord')) {
        console.warn('FinancialRecord table missing. Creating now...');
        await ensureFinancialRecordTable();
        financialRecord = await createRecord();
      } else {
        throw err;
      }
    }
    
    console.log('Financial record created:', financialRecord);
    
    // Optionally update student's payment status if we found the student
    if (student) {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          updatedAt: new Date()
        }
      });
    }
    
    res.json({
      success: true,
      payment: financialRecord,
      message: 'Payment processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
});

// Get payment summary for student
app.get('/api/payments/summary/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('Fetching payment summary for student:', studentId);
    
    // Get all payments for this student
    const payments = await prisma.financialRecord.findMany({
      where: {
        studentId: studentId,
        status: 'paid'
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('Found payments:', payments.length);
    
    // Calculate totals by billing type
    const summary = {};
    payments.forEach(payment => {
      const type = payment.billingType;
      if (!summary[type]) {
        summary[type] = 0;
      }
      summary[type] += payment.amount;
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      summary,
      totalPaid,
      paymentCount: payments.length,
      payments: payments
    });
    
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment summary',
      details: error.message 
    });
  }
});

// Get student by access number
app.get('/api/students/search/:accessNumber', async (req, res) => {
  try {
    const { accessNumber } = req.params;
    
    const student = await prisma.student.findFirst({
      where: { accessNumber: accessNumber }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
    
  } catch (error) {
    console.error('Error searching student:', error);
    res.status(500).json({ 
      error: 'Failed to search student',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Current students: ${students.length}`);
  console.log('🎯 Available endpoints:');
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/students`);
  console.log(`   POST /api/students`);
  console.log(`   POST /api/payments/process`);
  console.log(`   GET  /api/payments/summary/:studentId`);
  console.log(`   GET  /api/students/search/:accessNumber`);
});


