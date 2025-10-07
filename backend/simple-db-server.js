const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 5174;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    console.log('🏥 Health check requested');
    
    const sponsorCount = await prisma.sponsorship.count();
    const studentCount = await prisma.student.count();
    
    res.json({
      status: 'healthy',
      message: 'Simple database server is running',
      timestamp: new Date().toISOString(),
      port: PORT,
      database: 'connected',
      data: {
        sponsorships: sponsorCount,
        students: studentCount
      }
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);
    
    // For now, let's create a simple authentication
    // In a real app, you'd check against the database
    if (email === 'robs@school.com' && password === 'password') {
      const user = {
        id: '1',
        name: 'Robert Admin',
        email: 'robs@school.com',
        role: 'admin',
        privileges: ['manage_students', 'manage_sponsorships', 'view_reports']
      };
      
      console.log('✅ Login successful for:', email);
      res.json(user);
    } else {
      console.log('❌ Login failed for:', email);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 Getting users');
    // Return a default user for now
    const users = [
      {
        id: '1',
        name: 'Robert Admin',
        email: 'robs@school.com',
        role: 'admin',
        privileges: ['manage_students', 'manage_sponsorships', 'view_reports']
      }
    ];
    res.json(users);
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create sponsorship endpoint
app.post('/api/sponsorships', async (req, res) => {
  try {
    const sponsorshipData = req.body;
    console.log('🎯 Creating sponsorship:', sponsorshipData);
    
    const newSponsorship = await prisma.sponsorship.create({
      data: {
        studentId: sponsorshipData.studentId,
        sponsorName: sponsorshipData.sponsorName,
        sponsorCountry: sponsorshipData.sponsorCountry || 'Uganda',
        amount: parseFloat(sponsorshipData.amount),
        type: 'EDUCATION',
        status: 'PENDING',
        startDate: new Date(),
        description: sponsorshipData.message || sponsorshipData.description
      }
    });
    
    console.log('✅ Sponsorship created:', newSponsorship);
    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('❌ Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship', details: error.message });
  }
});

// Get sponsorships endpoint
app.get('/api/sponsorships', async (req, res) => {
  try {
    console.log('📋 Getting sponsorships');
    const sponsorships = await prisma.sponsorship.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(sponsorships);
  } catch (error) {
    console.error('❌ Error getting sponsorships:', error);
    res.status(500).json({ error: 'Failed to get sponsorships' });
  }
});

// Get students endpoint
app.get('/api/students', async (req, res) => {
  try {
    console.log('📚 Getting students');
    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(students);
  } catch (error) {
    console.error('❌ Error getting students:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Weekly reports endpoint
app.get('/api/reports/weekly', async (req, res) => {
  console.log('📊 Getting weekly reports');
  res.json([]);
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Simple database server running on http://127.0.0.1:${PORT}`);
  console.log(`💾 Connected to PostgreSQL database`);
  console.log(`🔐 Authentication enabled`);
  console.log(`🎯 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/users`);
  console.log(`   POST /api/sponsorships`);
  console.log(`   GET  /api/sponsorships`);
  console.log(`   GET  /api/students`);
  console.log(`   GET  /api/reports/weekly`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
