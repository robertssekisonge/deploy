import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import AIRefreshButton from '../common/AIRefreshButton';
import { BookOpen, Save, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { calculateGrade, calculatePercentage, autoGradeSubjects, DEFAULT_GRADE_SYSTEM } from '../../utils/grading';

interface SubjectMarks {
  subject: string;
  marks: number;
  grade: string;
  comment: string;
}

interface StudentMarks {
  studentId: string;
  studentName: string;
  className: string;
  streamName: string;
  subjects: SubjectMarks[];
  totalMarks: number;
  percentage: number;
  overallGrade: string;
  overallComment: string;
  position: number;
  term: string;
  year: string;
}

const TeacherMarksEntry: React.FC = () => {
  const { students, classes, settings } = useData();
  const { user } = useAuth();
  
  // Debug logging
  console.log('🔍 TeacherMarksEntry: Component mounted');
  console.log('🔍 TeacherMarksEntry: User:', user);
  console.log('🔍 TeacherMarksEntry: Students count:', students.length);
  console.log('🔍 TeacherMarksEntry: Classes count:', classes.length);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [editingMarks, setEditingMarks] = useState<StudentMarks | null>(null);
  const [existingMarksMap, setExistingMarksMap] = useState<{[key: string]: boolean}>({});

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = ['2024', '2025', '2026'];
  const subjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Literature', 'Economics', 'Computer Science'
  ];

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    console.log('🔍 TeacherMarksEntry: Checking assigned classes for user:', user);
    
    if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
      console.log('🔍 TeacherMarksEntry: User is not a teacher, role:', user?.role);
      return false;
    }

    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        console.log('🔍 TeacherMarksEntry: Parsed assignedClasses:', assignedClasses);
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    if (user.assignedStream) {
      console.log('🔍 TeacherMarksEntry: Using assignedStream:', user.assignedStream);
      return true;
    }

    console.log('🔍 TeacherMarksEntry: No assigned classes found');
    return false;
  };

  // Get teacher's assigned classes
  const getAssignedClasses = () => {
    if (!hasAssignedClasses()) return [];

    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        return assignedClasses || [];
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        return [];
      }
    }

    if (user.assignedStream) {
      const [className, streamName] = user.assignedStream.split(' ');
      return [{ className, streamName }];
    }

    return [];
  };

  // Get students for selected class and stream
  const getClassStudents = () => {
    if (!selectedClass || !selectedStream) return [];
    
    return students.filter(student => 
      student.class === selectedClass && 
      student.stream === selectedStream &&
      student.status === 'active'
    );
  };

  // Calculate grade based on marks using the configurable grade system
  const calculateGradeWithSystem = (marks: number): { grade: string; comment: string } => {
    const gradeSystem = settings?.gradeSystem || DEFAULT_GRADE_SYSTEM;
    return calculateGrade(marks, gradeSystem);
  };

  // Calculate overall grade using the configurable grade system
  const calculateOverallGradeWithSystem = (percentage: number): { grade: string; comment: string } => {
    const gradeSystem = settings?.gradeSystem || DEFAULT_GRADE_SYSTEM;
    return calculateGrade(percentage, gradeSystem);
  };

  // Initialize marks for a student
  const initializeStudentMarks = (student: any): StudentMarks => {
    const subjectMarks: SubjectMarks[] = subjects.map(subject => ({
      subject,
      marks: 0,
      grade: 'F',
      comment: 'Failure. Requires intensive support and remedial work.'
    }));

    return {
      studentId: student.id,
      studentName: student.name,
      className: student.class,
      streamName: student.stream,
      subjects: subjectMarks,
      totalMarks: 0,
      percentage: 0,
      overallGrade: 'F',
      overallComment: 'Failure. Requires intensive support and remedial work.',
      position: 1,
      term: selectedTerm,
      year: selectedYear
    };
  };

  // Load existing marks for a student
  const loadExistingMarks = async (student: any): Promise<StudentMarks | null> => {
    try {
      const response = await fetch(`http://localhost:5000/api/academic/student/${student.id}?term=${selectedTerm}&year=${selectedYear}`);
      
      if (response.ok) {
        const records = await response.json();
        const existingRecord = records.find((record: any) => 
          record.term === selectedTerm && record.year === selectedYear
        );
        
        if (existingRecord) {
          // Parse the subjects JSON string back to array
          const existingSubjects = JSON.parse(existingRecord.subjects);
          
          // Map existing subjects to our format, filling in missing ones with 0
          const subjectMarks: SubjectMarks[] = subjects.map(subject => {
            const existing = existingSubjects.find((s: any) => s.subject === subject);
            const marks = existing ? existing.marks : 0;
            const gradeResult = calculateGradeWithSystem(marks);
            return {
              subject,
              marks: marks,
              grade: gradeResult.grade,
              comment: gradeResult.comment
            };
          });
          
          return {
            studentId: student.id,
            studentName: student.name,
            className: student.class,
            streamName: student.stream,
            subjects: subjectMarks,
            totalMarks: existingRecord.totalMarks,
            percentage: existingRecord.percentage,
            overallGrade: existingRecord.overallGrade,
            overallComment: existingRecord.overallComment || calculateOverallGradeWithSystem(existingRecord.percentage).comment,
            position: existingRecord.position,
            term: selectedTerm,
            year: selectedYear
          };
        }
      }
    } catch (error) {
      console.error('Error loading existing marks:', error);
    }
    
    return null;
  };

  // Handle subject marks change with auto-grading
  const handleSubjectMarksChange = (subjectIndex: number, marks: number) => {
    if (!editingMarks) return;

    const newSubjects = [...editingMarks.subjects];
    const gradeResult = calculateGradeWithSystem(marks);
    
    newSubjects[subjectIndex] = {
      ...newSubjects[subjectIndex],
      marks: Math.max(0, Math.min(100, marks)),
      grade: gradeResult.grade,
      comment: gradeResult.comment
    };

    const totalMarks = newSubjects.reduce((sum, subj) => sum + subj.marks, 0);
    const percentage = Math.round((totalMarks / (newSubjects.length * 100)) * 100);
    const overallGradeResult = calculateOverallGradeWithSystem(percentage);

    setEditingMarks({
      ...editingMarks,
      subjects: newSubjects,
      totalMarks,
      percentage,
      overallGrade: overallGradeResult.grade,
      overallComment: overallGradeResult.comment
    });
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!editingMarks) return;

    setIsLoading(true);
    try {
      const marksData = {
        studentId: editingMarks.studentId,
        studentName: editingMarks.studentName,
        className: editingMarks.className,
        streamName: editingMarks.streamName,
        term: editingMarks.term,
        year: editingMarks.year,
        subjects: JSON.stringify(editingMarks.subjects),
        totalMarks: editingMarks.totalMarks,
        percentage: editingMarks.percentage,
        overallGrade: editingMarks.overallGrade,
        overallComment: editingMarks.overallComment,
        position: editingMarks.position,
        teacherId: user?.id?.toString() || '',
        teacherName: user?.name || ''
      };

      const response = await fetch('http://localhost:5000/api/academic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marksData)
      });

      if (response.ok) {
        const savedRecord = await response.json();
        console.log('✅ Marks saved successfully:', savedRecord);
        setMessage({ type: 'success', text: 'Marks saved successfully! Recomputing positions…' });

        // After saving, recompute positions for this class/stream and update student's position
        try {
          const recomputeRes = await fetch('http://localhost:5000/api/academic/recompute-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              className: editingMarks.className,
              streamName: editingMarks.streamName,
              term: editingMarks.term,
              year: editingMarks.year
            })
          });
          if (recomputeRes.ok) {
            const data = await recomputeRes.json();
            const updated = (data.records || []).find((r: any) => r.studentId === editingMarks.studentId);
            if (updated) {
              setEditingMarks({ ...editingMarks, position: updated.position });
              setMessage({ type: 'success', text: `Positions updated. New position: ${updated.position}` });
            } else {
              setMessage({ type: 'success', text: 'Positions updated.' });
            }
          } else {
            setMessage({ type: 'error', text: 'Saved, but failed to recompute positions.' });
          }
        } catch (err) {
          console.error('Error recomputing positions:', err);
          setMessage({ type: 'error', text: 'Saved, but error recomputing positions.' });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save marks');
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving marks:', error);
      setMessage({ type: 'error', text: `Failed to save marks: ${error instanceof Error ? error.message : 'Unknown error'}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing marks for a student
  const startEditingMarks = async (student: any) => {
    setIsLoading(true);
    try {
      // Try to load existing marks first
      const existingMarks = await loadExistingMarks(student);
      
      if (existingMarks) {
        // Use existing marks
        setEditingMarks(existingMarks);
        setMessage({ type: 'success', text: `Loaded existing marks for ${selectedTerm} ${selectedYear}. You can now edit them.` });
      } else {
        // Initialize new marks
        setEditingMarks(initializeStudentMarks(student));
        setMessage({ type: 'info', text: `No existing marks found for ${selectedTerm} ${selectedYear}. Entering new marks.` });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error starting marks editing:', error);
      // Fallback to new marks if loading fails
      setEditingMarks(initializeStudentMarks(student));
      setMessage({ type: 'error', text: 'Failed to load existing marks. Starting with new marks.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      console.log('🔍 TeacherMarksEntry: Teacher has no assigned classes, showing restricted view');
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assigned Classes</h2>
                <p className="text-gray-600 mb-4">
                  You don't have any classes assigned to you yet. Please contact an administrator to get assigned to classes.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // If not a teacher, show restricted view
  if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600">
                Only teachers can access the marks entry system.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assignedClasses = getAssignedClasses();
  const classStudents = getClassStudents();

  // Check for existing marks when filters change
  useEffect(() => {
    if (selectedClass && selectedStream && selectedTerm && selectedYear) {
      checkExistingMarks();
    }
  }, [selectedClass, selectedStream, selectedTerm, selectedYear]);

  const checkExistingMarks = async () => {
    if (!classStudents.length) return;
    
    const marksMap: {[key: string]: boolean} = {};
    
    for (const student of classStudents) {
      try {
        const response = await fetch(`http://localhost:5000/api/academic/student/${student.id}?term=${selectedTerm}&year=${selectedYear}`);
        if (response.ok) {
          const records = await response.json();
          const hasMarks = records.some((record: any) => 
            record.term === selectedTerm && record.year === selectedYear
          );
          marksMap[student.id] = hasMarks;
        }
      } catch (error) {
        console.error('Error checking marks for student:', student.id, error);
        marksMap[student.id] = false;
      }
    }
    
    setExistingMarksMap(marksMap);
  };

  console.log('🔍 TeacherMarksEntry: Rendering main component');
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter & Edit Student Marks</h1>
          <p className="text-gray-600">Enter new marks or edit existing ones for your assigned classes. Grades are calculated automatically.</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select Class</option>
                {assignedClasses.map((cls: any, index: number) => (
                  <option key={index} value={cls.className}>{cls.className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stream</label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={!selectedClass}
              >
                <option value="">Select Stream</option>
                {selectedClass && assignedClasses
                  .filter((cls: any) => cls.className === selectedClass)
                  .map((cls: any, index: number) => (
                    <option key={index} value={cls.streamName}>{cls.streamName}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

                 {/* Students List */}
         {selectedClass && selectedStream && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold text-gray-900">
                 Students in {selectedClass} {selectedStream}
               </h2>
               <div className="flex items-center space-x-3">
                 <div className="text-sm text-gray-600">
                   {Object.values(existingMarksMap).filter(Boolean).length} of {classStudents.length} students have marks for {selectedTerm} {selectedYear}
                 </div>
                 <AIRefreshButton
                   onClick={checkExistingMarks}
                   variant="data"
                   size="sm"
                   title="Refresh marks status"
                 />
               </div>
             </div>
            
            {classStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No students found in this class and stream.</p>
            ) : (
              <div className="space-y-4">
                {classStudents.map(student => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                                         <div className="flex items-center justify-between mb-4">
                       <div>
                         <div className="flex items-center space-x-2">
                           <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                           {existingMarksMap[student.id] && (
                             <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                               📊 Has Marks
                             </span>
                           )}
                         </div>
                         <p className="text-sm text-gray-600">Access Number: {student.accessNumber}</p>
                       </div>
                       <button
                         onClick={() => startEditingMarks(student)}
                         className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                           existingMarksMap[student.id]
                             ? 'bg-green-600 text-white hover:bg-green-700'
                             : 'bg-purple-600 text-white hover:bg-purple-700'
                         }`}
                       >
                         <Edit className="h-4 w-4" />
                         <span>{existingMarksMap[student.id] ? 'Edit Marks' : 'Enter Marks'}</span>
                       </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Marks Modal */}
        {editingMarks && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingMarks.totalMarks > 0 ? 'Edit' : 'Enter'} Marks - {editingMarks.studentName}
                  </h2>
                  {editingMarks.totalMarks > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      📝 Editing existing marks for {editingMarks.term} {editingMarks.year}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditingMarks(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-semibold">{editingMarks.className} {editingMarks.streamName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Term</p>
                    <p className="font-semibold">{editingMarks.term} {editingMarks.year}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="font-semibold text-blue-600">{editingMarks.totalMarks}</p>
                  </div>
                </div>
              </div>

              {/* Subject Marks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Marks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingMarks.subjects.map((subject, index) => (
                    <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {subject.subject}
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                            subject.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                            subject.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            subject.grade === 'C+' ? 'bg-yellow-100 text-yellow-800' :
                            subject.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            subject.grade === 'D+' ? 'bg-orange-100 text-orange-800' :
                            subject.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {subject.grade}
                          </span>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subject.marks}
                        onChange={(e) => handleSubjectMarksChange(index, parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                        placeholder="Enter marks (0-100)"
                      />
                      <p className="text-xs text-gray-600 italic">{subject.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">Total Marks</p>
                    <p className="text-xl font-bold text-blue-800">{editingMarks.totalMarks}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600">Percentage</p>
                    <p className="text-xl font-bold text-green-800">{editingMarks.percentage}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600">Overall Grade</p>
                    <p className="text-xl font-bold text-purple-800">{editingMarks.overallGrade}</p>
                    <p className="text-xs text-purple-600 italic mt-1">{editingMarks.overallComment}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-600">Position (auto)</p>
                    <div className="w-full border border-yellow-200 bg-white rounded-lg px-2 py-1 text-center font-bold text-yellow-800">
                      {editingMarks.position || '-'}
                    </div>
                    <p className="text-[10px] text-yellow-700 mt-1">Computed after saving for the whole class.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingMarks(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMarks}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Marks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMarksEntry;
