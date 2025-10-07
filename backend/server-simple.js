const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error });
  }
});

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get attendance by date
app.get('/api/attendance/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      orderBy: { time: 'asc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({ error: 'Failed to fetch attendance by date' });
  }
});

// Create new attendance record
app.post('/api/attendance', async (req, res) => {
  try {
    const {
      studentId,
      date,
      time,
      status,
      teacherId,
      teacherName,
      remarks,
      notificationSent
    } = req.body;

    // Validate required fields
    if (!studentId || !date || !status || !teacherId || !teacherName) {
      return res.status(400).json({ error: 'Student ID, date, status, teacher ID, and teacher name are required' });
    }

    const recordData = {
      studentId,
      date: new Date(date),
      time: time || new Date().toLocaleTimeString(),
      status,
      teacherId,
      teacherName,
      remarks,
      notificationSent: notificationSent || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const record = await prisma.attendance.create({
      data: recordData
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
});

// Update attendance record
app.put('/api/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      remarks,
      notificationSent
    } = req.body;

    console.log('Updating attendance record with ID:', id);
    console.log('Update data:', { status, remarks, notificationSent });

    const updateData = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (notificationSent !== undefined) updateData.notificationSent = notificationSent;

    console.log('Final update data:', updateData);

    // Try to find the record first to see if it exists
    const existingRecord = await prisma.attendance.findFirst({
      where: { id: id }
    });

    if (!existingRecord) {
      console.log('Record not found with ID:', id);
      return res.status(404).json({ 
        error: 'Attendance record not found',
        requestedId: id
      });
    }

    console.log('Found existing record:', existingRecord);

    const record = await prisma.attendance.update({
      where: { id: id },
      data: updateData
    });

    console.log('Successfully updated record:', record);
    res.json(record);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ 
      error: 'Failed to update attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`📝 Attendance API: http://localhost:${PORT}/api/attendance`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  process.exit(0);
});







