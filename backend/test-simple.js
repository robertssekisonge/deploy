const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // Use different port

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Simple test server is working!', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
});

console.log('✅ Test server setup complete');

