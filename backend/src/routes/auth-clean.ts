import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

const router = Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        privileges: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset all lock fields on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordAttempts: 0,
        lastLogin: new Date(),
        accountLocked: false,
        lockedUntil: null,
        lockReason: null
      }
    });

    // Return user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      requiresPasswordReset: user.firstTimeLogin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Auth routes working' });
});

export default router; 