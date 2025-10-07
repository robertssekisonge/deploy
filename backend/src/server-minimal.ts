import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login route working' });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
}); 