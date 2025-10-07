// Auto-grading utility functions

export interface GradeConfig {
  min: number;
  max: number;
  comment: string;
}

export interface GradeSystem {
  A: GradeConfig;
  BPlus: GradeConfig;
  B: GradeConfig;
  CPlus: GradeConfig;
  C: GradeConfig;
  DPlus: GradeConfig;
  D: GradeConfig;
  F: GradeConfig;
}

export interface GradeResult {
  grade: string;
  comment: string;
}

// Default grade system configuration
export const DEFAULT_GRADE_SYSTEM: GradeSystem = {
  A: { min: 80, max: 100, comment: "Excellent performance! Keep up the outstanding work." },
  BPlus: { min: 75, max: 79, comment: "Very good work! You are doing great." },
  B: { min: 70, max: 74, comment: "Good performance. Continue working hard." },
  CPlus: { min: 65, max: 69, comment: "Fair performance. You can do better with more effort." },
  C: { min: 60, max: 64, comment: "Average performance. More effort is needed." },
  DPlus: { min: 55, max: 59, comment: "Below average. Significant improvement required." },
  D: { min: 50, max: 54, comment: "Poor performance. Immediate attention needed." },
  F: { min: 0, max: 49, comment: "Failure. Requires intensive support and remedial work." }
};

/**
 * Calculate grade based on percentage score
 * @param percentage - The percentage score (0-100)
 * @param gradeSystem - Optional custom grade system, uses default if not provided
 * @returns GradeResult with grade letter and comment
 */
export function calculateGrade(percentage: number, gradeSystem?: Partial<GradeSystem>): GradeResult {
  const system = { ...DEFAULT_GRADE_SYSTEM, ...gradeSystem };
  
  // Ensure percentage is within valid range
  const validPercentage = Math.max(0, Math.min(100, percentage));
  
  // Check each grade in descending order (highest to lowest)
  if (validPercentage >= system.A.min && validPercentage <= system.A.max) {
    return { grade: 'A', comment: system.A.comment };
  }
  if (validPercentage >= system.BPlus.min && validPercentage <= system.BPlus.max) {
    return { grade: 'B+', comment: system.BPlus.comment };
  }
  if (validPercentage >= system.B.min && validPercentage <= system.B.max) {
    return { grade: 'B', comment: system.B.comment };
  }
  if (validPercentage >= system.CPlus.min && validPercentage <= system.CPlus.max) {
    return { grade: 'C+', comment: system.CPlus.comment };
  }
  if (validPercentage >= system.C.min && validPercentage <= system.C.max) {
    return { grade: 'C', comment: system.C.comment };
  }
  if (validPercentage >= system.DPlus.min && validPercentage <= system.DPlus.max) {
    return { grade: 'D+', comment: system.DPlus.comment };
  }
  if (validPercentage >= system.D.min && validPercentage <= system.D.max) {
    return { grade: 'D', comment: system.D.comment };
  }
  if (validPercentage >= system.F.min && validPercentage <= system.F.max) {
    return { grade: 'F', comment: system.F.comment };
  }
  
  // Fallback to F grade
  return { grade: 'F', comment: system.F.comment };
}

/**
 * Calculate percentage from marks and total possible marks
 * @param marks - Marks obtained
 * @param totalMarks - Total possible marks
 * @returns Percentage (0-100)
 */
export function calculatePercentage(marks: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  return Math.round((marks / totalMarks) * 100);
}

/**
 * Auto-grade multiple subjects
 * @param subjects - Object with subject names as keys and marks as values
 * @param totalMarksPerSubject - Object with subject names as keys and total marks as values
 * @param gradeSystem - Optional custom grade system
 * @returns Object with subject grades and overall grade
 */
export function autoGradeSubjects(
  subjects: Record<string, number>,
  totalMarksPerSubject: Record<string, number>,
  gradeSystem?: Partial<GradeSystem>
): {
  subjectGrades: Record<string, GradeResult>;
  overallGrade: GradeResult;
  totalMarks: number;
  totalPossibleMarks: number;
  averagePercentage: number;
} {
  const subjectGrades: Record<string, GradeResult> = {};
  let totalMarks = 0;
  let totalPossibleMarks = 0;
  
  // Calculate individual subject grades
  Object.keys(subjects).forEach(subject => {
    const marks = subjects[subject];
    const totalMarksForSubject = totalMarksPerSubject[subject] || 100; // Default to 100 if not specified
    const percentage = calculatePercentage(marks, totalMarksForSubject);
    const gradeResult = calculateGrade(percentage, gradeSystem);
    
    subjectGrades[subject] = gradeResult;
    totalMarks += marks;
    totalPossibleMarks += totalMarksForSubject;
  });
  
  // Calculate overall grade
  const averagePercentage = calculatePercentage(totalMarks, totalPossibleMarks);
  const overallGrade = calculateGrade(averagePercentage, gradeSystem);
  
  return {
    subjectGrades,
    overallGrade,
    totalMarks,
    totalPossibleMarks,
    averagePercentage
  };
}


