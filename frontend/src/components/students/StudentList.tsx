import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Search, Plus, Edit, Trash2, RefreshCw, CheckCircle, User, X, Phone, Mail, Building, FileText, Lock } from 'lucide-react';
import StudentForm from './StudentForm';
import AdmissionLetter from './AdmissionLetter';
import DuplicateDetection from './DuplicateDetection';

const API_BASE_URL = '/api';

const FLAG_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'expelled', label: 'Expelled' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'other', label: 'Other' },
];

const CLASS_COLORS = [
  'bg-blue-500', // Senior 1
  'bg-green-500', // Senior 2
  'bg-yellow-500', // Senior 3
  'bg-purple-500', // Senior 4
  'bg-pink-500', // Senior 5
  'bg-indigo-500', // Senior 6
];

const StudentList: React.FC = () => {
  const { students, deleteStudent, deleteStudentsByClassStream, flagStudent, droppedAccessNumbers, classes, addStudent, clearAllStudents, clearDroppedAccessNumbers, clinicRecords, forceRefresh } = useData();
  const { user } = useAuth();
  const { showSuccess, showError, showData, showSystem } = useNotification();
  
  // Check if user can see sponsorship status
  const canSeeSponsorshipStatus = (userRole: string) => {
    return ['ADMIN', 'SUPERUSER', 'SPONSORSHIPS_OVERSEER', 'sponsorships-overseer', 'SPONSORSHIP-OVERSEER', 'SPONSORSHIPS-OVERSEER', 'SECRETARY'].includes(userRole);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [reAdmitStudent, setReAdmitStudent] = useState<any | null>(null); // for unflag/re-admit
  const [showDroppedNumbers, setShowDroppedNumbers] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{id: string, name: string, mode?: 'flag' | 'permanent'} | null>(null);
  const [flagReason, setFlagReason] = useState<'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted' | 'other'>('left');
  const [flagComment, setFlagComment] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteByClassStream, setShowDeleteByClassStream] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'all' | 'class' | 'classStream'>('all');
  const [deleteClass, setDeleteClass] = useState('');
  const [deleteStream, setDeleteStream] = useState('');
  const [showAdmitFromOverseer, setShowAdmitFromOverseer] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState(null as null | typeof students[0]);
  const [showAdmissionLetter, setShowAdmissionLetter] = useState(false);
  const [createdStudent, setCreatedStudent] = useState(null as null | typeof students[0]);
  const [showConductNoteModal, setShowConductNoteModal] = useState(false);
  const [conductNoteDraft, setConductNoteDraft] = useState('');
  const [conductNoteType, setConductNoteType] = useState<'positive' | 'negative' | 'neutral' | 'achievement' | 'behavior'>('neutral');
  const [conductNoteEditIndex, setConductNoteEditIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Handle loading state
  React.useEffect(() => {
    // Set loading to false when students data is loaded (even if empty)
    console.log('🔍 StudentList Loading Debug:', { students, studentsLength: students?.length, isLoading });
    if (students !== undefined) {
      setIsLoading(false);
    }
  }, [students]);

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
      return true; // Admin and other roles can see everything
    }

    // Check for new assignedClasses structure
    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    // Fallback to old assignedStream logic
    if (user.assignedStream) {
      return true;
    }

    return false;
  };

  // Only show active students in main list
  const activeStudents = (students || []).filter(s => s.status === 'active');
  const flaggedStudents = (students || []).filter(s => s.status !== 'active');

  // Determine teacher's assigned stream or classes
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER';
  let teacherAssignedStreams: string[] = [];
  let teacherAssignedClasses: string[] = [];
  if (isTeacher && user?.assignedStream) {
    teacherAssignedStreams = [user.assignedStream];
  } else if (isTeacher && Array.isArray(user?.assignedStreams) && user.assignedStreams.length > 0) {
    if (Array.isArray(user.assignedStreams) && user.assignedStreams.length > 0 && user.assignedStreams.every((s: any) => typeof s === 'string')) {
      teacherAssignedStreams = user.assignedStreams as unknown as string[];
    } else if (Array.isArray(user.assignedStreams) && user.assignedStreams.length > 0 && user.assignedStreams.every((s: any) => typeof s === 'object' && s !== null && 'name' in s)) {
      teacherAssignedStreams = (user.assignedStreams as any[]).map((s: any) => s.name);
    } else {
      teacherAssignedStreams = [];
    }
  }
  if (isTeacher && Array.isArray(user?.assignedClasses) && user.assignedClasses.length > 0) {
    if (Array.isArray(user.assignedClasses) && user.assignedClasses.length > 0 && user.assignedClasses.every((c: any) => typeof c === 'string')) {
      teacherAssignedClasses = user.assignedClasses as unknown as string[];
    } else if (Array.isArray(user.assignedClasses) && user.assignedClasses.length > 0 && user.assignedClasses.every((c: any) => typeof c === 'object' && c !== null && 'name' in c)) {
      teacherAssignedClasses = (user.assignedClasses as any[]).map((c: any) => c.name);
    } else {
      teacherAssignedClasses = [];
    }
  }

  // Add state for selected stream within class
  const [selectedClassBox, setSelectedClassBox] = useState<string | null>(null);
  const [selectedStreamBox, setSelectedStreamBox] = useState<string | null>(null);

  // Find streams for the selected class
  const selectedClassObj = (classes as any[]).find((cls: any) => cls.name === selectedClassBox);
  const streamsForSelectedClass = selectedClassObj ? (selectedClassObj.streams as any[]) : [];

  // Filter students by selected class and stream
  let filteredStudents = activeStudents; // Only show active students in main list
  
  // Debug logging
  console.log('🔍 StudentList Debug:', {
    totalStudents: students?.length || 0,
    activeStudents: activeStudents.length,
    selectedClassBox,
    selectedStreamBox,
    filteredStudents: filteredStudents.length
  });
  
  // For teachers, only show students from their assigned classes
  if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    let assignedClasses = [];
    if (user.assignedClasses) {
      try {
        assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        assignedClasses = [];
      }
    }

    // If teacher has no assigned classes, show restricted view
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          </div>
            
          {/* Restricted Access Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Access Restricted</h2>
            <p className="text-yellow-700 mb-4">
              You haven't been assigned to any classes or streams yet. Please contact an administrator to get assigned.
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>What you need:</strong> Class and stream assignments to access student management.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Filter students by BOTH class AND stream from assignments
    filteredStudents = filteredStudents.filter(student => {
      return assignedClasses.some((assignment: any) => {
        // Check if student matches both class and stream from assignment
        return assignment.className === student.class && assignment.streamName === student.stream;
      });
    });
  }
  
  // For non-overseer users, exclude students admitted by overseer
  // Overseer-admitted students should only appear in overseer account and sponsorship flow
  if (user?.role !== 'SPONSORSHIPS_OVERSEER' && user?.role !== 'sponsorships-overseer' && user?.role !== 'SPONSORSHIP-OVERSEER') {
    filteredStudents = filteredStudents.filter(student => 
      student.admittedBy !== 'overseer'
    );
  }
  
  if (selectedClassBox) {
    filteredStudents = filteredStudents.filter(s => s.class === selectedClassBox);
  }
  if (selectedStreamBox) {
    filteredStudents = filteredStudents.filter(s => s.stream === selectedStreamBox);
  }
  // Add search filtering
  if (search) {
    filteredStudents = filteredStudents.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.accessNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.nin?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filter classes based on teacher's assigned classes
  const getFilteredClasses = () => {
    if (!user) return allClasses;
    
    // If user is admin or superuser, show all classes
    if (user.role === 'ADMIN' || user.role === 'SUPERUSER') {
      return allClasses;
    }
    
    // For teachers, only show their assigned classes
    if (user.role === 'TEACHER' || user.role === 'SUPER_TEACHER') {
      let assignedClasses = [];
      if (user.assignedClasses) {
        try {
          assignedClasses = typeof user.assignedClasses === 'string' 
            ? JSON.parse(user.assignedClasses) 
            : user.assignedClasses;
        } catch (error) {
          console.error('Error parsing assignedClasses:', error);
          assignedClasses = [];
        }
      }
      
      // Extract class names from assigned classes
      const assignedClassNames = assignedClasses.map((assignment: any) => assignment.className).filter(Boolean);
      
      return allClasses.filter((className: string) => assignedClassNames.includes(className));
    }
    
    return allClasses;
  };

  const allClasses = [
    'Senior 1',
    'Senior 2',
    'Senior 3',
    'Senior 4',
    'Senior 5',
    'Senior 6',
  ];

  // Filter classes based on user role and assigned classes
  const uniqueClasses = getFilteredClasses();

  // Class selector logic
  const filteredActiveStudents = activeStudents.filter(s => !selectedClassBox || s.class === selectedClassBox);
  const filteredFlaggedStudents = flaggedStudents.filter(s => !selectedClassBox || s.class === selectedClassBox);

  // Get students from Box 7 (Overseer Admitted Sponsored Children)
  const overseerAdmittedStudents = students.filter(s => 
    s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'overseer'
  );

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ id, name });
    setFlagReason('left' as 'left');
    setFlagComment('');
  };

  const confirmDelete = async () => {
    if (deleteModal) {
      if (deleteModal.mode === 'permanent') {
        // Permanent deletion
        try {
          await deleteStudent(deleteModal.id);
          showSystem('Student Deleted!', `Student ${deleteModal.name} has been permanently deleted from the database.`);
        } catch (error) {
          console.error('Error deleting student:', error);
          showError('Delete Failed', 'Failed to delete student. Please try again.');
        }
      } else {
        // Flagging (original behavior)
        try {
          const status = flagReason === 'other' ? 'left' : flagReason;
          await flagStudent(deleteModal.id, status, flagReason === 'other' ? flagComment : undefined);
          showData('Student Flagged!', `Student ${deleteModal.name} has been flagged as ${status}.`);
        } catch (error) {
          console.error('Error flagging student:', error);
          showError('Flag Failed', 'Failed to flag student. Please try again.');
        }
      }
      setDeleteModal(null);
    }
  };

  // Group dropped access numbers by class/stream pattern
  const groupedDroppedNumbers = droppedAccessNumbers.reduce((acc, number) => {
    const pattern = number.slice(0, -3); // Remove the 3-digit number
    if (!acc[pattern]) {
      acc[pattern] = [];
    }
    acc[pattern].push(number);
    return acc;
  }, {} as Record<string, string[]>);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      await forceRefresh();
      setRefreshMessage('Students list refreshed successfully!');
      console.log('✅ Manual refresh completed');
      // Clear the message after 3 seconds
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (error) {
      setRefreshMessage('Failed to refresh students list');
      console.error('❌ Error during manual refresh:', error);
      // Clear the error message after 3 seconds
      setTimeout(() => setRefreshMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to handle re-admit submit
  const handleReAdmitSubmit = async (studentData: any) => {
    try {
      // If a dropped access number was chosen, remove it from dropped list
      if (studentData.wasDroppedNumberChosen && studentData.accessNumber) {
        // Remove the access number from dropped list
        await fetch(`${API_BASE_URL}/students/dropped-access-numbers/${studentData.accessNumber}`, {
          method: 'DELETE'
        });
        console.log(`✅ Removed ${studentData.accessNumber} from dropped list (now in use)`);
      }
      
      // Add as new student and wait for it to complete
      const newStudent = await addStudent(studentData);
      
      // Mark the flagged student as re-admitted with reference to new details
      if (reAdmitStudent) {
        const referenceComment = `Re-admitted with new Access: ${newStudent.accessNumber}, Admission ID: ${newStudent.admissionId}`;
        await flagStudent(reAdmitStudent.id, 're-admitted', referenceComment);
      }
      
      // Show success notification
      showSuccess('Student Re-admitted!', `Student ${studentData.name} has been successfully re-admitted to ${studentData.class} ${studentData.stream}.`);
      
      // Close the re-admit modal
      setReAdmitStudent(null);
      
      // Force refresh the students list to ensure the new student appears
      await forceRefresh();
      
    } catch (error) {
      console.error('Error in re-admission process:', error);
      showError('Re-admission Failed', 'Failed to re-admit student. Please try again.');
    }
  };

  let visibleStudents = students;
  if (user?.role === 'SPONSOR') {
    visibleStudents = students.filter(s => s.sponsorship?.sponsorId === user.id);
  }

  // Show loading screen while students are being fetched
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Selector Grid */}
      {user?.role !== 'SPONSOR' && (
        <>
          {/* Notice for teachers without assigned classes */}
          {(user?.role === 'USER' || user?.role === 'SUPER_TEACHER') && getFilteredClasses().length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ No Assigned Classes</h3>
              <p className="text-yellow-700 text-sm">
                You don't have any assigned classes yet. Please contact an administrator to assign classes to your account.
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-8 justify-center mb-6">
            {getFilteredClasses().map((className: string, idx: number) => (
            <button
              key={className}
              className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-xl shadow-lg text-white font-bold text-lg transition-all duration-200 border-4 overflow-visible ${CLASS_COLORS[idx % CLASS_COLORS.length]} ${selectedClassBox === className ? 'border-black scale-105 animate-heartbeat' : 'border-transparent hover:scale-105'}`}
              onClick={() => {
                if (selectedClassBox === className) {
                  setSelectedClassBox(null);
                  setSelectedStreamBox(null);
                } else {
                  setSelectedClassBox(className);
                  setSelectedStreamBox(null);
                }
              }}
              style={{ zIndex: 1 }}
            >
              {/* Radiating frequency effect */}
              {selectedClassBox === className && (
                <span className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                  <span className="frequency-wave"></span>
                </span>
              )}
              {/* Navy snake animation */}
              {selectedClassBox === className && (
                <div className="navy-snake">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 5,5 L 95,5 L 95,95 L 5,95 Z" />
                  </svg>
                </div>
              )}
              <span className="z-10">{className.replace('Senior ', 'S')}</span>
              <span className="text-xs mt-1 z-10">{className}</span>
            </button>
          ))}
        </div>
        </>
      )}
      {/* Stream Selector Dropdown */}
      {selectedClassBox && streamsForSelectedClass.length > 0 && (
        <div className="flex justify-center mb-4">
          <select
            className="border rounded px-3 py-2 text-base"
            value={selectedStreamBox || ''}
            onChange={e => setSelectedStreamBox(e.target.value || null)}
          >
            <option value="">All Streams</option>
            {streamsForSelectedClass.map((stream: any) => (
              <option key={stream.id} value={stream.name}>{stream.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          {refreshMessage && (
            <div className={`text-sm mt-1 ${
              refreshMessage.includes('successfully') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {refreshMessage}
            </div>
          )}
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                isRefreshing 
                  ? 'bg-blue-500 text-white cursor-not-allowed shadow-lg' 
                  : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md'
              }`}
              aria-label="Refresh students list"
              title="Refresh students list"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowDroppedNumbers(!showDroppedNumbers)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              aria-label="Show dropped access numbers. Tap to view all access numbers that have been dropped and can be reassigned."
              title="Show dropped access numbers. Tap to view all access numbers that have been dropped and can be reassigned."
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Dropped ({droppedAccessNumbers.length})</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
              aria-label="Add a new student. Tap to open the add student form."
              title="Add a new student. Tap to open the add student form."
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Admit Student</span>
            </button>
            <button
              onClick={() => setShowFlagged(f => !f)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 ${showFlagged ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-pink-100'}`}
              aria-label="Show flagged students. Tap to toggle the list of students who have been flagged (left, transferred, expelled, etc.)."
              title="Show flagged students. Tap to toggle the list of students who have been flagged (left, transferred, expelled, etc.)."
            >
              <span className="text-sm">Flagged</span>
            </button>
            <button
              onClick={() => setShowAdmitFromOverseer(true)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              aria-label="Admit sponsored children from overseer. Tap to admit students who have sponsors but are not yet in the school system."
              title="Admit sponsored children from overseer. Tap to admit students who have sponsors but are not yet in the school system."
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Admit from Overseer</span>
            </button>
            <button
              onClick={() => setShowDeleteByClassStream(true)}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
              aria-label="Delete students by class or stream. Tap to open the delete by class/stream dialog."
              title="Delete students by class or stream. Tap to open the delete by class/stream dialog."
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Delete by Class</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirm Clear All Students Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4 text-red-700">Confirm Clear All Students</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to remove <b>all students</b> from the system? This cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowClearConfirm(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => { 
                  clearAllStudents(); 
                  setShowClearConfirm(false);
                  showSystem('All Students Cleared!', 'All students have been removed from the system.');
                }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Dropped Access Numbers Panel/Modal */}
      {showDroppedNumbers && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-blue-700">Dropped Access Numbers ({droppedAccessNumbers.length})</h3>
          </div>
          {droppedAccessNumbers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No dropped access numbers yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {droppedAccessNumbers.map(num => (
                <div key={num} className="bg-blue-50 border border-blue-200 rounded p-2 text-center font-mono text-blue-800">
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flagged Students Panel */}
      {showFlagged && (
        <div className="bg-white rounded-xl shadow-sm border border-pink-200 p-6">
          <h3 className="text-lg font-semibold text-pink-700 mb-4">Flagged Students</h3>
          {filteredFlaggedStudents.length === 0 ? (
            <p className="text-gray-500">No flagged students.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFlaggedStudents.filter(student => student && student.name).map(student => (
                <div key={student.id} className="bg-pink-50 rounded-xl shadow border border-pink-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-pink-800">{student.name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-pink-200 text-pink-900">{student.status}</span>
          </div>
                  <div className="text-xs text-gray-700">
                    <div><b>Access:</b> {student.accessNumber}</div>
                    <div><b>Admission ID:</b> {student.admissionId}</div>
                    <div><b>NIN:</b> {student.nin}</div>
                    <div><b>Class:</b> {student.class} - {student.stream}</div>
                    <div><b>Age:</b> {student.age}</div>
                    <div><b>Parent:</b> {student.parent?.name || 'N/A'} ({student.parent?.phone || 'N/A'})</div>
                    <div><b>Flagged on:</b> {student.updatedAt?.toLocaleString?.() || ''}</div>
                    {student.flagComment && (
                      <div className={`mt-2 ${student.status === 're-admitted' ? 'text-green-800 bg-green-50 p-2 rounded' : 'text-pink-800'}`}>
                        <b>{student.status === 're-admitted' ? 'Reference:' : 'Comment:'}</b> {student.flagComment}
                      </div>
                    )}
                    <div className="mt-2 italic text-gray-500">
                      {student.status === 're-admitted' 
                        ? '(This student was re-admitted with new details. Original record kept for reference.)'
                        : '(This student was flagged and is no longer active. Details are for reference only.)'
                      }
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                      onClick={() => setDeleteModal({id: student.id, name: student.name, mode: 'permanent'})}
                      aria-label="Permanently delete this student from the database"
                      title="Permanently delete this student from the database"
                    >
                      Delete Permanently
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-xs ${student.status === 're-admitted' ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      onClick={() => student.status !== 're-admitted' && setReAdmitStudent(student)}
                      disabled={student.status === 're-admitted'}
                      aria-label="Unflag and re-admit student. Tap to re-admit this flagged student as active."
                      title="Unflag and re-admit student. Tap to re-admit this flagged student as active."
                    >
                      {student.status === 're-admitted' ? 'Re-admitted' : 'Unflag & Re-admit'}
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Re-admit flagged student as new */}
      {reAdmitStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Re-admit Student</h2>
              <button
                onClick={() => setReAdmitStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >×</button>
            </div>
            <StudentForm
              onClose={() => setReAdmitStudent(null)}
              initialData={{
                ...reAdmitStudent,
                accessNumber: '',
                admissionId: '',
                wasDroppedNumberChosen: false,
                status: undefined,
                flagComment: undefined,
                isReAdmission: true, // Flag this as a re-admission
                originalAccessNumber: reAdmitStudent.accessNumber, // Keep reference to original access number
              }}
              onSubmit={handleReAdmitSubmit}
            />
          </div>
        </div>
      )}

      {/* Search input for admin */}
      {user?.role === 'ADMIN' && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by access number or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(e.currentTarget.value); }}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by access number, name, or NIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(e.currentTarget.value); }}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          {/* Class dropdown is now replaced by the colored class selector above */}
          {/* Stream dropdown, only show if a class is selected via class selector */}
          {selectedClassBox && (() => {
            const selectedClassObj = (classes as any[]).find((cls: any) => cls.name === selectedClassBox);
            const streamsForSelectedClass = selectedClassObj ? (selectedClassObj.streams as any[]) : [];
            return (
              <select
                value={selectedStreamBox || ''}
                onChange={e => setSelectedStreamBox(e.target.value || null)}
                className="rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">All Streams</option>
                {streamsForSelectedClass.map((stream: any) => (
                  <option key={stream.id} value={stream.name}>{stream.name}</option>
                ))}
              </select>
            );
          })()}
        </div>
      </div>

      {/* Duplicate Detection */}
      {!showFlagged && (user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
        <DuplicateDetection students={students || []} />
      )}

      {/* Students Grid */}
      {!showFlagged && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.filter(student => student && student.name).map((student) => (
              (user && user.role === 'SPONSOR') ? (
                <div key={student.id} className="relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-green-50">
                  {/* Green tick circle */}
                  <div className="absolute top-3 right-3 z-10">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  {student.familyPhoto && (
                    <img
                      src={student.familyPhoto}
                      alt={`${student.name}'s family`}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <span className="text-sm text-gray-500">Age {student.age}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{student.class} - {student.stream}</p>
                    <p className="text-sm text-gray-600 mb-2">NIN: {student.nin}</p>
                    <button
                      className="text-purple-600 text-xs underline hover:text-purple-800 mb-2"
                      onClick={() => setDetailsStudent(student)}
                    >
                      Details
                    </button>
                    {student.sponsorshipStory && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {student.sponsorshipStory.length > 120
                            ? `${student.sponsorshipStory.substring(0, 120)}...`
                            : student.sponsorshipStory
                          }
                        </p>
                      </div>
                    )}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Sponsored
                    </span>
                  </div>
                </div>
              ) : (
                <React.Fragment key={student.id}>
                  <div className="rounded-lg shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden max-w-sm mx-auto cursor-pointer" onClick={() => setDetailsStudent(student)}>
                    {/* Purple/Pink Gradient Header */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 p-3 relative">
                      <div className="flex items-center justify-center mb-1">
                        {student.passportPhoto ? (
                          <img src={student.photo} alt={student.name} className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg" />
                        ) : (
                          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* AI Decorative Elements */}
                      <div className="absolute top-1 right-1 flex items-center space-x-1">
                        <span className="text-pink-200 text-xs">✨</span>
                        <span className="text-yellow-200 text-xs">😊</span>
                        <span className="text-pink-200 text-xs">✨</span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-1 left-1">
                        <div className="px-1 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center space-x-1 shadow-sm">
                          <span className="text-xs">⚡</span>
                          <span className="text-xs font-semibold text-yellow-900">Active</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-900 leading-tight break-words pr-2 flex-1">{student.name}</h3>
                        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
                          <div className="flex space-x-1 flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingStudent(student.id); }}
                              className="p-1 text-gray-400 hover:text-purple-600 transition-colors rounded-full hover:bg-purple-50"
                              aria-label="Edit student. Tap to edit this student's details."
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(student.id, student.name); }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                              aria-label="Delete or flag student. Tap to flag this student as left, transferred, expelled, etc."
                              title="Delete or flag student. Tap to flag this student as left, transferred, expelled, etc."
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* AI-Styled Student Details */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-purple-100 to-pink-100 rounded-md p-1.5 border border-purple-200">
                          <span className="font-semibold text-purple-600 mr-1 text-xs">📚</span>
                          <span className="font-medium text-xs">Class:</span>
                          <span className="ml-1 text-gray-700 text-xs">{student.class} - {student.stream}</span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-md p-1.5 border border-blue-200">
                          <span className="font-semibold text-blue-600 mr-1 text-xs">🔑</span>
                          <span className="font-medium text-xs">Access:</span>
                          <span className="ml-1 text-gray-700 font-mono text-xs">{student.accessNumber}</span>
                        </div>
                        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
                          <div className="flex items-center text-gray-600 bg-gradient-to-r from-green-100 to-emerald-100 rounded-md p-1.5 border border-green-200">
                            <span className="font-semibold text-green-600 mr-1 text-xs">🆔</span>
                            <span className="font-medium text-xs">Admission ID:</span>
                            <span className="ml-1 text-gray-700 font-mono text-xs">{student.admissionId}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-md p-1.5 border border-orange-200">
                          <span className="font-semibold text-orange-600 mr-1 text-xs">🎂</span>
                          <span className="font-medium text-xs">Age:</span>
                          <span className="ml-1 text-gray-700 text-xs">{student.age} years</span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-pink-100 to-rose-100 rounded-md p-1.5 border border-pink-200">
                          <span className="font-semibold text-pink-600 mr-1 text-xs">👨‍👩‍👧‍👦</span>
                          <span className="font-medium text-xs">Parent:</span>
                          <span className="ml-1 text-gray-700 text-xs">{student.parent?.name || 'N/A'}</span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </React.Fragment>
              )
            ))}
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-xl mb-4">No students found</div>
              <div className="text-gray-500 text-sm mb-6">
                {user?.role === 'ADMIN' ? 
                  'Click "Admit Student" to create your first student record.' :
                  'No students are currently assigned to your classes.'
                }
              </div>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Student</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 max-w-xl w-full max-h-[90vh] overflow-hidden">
            {/* AI-Inspired Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 p-3 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Add New Student</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-7 h-7 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Compact Form Content */}
            <div className="p-4 max-h-[calc(90vh-100px)] overflow-y-auto">
              <StudentForm onClose={() => {
                setShowForm(false);
                // The student list will automatically refresh due to DataContext updates
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 max-w-xl w-full max-h-[90vh] overflow-hidden">
            {/* AI-Inspired Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 p-3 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Update Student</h2>
                </div>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="w-7 h-7 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Compact Form Content */}
            <div className="p-4 max-h-[calc(90vh-100px)] overflow-y-auto">
              <StudentForm 
                studentId={editingStudent} 
                onClose={() => setEditingStudent(null)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete/Flag Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            {deleteModal.mode === 'permanent' ? (
              <>
                <h2 className="text-lg font-bold mb-4 text-red-700">Permanently Delete Student</h2>
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                  <p className="text-red-700 text-sm">
                    Student <strong>{deleteModal.name}</strong> will be permanently removed from the database.
                    All their records, photos, and data will be lost forever.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick={() => setDeleteModal(null)}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={confirmDelete}
                  >Delete Permanently</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-4">Flag Student: {deleteModal.name}</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    className="w-full rounded border-gray-300"
                    value={flagReason}
                    onChange={e => setFlagReason(e.target.value as 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted' | 'other')}
                  >
                    {FLAG_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {flagReason === 'other' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                    <textarea
                      className="w-full rounded border-gray-300"
                      value={flagComment}
                      onChange={e => setFlagComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick={() => setDeleteModal(null)}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={confirmDelete}
                    disabled={flagReason === 'other' && !flagComment.trim()}
                  >Confirm</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admit from Overseer Modal */}
      {showAdmitFromOverseer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Admit Sponsored Children from Overseer</h2>
              <button
                onClick={() => setShowAdmitFromOverseer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                These students have been sponsored through the overseer system and are ready to be admitted to the school.
                Select students to admit them with proper access numbers and enrollment.
              </p>
            </div>

            {overseerAdmittedStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No sponsored students available for admission from overseer.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overseerAdmittedStudents.map(student => (
                  <div key={student.id} className="bg-green-50 rounded-xl shadow border border-green-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-green-800">{student.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-200 text-green-900">Sponsored</span>
                    </div>
                    <div className="text-xs text-gray-700 mb-3">
                      <div><b>Access:</b> {student.accessNumber}</div>
                      <div><b>Class:</b> {student.class} - {student.stream}</div>
                      <div><b>Age:</b> {student.age}</div>
                      <div><b>Parent:</b> {student.parentName || 'N/A'}</div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          // Set the student as editing to open the form with pre-filled data
                          setEditingStudent(student.id);
                          setShowAdmitFromOverseer(false);
                        }}
                        className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"
                        aria-label={`Edit and admit ${student.name} to the school`}
                        title={`Edit and admit ${student.name} to the school`}
                      >
                        Edit & Admit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete by Class/Stream Modal */}
      {showDeleteByClassStream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4 text-red-700">Delete Students</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delete Mode</label>
              <select
                className="w-full rounded border-gray-300 mb-2"
                value={deleteMode}
                onChange={e => {
                  setDeleteMode(e.target.value as 'all' | 'class' | 'classStream');
                  setDeleteClass('');
                  setDeleteStream('');
                }}
              >
                <option value="all">All Students</option>
                <option value="class">By Class</option>
                <option value="classStream">By Class & Stream</option>
              </select>
              {deleteMode !== 'all' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    className="w-full rounded border-gray-300 mb-2"
                    value={deleteClass}
                    onChange={e => { setDeleteClass(e.target.value); setDeleteStream(''); }}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </>
              )}
              {deleteMode === 'classStream' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                  <select
                    className="w-full rounded border-gray-300"
                    value={deleteStream}
                    onChange={e => setDeleteStream(e.target.value)}
                    disabled={!deleteClass}
                  >
                    <option value="">Select Stream</option>
                    {deleteClass && (classes as any[]).find((c: any) => c.name === deleteClass)?.streams.map((stream: any) => (
                      <option key={stream.id} value={stream.name}>{stream.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => { setShowDeleteByClassStream(false); setDeleteClass(''); setDeleteStream(''); setDeleteMode('all'); }}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={
                  (deleteMode === 'class' && !deleteClass) ||
                  (deleteMode === 'classStream' && (!deleteClass || !deleteStream))
                }
                onClick={async () => {
                  try {
                    if (deleteMode === 'all') {
                      await clearAllStudents();
                      showSystem('All Students Deleted!', `All students have been deleted and dropped access numbers cleared.`);
                    } else if (deleteMode === 'class') {
                      const classStudents = students.filter(s => s.class === deleteClass);
                      classStudents.forEach(s => deleteStudent(s.id));
                      showSystem('Class Students Deleted!', `All students from ${deleteClass} have been deleted.`);
                    } else if (deleteMode === 'classStream') {
                      // Use the new endpoint that clears everything including dropped access numbers
                      await deleteStudentsByClassStream(deleteClass, deleteStream);
                      showSystem('Stream Students Deleted!', `All students from ${deleteClass} ${deleteStream} have been deleted.`);
                    }
                    setShowDeleteByClassStream(false);
                    setDeleteClass('');
                    setDeleteStream('');
                    setDeleteMode('all');
                  } catch (error) {
                    console.error('Error deleting students:', error);
                    showError('Delete Failed', 'Failed to delete students. Please try again.');
                  }
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {detailsStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Student Details</h2>
                </div>
              <button
                onClick={() => setDetailsStudent(null)}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </button>
            </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-6">
                  {detailsStudent.photo ? (
                    <div className="relative">
                      <img
                        src={detailsStudent.photo}
                        alt={detailsStudent.name}
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="h-32 w-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-gray-400 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        No Photo
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{detailsStudent.name}</h3>
                    <p className="text-lg text-gray-600 mb-3">Access Number: {detailsStudent.accessNumber}</p>
                    <div className="flex items-center space-x-3">
                      <>
                        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                          {detailsStudent.class} - {detailsStudent.stream}
                        </span>
                        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
                          Age {detailsStudent.age}
                        </span>
                        {canSeeSponsorshipStatus(user?.role || '') && (
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            detailsStudent.sponsorshipStatus === 'sponsored' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                            detailsStudent.sponsorshipStatus === 'awaiting' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                            detailsStudent.sponsorshipStatus === 'pending' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                            detailsStudent.needsSponsorship 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                          }`}>
                            {detailsStudent.sponsorshipStatus === 'sponsored' ? 'Sponsored' :
                             detailsStudent.sponsorshipStatus === 'awaiting' ? 'Awaiting' :
                             detailsStudent.sponsorshipStatus === 'pending' ? 'Pending' :
                             detailsStudent.needsSponsorship ? 'Awaiting' : 'Private'}
                          </span>
                        )}
                      </>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Student Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                      <User className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Name</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Access Number</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.accessNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                      <User className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Admission ID</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.admissionId}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200">
                      <User className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">NIN</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.nin}</div>
                      </div>
                    </div>
                    {detailsStudent.phone && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                        <Phone className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{detailsStudent.phone}</div>
                        </div>
                      </div>
                    )}
                    {detailsStudent.email && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{detailsStudent.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {/* Parent Information */}
                <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl p-6 border border-pink-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
                      <User className="h-5 w-5 text-pink-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Parent Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200">
                      <User className="h-5 w-5 text-pink-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Parent Name</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.parentName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                      <Phone className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Parent Phone</div>
                        <div className="text-sm font-semibold text-gray-900">{detailsStudent.parentPhone || 'N/A'}</div>
                      </div>
                    </div>
                    {detailsStudent.parentEmail && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Parent Email</div>
                          <div className="text-sm font-semibold text-gray-900">{detailsStudent.parentEmail}</div>
                        </div>
                      </div>
                    )}
                    {detailsStudent.parentAddress && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                        <Building className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Parent Address</div>
                          <div className="text-sm font-semibold text-gray-900">{detailsStudent.parentAddress}</div>
                        </div>
                      </div>
                    )}
                    {detailsStudent.parentOccupation && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200">
                        <User className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-sm text-gray-500 font-medium">Parent Occupation</div>
                          <div className="text-sm font-semibold text-gray-900">{detailsStudent.parentOccupation}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sponsorship Status - Only visible to Admin and Sponsorship roles */}
              {(user?.role === 'ADMIN' || user?.role === 'SPONSOR' || user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'SPONSORSHIP_COORDINATOR') && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                      detailsStudent.needsSponsorship 
                        ? 'bg-orange-100' 
                        : 'bg-purple-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        detailsStudent.needsSponsorship 
                          ? 'text-orange-600' 
                          : 'text-purple-600'
                      }`} />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Sponsorship Status</h4>
                  </div>
                  <div className="space-y-3">
                    {canSeeSponsorshipStatus(user?.role || '') && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          detailsStudent.sponsorshipStatus === 'sponsored' ? 'bg-green-100 text-green-800' :
                          detailsStudent.sponsorshipStatus === 'awaiting' ? 'bg-yellow-100 text-yellow-800' :
                          detailsStudent.sponsorshipStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                          detailsStudent.needsSponsorship 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {detailsStudent.sponsorshipStatus || (detailsStudent.needsSponsorship ? 'Awaiting' : 'Private')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student's Picture Section - Only for sponsored students and visible to Admin/Sponsorship roles */}
              {detailsStudent.needsSponsorship && (user?.role === 'ADMIN' || user?.role === 'SPONSOR' || user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'SPONSORSHIP_COORDINATOR') && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Student's Picture</h4>
                  </div>
                  <div className="flex justify-center">
                    {detailsStudent.passportPhoto ? (
                      <div className="relative">
                        <img
                          src={detailsStudent.passportPhoto}
                          alt="Student's Picture"
                          className="h-32 w-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-32 w-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-blue-200 shadow-lg">
                          <User className="h-16 w-16 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gray-400 rounded-full p-1">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                          No Photo
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-sm text-gray-600">
                      {detailsStudent.passportPhoto ? 'Student picture uploaded' : 'No student picture uploaded yet'}
                    </p>
                  </div>
                </div>
              )}

              {/* Family Photo Section - Only for sponsored students and visible to Admin/Sponsorship roles */}
              {detailsStudent.needsSponsorship && (user?.role === 'ADMIN' || user?.role === 'SPONSOR' || user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'SPONSORSHIP_COORDINATOR') && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Family Photo</h4>
                  </div>
                  <div className="space-y-4">
                    {detailsStudent.familyPhoto ? (
                      <div className="flex justify-center">
                        <img 
                          src={detailsStudent.familyPhoto} 
                          alt="Family Photo" 
                          className="max-w-full h-auto rounded-lg border-2 border-green-200 shadow-lg"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-center">No family photo available.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Story Section - Only for sponsored students and visible to Admin/Sponsorship roles */}
              {detailsStudent.needsSponsorship && (user?.role === 'ADMIN' || user?.role === 'SPONSOR' || user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'SPONSORSHIP_COORDINATOR') && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Story</h4>
                  </div>
                  <div className="space-y-4">
                    {detailsStudent.sponsorshipStory ? (
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{detailsStudent.sponsorshipStory}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-center">No story available.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nurse Visit History */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Nurse Visit History</h4>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const studentVisits = clinicRecords.filter(record => 
                      record.studentId === detailsStudent.id || record.accessNumber === detailsStudent.accessNumber
                    );
                    
                    if (studentVisits.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <p>No clinic visits recorded yet.</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {studentVisits.map((visit, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {visit.visitDate.toLocaleDateString()} at {visit.visitTime}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                visit.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                visit.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {visit.status}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div><strong>Diagnosis:</strong> {visit.diagnosis}</div>
                              <div><strong>Symptoms:</strong> {visit.symptoms}</div>
                              {visit.treatment && <div><strong>Treatment:</strong> {visit.treatment}</div>}
                              {visit.medication && <div><strong>Medication:</strong> {visit.medication}</div>}
                              <div><strong>Cost:</strong> UGX {visit.cost.toLocaleString()}</div>
                              <div><strong>Nurse:</strong> {visit.nurseName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* School Conduct Notes */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">School Conduct Notes</h4>
                </div>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>⚠️  IMPORTANT:</strong> Conduct notes are <strong>PERMANENT RECORDS</strong> and cannot be edited or deleted once submitted. Please ensure accuracy before submitting. These notes are visible to parents and help maintain communication between school and home.
                    </p>
                  </div>
                  
                  {/* Conduct Notes Display */}
                  {detailsStudent.conductNotes && detailsStudent.conductNotes.length > 0 ? (
                    <div className="space-y-3">
                      {detailsStudent.conductNotes.map((note: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">
                                {new Date(note.date).toLocaleDateString()}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                note.type === 'positive' ? 'bg-green-100 text-green-800' :
                                note.type === 'negative' ? 'bg-red-100 text-red-800' :
                                note.type === 'achievement' ? 'bg-blue-100 text-blue-800' :
                                note.type === 'behavior' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {note.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{note.author}</span>
                              <span className="text-xs text-gray-400">📝 Permanent Record</span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No conduct notes recorded yet.</p>
                    </div>
                  )}
                  
                  {/* Add New Note Button (Admin/Teacher Only) */}
                  {(user?.role === 'ADMIN' || user?.role === 'SUPERUSER' || user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && (
                    <button
                      onClick={() => {
                        setConductNoteDraft('');
                        setConductNoteEditIndex(null);
                        setShowConductNoteModal(true);
                      }}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Add Conduct Note</span>
                    </button>
            )}
          </div>
              </div>



              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCreatedStudent(detailsStudent);
                    setShowAdmissionLetter(true);
                    setDetailsStudent(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Admission Letter
                </button>
                <button
                  onClick={() => {
                    setEditingStudent(detailsStudent.id);
                    setDetailsStudent(null);
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit Student
                </button>
                <button
                  onClick={() => setDetailsStudent(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conduct Note Modal */}
      {showConductNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Add Conduct Note</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                <strong>⚠️  WARNING:</strong> This note will become a <strong>PERMANENT RECORD</strong> and cannot be edited or deleted once submitted.
              </p>
            </div>
            <textarea
              className="w-full rounded border-gray-300 p-2 mb-4"
              rows={4}
              placeholder="Write your note here..."
              value={conductNoteDraft}
              onChange={e => setConductNoteDraft(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full rounded border-gray-300"
                value={conductNoteType}
                onChange={e => setConductNoteType(e.target.value as any)}
              >
                <option value="neutral">Neutral</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="achievement">Achievement</option>
                <option value="behavior">Behavior</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConductNoteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >Cancel</button>
                              <button
                  onClick={async () => {
                    if (conductNoteDraft.trim()) {
                      try {
                        // Call API to save conduct note
                        const response = await fetch(`/api/students/${(detailsStudent as any).id}/conduct-notes`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            content: conductNoteDraft.trim(),
                            type: conductNoteType,
                            author: user?.name || 'Unknown'
                          })
                        });

                        if (response.ok) {
                          const result = await response.json();
                          
                          // Update local state with the updated student data
                          setDetailsStudent(result.student);
                          
                          // Show success message with permanent storage confirmation
                          alert('✅ Conduct note added successfully!\n\n📝 This note is now PERMANENTLY saved to the database and cannot be edited or deleted.\n\n🔒 Permanent Record: ' + result.note.id);
                          
                          // Reset form
                          setConductNoteDraft('');
                          setShowConductNoteModal(false);
                        } else {
                          const error = await response.json();
                          alert(`❌ Failed to add conduct note: ${error.error}`);
                        }
                      } catch (error) {
                        console.error('Error adding conduct note:', error);
                        alert('Failed to add conduct note. Please try again.');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >Add Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Admission Letter Modal */}
      {showAdmissionLetter && createdStudent && (
        <AdmissionLetter
          student={createdStudent}
          onClose={() => {
            setShowAdmissionLetter(false);
            setCreatedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentList;