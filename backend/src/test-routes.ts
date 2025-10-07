import { Router } from 'express';

const router = Router();

// Test routes with different patterns
router.get('/', (req, res) => {
  res.json({ message: 'Root route' });
});

router.get('/test', (req, res) => {
  res.json({ message: 'Test route' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'ID route', id: req.params.id });
});

router.get('/:id/test', (req, res) => {
  res.json({ message: 'ID test route', id: req.params.id });
});

router.get('/:id/privileges/:privilege', (req, res) => {
  res.json({ 
    message: 'Privilege route', 
    id: req.params.id, 
    privilege: req.params.privilege 
  });
});

export default router; 