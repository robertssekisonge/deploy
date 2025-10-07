import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// GET academic records for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await prisma.academicRecord.findMany({
      where: { studentId },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' }
      ]
    });
    
    console.log(`GET /api/academic/student/${studentId} - Returning ${records.length} records`);
    res.json(records);
  } catch (error) {
    console.error('Error fetching academic records:', error);
    res.status(500).json({ error: 'Failed to fetch academic records' });
  }
});

// GET academic records for a class and stream
router.get('/class/:className/stream/:streamName', async (req, res) => {
  try {
    const { className, streamName } = req.params;
    const { term, year } = req.query;
    
    const whereClause: any = {
      className,
      streamName
    };
    
    if (term) whereClause.term = term;
    if (year) whereClause.year = year;
    
    const records = await prisma.academicRecord.findMany({
      where: whereClause,
      orderBy: [
        { position: 'asc' },
        { totalMarks: 'desc' }
      ]
    });
    
    console.log(`GET /api/academic/class/${className}/stream/${streamName} - Returning ${records.length} records`);
    res.json(records);
  } catch (error) {
    console.error('Error fetching class academic records:', error);
    res.status(500).json({ error: 'Failed to fetch class academic records' });
  }
});

// GET academic records by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { term, year } = req.query;
    
    const whereClause: any = { teacherId };
    if (term) whereClause.term = term;
    if (year) whereClause.year = year;
    
    const records = await prisma.academicRecord.findMany({
      where: whereClause,
      orderBy: [
        { className: 'asc' },
        { streamName: 'asc' },
        { position: 'asc' }
      ]
    });
    
    console.log(`GET /api/academic/teacher/${teacherId} - Returning ${records.length} records`);
    res.json(records);
  } catch (error) {
    console.error('Error fetching teacher academic records:', error);
    res.status(500).json({ error: 'Failed to fetch teacher academic records' });
  }
});

// POST new academic record
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      className,
      streamName,
      term,
      year,
      subjects,
      totalMarks,
      percentage,
      overallGrade,
      position,
      teacherId,
      teacherName
    } = req.body;

    // Check if record already exists for this student, term, and year
    const existingRecord = await prisma.academicRecord.findUnique({
      where: {
        studentId_term_year: {
          studentId,
          term,
          year
        }
      }
    });

    if (existingRecord) {
      // Update existing record
      const updatedRecord = await prisma.academicRecord.update({
        where: { id: existingRecord.id },
        data: {
          subjects,
          totalMarks,
          percentage,
          overallGrade,
          position,
          teacherId,
          teacherName,
          updatedAt: new Date()
        }
      });
      
      console.log('Academic record updated:', updatedRecord);
      res.json(updatedRecord);
    } else {
      // Create new record
      const newRecord = await prisma.academicRecord.create({
        data: {
          studentId,
          studentName,
          className,
          streamName,
          term,
          year,
          subjects,
          totalMarks,
          percentage,
          overallGrade,
          position,
          teacherId,
          teacherName
        }
      });
      
      console.log('Academic record created:', newRecord);
      res.status(201).json(newRecord);
    }
  } catch (error) {
    console.error('Error saving academic record:', error);
    res.status(500).json({ error: 'Failed to save academic record' });
  }
});

// POST: Auto-grade student marks
router.post('/auto-grade', async (req, res) => {
  try {
    const { studentId, subjects, totalMarksPerSubject, gradeSystem } = req.body as {
      studentId: string;
      subjects: Record<string, number>;
      totalMarksPerSubject: Record<string, number>;
      gradeSystem?: any;
    };

    if (!studentId || !subjects) {
      return res.status(400).json({ error: 'studentId and subjects are required' });
    }

    // Use the centralized grade system from frontend utils
    const DEFAULT_GRADE_SYSTEM = {
      A: { min: 80, max: 100, comment: "Excellent performance! Keep up the outstanding work." },
      BPlus: { min: 75, max: 79, comment: "Very good work! You are doing great." },
      B: { min: 70, max: 74, comment: "Good performance. Continue working hard." },
      CPlus: { min: 65, max: 69, comment: "Fair performance. You can do better with more effort." },
      C: { min: 60, max: 64, comment: "Average performance. More effort is needed." },
      DPlus: { min: 55, max: 59, comment: "Below average. Significant improvement required." },
      D: { min: 50, max: 54, comment: "Poor performance. Immediate attention needed." },
      F: { min: 0, max: 49, comment: "Failure. Requires intensive support and remedial work." }
    };

    const system = { ...DEFAULT_GRADE_SYSTEM, ...gradeSystem };

    // Calculate grades
    const subjectGrades: Record<string, any> = {};
    let totalMarks = 0;
    let totalPossibleMarks = 0;

    Object.keys(subjects).forEach(subject => {
      const marks = subjects[subject];
      const totalMarksForSubject = totalMarksPerSubject[subject] || 100;
      const percentage = Math.round((marks / totalMarksForSubject) * 100);
      
      // Determine grade
      let grade = 'F';
      let comment = system.F.comment;
      
      if (percentage >= system.A.min && percentage <= system.A.max) {
        grade = 'A';
        comment = system.A.comment;
      } else if (percentage >= system.BPlus.min && percentage <= system.BPlus.max) {
        grade = 'B+';
        comment = system.BPlus.comment;
      } else if (percentage >= system.B.min && percentage <= system.B.max) {
        grade = 'B';
        comment = system.B.comment;
      } else if (percentage >= system.CPlus.min && percentage <= system.CPlus.max) {
        grade = 'C+';
        comment = system.CPlus.comment;
      } else if (percentage >= system.C.min && percentage <= system.C.max) {
        grade = 'C';
        comment = system.C.comment;
      } else if (percentage >= system.DPlus.min && percentage <= system.DPlus.max) {
        grade = 'D+';
        comment = system.DPlus.comment;
      } else if (percentage >= system.D.min && percentage <= system.D.max) {
        grade = 'D';
        comment = system.D.comment;
      }

      subjectGrades[subject] = { grade, percentage, comment };
      totalMarks += marks;
      totalPossibleMarks += totalMarksForSubject;
    });

    // Calculate overall grade
    const averagePercentage = Math.round((totalMarks / totalPossibleMarks) * 100);
    let overallGrade = 'F';
    let overallComment = system.F.comment;

    if (averagePercentage >= system.A.min && averagePercentage <= system.A.max) {
      overallGrade = 'A';
      overallComment = system.A.comment;
    } else if (averagePercentage >= system.BPlus.min && averagePercentage <= system.BPlus.max) {
      overallGrade = 'B+';
      overallComment = system.BPlus.comment;
    } else if (averagePercentage >= system.B.min && averagePercentage <= system.B.max) {
      overallGrade = 'B';
      overallComment = system.B.comment;
    } else if (averagePercentage >= system.CPlus.min && averagePercentage <= system.CPlus.max) {
      overallGrade = 'C+';
      overallComment = system.CPlus.comment;
    } else if (averagePercentage >= system.C.min && averagePercentage <= system.C.max) {
      overallGrade = 'C';
      overallComment = system.C.comment;
    } else if (averagePercentage >= system.DPlus.min && averagePercentage <= system.DPlus.max) {
      overallGrade = 'D+';
      overallComment = system.DPlus.comment;
    } else if (averagePercentage >= system.D.min && averagePercentage <= system.D.max) {
      overallGrade = 'D';
      overallComment = system.D.comment;
    }

    const result = {
      studentId,
      subjectGrades,
      overallGrade: {
        grade: overallGrade,
        percentage: averagePercentage,
        comment: overallComment
      },
      totalMarks,
      totalPossibleMarks,
      averagePercentage
    };

    console.log('Auto-grading result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error auto-grading:', error);
    res.status(500).json({ error: 'Failed to auto-grade' });
  }
});

// POST: Recompute positions for a cohort (class/stream) and/or overall for a term/year
router.post('/recompute-positions', async (req, res) => {
  try {
    const { className, streamName, term, year } = req.body as {
      className?: string;
      streamName?: string;
      term: string;
      year: string | number;
    };

    if (!term || !year) {
      return res.status(400).json({ error: 'term and year are required' });
    }

    const whereClause: any = { term, year };
    if (className) whereClause.className = className;
    if (streamName) whereClause.streamName = streamName;

    // Pull current records
    const records = await prisma.academicRecord.findMany({
      where: whereClause
    });

    if (records.length === 0) {
      return res.json({ message: 'No academic records found for selection', updated: 0 });
    }

    // Helper to count subjects from flexible shapes
    const getSubjectsCount = (subjects: any): number => {
      if (!subjects) return 0;
      if (Array.isArray(subjects)) return subjects.length;
      if (typeof subjects === 'object') return Object.keys(subjects).length;
      return 0;
    };

    // Build sortable data with tie-break helpers
    type Ranked = typeof records[number] & {
      __subjectsCount?: number;
      __name?: string;
    };

    const enriched: Ranked[] = records.map((r: any) => ({
      ...r,
      __subjectsCount: getSubjectsCount(r.subjects),
      __name: (r.studentName || '').toString().toLowerCase()
    }));

    enriched.sort((a, b) => {
      const aPerc = (a.percentage ?? 0) as number;
      const bPerc = (b.percentage ?? 0) as number;
      if (bPerc !== aPerc) return bPerc - aPerc;

      const aTot = (a.totalMarks ?? 0) as number;
      const bTot = (b.totalMarks ?? 0) as number;
      if (bTot !== aTot) return bTot - aTot;

      const aSub = a.__subjectsCount ?? 0;
      const bSub = b.__subjectsCount ?? 0;
      if (bSub !== aSub) return bSub - aSub;

      // Stable alphabetical as final tiebreaker
      return (a.__name || '').localeCompare(b.__name || '');
    });

    // Assign positions with ties (1,2,2,4 ...)
    let lastKey: string | null = null;
    let lastPosition = 0;
    let processed = 0;

    const keyOf = (r: any) => `${r.percentage ?? 0}|${r.totalMarks ?? 0}|${r.__subjectsCount ?? 0}`;

    for (let index = 0; index < enriched.length; index++) {
      const rec = enriched[index];
      const key = keyOf(rec);
      if (key !== lastKey) {
        lastPosition = index + 1; // new position after any ties
        lastKey = key;
      }

      await prisma.academicRecord.update({
        where: { id: rec.id },
        data: { position: lastPosition, updatedAt: new Date() }
      });
      processed++;
    }

    // Return ranked list
    const refreshed = await prisma.academicRecord.findMany({
      where: whereClause,
      orderBy: [
        { position: 'asc' },
        { totalMarks: 'desc' }
      ]
    });

    console.log(`Recomputed positions for ${processed} records`, { className, streamName, term, year });
    res.json({ updated: processed, records: refreshed });
  } catch (error) {
    console.error('Error recomputing positions:', error);
    res.status(500).json({ error: 'Failed to recompute positions' });
  }
});

// PUT update academic record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);
    
    const updatedRecord = await prisma.academicRecord.update({
      where: { id: recordId },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });
    
    console.log('Academic record updated:', updatedRecord);
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating academic record:', error);
    res.status(500).json({ error: 'Failed to update academic record' });
  }
});

// DELETE academic record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);
    
    const deletedRecord = await prisma.academicRecord.delete({
      where: { id: recordId }
    });
    
    console.log('Academic record deleted:', deletedRecord);
    res.json({ message: 'Academic record deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic record:', error);
    res.status(500).json({ error: 'Failed to delete academic record' });
  }
});

export default router;







