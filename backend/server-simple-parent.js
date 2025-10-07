const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for testing (replace with database later)
let users = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+256 701 234 567',
    address: 'Kampala, Uganda',
    occupation: 'Teacher',
    role: 'PARENT',
    studentIds: '["1", "2"]',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+256 702 345 678',
    address: 'Entebbe, Uganda',
    occupation: 'Engineer',
    role: 'PARENT',
    studentIds: '[]',
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let students = [
  {
    id: '1',
    name: 'Nakato Grace',
    accessNumber: 'CA001',
    class: 'Senior 1',
    stream: 'A',
    gender: 'Female'
  },
  {
    id: '2',
    name: 'John Okello',
    accessNumber: 'BB0001',
    class: 'Senior 2',
    stream: 'B',
    gender: 'Male'
  }
];

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Simple Parent Management Server is running!', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    studentsCount: students.length
  });
});

// Get all users (parents)
app.get('/api/users', (req, res) => {
  try {
    const parentUsers = users.filter(user => user.role === 'PARENT');
    res.json(parentUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (parent)
app.post('/api/users', (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      occupation,
      password,
      role = 'PARENT',
      studentIds = '[]',
      status = 'inactive'
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      phone: phone || '',
      address: address || '',
      occupation: occupation || '',
      password, // Note: In production, hash this password
      role,
      studentIds,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (parent)
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;

    users[userIndex] = {
      ...users[userIndex],
      ...updateData
    };

    res.json(users[userIndex]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Assign students to parent
app.post('/api/users/:id/assign-students', (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

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
      status: studentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

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

// Unassign student from parent
app.delete('/api/users/:id/unassign-student/:studentId', (req, res) => {
  try {
    const { id, studentId } = req.params;
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse current student IDs
    const currentStudentIds = JSON.parse(users[userIndex].studentIds || '[]');
    const updatedStudentIds = currentStudentIds.filter(id => id !== studentId);

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(updatedStudentIds),
      status: updatedStudentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

    res.json({
      message: 'Student unassigned successfully',
      user: users[userIndex],
      remainingStudents: updatedStudentIds
    });
  } catch (error) {
    console.error('Error unassigning student:', error);
    res.status(500).json({ error: 'Failed to unassign student' });
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

// Get parent assignments
app.get('/api/parent-assignments', (req, res) => {
  try {
    const parentUsers = users.filter(user => user.role === 'PARENT');
    
    const assignments = parentUsers.map(parent => ({
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      assignedStudents: JSON.parse(parent.studentIds || '[]'),
      status: parent.status,
      lastUpdated: parent.updatedAt
    }));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching parent assignments:', error);
    res.status(500).json({ error: 'Failed to fetch parent assignments' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple Parent Management Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📚 Students API: http://localhost:${PORT}/api/students`);
  console.log(`🔗 Parent Assignments: http://localhost:${PORT}/api/parent-assignments`);
  console.log(`\n💾 Using in-memory storage for testing`);
  console.log(`📝 Sample data loaded: ${users.length} users, ${students.length} students`);
});

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('✅ Server setup complete, listening for requests...');


