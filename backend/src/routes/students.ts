import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { duplicatePreventionMiddleware, auditStudentCreationMiddleware } from '../middleware/duplicatePreventionMiddleware';
import { calculateStudentFees } from '../utils/feeCalculation';

const router = Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get enrolled students (active status)
router.get('/enrolled', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled students' });
  }
});

// Get dropped access numbers
router.get('/dropped-access-numbers', async (req, res) => {
  try {
    const droppedNumbers = await prisma.droppedAccessNumber.findMany({
      orderBy: { droppedAt: 'desc' }
    });
    res.json(droppedNumbers);
  } catch (error) {
    console.error('Error fetching dropped access numbers:', error);
    res.status(500).json({ error: 'Failed to fetch dropped access numbers' });
  }
});

// Check fee balance for a student
router.get('/:id/fee-balance', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        accessNumber: true,
        totalFees: true,
        feesPaid: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Calculate if fees are fully paid
    const balance = (student.totalFees || 0) - (student.feesPaid || 0);
    const isFullyPaid = balance <= 0;

    res.json({
      studentId: student.id,
      name: student.name,
      accessNumber: student.accessNumber,
      totalFees: student.totalFees || 0,
      feesPaid: student.feesPaid || 0,
      balance: balance,
      isFullyPaid: isFullyPaid
    });
  } catch (error) {
    console.error('Error checking fee balance:', error);
    res.status(500).json({ error: 'Failed to check fee balance' });
  }
});

// Get dropped access numbers by class/stream
router.get('/dropped-access-numbers/:class/:stream', async (req, res) => {
  try {
  const { class: className, stream } = req.params;
  const droppedNumbers = await prisma.droppedAccessNumber.findMany({
    where: {
      className: className,
      streamName: stream
    },
    select: {
      accessNumber: true
    }
  });
    res.json(droppedNumbers);
  } catch (error) {
    console.error('Error fetching dropped access numbers by class/stream:', error);
    res.status(500).json({ error: 'Failed to fetch dropped access numbers' });
  }
});

// Remove dropped access number
router.delete('/dropped-access-numbers/:accessNumber', async (req, res) => {
  try {
    const { accessNumber } = req.params;
    await prisma.droppedAccessNumber.deleteMany({
      where: { accessNumber }
    });
    res.json({ message: 'Dropped access number removed successfully' });
  } catch (error) {
    console.error('Error removing dropped access number:', error);
    res.status(500).json({ error: 'Failed to remove dropped access number' });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create new student
router.post('/', duplicatePreventionMiddleware, auditStudentCreationMiddleware, async (req, res) => {
  try {
    const {
      name,
      accessNumber,
      admissionId,
      nin,
      lin,
      dateOfBirth,
      age,
      gender,
      residenceType,
      phone,
      email,
      class: className,
      stream,
      needsSponsorship,
      sponsorshipStatus,
      sponsorshipStory,
      familyPhoto,
      passportPhoto,
      parent,
      parentAddress,
      parentOccupation,
      conductNotes,
      // New sponsorship fields
      classCompletion,
      careerAspiration
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Use className from request or fall back to class
    const finalClassName = className || req.body.class;
    
    if (!age || age <= 0) {
      return res.status(400).json({ error: 'Valid age is required' });
    }
    
    if (!finalClassName) {
      return res.status(400).json({ error: 'Class is required' });
    }
    
    // Stream is required for admin-admitted students, but overseer students can have 'None'
    if (!stream && req.body.admittedBy !== 'overseer') {
      return res.status(400).json({ error: 'Stream is required' });
    }

    // Extract parent information from nested object or use individual fields
    const parentInfo = parent || {};

    // AGGRESSIVE DUPLICATE PREVENTION: Check for existing student with same name and class
    const existingStudent = await prisma.student.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        class: finalClassName,
        status: {
          in: ['active', 'pending', 'sponsored', 'awaiting']
        }
      }
    });

    if (existingStudent) {
      console.log(`🚫 DUPLICATE DETECTED: Found existing student ${name} in ${finalClassName}`);
      return res.status(400).json({ 
        error: 'Duplicate student detected',
        details: `A student with name "${name}" already exists in class "${finalClassName}". Please check the existing student or use a different name.`,
        existingStudent: {
          name: existingStudent.name,
          class: existingStudent.class,
          accessNumber: existingStudent.accessNumber,
          id: existingStudent.id
        }
      });
    }

    // FORCE overseer students to always have "None-" prefixed numbers
    let finalAccessNumber = accessNumber;
    if (req.body.admittedBy === 'overseer') {
      // Overseer students MUST have "None-" prefixed access numbers
      finalAccessNumber = `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🎯 OVERSEER: Forcing None- prefixed access number: ${finalAccessNumber}`);
    } else if (!finalAccessNumber) {
      // SPECIAL CASE: Re-admission - check if original access number is available
      if (req.body.isReAdmission && req.body.originalAccessNumber) {
        const originalAccessNumber = req.body.originalAccessNumber;
        const existingActiveStudent = await prisma.student.findFirst({
          where: {
            accessNumber: originalAccessNumber,
            status: 'active'
          }
        });
        
        if (!existingActiveStudent) {
          finalAccessNumber = originalAccessNumber;
          console.log(`♻️ Re-admission: Using original access number ${originalAccessNumber}`);
        } else {
          console.log(`⚠️ Re-admission: Original access number ${originalAccessNumber} is taken, will generate new one`);
        }
      }
      
      // If still no access number, generate new one
      if (!finalAccessNumber) {
        // Check if there are any dropped access numbers available for this class/stream
        const droppedNumbers = await prisma.droppedAccessNumber.findMany({
          where: {
            className: finalClassName,
            streamName: stream
          },
          orderBy: { droppedAt: 'asc' }
        });

        if (droppedNumbers.length > 0) {
          // Use the oldest dropped access number
          finalAccessNumber = droppedNumbers[0].accessNumber;
          console.log(`♻️ Reusing dropped access number: ${finalAccessNumber}`);
        } else {
          // No dropped numbers available, generate new one
          // Use a transaction to prevent race conditions
          // Prepare class and stream codes for access number generation
          const getClassCodeForAccess = (className: string): string => {
            switch (className) {
              case 'Senior 1': return 'A';
              case 'Senior 2': return 'B';
              case 'Senior 3': return 'C';
              case 'Senior 4': return 'D';
              case 'Senior 5': return 'E';
              case 'Senior 6': return 'F';
              default: return 'X';
            }
          };
          const getStreamCode = (streamName: string | undefined): string => {
            if (!streamName) return 'N';
            const first = streamName.trim().toUpperCase()[0];
            return first >= 'A' && first <= 'Z' ? first : 'N';
          };
          const classCode = getClassCodeForAccess(finalClassName);
          const streamCode = getStreamCode(stream);

          const result = await prisma.$transaction(async (tx) => {
            // Get all existing ACTIVE students in this class and stream
            const existingStudents = await tx.student.findMany({
              where: {
                class: finalClassName,
                stream: stream,
                status: 'active' // Only consider active students for number generation
              }
            });

            // Get all used numbers in this stream
            const usedNumbers = existingStudents.map(s => {
              const match = s.accessNumber?.match(/\d{2}$/);
              return match ? parseInt(match[0], 10) : 0;
            });

            // Find the next available number
            let nextNumber = 1;
            while (usedNumbers.includes(nextNumber)) {
              nextNumber++;
            }

            const generatedAccessNumber = `${classCode}${streamCode}${String(nextNumber).padStart(2, '0')}`;
            
            // Double-check this number isn't being used by another concurrent request
            const conflictingStudent = await tx.student.findFirst({
              where: { 
                accessNumber: generatedAccessNumber,
                status: 'active'
              }
            });

            if (conflictingStudent) {
              throw new Error('Access number conflict detected, please try again');
            }

            return generatedAccessNumber;
          });

          finalAccessNumber = result;
          console.log(`🆕 Generated new access number: ${finalAccessNumber}`);
        }
      }
    }

    // Check if access number already exists (only for real access numbers, not "None" prefixed)
    if (finalAccessNumber && !finalAccessNumber.startsWith('None-')) {
      const existingActiveStudent = await prisma.student.findFirst({
        where: { 
          accessNumber: finalAccessNumber,
          status: 'active'
        }
      });

      if (existingActiveStudent) {
        return res.status(400).json({ error: 'Access number already exists' });
      }
    } else if (finalAccessNumber && finalAccessNumber.startsWith('None-')) {
      // For "None-" prefixed access numbers, we don't need to check uniqueness
      // Multiple students can have "None-" prefixed access numbers
      console.log('✅ Allowing multiple students with accessNumber: "None-" prefixed');
    }

    // If using a dropped access number, remove it from dropped list and delete old re-admitted student record
    if (finalAccessNumber && !finalAccessNumber.startsWith('None-')) {
      // Remove from dropped list if it exists there
      const droppedCount = await prisma.droppedAccessNumber.deleteMany({
        where: { accessNumber: finalAccessNumber }
      });
      if (droppedCount.count > 0) {
        console.log(`♻️ Removed ${finalAccessNumber} from dropped access numbers (now in use)`);
      }
      
      // Also check for old re-admitted student record
      const oldReAdmittedStudent = await prisma.student.findFirst({
        where: {
          accessNumber: finalAccessNumber,
          status: 're-admitted'
        }
      });

      if (oldReAdmittedStudent) {
        await prisma.student.delete({
          where: { id: oldReAdmittedStudent.id }
        });
        console.log(`🗑️ Deleted old re-admitted student record: ${oldReAdmittedStudent.name} (${finalAccessNumber})`);
      }
    }

    // Generate admission ID if not provided OR if not a "None-" prefixed overseer student
    let finalAdmissionId = admissionId;
    if (req.body.admittedBy === 'overseer') {
      // Overseer students MUST have "None-" prefixed admission IDs
      finalAdmissionId = `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🎯 OVERSEER: Forcing None- prefixed admission ID: ${finalAdmissionId}`);
    } else if (!finalAdmissionId) {
      // Generate admission ID based on current date and class
      const now = new Date();
      const currentYear = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      
      // Get month code (first letter, or first+last for duplicates)
      const getMonthCode = (month: number): string => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const monthName = monthNames[month];
        const firstLetter = monthName.charAt(0);
        
        // Check if this first letter is used by other months
        const monthsWithSameFirstLetter = monthNames.filter(name => name.charAt(0) === firstLetter);
        
        if (monthsWithSameFirstLetter.length > 1) {
          // Use first + last letter for months with duplicate first letters
          const lastLetter = monthName.charAt(monthName.length - 1);
          const code = firstLetter + lastLetter;
          
          // Special cases to avoid duplicates
          if (monthName === 'January') return 'Ja';
          if (monthName === 'July') return 'Jy';
          
          return code;
        } else {
          // Use single letter for unique first letters
          return firstLetter;
        }
      };

      // Get class code
      const getClassCode = (className: string): string => {
        switch (className) {
          case 'Senior 1': return 'A';
          case 'Senior 2': return 'B';
          case 'Senior 3': return 'C';
          case 'Senior 4': return 'D';
          default: return 'X';
        }
      };
      
      const monthCode = getMonthCode(now.getMonth());
      const classCode = getClassCode(finalClassName);
      
      // Count ALL students (any status) to avoid admission ID conflicts
      const yearStudents = await prisma.student.findMany({
        where: {
          admissionId: {
            startsWith: `${monthCode}${currentYear}`
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // The next admission number is the count + 1, formatted as 2 digits
      const nextNumber = yearStudents.length + 1;
      finalAdmissionId = `${monthCode}${currentYear}${classCode}${String(nextNumber).padStart(2, '0')}`;
    }

    // Check if admissionId already exists (only for real admission IDs, not "None-" prefixed)
    if (finalAdmissionId && !finalAdmissionId.startsWith('None-')) {
      const existingStudent = await prisma.student.findFirst({
        where: { admissionId: finalAdmissionId }
      });
      
      if (existingStudent) {
        return res.status(400).json({ 
          error: 'Admission ID already exists', 
          details: `Admission ID ${finalAdmissionId} is already in use by student: ${existingStudent.name}` 
        });
      }
    } else if (finalAdmissionId && finalAdmissionId.startsWith('None-')) {
      // For "None-" prefixed admission IDs, we don't need to check uniqueness
      // Multiple students can have "None-" prefixed admission IDs
      console.log('✅ Allowing multiple students with admissionId: "None-" prefixed');
    }

    const studentData = {
      name,
      accessNumber: finalAccessNumber,
      admissionId: finalAdmissionId,
      nin: nin || '',
      lin: lin || '',
      age: age ? parseInt(age) : 0,
      dateOfBirth: req.body.dateOfBirth || '',
      gender: gender || '',
      residenceType: residenceType || req.body.residenceType || null,
      phone: phone || '',
      phoneCountryCode: req.body.phoneCountryCode || 'UG',
      email: email || '',
      class: finalClassName,
      // Calculate fees including boarding fee if applicable
      totalFees: calculateStudentFees(finalClassName, residenceType || req.body.residenceType),
      feesPaid: 0,
      feeBalance: calculateStudentFees(finalClassName, residenceType || req.body.residenceType),
      stream,
      needsSponsorship: needsSponsorship || false,
      sponsorshipStatus: sponsorshipStatus || (req.body.admittedBy === 'overseer' ? 'pending' : 'awaiting'),
      sponsorshipStory: sponsorshipStory || '',
      photo: req.body.photo || '',
      familyPhoto: familyPhoto || '',
      passportPhoto: passportPhoto || '',
      // Parent information (flattened)
      parentName: parentInfo.name || parentAddress || '',
      parentNin: parentInfo.nin || '',
      parentNinType: parentInfo.ninType || 'NIN',
      parentPhone: parentInfo.phone || '',
      parentPhoneCountryCode: parentInfo.phoneCountryCode || 'UG',
      parentEmail: parentInfo.email || '',
      parentAddress: parentInfo.address || parentAddress || '',
      parentOccupation: parentInfo.occupation || parentOccupation || '',
      parentStory: parentInfo.story || '',
      parentAge: parentInfo.age ? parseInt(parentInfo.age) : null,
      parentFamilySize: parentInfo.familySize ? parseInt(parentInfo.familySize) : null,
      parentRelationship: parentInfo.relationship || '',
      conductNotes: conductNotes || null,
      // New fields
      classCompletion: classCompletion || '',
      careerAspiration: careerAspiration || '',
      storyLocked: false,
      status: 'active',
      // Personal Information Fields
      address: req.body.address || '',
      hobbies: req.body.hobbies || '',
      dreams: req.body.dreams || '',
      aspirations: req.body.aspirations || '',
      medicalCondition: req.body.medicalCondition || '',
      village: req.body.village || '',
      medicalProblems: req.body.medicalProblems || '',
      individualFee: req.body.individualFee ? parseFloat(req.body.individualFee) : null,
      // Second Parent Information
      secondParentName: req.body.secondParent?.name || '',
      secondParentNin: req.body.secondParent?.nin || '',
      secondParentPhone: req.body.secondParent?.phone || '',
      secondParentEmail: req.body.secondParent?.email || '',
      secondParentAddress: req.body.secondParent?.address || '',
      secondParentOccupation: req.body.secondParent?.occupation || '',
      secondParentPhoneCountryCode: req.body.secondParent?.phoneCountryCode || 'UG',
      // Admission tracking
      admittedBy: req.body.admittedBy || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Creating student with data:', {
      name: studentData.name,
      class: studentData.class,
      stream: studentData.stream,
      accessNumber: studentData.accessNumber,
      admissionId: studentData.admissionId,
      sponsorshipStatus: studentData.sponsorshipStatus,
      admittedBy: studentData.admittedBy
    });
    
    console.log('🔍 DEBUG - Request body sponsorshipStatus:', req.body.sponsorshipStatus);
    console.log('🔍 DEBUG - Request body admittedBy:', req.body.admittedBy);

    const student = await prisma.student.create({
      data: studentData
    });

    // If a dropped access number was used, remove it from dropped list
    if (req.body.wasDroppedNumberChosen && finalAccessNumber) {
      // This means a dropped number was chosen, remove it from dropped list
      await prisma.droppedAccessNumber.deleteMany({
        where: { accessNumber: finalAccessNumber }
      });
      console.log(`🗑️  Removed ${finalAccessNumber} from dropped access numbers (now in use)`);
    }

    console.log('✅ Student created successfully:', {
      id: student.id,
      name: student.name,
      accessNumber: student.accessNumber,
      admissionId: student.admissionId
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    const err: any = error as any;
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return res.status(400).json({
        error: 'Duplicate entry',
        details: `A student with this ${err.meta?.target?.join(', ') || 'information'} already exists`
      });
    }
    
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Foreign key constraint failed',
        details: 'Referenced record does not exist'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create student',
      details: err?.message || 'Unknown error occurred',
      code: err?.code,
      meta: err?.meta
    });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const {
      name,
      nin,
      lin,
      dateOfBirth,
      age,
      gender,
      phone,
      email,
      class: className,
      stream,
      needsSponsorship,
      sponsorshipStatus,
      sponsorshipStory,
      familyPhoto,
      passportPhoto,
      photo,
      parent,
      parentAddress,
      parentOccupation,
      conductNotes,
      classCompletion,
      careerAspiration,
      address,
      hobbies,
      dreams,
      aspirations,
      medicalCondition,
      individualFee,
      village,
      medicalProblems
    } = req.body;

    // Handle family photo upload if provided
    let updateData: any = {
      name,
      nin,
      lin,
      dateOfBirth,
      age: age ? parseInt(age) : undefined,
      gender,
      phone,
      email,
      class: className,
      stream,
      needsSponsorship,
      sponsorshipStatus,
      sponsorshipStory,
      parentAddress,
      parentOccupation,
      conductNotes,
      classCompletion,
      careerAspiration,
      address,
      hobbies,
      dreams,
      aspirations,
      medicalCondition,
      village,
      medicalProblems,
      individualFee: individualFee ? parseFloat(individualFee) : undefined,
      ...(req.body.residenceType ? { residenceType: req.body.residenceType } : {}),
      updatedAt: new Date()
    };

    // Handle family photo upload if provided
    if (familyPhoto && typeof familyPhoto === 'object' && familyPhoto.fileData) {
      try {
        const familyPhotoFile = familyPhoto;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(familyPhotoFile.fileType)) {
          return res.status(400).json({ error: 'Invalid family photo file type. Only images are allowed.' });
        }

        // Generate unique filename
        const fileExtension = familyPhotoFile.fileType.split('/')[1];
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const uploadsDir = require('path').join(__dirname, '..', '..', 'uploads');

        if (!require('fs').existsSync(uploadsDir)) {
          require('fs').mkdirSync(uploadsDir, { recursive: true });
        }

        // Decode base64 and save file
        const base64Data = familyPhotoFile.fileData.replace(/^data:image\/[a-z]+;base64,/, '');
        const filePath = require('path').join(uploadsDir, filename);
        require('fs').writeFileSync(filePath, base64Data, 'base64');
        
        updateData.familyPhoto = filename;
        console.log(`📸 Family photo uploaded: ${filename}`);
      } catch (photoError) {
        console.error('Error uploading family photo:', photoError);
        return res.status(500).json({ error: 'Failed to upload family photo' });
      }
    } else if (familyPhoto !== undefined) {
      // If no file upload but text field provided, use the text value
      // Use !== undefined to allow empty strings to be set
      updateData.familyPhoto = familyPhoto;
    }

    // Handle passport photo upload if provided
    if (passportPhoto && typeof passportPhoto === 'object' && passportPhoto.fileData) {
      try {
        const passportPhotoFile = passportPhoto;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(passportPhotoFile.fileType)) {
          return res.status(400).json({ error: 'Invalid passport photo file type. Only images are allowed.' });
        }

        // Generate unique filename
        const fileExtension = passportPhotoFile.fileType.split('/')[1];
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const uploadsDir = require('path').join(__dirname, '..', '..', 'uploads');

        if (!require('fs').existsSync(uploadsDir)) {
          require('fs').mkdirSync(uploadsDir, { recursive: true });
        }

        // Decode base64 and save file
        const base64Data = passportPhotoFile.fileData.replace(/^data:image\/[a-z]+;base64,/, '');
        const filePath = require('path').join(uploadsDir, filename);
        require('fs').writeFileSync(filePath, base64Data, 'base64');
        
        updateData.passportPhoto = filename;
        console.log(`📸 Passport photo uploaded: ${filename}`);
      } catch (photoError) {
        console.error('Error uploading passport photo:', photoError);
        return res.status(500).json({ error: 'Failed to upload passport photo' });
      }
    } else if (passportPhoto !== undefined) {
      // If no file upload but text field provided, use the text value
      // Use !== undefined to allow empty strings to be set
      updateData.passportPhoto = passportPhoto;
    }

    // Handle profile photo upload if provided
    if (photo && typeof photo === 'object' && photo.fileData) {
      try {
        const photoFile = photo;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(photoFile.fileType)) {
          return res.status(400).json({ error: 'Invalid profile photo file type. Only images are allowed.' });
        }

        // Generate unique filename
        const fileExtension = photoFile.fileType.split('/')[1];
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const uploadsDir = require('path').join(__dirname, '..', '..', 'uploads');

        if (!require('fs').existsSync(uploadsDir)) {
          require('fs').mkdirSync(uploadsDir, { recursive: true });
        }

        // Decode base64 and save file
        const base64Data = photoFile.fileData.replace(/^data:image\/[a-z]+;base64,/, '');
        const filePath = require('path').join(uploadsDir, filename);
        require('fs').writeFileSync(filePath, base64Data, 'base64');
        
        updateData.photo = filename;
        console.log(`📸 Profile photo uploaded: ${filename}`);
      } catch (photoError) {
        console.error('Error uploading profile photo:', photoError);
        return res.status(500).json({ error: 'Failed to upload profile photo' });
      }
    } else if (photo !== undefined) {
      // If no file upload but text field provided, use the text value
      // Use !== undefined to allow empty strings to be set
      updateData.photo = photo;
    }

    // Add other fields if provided
    if (parent) {
      updateData = {
        ...updateData,
        parentName: parent.name || '',
        parentNin: parent.nin || '',
        parentNinType: parent.ninType || 'NIN',
        parentPhone: parent.phone || '',
        parentPhoneCountryCode: parent.phoneCountryCode || 'UG',
        parentEmail: parent.email || '',
        parentAddress: parent.address || '',
        parentOccupation: parent.occupation || '',
        parentStory: parent.story || '',
        parentAge: parent.age ? parseInt(parent.age) : null,
        parentFamilySize: parent.familySize ? parseInt(parent.familySize) : null,
        parentRelationship: parent.relationship || ''
      };
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Get the student first to check their access number
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

      // Do not delete overseer-admitted records. These are pupils until school admission.
      if ((student as any).admittedBy === 'overseer') {
        return res.status(403).json({
          error: 'Cannot delete overseer-admitted student',
          details: 'Overseer-admitted records are pupils and must remain until admitted by the school.'
        });
      }

    console.log(`🗑️ Deleting student: ${student.name} (${student.accessNumber})`);

    // Check if this student is the highest numbered active student in their stream
    const allStudentsInStream = await prisma.student.findMany({
      where: {
        class: student.class,
        stream: student.stream,
        status: 'active'
      },
      orderBy: { accessNumber: 'desc' }
    });

    const isHighestNumbered = allStudentsInStream.length > 0 && 
      allStudentsInStream[0].accessNumber === student.accessNumber;

    if (isHighestNumbered) {
      console.log(`✅ ${student.accessNumber} goes back to main pool (highest number - can be reused)`);
    } else {
      // Add to dropped access numbers list
      await prisma.droppedAccessNumber.create({
        data: {
          accessNumber: student.accessNumber,
          className: student.class,
          streamName: student.stream,
          droppedAt: new Date(),
          reason: 'Student deleted'
        }
      });
      console.log(`✅ Added ${student.accessNumber} to dropped list (not highest numbered in stream)`);
    }

    // Now delete the original student with explicit transaction
    await prisma.$transaction(async (tx) => {
      await tx.student.delete({
        where: { id: studentId }
      });
    });

    console.log(`✅ Student ${student.name} (${student.accessNumber}) deleted successfully`);

    res.json({ 
      message: 'Student deleted successfully',
      droppedAccessNumber: student.accessNumber,
      isHighestNumbered: isHighestNumbered
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Flag student (change status to left, expelled, etc.)
router.patch('/:id/flag', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { status, comment } = req.body;

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Get the current student
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`🏷️ Flagging student: ${currentStudent.name} (${currentStudent.accessNumber}) as ${status}`);

    // SPECIAL CASE: Re-admitted students should NOT go to dropped list
    // They keep their original access number for reference, but it's not available for reuse
    if (status === 're-admitted') {
      console.log(`✅ ${currentStudent.accessNumber} marked as re-admitted (kept for reference, not available for reuse)`);
    } else {
      // CORRECT LOGIC: Check if this is the highest numbered student in the stream
      const allStudentsInStream = await prisma.student.findMany({
        where: {
          class: currentStudent.class,
          stream: currentStudent.stream,
          status: 'active'
        },
        orderBy: { accessNumber: 'desc' }
      });

      const isHighestNumbered = allStudentsInStream.length > 0 && 
        allStudentsInStream[0].accessNumber === currentStudent.accessNumber;

      if (isHighestNumbered) {
        console.log(`✅ ${currentStudent.accessNumber} goes back to main pool (highest numbered in stream)`);
      } else {
        // Add to dropped access numbers list
        await prisma.droppedAccessNumber.create({
          data: {
            accessNumber: currentStudent.accessNumber,
            className: currentStudent.class,
            streamName: currentStudent.stream,
            droppedAt: new Date(),
            reason: `Student flagged as ${status}`
          }
        });
        console.log(`✅ Added ${currentStudent.accessNumber} to dropped list (not highest numbered in stream)`);
      }
    }

    // Update the student status
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        status: status || 'left',
        flagComment: comment || '',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Student ${currentStudent.name} flagged successfully as ${status}`);

    res.json({
      message: 'Student flagged successfully',
      student: updatedStudent,
      accessNumber: currentStudent.accessNumber
    });
  } catch (error) {
    console.error('Error flagging student:', error);
    res.status(500).json({ error: 'Failed to flag student' });
  }
});

// Add conduct note to student
router.post('/:id/conduct-notes', async (req, res) => {
  try {
    const { content, type, author } = req.body;
    const studentId = parseInt(req.params.id);

    // Validate required fields
    if (!content || !type || !author) {
      return res.status(400).json({ error: 'Content, type, and author are required' });
    }

    // Validate content length
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Content must be less than 1000 characters' });
    }

    // Validate type
    const validTypes = ['positive', 'negative', 'warning', 'achievement', 'incident'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid conduct note type' });
    }

    // Get the student
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get existing conduct notes
    const existingNotes: any[] = Array.isArray((student as any).conductNotes) ? (student as any).conductNotes : [];

    // Create new conduct note
    const newNote = {
      id: Date.now().toString(),
      content,
      type,
      author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedNotes = [...existingNotes, newNote];

    // Use a transaction to ensure atomicity
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update the student with the new conduct note
      const result = await tx.student.update({
        where: { id: studentId },
        data: {
          conductNotes: updatedNotes,
          updatedAt: new Date()
        }
      });

      // Log the conduct note creation for audit purposes
      console.log(`📝 Conduct note added to student ${student.name} (${student.accessNumber}): ${type} by ${author}`);

      return result;
    });

    res.json({
      message: 'Conduct note added successfully',
      student: updatedStudent,
      newNote
    });
  } catch (error) {
    console.error('Error adding conduct note:', error);
    res.status(500).json({ error: 'Failed to add conduct note' });
  }
});

// Approve overseer admission
router.post('/:id/approve-overseer-admission', async (req, res) => {
  try {
    const { accessNumber } = req.body;
    const studentId = parseInt(req.params.id);

    // Get the student
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update the student with the approved access number
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        accessNumber: accessNumber,
        sponsorshipStatus: 'approved',
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Overseer admission approved successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Error approving overseer admission:', error);
    res.status(500).json({ error: 'Failed to approve overseer admission' });
  }
});

export default router;

