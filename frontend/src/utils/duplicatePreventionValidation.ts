/**
 * COMPREHENSIVE DUPLICATE PREVENTION VALIDATION
 * 
 * This utility provides multiple layers of duplicate prevention
 * at the frontend level before API calls are made
 */

import { Student } from '../types';

export interface DuplicateValidationResult {
  isDuplicate: boolean;
  severity: 'none' | 'warning' | 'error';
  message?: string;
  existingStudents?: Student[];
  suggestion?: string;
}

export interface DuplicateCheckOptions {
  checkRecent?: boolean; // Check for very recent duplicates
  allowSimilar?: boolean; // Allow similar names in different classes
  strictMode?: boolean;   // Enable strict duplicate detection
}

/**
 * Comprehensive duplicate validation
 */
export const validateAgainstDuplicates = async (
  studentData: Partial<Student>,
  existingStudents: Student[],
  options: DuplicateCheckOptions = {}
): Promise<DuplicateValidationResult> => {
  const { checkRecent = true, allowSimilar = false, strictMode = false } = options;
  
  try {
    // Level 1: Exact duplicate check
    const exactDuplicates = findExactDuplicates(studentData, existingStudents);
    if (exactDuplicates.length > 0) {
      return {
        isDuplicate: true,
        severity: 'error',
        message: `A student with name "${studentData.name}" already exists in class "${studentData.class}" with the same parent information.`,
        existingStudents: exactDuplicates,
        suggestion: 'Please check the existing student record or use different identifying information.'
      };
    }

    // Level 2: Similar name check
    const similarDuplicates = findSimilarDuplicates(studentData, existingStudents);
    if (similarDuplicates.length > 0 && !allowSimilar) {
      return {
        isDuplicate: true,
        severity: strictMode ? 'error' : 'warning',
        message: `Students with similar names exist: ${similarDuplicates.map(s => `${s.name} (${s.class})`).join(', ')}.`,
        existingStudents: similarDuplicates,
        suggestion: 'If this is the same student, please edit the existing record instead of creating a new one.'
      };
    }

    // Level 3: Recent duplicate check
    if (checkRecent) {
      const recentDuplicates = findRecentDuplicates(studentData, existingStudents);
      if (recentDuplicates.length > 0) {
        return {
          isDuplicate: true,
          severity: 'warning',
          message: `A student with this name was recently created (within last 5 minutes).`,
          existingStudents: recentDuplicates,
          suggestion: 'Please verify this is a different student or wait before creating.'
        };
      }
    }

    // Level 4: Pattern-based detection (for overseer students)
    const patternDuplicates = findPatternDuplicates(studentData, existingStudents);
    if (patternDuplicates.length > 0) {
      return {
        isDuplicate: true,
        severity: 'warning',
        message: `Potential duplicate pattern detected for ${studentData.name}.`,
        existingStudents: patternDuplicates,
        suggestion: 'Check if this student already exists in a different format.'
      };
    }

    return {
      isDuplicate: false,
      severity: 'none'
    };

  } catch (error) {
    console.error('Error in duplicate validation:', error);
    return {
      isDuplicate: false,
      severity: 'none'
    };
  }
};

/**
 * Find exact duplicates (same name, class, parent)
 */
const findExactDuplicates = (
  studentData: Partial<Student>,
  existingStudents: Student[]
): Student[] => {
  const { name, class: className, parent } = studentData;
  
  if (!name || !className) return [];

  const parentName = parent?.name || (studentData as any).parentName || '';

  return existingStudents.filter(student => 
    student.name.toLowerCase() === name.toLowerCase() &&
    student.class === className &&
    `${parentName}`.toLowerCase() === `${student.parentName || ''}`.toLowerCase() &&
    student.status !== 'dropped'
  );
};

/**
 * Find similar duplicates (same name, different parent/class)
 */
const findSimilarDuplicates = (
  studentData: Partial<Student>,
  existingStudents: Student[]
): Student[] => {
  const { name } = studentData;
  
  if (!name) return [];

  return existingStudents.filter(student => 
    student.name.toLowerCase() === name.toLowerCase() &&
    student.status !== 'dropped'
  );
};

/**
 * Find recent duplicates (created within last 5 minutes)
 */
const findRecentDuplicates = (
  studentData: Partial<Student>,
  existingStudents: Student[]
): Student[] => {
  const { name, class: className } = studentData;
  
  if (!name || !className) return [];

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  return existingStudents.filter(student => 
    student.name.toLowerCase() === name.toLowerCase() &&
    student.class === className &&
    student.createdAt && 
    new Date(student.createdAt) >= fiveMinutesAgo &&
    student.status !== 'dropped'
  );
};

/**
 * Find pattern duplicates (same name with different access patterns)
 */
const findPatternDuplicates = (
  studentData: Partial<Student>,
  existingStudents: Student[]
): Student[] => {
  const { name } = studentData;
  
  if (!name) return [];

  return existingStudents.filter(student => 
    student.name.toLowerCase() === name.toLowerCase() &&
    student.status !== 'dropped' &&
    (
      student.accessNumber?.startsWith('None-') ||
      student.admissionId?.startsWith('None-') ||
      (student as any).admittedBy === 'overseer'
    )
  );
};

/**
 * Real-time duplicate checking while typing
 */
export const checkDuplicateWhileTyping = (
  fieldName: string,
  value: string,
  existingStudents: Student[]
): DuplicateValidationResult => {
  if (fieldName === 'name' && value.length > 2) {
    const duplicates = existingStudents.filter(student =>
      student.name.toLowerCase().includes(value.toLowerCase()) &&
      student.status !== 'dropped'
    );

    if (duplicates.length > 0) {
      return {
        isDuplicate: true,
        severity: duplicates.length === 1 && duplicates[0].name.toLowerCase() === value.toLowerCase() ? 'error' : 'warning',
        message: `${duplicates.length} student${duplicates.length > 1 ? 's' : ''} with similar names found.`,
        existingStudents: duplicates,
        suggestion: 'Consider using a different name or check existing records.'
      };
    }
  }

  return {
    isDuplicate: false,
    severity: 'none'
  };
};

/**
 * Server-side duplicate check (calls API)
 */
export const serverSideDuplicateCheck = async (
  studentData: Partial<Student>
): Promise<{ hasDuplicates: boolean; duplicates?: any[] }> => {
  try {
    const response = await fetch('http://localhost:5000/api/students/check-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        hasDuplicates: result.hasDuplicates,
        duplicates: result.duplicates
      };
    }

    return { hasDuplicates: false };
  } catch (error) {
    console.error('Error checking duplicates with server:', error);
    return { hasDuplicates: false };
  }
};

/**
 * Format duplicate warning message for UI
 */
export const formatDuplicateMessage = (result: DuplicateValidationResult): string => {
  if (!result.message) return '';
  
  let message = result.message;
  if (result.existingStudents && result.existingStudents.length > 0) {
    message += `\n\nExisting student(s):\n`;
    result.existingStudents.forEach((student, index) => {
      message += `• ${student.name} (${student.accessNumber}, ${student.class})\n`;
    });
  }
  
  if (result.suggestion) {
    message += `\n\nSuggestion: ${result.suggestion}`;
  }
  
  return message;
};

