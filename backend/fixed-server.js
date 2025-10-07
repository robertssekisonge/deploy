const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const count = await prisma.student.count();
    res.json({ 
      status: 'healthy', 
      students: count,
      message: 'Fixed Backend Server is running'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`📚 GET /api/students - Returning ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get dropped access numbers
app.get('/api/students/dropped-access-numbers', async (req, res) => {
  try {
    const droppedNumbers = await prisma.droppedAccessNumber.findMany({
      orderBy: { droppedAt: 'desc' }
    });
    res.json(droppedNumbers);
  } catch (error) {
    console.error('❌ Error fetching dropped access numbers:', error);
    res.status(500).json({ error: 'Failed to fetch dropped access numbers' });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.delete({
      where: { id: studentId }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Flag student
app.patch('/api/students/:id/flag', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { status, comment } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: status || 'left',
        flagComment: comment || '',
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Student flagged successfully' });
  } catch (error) {
    console.error('❌ Error flagging student:', error);
    res.status(500).json({ error: 'Failed to flag student' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fixed Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Students: http://localhost:${PORT}/api/students`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});






