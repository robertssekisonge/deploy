import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

app.get('/api/users/:id', (req, res) => {
  res.json({ message: 'User route', id: req.params.id });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
}); 