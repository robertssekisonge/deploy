import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Student Photos Routes
router.post('/photos/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { studentId, photoType, uploadedBy } = req.body;
    
    const photo = await prisma.studentPhoto.create({
      data: {
        studentId,
        photoType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy
      }
    });

    res.json({ success: true, photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

router.get('/photos/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const photos = await prisma.studentPhoto.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await prisma.studentPhoto.findUnique({ where: { id: parseInt(id) } });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(photo.filePath)) {
      fs.unlinkSync(photo.filePath);
    }

    await prisma.studentPhoto.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Conduct Notes Routes
router.post('/conduct-notes', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      className,
      streamName,
      noteType,
      title,
      description,
      severity,
      teacherId,
      teacherName
    } = req.body;

    const conductNote = await prisma.conductNote.create({
      data: {
        studentId,
        studentName,
        className,
        streamName,
        noteType,
        title,
        description,
        severity,
        teacherId,
        teacherName
      }
    });

    res.json({ success: true, conductNote });
  } catch (error) {
    console.error('Error creating conduct note:', error);
    res.status(500).json({ error: 'Failed to create conduct note' });
  }
});

router.get('/conduct-notes/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const notes = await prisma.conductNote.findMany({
      where: { studentId, isActive: true },
      orderBy: { date: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching conduct notes:', error);
    res.status(500).json({ error: 'Failed to fetch conduct notes' });
  }
});

router.put('/conduct-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const conductNote = await prisma.conductNote.update({
      where: { id: parseInt(id) },
      data: { ...updates, updatedAt: new Date() }
    });

    res.json({ success: true, conductNote });
  } catch (error) {
    console.error('Error updating conduct note:', error);
    res.status(500).json({ error: 'Failed to update conduct note' });
  }
});

router.delete('/conduct-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.conductNote.update({
      where: { id: parseInt(id) },
      data: { isActive: false, updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Conduct note deactivated' });
  } catch (error) {
    console.error('Error deleting conduct note:', error);
    res.status(500).json({ error: 'Failed to delete conduct note' });
  }
});

// Resource Files Routes
router.post('/resources/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      title,
      description,
      fileType,
      category,
      classIds,
      uploadedBy
    } = req.body;

    const resource = await prisma.resourceFile.create({
      data: {
        title,
        description,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType,
        category,
        classIds: classIds ? JSON.stringify(classIds) : null,
        uploadedBy
      }
    });

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

router.get('/resources', async (req, res) => {
  try {
    const { category, fileType, uploadedBy } = req.query;
    
    const where: any = {};
    if (category) where.category = category;
    if (fileType) where.fileType = fileType;
    if (uploadedBy) where.uploadedBy = uploadedBy;

    const resources = await prisma.resourceFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.get('/resources/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resourceFile.findUnique({
      where: { id: parseInt(id) }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment download count
    await prisma.resourceFile.update({
      where: { id: parseInt(id) },
      data: { downloadCount: { increment: 1 } }
    });

    // Send file
    res.download(resource.filePath, resource.fileName);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

// Student Documents Routes
router.post('/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      studentId,
      studentName,
      documentType,
      uploadedBy
    } = req.body;

    const document = await prisma.studentDocument.create({
      data: {
        studentId,
        studentName,
        documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy
      }
    });

    res.json({ success: true, document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/documents/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const documents = await prisma.studentDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Teacher Resources Routes
router.post('/teacher-resources/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      teacherId,
      teacherName,
      resourceType,
      subject,
      className,
      title,
      description
    } = req.body;

    const resource = await prisma.teacherResource.create({
      data: {
        teacherId,
        teacherName,
        resourceType,
        subject,
        className,
        title,
        description,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Error uploading teacher resource:', error);
    res.status(500).json({ error: 'Failed to upload teacher resource' });
  }
});

router.get('/teacher-resources', async (req, res) => {
  try {
    const { teacherId, resourceType, subject } = req.query;
    
    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (resourceType) where.resourceType = resourceType;
    if (subject) where.subject = subject;

    const resources = await prisma.teacherResource.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching teacher resources:', error);
    res.status(500).json({ error: 'Failed to fetch teacher resources' });
  }
});

export default router;
