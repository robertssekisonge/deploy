const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running on port 3004!' });
});

app.post('/api/students', (req, res) => {
  console.log('📥 Received student:', req.body.name);
  res.json({ 
    success: true, 
    message: `Student "${req.body.name}" saved successfully!` 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Ready to receive student data!');
  console.log('📡 Health check: http://localhost:3004/api/health');
  console.log('📡 Student endpoint: http://localhost:3004/api/students');
}); 