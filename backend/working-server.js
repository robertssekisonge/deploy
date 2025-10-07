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

// Data file paths
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Load students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
  students = JSON.parse(studentsData);
  console.log(`📚 Loaded ${students.length} students from file`);
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
    status: 'healthy', 
    students: students.length,
    message: 'Server is running'
  });
});

// Get all students
app.get('/api/students', (req, res) => {
  console.log(`📚 GET /api/students - Returning ${students.length} students`);
  res.json(students);
});

// Update student
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`🔄 PUT /api/students/${id} - Updating student with:`, updates);

    const studentIndex = students.findIndex(s => s.id == id);
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updatedStudent = {
      ...students[studentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    students[studentIndex] = updatedStudent;
    saveStudents();

    console.log('✅ Student updated successfully:', updatedStudent);
    res.json(updatedStudent);
  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Process payment endpoint
app.post('/api/payments/process', async (req, res) => {
  try {
    const { studentId, amount, billingType, paymentMethod, paymentReference, description, processedBy } = req.body;
    
    console.log('Processing payment:', { studentId, amount, billingType, paymentMethod, paymentReference });
    
  // Find student robustly: numeric id, string id, or accessNumber
  let student = null;
  try {
    const numericId = Number(studentId);
    if (!Number.isNaN(numericId)) {
      student = await prisma.student.findFirst({ where: { id: numericId } });
    }
  } catch (e) {}
  if (!student) {
    try {
      student = await prisma.student.findFirst({ where: { id: studentId } });
    } catch (e) {}
  }
  if (!student) {
    try {
      student = await prisma.student.findFirst({ where: { accessNumber: String(studentId) } });
    } catch (e) {}
  }
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
    
  // Helper to ensure table exists
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
    
    // Update student's payment status
    await prisma.student.update({
      where: { id: student.id },
      data: {
        updatedAt: new Date()
      }
    });
    
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

// Settings endpoints
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Load settings
let settings = {};
if (fs.existsSync(SETTINGS_FILE)) {
  const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
  settings = JSON.parse(settingsData);
  console.log(`⚙️ Loaded settings from file`);
} else {
  // Create default settings
  settings = {
    currentYear: new Date().getFullYear(),
    currentTerm: 'Term 1',
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolMotto: '',
    schoolWebsite: '',
    schoolPOBox: '',
    schoolDistrict: '',
    schoolRegion: '',
    schoolCountry: 'Uganda',
    schoolFounded: '',
    schoolRegistrationNumber: '',
    schoolLicenseNumber: '',
    schoolTaxNumber: '',
    termStart: '',
    termEnd: '',
    reportingDate: '',
    attendanceStart: '',
    attendanceEnd: '',
    publicHolidays: '',
    schoolNameSize: 18,
    schoolNameColor: '#0f172a',
    mottoSize: 12,
    mottoColor: '#475569',
    bankDetailsHtml: '',
    rulesRegulationsHtml: ''
  };
  // Save default settings
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  console.log(`⚙️ Created default settings file`);
}

// Save settings function
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('✅ Settings saved successfully');
  } catch (error) {
    console.error('❌ Error saving settings:', error);
  }
}

// Get settings
app.get('/settings', (req, res) => {
  console.log(`⚙️ GET /settings - Returning settings`);
  res.json(settings);
});

// Update settings
app.put('/settings', (req, res) => {
  try {
    const updates = req.body;
    console.log(`🔄 PUT /settings - Updating settings with:`, updates);
    
    // Merge updates with existing settings
    settings = { ...settings, ...updates };
    
    // Save to file
    saveSettings();
    
    res.json(settings);
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Working server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${students.length} students`);
  console.log(`⚙️ Loaded settings`);
  console.log(`🎯 Test student ID: test-student-001`);
  console.log('🎯 Available endpoints:');
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/students`);
  console.log(`   PUT  /api/students/:id`);
  console.log(`   POST /api/payments/process`);
  console.log(`   GET  /api/payments/summary/:studentId`);
  console.log(`   GET  /api/students/search/:accessNumber`);
  console.log(`   GET  /settings`);
  console.log(`   PUT  /settings`);
});
