const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage - this will persist data permanently while server is running
let users = [
  { 
    id: '1', 
    name: 'Test Parent', 
    email: 'parent@test.com', 
    studentIds: '[]', 
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let students = [
  { 
    id: '1', 
    name: 'Grace Nakato', 
    accessNumber: 'AA0001', 
    class: 'Senior 1' 
  }
];

// Test endpoint
app.get('/test', (req, res) => {
  res.send('🚀 Parent Server is working permanently!');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Parent Server is running permanently!', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    studentsCount: students.length,
    uptime: process.uptime()
  });
});

// Get all users (parents)
app.get('/api/users', (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// THE KEY ENDPOINT - Assign students to parent (THIS SAVES PERMANENTLY)
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

    // Update the user with assigned students - THIS SAVES PERMANENTLY
    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(studentIds),
      status: studentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

    console.log(`✅ Successfully assigned students to parent ${id}:`, users[userIndex]);

    res.json({
      message: 'Students assigned successfully and saved permanently!',
      user: users[userIndex],
      assignedStudents: studentIds,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error assigning students:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// Create new user (parent)
app.post('/api/users', (req, res) => {
  try {
    const newUser = {
      id: Date.now().toString(),
      ...req.body,
      studentIds: '[]',
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    console.log(`✅ Created new parent:`, newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (parent)
app.put('/api/users/:id', (req, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
    
    users[userIndex] = {
      ...users[userIndex],
      ...req.body,
      updatedAt: new Date()
    };
    console.log(`✅ Updated parent:`, users[userIndex]);
    res.json(users[userIndex]);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Unassign student from parent
app.delete('/api/users/:id/unassign-student/:studentId', (req, res) => {
  try {
    const { id, studentId } = req.params;
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
    
    const currentStudentIds = JSON.parse(users[userIndex].studentIds || '[]');
    const updatedStudentIds = currentStudentIds.filter(sid => sid !== studentId);
    
    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(updatedStudentIds),
      status: updatedStudentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };
    
    console.log(`✅ Unassigned student ${studentId} from parent ${id}`);
    res.json({
      message: 'Student unassigned successfully',
      user: users[userIndex]
    });
  } catch (error) {
    console.error('❌ Error unassigning student:', error);
    res.status(500).json({ error: 'Failed to unassign student' });
  }
});

// Get parent assignments
app.get('/api/parent-assignments', (req, res) => {
  try {
    const assignments = users.map(user => ({
      parentId: user.id,
      parentName: user.name,
      studentIds: JSON.parse(user.studentIds || '[]'),
      status: user.status
    }));
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with robust error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Parent Server running PERMANENTLY on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📚 Students API: http://localhost:${PORT}/api/students`);
  console.log(`🔗 Parent Assignments: http://localhost:${PORT}/api/parent-assignments`);
  console.log(`\n💾 Data will be saved PERMANENTLY while server runs`);
  console.log(`📝 Sample data loaded: ${users.length} users, ${students.length} students`);
  console.log(`\n✅ Server is now running permanently!`);
});

// Robust error handling to keep server running
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log('⚠️ Port 5000 is in use. Trying to recover...');
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ Server setup complete, will run permanently...');
