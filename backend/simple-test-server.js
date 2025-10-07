const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${students.length} students`);
});
