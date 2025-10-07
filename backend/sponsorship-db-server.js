const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    console.log('🏥 Health check requested');
    
    // Test database connection
    const sponsorshipCount = await prisma.sponsorship.count();
    const studentCount = await prisma.student.count();
    const userCount = await prisma.user.count();
    
    res.json({
      status: 'healthy',
      message: 'Sponsorship server is running with PostgreSQL',
      timestamp: new Date().toISOString(),
      port: PORT,
      database: 'PostgreSQL',
      data: {
        sponsorships: sponsorshipCount,
        students: studentCount,
        users: userCount
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

// Get all sponsorships
app.get('/api/sponsorships', async (req, res) => {
  try {
    console.log('📋 GET /api/sponsorships - Fetching all sponsorships');
    
    const sponsorships = await prisma.sponsorship.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${sponsorships.length} sponsorships`);
    res.json(sponsorships);
  } catch (error) {
    console.error('❌ Error fetching sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// Create new sponsorship
app.post('/api/sponsorships', async (req, res) => {
  try {
    const sponsorshipData = req.body;
    console.log('🎯 Creating new sponsorship:', sponsorshipData);

    // Validate required fields
    if (!sponsorshipData.studentId || !sponsorshipData.sponsorName || !sponsorshipData.amount) {
      return res.status(400).json({ error: 'Missing required fields: studentId, sponsorName, amount' });
    }

    // Create sponsorship in database
    const newSponsorship = await prisma.sponsorship.create({
      data: {
        studentId: sponsorshipData.studentId,
        sponsorName: sponsorshipData.sponsorName,
        sponsorCountry: sponsorshipData.sponsorCountry || 'Uganda',
        amount: parseFloat(sponsorshipData.amount),
        type: sponsorshipData.type || 'EDUCATION',
        status: 'PENDING',
        startDate: new Date(sponsorshipData.sponsorshipStartDate || new Date()),
        description: sponsorshipData.message || sponsorshipData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Sponsorship created successfully:', newSponsorship);
    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('❌ Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship', details: error.message });
  }
});

// Update sponsorship
app.put('/api/sponsorships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`🔄 PUT /api/sponsorships/${id} - Updating sponsorship`);

    const updatedSponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    console.log('✅ Sponsorship updated successfully:', updatedSponsorship);
    res.json(updatedSponsorship);
  } catch (error) {
    console.error('❌ Error updating sponsorship:', error);
    res.status(500).json({ error: 'Failed to update sponsorship' });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    console.log('📚 GET /api/students - Fetching all students');
    
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get available students for sponsors
app.get('/api/students/available-for-sponsors', async (req, res) => {
  try {
    console.log('🎯 GET /api/students/available-for-sponsors - Fetching available students');
    
    // Get students who don't have active sponsorships
    const students = await prisma.student.findMany({
      where: {
        status: 'active',
        NOT: {
          accessNumber: {
            in: await prisma.sponsorship.findMany({
              where: { status: { in: ['PENDING', 'ACTIVE'] } },
              select: { studentId: true }
            }).then(sponsorships => sponsorships.map(s => s.studentId))
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${students.length} available students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching available students:', error);
    res.status(500).json({ error: 'Failed to fetch available students' });
  }
});

// Get sponsorships by status
app.get('/api/sponsorships/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    console.log(`📊 GET /api/sponsorships/status/${status} - Fetching sponsorships`);
    
    const sponsorships = await prisma.sponsorship.findMany({
      where: { status: status.toUpperCase() },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${sponsorships.length} sponsorships with status: ${status}`);
    res.json(sponsorships);
  } catch (error) {
    console.error('❌ Error fetching sponsorships by status:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// Get pending sponsorships
app.get('/api/sponsorships/pending', async (req, res) => {
  try {
    console.log('⏳ GET /api/sponsorships/pending - Fetching pending sponsorships');
    
    const pendingSponsorships = await prisma.sponsorship.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${pendingSponsorships.length} pending sponsorships`);
    res.json(pendingSponsorships);
  } catch (error) {
    console.error('❌ Error fetching pending sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch pending sponsorships' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 GET /api/users - Fetching all users');
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Returning ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    console.log('👥 Creating new user:', userData);

    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password,
        role: userData.role,
        status: 'ACTIVE',
        createdAt: new Date()
      }
    });

    console.log('✅ User created successfully:', newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get sponsorship statistics
app.get('/api/sponsorships/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/sponsorships/stats - Fetching statistics');
    
    const [total, pending, active, completed] = await Promise.all([
      prisma.sponsorship.count(),
      prisma.sponsorship.count({ where: { status: 'PENDING' } }),
      prisma.sponsorship.count({ where: { status: 'ACTIVE' } }),
      prisma.sponsorship.count({ where: { status: 'COMPLETED' } })
    ]);

    const totalAmount = await prisma.sponsorship.aggregate({
      _sum: { amount: true }
    });

    const stats = {
      total,
      pending,
      active,
      completed,
      totalAmount: totalAmount._sum.amount || 0
    };

    console.log('✅ Returning sponsorship statistics');
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting sponsorship stats:', error);
    res.status(500).json({ error: 'Failed to get sponsorship stats' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const sponsorshipCount = await prisma.sponsorship.count();
    const studentCount = await prisma.student.count();
    const userCount = await prisma.user.count();
    
    console.log(`🚀 Sponsorship server running on http://localhost:${PORT}`);
    console.log(`📊 Database: PostgreSQL`);
    console.log(`📊 Current data: ${sponsorshipCount} sponsorships, ${studentCount} students, ${userCount} users`);
    console.log(`🎯 Available endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/sponsorships`);
    console.log(`   POST /api/sponsorships`);
    console.log(`   PUT  /api/sponsorships/:id`);
    console.log(`   GET  /api/students`);
    console.log(`   GET  /api/students/available-for-sponsors`);
    console.log(`   GET  /api/sponsorships/status/:status`);
    console.log(`   GET  /api/sponsorships/pending`);
    console.log(`   GET  /api/sponsorships/stats`);
    console.log(`   GET  /api/users`);
    console.log(`   POST /api/users`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected. Server stopped.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected. Server stopped.');
  process.exit(0);
});
