const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data file paths
const SPONSORSHIPS_FILE = path.join(__dirname, 'data', 'sponsorships.json');
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Load or create default data
let sponsorships = [];
let students = [];
let users = [];

// Load data from files
function loadData() {
  try {
    // Load sponsorships
    if (fs.existsSync(SPONSORSHIPS_FILE)) {
      const sponsorshipsData = fs.readFileSync(SPONSORSHIPS_FILE, 'utf8');
      sponsorships = JSON.parse(sponsorshipsData);
      console.log(`🎯 Loaded ${sponsorships.length} sponsorships from file`);
    } else {
      sponsorships = [];
      fs.writeFileSync(SPONSORSHIPS_FILE, JSON.stringify(sponsorships, null, 2));
      console.log(`🎯 Created empty sponsorships file`);
    }

    // Load students
    if (fs.existsSync(STUDENTS_FILE)) {
      const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
      students = JSON.parse(studentsData);
      console.log(`📚 Loaded ${students.length} students from file`);
    } else {
      // Create default students for testing
      students = [
        {
          id: '1',
          name: 'Nakato Grace',
          accessNumber: 'AA0001',
          class: 'Senior 1',
          stream: 'A',
          age: 13,
          sponsorshipStatus: 'available-for-sponsors',
          sponsorshipStory: 'Grace dreams of becoming a doctor to help her family struggles to provide for her education.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'John Okello',
          accessNumber: 'BB0001',
          class: 'Senior 2',
          stream: 'B',
          age: 16,
          sponsorshipStatus: 'available-for-sponsors',
          sponsorshipStory: 'John is passionate about engineering and wants to build solutions for his community.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
      console.log(`📚 Created default students`);
    }

    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
      console.log(`👥 Loaded ${users.length} users from file`);
    } else {
      // Create default users
      users = [
        {
          id: '1',
          name: 'Test Sponsor',
          email: 'sponsor@test.com',
          role: 'SPONSOR',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Isaac Overseer',
          email: 'isaac@school.com',
          role: 'SPONSORSHIPS_OVERSEER',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      console.log(`👥 Created default users`);
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    sponsorships = [];
    students = [];
    users = [];
  }
}

// Save functions
function saveSponsorships() {
  try {
    fs.writeFileSync(SPONSORSHIPS_FILE, JSON.stringify(sponsorships, null, 2));
    console.log(`💾 Saved ${sponsorships.length} sponsorships to file`);
  } catch (error) {
    console.error('❌ Error saving sponsorships:', error);
  }
}

function saveStudents() {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log(`💾 Saved ${students.length} students to file`);
  } catch (error) {
    console.error('❌ Error saving students:', error);
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`💾 Saved ${users.length} users to file`);
  } catch (error) {
    console.error('❌ Error saving users:', error);
  }
}

// Load initial data
loadData();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Comprehensive Sponsorship server is running',
    timestamp: new Date().toISOString(),
    sponsorships: sponsorships.length,
    students: students.length,
    users: users.length,
    server: 'comprehensive-sponsorship-server.js'
  });
});

// Get all sponsorships
app.get('/api/sponsorships', (req, res) => {
  try {
    console.log(`📋 GET /api/sponsorships - Returning ${sponsorships.length} sponsorships`);
    res.json(sponsorships);
  } catch (error) {
    console.error('❌ Error getting sponsorships:', error);
    res.status(500).json({ error: 'Failed to get sponsorships' });
  }
});

// Create new sponsorship
app.post('/api/sponsorships', (req, res) => {
  try {
    const sponsorshipData = req.body;
    console.log('🎯 Creating new sponsorship:', sponsorshipData);

    // Validate required fields
    if (!sponsorshipData.studentId || !sponsorshipData.sponsorName || !sponsorshipData.amount) {
      return res.status(400).json({ error: 'Missing required fields: studentId, sponsorName, amount' });
    }

    // Create new sponsorship
    const newSponsorship = {
      id: 'sponsorship-' + Date.now(),
      ...sponsorshipData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to sponsorships array
    sponsorships.push(newSponsorship);

    // Update student status
    const studentIndex = students.findIndex(s => s.id === sponsorshipData.studentId);
    if (studentIndex !== -1) {
      students[studentIndex].sponsorshipStatus = 'pending';
      students[studentIndex].updatedAt = new Date().toISOString();
    }

    // Save to file
    saveSponsorships();
    saveStudents();

    console.log('✅ Sponsorship created successfully:', newSponsorship);
    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('❌ Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship' });
  }
});

// Update sponsorship
app.put('/api/sponsorships/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`🔄 Updating sponsorship ${id}:`, updates);

    const sponsorshipIndex = sponsorships.findIndex(s => s.id === id);
    if (sponsorshipIndex === -1) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }

    // Update sponsorship
    sponsorships[sponsorshipIndex] = {
      ...sponsorships[sponsorshipIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Handle status changes that affect student status
    if (updates.status) {
      const sponsorship = sponsorships[sponsorshipIndex];
      let newStudentStatus = 'available-for-sponsors';

      switch (updates.status) {
        case 'pending':
          newStudentStatus = 'pending';
          break;
        case 'sponsored':
          newStudentStatus = 'sponsored';
          break;
        case 'rejected':
          newStudentStatus = 'available-for-sponsors';
          break;
        case 'completed':
          newStudentStatus = 'completed';
          break;
      }

      // Update student status
      const studentIndex = students.findIndex(s => s.id === sponsorship.studentId);
      if (studentIndex !== -1) {
        students[studentIndex].sponsorshipStatus = newStudentStatus;
        students[studentIndex].updatedAt = new Date().toISOString();
      }
    }

    // Save to file
    saveSponsorships();
    saveStudents();

    console.log('✅ Sponsorship updated successfully');
    res.json(sponsorships[sponsorshipIndex]);
  } catch (error) {
    console.error('❌ Error updating sponsorship:', error);
    res.status(500).json({ error: 'Failed to update sponsorship' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    console.log(`📚 GET /api/students - Returning ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error getting students:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get students available for sponsorship
app.get('/api/students/available-for-sponsors', (req, res) => {
  try {
    const availableStudents = students.filter(s => s.sponsorshipStatus === 'available-for-sponsors');
    console.log(`📚 GET /api/students/available-for-sponsors - Returning ${availableStudents.length} students`);
    res.json(availableStudents);
  } catch (error) {
    console.error('❌ Error getting available students:', error);
    res.status(500).json({ error: 'Failed to get available students' });
  }
});

// Get sponsorships by status (for overseer dashboard)
app.get('/api/sponsorships/status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const filteredSponsorships = sponsorships.filter(s => s.status === status);
    console.log(`📊 GET /api/sponsorships/status/${status} - Returning ${filteredSponsorships.length} sponsorships`);
    res.json(filteredSponsorships);
  } catch (error) {
    console.error('❌ Error getting sponsorships by status:', error);
    res.status(500).json({ error: 'Failed to get sponsorships by status' });
  }
});

// Get pending sponsorships (for overseer)
app.get('/api/sponsorships/pending', (req, res) => {
  try {
    const pendingSponsorships = sponsorships.filter(s => s.status === 'pending');
    console.log(`⏳ GET /api/sponsorships/pending - Returning ${pendingSponsorships.length} pending sponsorships`);
    res.json(pendingSponsorships);
  } catch (error) {
    console.error('❌ Error getting pending sponsorships:', error);
    res.status(500).json({ error: 'Failed to get pending sponsorships' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  try {
    console.log(`👥 GET /api/users - Returning ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create user
app.post('/api/users', (req, res) => {
  try {
    const userData = req.body;
    console.log('👥 Creating new user:', userData);

    const newUser = {
      id: 'user-' + Date.now(),
      ...userData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers();

    console.log('✅ User created successfully:', newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get sponsorship statistics (for overseer dashboard)
app.get('/api/sponsorships/stats', (req, res) => {
  try {
    const stats = {
      total: sponsorships.length,
      pending: sponsorships.filter(s => s.status === 'pending').length,
      sponsored: sponsorships.filter(s => s.status === 'sponsored').length,
      rejected: sponsorships.filter(s => s.status === 'rejected').length,
      completed: sponsorships.filter(s => s.status === 'completed').length,
      totalAmount: sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0)
    };
    console.log(`📊 GET /api/sponsorships/stats - Returning statistics`);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Comprehensive Sponsorship server running on http://localhost:${PORT}`);
  console.log(`📊 Current data: ${sponsorships.length} sponsorships, ${students.length} students, ${users.length} users`);
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
  console.log(`📁 Data files:`);
  console.log(`   ${SPONSORSHIPS_FILE}`);
  console.log(`   ${STUDENTS_FILE}`);
  console.log(`   ${USERS_FILE}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  saveSponsorships();
  saveStudents();
  saveUsers();
  console.log('✅ All data saved. Server stopped.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  saveSponsorships();
  saveStudents();
  saveUsers();
  console.log('✅ All data saved. Server stopped.');
  process.exit(0);
});
