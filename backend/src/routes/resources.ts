import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// List all resources
router.get('/', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(resources);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Get resources by class
router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const resources = await prisma.resource.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
    
    // Filter resources that include this class
    const filteredResources = resources.filter(resource => {
      if (!resource.classIds) return false;
      const classIds = JSON.parse(resource.classIds);
      return classIds.includes(classId);
    });
    
    res.json(filteredResources);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch resources for class' });
  }
});

// Upload a resource
router.post('/', async (req, res) => {
  try {
    const { title, fileType, fileData, classIds, uploadedBy } = req.body;
    if (!title || !fileType || !fileData || !classIds || !uploadedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }
    
    // Ensure classIds is properly formatted as JSON string
    const classIdsString = Array.isArray(classIds) ? JSON.stringify(classIds) : classIds;
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1] || 'bin';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Decode base64 and save file
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    const resource = await prisma.resource.create({
      data: {
        title,
        fileType,
        fileData: fileName, // Store filename instead of base64 data
        classIds: classIdsString,
        uploadedBy,
      },
    });
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

// Download a resource (get by id)
router.get('/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// Download file
router.get('/:id/download', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    
    const filePath = path.join(uploadsDir, resource.fileData);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, resource.title);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

// Preview file (serve file for embedding/preview)
router.get('/:id/preview', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const filePath = path.join(uploadsDir, resource.fileData);
    console.log('🔍 Checking file path:', filePath);
    console.log('📁 File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found at path:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers for preview
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', resource.fileType || 'application/octet-stream');
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
        res.status(500).json({ error: 'Failed to serve file' });
      }
    });
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ error: 'Failed to preview resource' });
  }
});

// Delete a resource
router.delete('/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (resource) {
      // Delete the file
      const filePath = path.join(uploadsDir, resource.fileData);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from database
      await prisma.resource.delete({ where: { id: parseInt(req.params.id) } });
    }
    
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

export default router; 