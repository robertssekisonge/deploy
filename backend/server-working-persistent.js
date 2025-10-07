const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load or create default data
let users = [];
let students = [];

try {
  // Load users
  if (fs.existsSync(USERS_FILE)) {
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(usersData);
    console.log(`📊 Loaded ${users.length} users from file`);
  } else {
    // Create default users
    users = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        role: 'PARENT',
        studentIds: '["1", "2"]',
        status: 'active'
      },
      {
        id: '2',
        name: 'Michael Brown',
        email: 'michael.brown@email.com',
        role: 'PARENT',
        studentIds: '[]',
        status: 'inactive'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`📊 Created default users`);
  }

  // Load students
  if (fs.existsSync(STUDENTS_FILE)) {
    const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
    students = JSON.parse(studentsData);
    console.log(`📚 Loaded ${students.length} students from file`);
  } else {
    // Create default students
    students = [
      {
        id: '1',
        name: 'Nakato Grace',
        accessNumber: 'CA001',
        class: 'Senior 1',
        stream: 'A'
      },
      {
        id: '2',
        name: 'John Okello',
        accessNumber: 'BB0001',
        class: 'Senior 2',
        stream: 'B'
      }
    ];
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log(`📚 Created default students`);
  }
} catch (error) {
  console.error('Error loading data:', error);
  users = [];
  students = [];
}

// Sponsorship data
let sponsorships = [];

// Save functions
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`💾 Saved ${users.length} users to file`);
  } catch (error) {
    console.error('Error saving users:', error);
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

function saveSponsorships() {
  try {
    const sponsorshipsFile = path.join(__dirname, 'data', 'sponsorships.json');
    fs.writeFileSync(sponsorshipsFile, JSON.stringify(sponsorships, null, 2));
    console.log(`💾 Saved ${sponsorships.length} sponsorships to file`);
  } catch (error) {
    console.error('Error saving sponsorships:', error);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Working Persistent Server is running!', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    studentsCount: students.length
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const parentUsers = users.filter(user => user.role === 'PARENT');
    res.json(parentUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create new student
app.post('/api/students', (req, res) => {
  try {
    const studentData = req.body;
    console.log('📝 Creating new student:', studentData);

    // Generate unique ID
    const newStudent = {
      id: Date.now().toString(),
      ...studentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to students array
    students.push(newStudent);
    
    // Save to file for persistence
    saveStudents();

    console.log('✅ Student created successfully:', newStudent.id);
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('❌ Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating student ${id}:`, updates);

    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    students[studentIndex] = {
      ...students[studentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save to file for persistence
    saveStudents();

    console.log('✅ Student updated successfully:', id);
    res.json(students[studentIndex]);
  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting student ${id}`);

    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const deletedStudent = students.splice(studentIndex, 1)[0];

    // Save to file for persistence
    saveStudents();

    console.log('✅ Student deleted successfully:', id);
    res.json({ message: 'Student deleted successfully', student: deletedStudent });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Assign students to parent
app.post('/api/users/:id/assign-students', (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    console.log(`🔍 Assigning students ${JSON.stringify(studentIds)} to parent ${id}`);

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds must be an array' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(studentIds),
      status: studentIds.length > 0 ? 'active' : 'inactive'
    };

    saveUsers(); // Save to file for persistence

    console.log(`✅ Successfully assigned students to parent ${id}`);

    res.json({
      message: 'Students assigned successfully',
      user: users[userIndex],
      assignedStudents: studentIds
    });
  } catch (error) {
    console.error('Error assigning students:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// Get all sponsorships
app.get('/api/sponsorships', (req, res) => {
  try {
    console.log('📋 Fetching all sponsorships...');
    res.json(sponsorships);
  } catch (error) {
    console.error('Error fetching sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// Create new sponsorship
app.post('/api/sponsorships', (req, res) => {
  try {
    const {
      studentId,
      sponsorName,
      sponsorCountry,
      amount,
      type,
      description
    } = req.body;

    console.log('📝 Creating new sponsorship:', req.body);

    // Validate required fields
    if (!studentId || !sponsorName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create sponsorship
    const newSponsorship = {
      id: Date.now().toString(),
      studentId,
      sponsorName,
      sponsorCountry: sponsorCountry || 'Uganda',
      amount: parseFloat(amount),
      type: type || 'individual',
      status: 'pending',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sponsorships.push(newSponsorship);
    saveSponsorships();

    // Update student status
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
      students[studentIndex] = {
        ...students[studentIndex],
        sponsorshipStatus: 'pending'
      };
      saveStudents();
    }

    console.log('✅ Sponsorship created successfully');

    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Working Persistent Server running on http://localhost:${PORT}`);
  console.log(`💾 Data will be saved to: ${dataDir}`);
  console.log(`📊 Loaded: ${users.length} users, ${students.length} students`);
});

console.log('✅ Server setup complete!');




