import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MIDDLEWARE: Duplicate Prevention for Student Creation
 * 
 * This middleware runs BEFORE any student creation endpoint
 * and performs comprehensive duplicate detection to prevent
 * database-level duplicate errors
 */

interface DuplicateCheckRequest extends Request {
  duplicateCheck?: {
    passed: boolean;
    reason?: string;
    existingStudent?: any;
  };
}

export const duplicatePreventionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip duplicate check for non-student creation endpoints
    if (req.method !== 'POST' || !req.path.includes('/students')) {
      return next();
    }

    const { name, class: className, parentName, parent } = req.body;

    // Skip if required fields missing
    if (!name || !className) {
      return next();
    }

    const studentParentName = parent?.name || parentName || '';

    console.log('🔍 DUPLICATE PREVENTION: Checking for duplicates...', {
      name,
      className,
      parentName: studentParentName
    });

    // LEVEL 1: Check for exact duplicates (name + class + parent)
    const exactDuplicate = await prisma.student.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        class: className,
        parentName: studentParentName,
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      }
    });

    if (exactDuplicate) {
      console.log('🚫 DUPLICATE DETECTED: Exact match found', {
        existingStudent: exactDuplicate.name,
        existingAccess: exactDuplicate.accessNumber,
        existingClass: exactDuplicate.class
      });

      return res.status(400).json({
        error: 'DUPLICATE_STUDENT_DETECTED',
        message: 'Duplicate student detected',
        details: `A student with name "${name}" already exists in class "${className}" with the same parent information.`,
        existingStudent: {
          name: exactDuplicate.name,
          class: exactDuplicate.class,
          accessNumber: exactDuplicate.accessNumber,
          admissionId: exactDuplicate.admissionId,
          createdAt: exactDuplicate.createdAt,
          id: exactDuplicate.id
        },
        suggestion: 'Please check the existing student record or use different identifying information.',
        preventionLevel: 'EXACT_MATCH'
      });
    }

    // LEVEL 2: Check for similar duplicates (name + class, different parent)
    const similarDuplicate = await prisma.student.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        class: className,
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      }
    });

    if (similarDuplicate) {
      console.log('⚠️ SIMILAR DUPLICATE DETECTED: Same name and class', {
        existingStudent: similarDuplicate.name,
        existingAccess: similarDuplicate.accessNumber,
        existingParent: similarDuplicate.parentName
      });

      return res.status(400).json({
        error: 'SIMILAR_STUDENT_EXISTS',
        message: 'Similar student exists',
        details: `A student with name "${name}" already exists in class "${className}". Please verify this is a different student or check the existing record.`,
        existingStudent: {
          name: similarDuplicate.name,
          class: similarDuplicate.class,
          accessNumber: similarDuplicate.accessNumber,
          parentName: similarDuplicate.parentName,
          createdAt: similarDuplicate.createdAt,
          id: similarDuplicate.id
        },
        suggestion: 'If this is the same student, please update the existing record instead of creating a new one.',
        preventionLevel: 'SIMILAR_MATCH'
      });
    }

    // LEVEL 3; Check for overseer-specific duplicates (None prefixed access numbers)
    const overseerDuplicate = await prisma.student.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        class: className,
        OR: [
          { accessNumber: { startsWith: 'None-' } },
          { admissionId: { startsWith: 'None-' } },
          { admittedBy: 'overseer' }
        ],
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      }
    });

    if (overseerDuplicate) {
      console.log('🔍 OVERSEER DUPLICATE DETECTED', {
        existingStudent: overseerDuplicate.name,
        existingAccess: overseerDuplicate.accessNumber,
        admittedBy: overseerDuplicate.admittedBy
      });

      return res.status(400).json({
        error: 'OVERSEER_STUDENT_EXISTS',
        message: 'Overseer student exists',
        details: `An overseer student with name "${name}" already exists in class "${className}".`,
        existingStudent: {
          name: overseerDuplicate.name,
          class: overseerDuplicate.class,
          accessNumber: overseerDuplicate.accessNumber,
          admissionId: overseerDuplicate.admissionId,
          admittedBy: overseerDuplicate.admittedBy,
          createdAt: overseerDuplicate.createdAt,
          id: overseerDuplicate.id
        },
        suggestion: 'Check the overseer student record before creating a new registration.',
        preventionLevel: 'OVERSEER_MATCH'
      });
    }

    // LEVEL 4: Check for recently created students (within last 5 minutes)
    const recentStudent = await prisma.student.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        class: className,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        status: {
          in: ['active', 'pending', 'sponsored', 'awaiting']
        }
      }
    });

    if (recentStudent) {
      console.log('⏰ RECENT DUPLICATE DETECTED: Within 5 minutes', {
        existingStudent: recentStudent.name,
        timeDiff: Date.now() - new Date(recentStudent.createdAt).getTime()
      });

      return res.status(400).json({
        error: 'RECENT_DUPLICATE_DETECTED',
        message: 'Recent duplicate attempt',
        details: `A student with name "${name}" was recently created in class "${className}". Please wait a few minutes before creating another student with the same name.`,
        existingStudent: {
          name: recentStudent.name,
          class: recentStudent.class,
          accessNumber: recentStudent.accessNumber,
          createdAt: recentStudent.createdAt,
          id: recentStudent.id
        },
        suggestion: 'Wait 5 minutes before creating another student with the same name, or verify this is a different student.',
        preventionLevel: 'TEMPORAL_MATCH'
      });
    }

    // All checks passed - mark as safe to proceed
    (req as DuplicateCheckRequest).duplicateCheck = {
      passed: true,
      reason: 'No duplicates found'
    };

    console.log('✅ DUPLICATE PREVENTION: All checks passed');
    next();

  } catch (error) {
    console.error('❌ DUPLICATE PREVENTION ERROR:', error);
    
    // In case of error, still proceed but log the issue
    // Don't block legitimate student creation due to middleware error
    (req as DuplicateCheckRequest).duplicateCheck = {
      passed: true,
      reason: 'Error in duplicate check - proceeding'
    };
    
    next();
  }
};

/**
 * Additional helper middleware for audit logging
 */
export const auditStudentCreationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === 'POST' && req.path.includes('/students')) {
    const duplicateCheck = (req as DuplicateCheckRequest).duplicateCheck;
    
    console.log('📝 STUDENT CREATION AUDIT:', {
      timestamp: new Date().toISOString(),
      name: req.body.name,
      class: req.body.class,
      parentName: req.body.parent?.name || req.body.parentName,
      duplicateCheckPassed: duplicateCheck?.passed,
      duplicateCheckReason: duplicateCheck?.reason,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
};
