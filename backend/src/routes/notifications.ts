import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true }
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Create notification for password reset request
router.post('/password-reset-request', async (req, res) => {
  try {
    const { userId, userEmail, userName } = req.body;
    
    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map(admin => 
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Password Reset Request',
            message: `User ${userName} (${userEmail}) has requested a password reset. Please review and take action.`,
            type: 'INFO',
            read: false
          }
        })
      )
    );
    
    res.json({ message: 'Password reset request notifications sent to admins', notifications });
  } catch (error) {
    console.error('Error creating password reset notifications:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Get unread notifications count
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await prisma.notification.count({
      where: { 
        userId: parseInt(userId),
        read: false
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export default router; 