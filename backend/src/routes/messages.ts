import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get messages by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get messages where user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Transform the data to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      id: msg.id.toString(),
      from: msg.senderId.toString(),
      to: msg.receiverId?.toString() || '',
      fromRole: msg.user?.role || '',
      toRole: '', // We'll need to fetch receiver info separately if needed
      subject: msg.title,
      content: msg.content,
      type: msg.type,
      date: msg.createdAt,
      read: msg.read,
      studentId: undefined // Not stored in current schema
    }));

    console.log(`Found ${transformedMessages.length} messages for user ${userId}`);
    res.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
});

// Get unread message count for specific user
router.get('/unread/count/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const count = await prisma.message.count({
      where: { 
        receiverId: userId,
        read: false 
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get unread message count (global)
router.get('/unread/count', async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: { read: false }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    const {
      from,
      to,
      fromRole,
      toRole,
      subject,
      content,
      type,
      studentId,
      date,
      priority,
      isPinned
    } = req.body;

    console.log('=== BACKEND MESSAGE CREATION ===');
    console.log('Received message data:', req.body);
    console.log('From field type:', typeof req.body.from, 'Value:', req.body.from);
    console.log('To field type:', typeof req.body.to, 'Value:', req.body.to);
    console.log('Subject:', req.body.subject);
    console.log('Content:', req.body.content);

    // Validate required fields
    if (!from || !subject || !content) {
      return res.status(400).json({ error: 'From, subject, and content are required' });
    }

    // Handle ID conversion - check if IDs are already integers or need conversion
    let senderId: number;
    let receiverId: number | null = null;
    
    // Check if sender ID is already a number
    if (typeof from === 'number') {
      senderId = from;
    } else if (typeof from === 'string') {
      // Try to parse as integer, but also check if it's a valid numeric string
      const parsedSenderId = parseInt(from);
      if (isNaN(parsedSenderId)) {
        console.error('Invalid sender ID format:', from);
        return res.status(400).json({ error: 'Invalid sender ID format. Expected numeric ID.' });
      }
      senderId = parsedSenderId;
    } else {
      return res.status(400).json({ error: 'Invalid sender ID type. Expected string or number.' });
    }
    
    // Handle receiver ID if provided
    if (to) {
      if (typeof to === 'number') {
        receiverId = to;
      } else if (typeof to === 'string') {
        const parsedReceiverId = parseInt(to);
        if (isNaN(parsedReceiverId)) {
          console.error('Invalid receiver ID format:', to);
          return res.status(400).json({ error: 'Invalid receiver ID format. Expected numeric ID.' });
        }
        receiverId = parsedReceiverId;
      } else {
        return res.status(400).json({ error: 'Invalid receiver ID type. Expected string or number.' });
      }
    }

    const messageData = {
      senderId,
      receiverId,
      title: subject, // Map subject to title
      content,
      type: type || 'GENERAL',
      read: false,
      createdAt: date ? new Date(date) : new Date(),
      priority: priority || 'normal',
      isPinned: isPinned || false
    };

    console.log('=== PROCESSED MESSAGE DATA ===');
    console.log('Final message data:', messageData);
    console.log('Sender ID (processed):', senderId, 'Type:', typeof senderId);
    console.log('Receiver ID (processed):', receiverId, 'Type:', typeof receiverId);

    const message = await prisma.message.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log('Message created successfully:', message);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Update message (mark as read)
router.put('/:id', async (req, res) => {
  try {
    const { read } = req.body;
    
    const message = await prisma.message.update({
      where: { id: parseInt(req.params.id) },
      data: { read: read === true }
    });

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Mark all messages as read for a user
router.put('/read/all/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const result = await prisma.message.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error marking all messages read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    await prisma.message.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
