import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload profile photo for user
router.post('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fileData, fileType } = req.body;
    
    if (!fileData || !fileType) {
      return res.status(400).json({ error: 'Missing file data or type' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1] || 'jpg';
    const fileName = `profile_${userId}_${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Decode base64 and save file
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    // Update user's photo field
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { photo: fileName }
    });
    
    res.json({ 
      success: true, 
      photo: fileName, 
      photoUrl: `/photos/${fileName}`,
      user: updatedUser 
    });
    
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Upload family photo for student
router.post('/family/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fileData, fileType } = req.body;
    
    console.log(`📸 Family photo upload request for student ${studentId}`);
    console.log(`📊 Request body size: ${JSON.stringify(req.body).length} characters`);
    
    if (!fileData || !fileType) {
      console.error('❌ Missing file data or type');
      return res.status(400).json({ error: 'Missing file data or type' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      console.error(`❌ Invalid file type: ${fileType}`);
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1] || 'jpg';
    const fileName = `family_${studentId === 'new' ? 'temp' : studentId}_${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log(`📁 Saving file to: ${filePath}`);
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log(`📁 Creating uploads directory: ${uploadsDir}`);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Decode base64 and save file
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    console.log(`📊 Base64 data length: ${base64Data.length} characters`);
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📊 Buffer size: ${buffer.length} bytes`);
    fs.writeFileSync(filePath, buffer);
    
    // Only update database if student exists
    if (studentId !== 'new') {
      try {
        const updatedStudent = await prisma.student.update({
          where: { id: parseInt(studentId) },
          data: { familyPhoto: fileName }
        });
        
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          student: updatedStudent 
        });
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        // Still return the photo URL even if DB update fails
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          warning: 'Photo uploaded but database update failed'
        });
      }
    } else {
      // For new students, just return the photo URL
      res.json({ 
        success: true, 
        photo: fileName, 
        photoUrl: `/photos/${fileName}`,
        message: 'Photo uploaded successfully for new student'
      });
    }
    
  } catch (error) {
    console.error('Error uploading family photo:', error);
    res.status(500).json({ error: 'Failed to upload family photo' });
  }
});

// Upload passport photo for student
router.post('/passport/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fileData, fileType } = req.body;
    
    if (!fileData || !fileType) {
      return res.status(400).json({ error: 'Missing file data or type' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1] || 'jpg';
    const fileName = `passport_${studentId === 'new' ? 'temp' : studentId}_${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Decode base64 and save file
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    // Only update database if student exists
    if (studentId !== 'new') {
      try {
        const updatedStudent = await prisma.student.update({
          where: { id: parseInt(studentId) },
          data: { passportPhoto: fileName }
        });
        
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          student: updatedStudent 
        });
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        // Still return the photo URL even if DB update fails
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          warning: 'Photo uploaded but database update failed'
        });
      }
    } else {
      // For new students, just return the photo URL
      res.json({ 
        success: true, 
        photo: fileName, 
        photoUrl: `/photos/${fileName}`,
        message: 'Photo uploaded successfully for new student'
      });
    }
    
  } catch (error) {
    console.error('Error uploading passport photo:', error);
    res.status(500).json({ error: 'Failed to upload passport photo' });
  }
});

// Upload profile photo for student
router.post('/student-profile/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fileData, fileType } = req.body;
    
    if (!fileData || !fileType) {
      return res.status(400).json({ error: 'Missing file data or type' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1] || 'jpg';
    const fileName = `profile_${studentId === 'new' ? 'temp' : studentId}_${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Decode base64 and save file
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    // Only update database if student exists
    if (studentId !== 'new') {
      try {
        const updatedStudent = await prisma.student.update({
          where: { id: parseInt(studentId) },
          data: { photo: fileName }
        });
        
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          student: updatedStudent 
        });
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        // Still return the photo URL even if DB update fails
        res.json({ 
          success: true, 
          photo: fileName, 
          photoUrl: `/photos/${fileName}`,
          warning: 'Photo uploaded but database update failed'
        });
      }
    } else {
      // For new students, just return the photo URL
      res.json({ 
        success: true, 
        photo: fileName, 
        photoUrl: `/photos/${fileName}`,
        message: 'Photo uploaded successfully for new student'
      });
    }
    
  } catch (error) {
    console.error('Error uploading student profile photo:', error);
    res.status(500).json({ error: 'Failed to upload student profile photo' });
  }
});

// List all photos (for admin management)
router.get('/list', async (req, res) => {
  try {
    // Get all users with photos
    const usersWithPhotos = await prisma.user.findMany({
      where: {
        photo: { not: null }
      },
      select: {
        id: true,
        name: true,
        photo: true,
        createdAt: true
      }
    });

    // Get all students with photos
    const studentsWithPhotos = await prisma.student.findMany({
      where: {
        OR: [
          { photo: { not: null } },
          { familyPhoto: { not: null } },
          { passportPhoto: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        photo: true,
        familyPhoto: true,
        passportPhoto: true,
        createdAt: true
      }
    });

    // Process photos and get file information
    const photos: any[] = [];

    // Process user photos
    usersWithPhotos.forEach(user => {
      if (user.photo) {
        const filePath = path.join(uploadsDir, user.photo);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          photos.push({
            id: `user_${user.id}`,
            filename: user.photo,
            type: 'profile',
            userId: user.id.toString(),
            userName: user.name,
            uploadDate: user.createdAt,
            fileSize: stats.size,
            url: `/photos/${user.photo}`
          });
        }
      }
    });

    // Process student photos
    studentsWithPhotos.forEach(student => {
      if (student.photo) {
        const filePath = path.join(uploadsDir, student.photo);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          photos.push({
            id: `student_profile_${student.id}`,
            filename: student.photo,
            type: 'student-profile',
            studentId: student.id.toString(),
            studentName: student.name,
            uploadDate: student.createdAt,
            fileSize: stats.size,
            url: `/photos/${student.photo}`
          });
        }
      }

      if (student.familyPhoto) {
        const filePath = path.join(uploadsDir, student.familyPhoto);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          photos.push({
            id: `student_family_${student.id}`,
            filename: student.familyPhoto,
            type: 'family',
            studentId: student.id.toString(),
            studentName: student.name,
            uploadDate: student.createdAt,
            fileSize: stats.size,
            url: `/photos/${student.familyPhoto}`
          });
        }
      }

      if (student.passportPhoto) {
        const filePath = path.join(uploadsDir, student.passportPhoto);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          photos.push({
            id: `student_passport_${student.id}`,
            filename: student.passportPhoto,
            type: 'passport',
            studentId: student.id.toString(),
            studentName: student.name,
            uploadDate: student.createdAt,
            fileSize: stats.size,
            url: `/photos/${student.passportPhoto}`
          });
        }
      }
    });

    // Sort by upload date (newest first)
    photos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    res.json({
      success: true,
      photos,
      total: photos.length
    });

  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

// Delete photo
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    // First, find and clean up database references
    let databaseUpdated = false;
    
    try {
      // Check if this photo is referenced by any user
      const userWithPhoto = await prisma.user.findFirst({
        where: { photo: filename }
      });
      
      if (userWithPhoto) {
        await prisma.user.update({
          where: { id: userWithPhoto.id },
          data: { photo: null }
        });
        console.log(`Cleaned up user photo reference for user ${userWithPhoto.id}`);
        databaseUpdated = true;
      }
      
      // Check if this photo is referenced by any student
      const studentWithPhoto = await prisma.student.findFirst({
        where: {
          OR: [
            { photo: filename },
            { familyPhoto: filename },
            { passportPhoto: filename }
          ]
        }
      });
      
      if (studentWithPhoto) {
        const updateData: any = {};
        
        if (studentWithPhoto.photo === filename) {
          updateData.photo = null;
        }
        if (studentWithPhoto.familyPhoto === filename) {
          updateData.familyPhoto = null;
        }
        if (studentWithPhoto.passportPhoto === filename) {
          updateData.passportPhoto = null;
        }
        
        await prisma.student.update({
          where: { id: studentWithPhoto.id },
          data: updateData
        });
        
        console.log(`Cleaned up student photo reference for student ${studentWithPhoto.id}`);
        databaseUpdated = true;
      }
      
    } catch (dbError) {
      console.error('Error cleaning up database references:', dbError);
      // Continue with file deletion even if DB cleanup fails
    }
    
    // Delete the file from the file system
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted photo file: ${filename}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Photo deleted successfully',
      databaseCleaned: databaseUpdated
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Bulk cleanup orphaned photos
router.post('/cleanup-orphaned', async (req, res) => {
  try {
    // Get all photos referenced in the database
    const userPhotos = await prisma.user.findMany({
      where: { photo: { not: null } },
      select: { photo: true }
    });
    
    const studentPhotos = await prisma.student.findMany({
      where: {
        OR: [
          { photo: { not: null } },
          { familyPhoto: { not: null } },
          { passportPhoto: { not: null } }
        ]
      },
      select: {
        photo: true,
        familyPhoto: true,
        passportPhoto: true
      }
    });
    
    // Collect all referenced photo filenames
    const referencedPhotos = new Set<string>();
    
    userPhotos.forEach(user => {
      if (user.photo) referencedPhotos.add(user.photo);
    });
    
    studentPhotos.forEach(student => {
      if (student.photo) referencedPhotos.add(student.photo);
      if (student.familyPhoto) referencedPhotos.add(student.familyPhoto);
      if (student.passportPhoto) referencedPhotos.add(student.passportPhoto);
    });
    
    // Get all files in the uploads directory
    const allFiles = fs.readdirSync(uploadsDir);
    const imageFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    // Find orphaned photos
    const orphanedPhotos = imageFiles.filter(file => !referencedPhotos.has(file));
    
    let deletedCount = 0;
    let errors: string[] = [];
    
    // Delete orphaned photos
    for (const orphanedPhoto of orphanedPhotos) {
      try {
        const filePath = path.join(uploadsDir, orphanedPhoto);
        fs.unlinkSync(filePath);
        console.log(`Deleted orphaned photo: ${orphanedPhoto}`);
        deletedCount++;
      } catch (deleteError) {
        console.error(`Error deleting orphaned photo ${orphanedPhoto}:`, deleteError);
        errors.push(`Failed to delete ${orphanedPhoto}`);
      }
    }
    
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} orphaned photos.`,
      deletedCount,
      totalOrphaned: orphanedPhotos.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error during orphaned photo cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup orphaned photos' });
  }
});

// Get photo statistics
router.get('/stats', async (req, res) => {
  try {
    // Count photos by type in database
    const userPhotoCount = await prisma.user.count({
      where: { photo: { not: null } }
    });
    
    const studentProfileCount = await prisma.student.count({
      where: { photo: { not: null } }
    });
    
    const familyPhotoCount = await prisma.student.count({
      where: { familyPhoto: { not: null } }
    });
    
    const passportPhotoCount = await prisma.student.count({
      where: { passportPhoto: { not: null } }
    });
    
    // Get file system statistics
    const allFiles = fs.readdirSync(uploadsDir);
    const imageFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    let totalSize = 0;
    const fileSizes: { [key: string]: number } = {};
    
    imageFiles.forEach(file => {
      try {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        fileSizes[file] = stats.size;
      } catch (error) {
        console.error(`Error getting stats for file ${file}:`, error);
      }
    });
    
    // Calculate storage breakdown by type
    const storageBreakdown = {
      profile: { count: 0, size: 0 },
      family: { count: 0, size: 0 },
      passport: { count: 0, size: 0 },
      studentProfile: { count: 0, size: 0 },
      unknown: { count: 0, size: 0 }
    };
    
    imageFiles.forEach(file => {
      const fileSize = fileSizes[file] || 0;
      
      if (file.startsWith('profile_')) {
        if (file.includes('_temp_')) {
          storageBreakdown.studentProfile.count++;
          storageBreakdown.studentProfile.size += fileSize;
        } else {
          storageBreakdown.profile.count++;
          storageBreakdown.profile.size += fileSize;
        }
      } else if (file.startsWith('family_')) {
        storageBreakdown.family.count++;
        storageBreakdown.family.size += fileSize;
      } else if (file.startsWith('passport_')) {
        storageBreakdown.passport.count++;
        storageBreakdown.passport.size += fileSize;
      } else {
        storageBreakdown.unknown.count++;
        storageBreakdown.unknown.size += fileSize;
      }
    });
    
    res.json({
      success: true,
      database: {
        userPhotos: userPhotoCount,
        studentProfilePhotos: studentProfileCount,
        familyPhotos: familyPhotoCount,
        passportPhotos: passportPhotoCount,
        totalReferenced: userPhotoCount + studentProfileCount + familyPhotoCount + passportPhotoCount
      },
      fileSystem: {
        totalFiles: imageFiles.length,
        totalSize: totalSize,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100
      },
      storageBreakdown,
      orphanedPhotos: imageFiles.length - (userPhotoCount + studentProfileCount + familyPhotoCount + passportPhotoCount)
    });
    
  } catch (error) {
    console.error('Error getting photo statistics:', error);
    res.status(500).json({ error: 'Failed to get photo statistics' });
  }
});

export default router;

