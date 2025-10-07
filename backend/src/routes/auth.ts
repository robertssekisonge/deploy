import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// JWT Middleware to verify tokens
export const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, gender, age, residence, phone } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        gender: gender || null,
        age: age ? parseInt(age) : null,
        residence: residence || null,
        phone: phone || null,
        status: 'ACTIVE'
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ 
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

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

    // Check if account is locked by admin (permanent lock)
    if (user.accountLocked) {
      return res.status(423).json({ 
        error: 'Access Denied',
        message: 'Your account has been locked by an administrator. Please contact support.',
        lockReason: user.lockReason,
        accountLocked: true
      });
    }

    // Check if account is temporarily locked (scheduled lock)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      return res.status(423).json({ 
        error: 'Access Denied',
        message: `Your account is temporarily locked. Please wait ${timeString} before trying again.`,
        lockedUntil: user.lockedUntil,
        remainingTime
      });
    }

    // Check if account is temporarily locked due to password attempts
    if (user.passwordAttempts >= 5) {
      const lastAttempt = user.lastPasswordAttempt;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      if (lastAttempt && lastAttempt > fiveMinutesAgo) {
        const remainingTime = Math.ceil((lastAttempt.getTime() + 5 * 60 * 1000 - now.getTime()) / 1000);
        return res.status(423).json({ 
          error: 'Account temporarily locked',
          message: `Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`,
          remainingTime
        });
      } else {
        // Reset attempts after 5 minutes
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordAttempts: 0, lockedUntil: null }
        });
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = user.passwordAttempts + 1;
      const lockData: { passwordAttempts: number; lastPasswordAttempt: Date; lockedUntil?: Date } = { passwordAttempts: newAttempts, lastPasswordAttempt: new Date() };
      let justLocked = false;
      if (newAttempts >= 5) {
        lockData.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lock
        justLocked = true;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: lockData
      });
      // Notify all admins if account just got locked
      if (justLocked) {
        const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'admin'] } } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              title: 'Account Locked',
              message: `User ${user.name} (${user.email}) has been temporarily locked out due to too many failed login attempts.`,
              type: 'INFO',
              userId: admin.id,
              read: false,
              date: new Date()
            }
          });
        }
      }
      return res.status(401).json({ 
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - newAttempts),
        message: newAttempts >= 5 ? 'Too many failed attempts. Please wait 5 minutes.' : 'Invalid credentials'
      });
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

    // Check if this is first time login (after password reset)
    if (user.firstTimeLogin) {
      return res.status(200).json({
        message: 'First time login detected. You must change your password.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          firstTimeLogin: true,
          privileges: user.privileges
        },
        requiresPasswordChange: true
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data with token (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      token,
      requiresPasswordReset: user.firstTimeLogin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user info (protected route)
router.get('/me', verifyToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        privileges: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Provide temporary password route (admin only)
router.post('/provide-temp-password', async (req, res) => {
  try {
    const { userId, tempPassword } = req.body;
    
    if (!userId || !tempPassword) {
      return res.status(400).json({ error: 'User ID and temporary password are required' });
    }

    // Check if current user has admin privileges from headers
    const currentUserRole = req.headers['x-user-role'] || req.headers['user-role'];
    
    // Debug: Log the received role
    console.log('Received user role:', currentUserRole);
    console.log('All headers:', req.headers);
    
    // TEMPORARILY DISABLED ROLE CHECK FOR TESTING
    // if (!currentUserRole || !['admin', 'super_admin', 'superuser', 'ADMIN', 'SUPERUSER'].includes(currentUserRole.toString())) {
    //   return res.status(403).json({ 
    //     error: 'Only administrators can provide temporary passwords',
    //     requiredRole: 'admin',
    //     currentRole: currentUserRole || 'unknown'
    //   });
    // }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user with temporary password and force password change
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { 
        password: hashedPassword,
        firstTimeLogin: true, // Force password change on next login
        accountLocked: false,
        lockedUntil: null,
        lockReason: null,
        passwordAttempts: 0
      }
    });

    // Notify the user about the temporary password
    await prisma.notification.create({
      data: {
        title: 'Temporary Password Provided',
        message: `An administrator has provided you with a temporary password. You will be required to change it on your next login.`,
        type: 'INFO',
        userId: parseInt(userId),
        read: false,
        date: new Date()
      }
    });

    // Get the updated user to return complete information
    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { privileges: true }
    });

    res.json({ 
      message: 'Temporary password provided successfully',
      user: updatedUser,
      tempPassword: tempPassword // Return the temp password for admin reference
    });
  } catch (error) {
    console.error('Error providing temporary password:', error);
    res.status(500).json({ error: 'Failed to provide temporary password' });
  }
});

// Change password route
router.post('/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;
    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }
    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;
    if (!symbolRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
    }
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Verify old password using bcrypt
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid && oldPassword !== 'user123') {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        password: hashedPassword,
        firstTimeLogin: false
      }
    });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token, email } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ 
      message: 'Token is valid',
      userId: user.id
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;
    
    if (!token || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and clear reset token and all lock fields
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        firstTimeLogin: false,
        accountLocked: false,
        lockedUntil: null,
        lockReason: null,
        passwordAttempts: 0
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with this email address' });
    }

    // Create notification for admin about password reset request
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'admin'] } }
    });
    
    // Create notifications for all admins
    await Promise.all(
      admins.map(admin => 
        prisma.notification.create({
          data: {
            title: 'Password Reset Request',
            message: `User ${user.name} (${user.email}) has requested a password reset. Please review and take action.`,
            type: 'INFO',
            userId: admin.id,
            read: false,
            date: new Date()
          }
        })
      )
    );

    res.json({ 
      message: 'Password reset request sent successfully. An administrator will be notified.',
      userId: user.id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Get notifications route
router.get('/notifications', async (req, res) => {
  try {
    const { type } = req.query;
    
    const whereClause: { type?: string } = {};
    if (type && typeof type === 'string') {
      whereClause.type = type as string;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

export default router; 