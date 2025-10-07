const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Data file paths
const SPONSORSHIPS_FILE = path.join(__dirname, 'data', 'sponsorships.json');
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load or create default data
let sponsorships = [];
let students = [];

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
        accessNumber: 'CA001',
        class: 'Senior 1',
        stream: 'A',
        age: 15,
        sponsorshipStatus: 'available-for-sponsors'
      },
      {
        id: '2',
        name: 'John Okello',
        accessNumber: 'BB0001',
        class: 'Senior 2',
        stream: 'B',
        age: 16,
        sponsorshipStatus: 'available-for-sponsors'
      }
    ];
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log(`📚 Created default students`);
  }
} catch (error) {
  console.error('Error loading data:', error);
  sponsorships = [];
  students = [];
}

// Save functions
function saveSponsorships() {
  try {
    fs.writeFileSync(SPONSORSHIPS_FILE, JSON.stringify(sponsorships, null, 2));
    console.log(`💾 Saved ${sponsorships.length} sponsorships to file`);
  } catch (error) {
    console.error('Error saving sponsorships:', error);
  }
}

function saveStudents() {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log(`💾 Saved ${students.length} students to file`);
  } catch (error) {
    console.error('Error saving students:', error);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sponsorship server is running',
    timestamp: new Date().toISOString(),
    sponsorships: sponsorships.length,
    students: students.length
  });
});

// Get all sponsorships
app.get('/api/sponsorships', (req, res) => {
  try {
    console.log(`📋 GET /api/sponsorships - Returning ${sponsorships.length} sponsorships`);
    res.json(sponsorships);
  } catch (error) {
    console.error('Error getting sponsorships:', error);
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
      return res.status(400).json({ error: 'Missing required fields' });
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
    }

    // Save to file
    saveSponsorships();
    saveStudents();

    console.log('✅ Sponsorship created successfully:', newSponsorship);
    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('Error creating sponsorship:', error);
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
      }
    }

    // Save to file
    saveSponsorships();
    saveStudents();

    console.log('✅ Sponsorship updated successfully');
    res.json(sponsorships[sponsorshipIndex]);
  } catch (error) {
    console.error('Error updating sponsorship:', error);
    res.status(500).json({ error: 'Failed to update sponsorship' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    console.log(`📚 GET /api/students - Returning ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ error: 'Failed to get students' });
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
    console.error('Error getting sponsorships by status:', error);
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
    console.error('Error getting pending sponsorships:', error);
    res.status(500).json({ error: 'Failed to get pending sponsorships' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sponsorship server running on http://localhost:${PORT}`);
  console.log(`📊 Current data: ${sponsorships.length} sponsorships, ${students.length} students`);
  console.log(`🎯 Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/sponsorships`);
  console.log(`   POST /api/sponsorships`);
  console.log(`   PUT  /api/sponsorships/:id`);
  console.log(`   GET  /api/students`);
  console.log(`   GET  /api/sponsorships/status/:status`);
  console.log(`   GET  /api/sponsorships/pending`);
});
