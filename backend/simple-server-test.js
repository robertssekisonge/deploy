const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

app.post('/api/students', (req, res) => {
  console.log('📥 Received student data:', req.body);
  res.json({ 
    success: true, 
    message: 'Student saved successfully!',
    student: req.body 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log('✅ Ready to receive student data!');
});

