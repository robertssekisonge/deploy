import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Calendar, Users, Check, X, Clock, Edit, Save, Lock, Info, RefreshCw, BarChart3, CheckCircle } from 'lucide-react';
import { UGANDAN_HOLIDAYS_2025, formatDateString } from '../../utils/ugandanHolidays';

const API_BASE_URL = '/api';

const AttendanceManagement: React.FC = () => {
  const { students, attendanceRecords, addAttendanceRecord, updateAttendanceRecord, classes, fetchAttendanceRecords, forceRefresh, settings } = useData();
  const { user, refreshCurrentUser } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if attendance marking period is set by admin
  const isAttendancePeriodSet = settings?.attendanceStart && settings?.attendanceEnd;
  
  // Show restriction message for non-admin users if attendance period is not set
  if (!isAttendancePeriodSet && user?.role !== 'ADMIN' && user?.role !== 'SUPERUSER') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        </div>
        
        {/* Attendance Period Not Set Message */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 text-center border border-orange-200">
          <Calendar className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Attendance Marking Not Available</h2>
          <p className="text-orange-700 mb-4 text-lg">
            The attendance marking period has not been set by the administrator yet.
          </p>
          <p className="text-orange-600 mb-6">
            Please contact your administrator to configure the attendance marking dates in System Settings.
          </p>
          
          <div className="bg-orange-100 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-orange-800">
              <strong>Required:</strong> Administrator must set Attendance Start Date and Attendance End Date in System Settings → School Info tab.
            </p>
          </div>
        </div>
      </div>
    );
  }



  // Function to check if a date is a public holiday
  const isPublicHoliday = (date: Date): boolean => {
    const dateString = formatDateString(date);
    return UGANDAN_HOLIDAYS_2025.some(holiday => holiday.date === dateString);
  };

  // Function to get holiday name for a date
  const getHolidayName = (date: Date): string | null => {
    const dateString = formatDateString(date);
    const holiday = UGANDAN_HOLIDAYS_2025.find(holiday => holiday.date === dateString);
    return holiday ? holiday.name : null;
  };

  // Function to automatically mark public holidays for all students
  const markPublicHolidays = async () => {
    const selectedDateObj = new Date(selectedDate);
    
    if (!isPublicHoliday(selectedDateObj)) {
      return; // Not a public holiday, skip
    }

    const holidayName = getHolidayName(selectedDateObj);
    console.log(`🎉 ${selectedDate} is a public holiday: ${holidayName}`);

    // Get all students for the selected class/stream
    const filteredStudents = students.filter(student => {
      const classMatch = !selectedClass || student.class === selectedClass;
      const streamMatch = !selectedStream || student.stream === selectedStream;
      return classMatch && streamMatch;
    });

    console.log(`📝 Auto-marking ${filteredStudents.length} students for public holiday: ${holidayName}`);

    // Mark each student as "holiday" for this public holiday
    for (const student of filteredStudents) {
      // Check if attendance already exists for this student on this date
      const existingRecord = getAttendanceForDate(student.id);
      
      if (!existingRecord) {
        // Only create holiday record if no attendance exists
        const holidayAttendanceData = {
          studentId: student.id.toString(),
          date: selectedDate,
          time: '00:00', // Holiday records don't need specific time
          status: 'holiday' as 'present' | 'absent' | 'late' | 'holiday',
          teacherId: 'system',
          teacherName: 'System (Public Holiday)',
          remarks: `Public Holiday: ${holidayName}`,
          notificationSent: false
        };

        try {
          const response = await fetch(`${API_BASE_URL}/attendance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(holidayAttendanceData),
          });

          if (response.ok) {
            console.log(`✅ Auto-marked ${student.name} for public holiday: ${holidayName}`);
          } else {
            console.error(`❌ Failed to auto-mark ${student.name} for public holiday`);
          }
        } catch (error) {
          console.error(`❌ Error auto-marking ${student.name} for public holiday:`, error);
        }
      } else {
        console.log(`ℹ️ ${student.name} already has attendance record for ${selectedDate}`);
      }
    }

    // Refresh attendance records to show the new holiday records
    await fetchAttendanceRecords(selectedDate);
  };

  // Load existing attendance records from backend
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      if (!user) return;
      
      try {
        await fetchAttendanceRecords(selectedDate);
        
        // Clean up any duplicate records for the selected date
        cleanupDuplicateRecords();
        
        // Auto-mark public holidays for all students
        await markPublicHolidays();
      } catch (error) {
        console.error('Error loading attendance records from backend:', error);
        // Silently fall back to localStorage if backend fails
        console.log('Backend failed, using localStorage fallback silently');
      }
    };

    loadAttendanceRecords();
  }, [selectedDate, user, fetchAttendanceRecords, selectedClass, selectedStream]);

  // Function to clean up duplicate attendance records
  const cleanupDuplicateRecords = () => {
    const todayRecords = attendanceRecords.filter(a => 
      a.date.toDateString() === new Date(selectedDate).toDateString()
    );
    
    // Group records by studentId
    const studentGroups = new Map();
    todayRecords.forEach(record => {
      if (!studentGroups.has(record.studentId)) {
        studentGroups.set(record.studentId, []);
      }
      studentGroups.get(record.studentId).push(record);
    });
    
    // Log any duplicates found
    studentGroups.forEach((records, studentId) => {
      if (records.length > 1) {
        console.log(`Found ${records.length} attendance records for student ${studentId} on ${selectedDate}:`, records);
      }
    });
  };

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPERUSER') {
      return false; // Admin and superuser cannot mark attendance
    }
    
    if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
      return true; // Other roles can see everything
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

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCurrentUser();
      alert('Your account data has been refreshed! If you were recently assigned to classes, you should now see them.');
    } catch (error) {
      console.error('Error refreshing user data:', error);
      alert('Failed to refresh your data. Please try logging out and back in.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter students based on teacher's assigned classes or show all for admin
  const getFilteredStudents = () => {
    let filteredStudents = students;

    if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
      // Parse assigned classes from the new structure
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
      
      // Filter students based on assigned classes - BOTH class AND stream must match
      if (assignedClasses.length > 0) {
        filteredStudents = students.filter(student => 
          assignedClasses.some((assignment: any) => 
            assignment.className === student.class && assignment.streamName === student.stream
          )
        );
      } else {
        // Fallback to old assignedStream logic
        if (user.assignedStream) {
          const [className, streamName] = user.assignedStream.split(' ');
          filteredStudents = students.filter(student => 
            student.class === className && student.stream === streamName
          );
        }
      }
    } else {
      // Admin and superuser can filter by class and stream
      if (selectedClass) {
        filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
      }
      if (selectedStream) {
        filteredStudents = filteredStudents.filter(s => s.stream === selectedStream);
      }
    }

    return filteredStudents;
  };

  const filteredStudents = getFilteredStudents();

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          </div>
          
          {/* Assignment Update Notification */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Assignment Update</h3>
            </div>
            <p className="text-blue-700 mb-4">
              If you were recently assigned to classes by an administrator, you may need to refresh your account data to see the changes.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh My Data'}</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
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
                <strong>What you need:</strong> Class and stream assignments to access attendance management.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show admin message instead of attendance ticking
  if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        </div>

        {/* Admin Setup Required Message */}
        {!isAttendancePeriodSet && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 text-center border border-yellow-200">
            <Calendar className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">Attendance Period Setup Required</h2>
            <p className="text-yellow-700 mb-4 text-lg">
              You need to set the attendance marking period before teachers can mark attendance.
            </p>
            <p className="text-yellow-600 mb-6">
              Go to <strong>System Settings → School Info</strong> and set the Attendance Start Date and Attendance End Date.
            </p>
            
            <div className="bg-yellow-100 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Action Required:</strong> Set attendance marking dates to enable teacher access to attendance management.
              </p>
            </div>
          </div>
        )}

        {/* Admin Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center border border-blue-200">
          <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Administrator Access</h2>
          <p className="text-blue-700 mb-4 text-lg">
            As an administrator, you have access to comprehensive attendance analytics and reporting.
          </p>
          <p className="text-blue-600 mb-6">
            Teachers mark individual student attendance, while you analyze patterns, trends, and generate reports.
          </p>
          
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What You Can Do:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">View attendance analytics and trends</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Generate comprehensive reports</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Monitor class and stream performance</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Export attendance data</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-blue-600 font-medium">
              Navigate to your dashboard to access the Attendance Analysis section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late', remarks?: string) => {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Find the student to get their details
      const student = students.find(s => s.id === studentId);
      if (!student) {
        showError('Student Not Found', 'Student not found');
        return;
      }

      const attendanceData = {
        studentId: studentId.toString(),
        date: selectedDate,
        time: currentTime,
        status,
        teacherId: user?.id?.toString() || '1',
        teacherName: user?.name || 'Unknown Teacher',
        remarks,
        notificationSent: true // Always set to true since we're sending notifications
      };

      console.log('Marking attendance for:', student.name, 'Status:', status);
      
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Attendance marked successfully:', result);
        
        // Immediately append the new record locally to reflect in the UI before refresh
        try {
          addAttendanceRecord({
            studentId: attendanceData.studentId,
            date: new Date(attendanceData.date),
            time: attendanceData.time,
            status: attendanceData.status,
            teacherId: attendanceData.teacherId,
            teacherName: attendanceData.teacherName,
            remarks: attendanceData.remarks,
            notificationSent: attendanceData.notificationSent
          }, result?.id);
        } catch (e) {
          console.warn('Could not append local attendance record:', e);
        }

        // Then refresh from backend to ensure totals are consistent across tabs
        console.log('Refreshing attendance data...');
        await fetchAttendanceRecords(selectedDate);
        await forceRefresh();
        
        showSuccess('Attendance Marked!', `Attendance marked: ${status} for ${student.name}. Parent has been notified.`);
      } else {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      showError('Attendance Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateAttendance = async (studentId: string, status: 'present' | 'absent' | 'late', remarks?: string) => {
    setIsUpdating(true);
    console.log('Updating attendance for student:', studentId, 'to status:', status, 'with remarks:', remarks);
    
    try {
      // Find the existing attendance record
      const existingRecord = attendanceRecords.find(a => 
        a.studentId === studentId && 
        a.date.toDateString() === new Date(selectedDate).toDateString()
      );

      console.log('Found existing record:', existingRecord);

      if (existingRecord) {
        console.log('Sending update request to API for record ID:', existingRecord.id);
        
        // Try to update in backend first
        const response = await fetch(`${API_BASE_URL}/attendance/${existingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            remarks,
            notificationSent: true // Always set to true since we're sending notifications
          }),
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          // Update local state using DataContext function
          const updatedRecord = await response.json();
          console.log('API returned updated record:', updatedRecord);
          
          // Don't update local context - let the refresh handle it
          // updateAttendanceRecord(existingRecord.id, {
          //   status: updatedRecord.status,
          //   remarks: updatedRecord.remarks,
          //   notificationSent: updatedRecord.notificationSent
          // });
          
          // Append/replace locally for instant UI update
          addAttendanceRecord({
            studentId: existingRecord.studentId,
            date: existingRecord.date,
            time: existingRecord.time,
            status: updatedRecord.status,
            teacherId: existingRecord.teacherId,
            teacherName: existingRecord.teacherName,
            remarks: updatedRecord.remarks,
            notificationSent: updatedRecord.notificationSent
          }, Number(existingRecord.id));

          // Force refresh attendance records from backend to update counts
          console.log('Forcing refresh of attendance records after update...');
          await fetchAttendanceRecords(selectedDate);
          
          // Also force refresh all data to ensure consistency
          console.log('Forcing refresh of all data after update...');
          await forceRefresh();
          
          console.log('Attendance updated successfully in context');
          showSuccess('Attendance Updated!', `Attendance updated successfully to: ${status}. Parent has been notified.`);
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', errorText);
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
      } else {
        console.log('No existing record found, creating new one');
        // If no existing record, create a new one
        markAttendance(studentId, status, remarks);
      }
      
      setEditingAttendance(null);
      setEditStatus('present');
      setEditRemarks('');

    } catch (error) {
      console.error('Error updating attendance:', error);
      showError('Update Failed', 'Error updating attendance. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAttendanceForDate = (studentId: string) => {
    console.log('Checking attendance for student:', studentId, 'on date:', selectedDate);
    console.log('Available attendance records:', attendanceRecords.length);
    
    // Get all records for this student on this date
    const records = attendanceRecords.filter(a => {
      // Normalize both sides to prevent timezone-related off-by-one issues
      const recordDateStr = new Date(a.date).toDateString();
      const selectedDateStr = new Date(selectedDate).toDateString();
      const studentMatch = String(a.studentId) === String(studentId);
      const dateMatch = recordDateStr === selectedDateStr;
      
      console.log(`Record: studentId=${a.studentId} (${typeof a.studentId}), date=${recordDateStr}, studentMatch=${studentMatch}, dateMatch=${dateMatch}`);
      
      return studentMatch && dateMatch;
    });
    
    console.log(`Found ${records.length} records for student ${studentId} on ${selectedDate}`);
    
    // If multiple records exist, return the most recent one
    if (records.length > 1) {
      console.log(`Multiple attendance records found for student ${studentId} on ${selectedDate}:`, records);
      // Sort by updatedAt or createdAt to get the most recent
      records.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      return records[0]; // Return the most recent record
    }
    
    return records[0] || null;
  };

  const getSelectedClassStreams = () => {
    const classData = classes.find(c => c.name === selectedClass);
    return classData?.streams || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-lg">
          <Calendar className="h-5 w-5 text-purple-600" />
          <span className="text-purple-800 font-medium">
            {new Date(selectedDate).toLocaleDateString()}
            {isPublicHoliday(new Date(selectedDate)) && (
              <span className="ml-2 text-purple-600 font-bold">
                🎉 {getHolidayName(new Date(selectedDate))}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStream('');
                  }}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream
                </label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 disabled:bg-gray-100"
                >
                  <option value="">All Streams</option>
                  {getSelectedClassStreams().map(stream => (
                    <option key={stream.id} value={stream.name}>{stream.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Assigned Classes
              </label>
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                {(() => {
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
                  
                  if (assignedClasses.length > 0) {
                    return (
                      <div className="space-y-1">
                        {assignedClasses.map((assignment: any, index: number) => (
                          <div key={index} className="text-purple-800 font-medium">
                            {assignment.className} - Stream {assignment.streamName}
                          </div>
                        ))}
                      </div>
                    );
                  } else if (user.assignedStream) {
                    return <span className="text-purple-800 font-medium">{user.assignedStream}</span>;
                  } else {
                    return <span className="text-purple-600">No classes assigned</span>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class and Stream Selection for Teachers */}
      {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && (() => {
        // Parse assigned classes from the new structure
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

        if (assignedClasses.length > 1) {
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Class & Stream</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedClasses.map((assignment: any) => {
                  const isSelected = selectedClass === assignment.className && selectedStream === assignment.streamName;
                  return (
                    <button
                      key={`${assignment.className}-${assignment.streamName}`}
                      onClick={() => {
                        setSelectedClass(assignment.className);
                        setSelectedStream(assignment.streamName);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {assignment.className} {assignment.streamName}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {students.filter(s => s.class === assignment.className && s.stream === assignment.streamName).length} students
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Student Attendance - {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{filteredStudents.length} students</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredStudents.map((student) => {
            const attendance = getAttendanceForDate(student.id);
            const canEdit = user?.role?.toLowerCase() === 'user' || 
                           user?.role?.toLowerCase() === 'teacher' || 
                           user?.role?.toLowerCase() === 'super-teacher';

            return (
              <div key={student.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700">
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                      <p className="text-xs text-purple-600">Access: {student.accessNumber}</p>
                      <p className="text-sm text-gray-500">{student.class} - Stream {student.stream}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {attendance ? (
                      editingAttendance === student.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as 'present' | 'absent' | 'late')}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Remarks (optional)"
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                          />
                          <button
                            onClick={() => updateAttendance(student.id, editStatus, editRemarks)}
                            disabled={isUpdating}
                            className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Save className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
                            <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingAttendance(null);
                              setEditStatus('present');
                              setEditRemarks('');
                            }}
                            className="flex items-center space-x-1 bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <>
                            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                              attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                              attendance.status === 'late' ? 'bg-orange-100 text-orange-800' :
                              attendance.status === 'holiday' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status === 'holiday' ? '🎉 Holiday' : attendance.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              at {attendance.time}
                            </span>
                            {attendance.notificationSent && (
                              <span className="text-xs text-green-600 font-medium ml-2">
                                📧 Parent notified
                              </span>
                            )}
                          </>
                          {attendance.remarks && (
                            <span className="text-xs text-gray-600 italic">
                              "{attendance.remarks}"
                            </span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingAttendance(student.id);
                                setEditStatus(attendance.status);
                                setEditRemarks(attendance.remarks || '');
                              }}
                              className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                          Not Marked
                        </span>
                        {canEdit && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              <span>Present</span>
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'late', 'Arrived late')}
                              className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <Clock className="h-4 w-4" />
                              <span>Late</span>
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span>Absent</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No students found for the selected criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="space-y-6">
        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {(() => {
            // Simple and reliable count calculation
            const todayRecords = attendanceRecords.filter(record => {
              // Use local date comparison to avoid timezone shifts
              const recordDateStr = new Date(record.date).toDateString();
              const selectedDateStr = new Date(selectedDate).toDateString();
              return recordDateStr === selectedDateStr;
            });

            // Get unique records per student (keep most recent)
            const studentAttendanceMap = new Map();
            todayRecords.forEach(record => {
              const existing = studentAttendanceMap.get(record.studentId);
              if (!existing || new Date(record.updatedAt || record.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                studentAttendanceMap.set(record.studentId, record);
              }
            });

            const presentCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'present').length;
            const lateCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'late').length;
            const absentCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'absent').length;
            const holidayCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'holiday').length;
            const markedCount = studentAttendanceMap.size;
            const notMarkedCount = Math.max(0, filteredStudents.length - markedCount);

            console.log('Summary counts:', { presentCount, lateCount, absentCount, notMarkedCount, totalStudents: filteredStudents.length });

            return (
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Present</p>
                      <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                    </div>
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Late</p>
                      <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                    </div>
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Holiday</p>
                      <p className="text-2xl font-bold text-purple-600">{holidayCount}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Not Marked</p>
                      <p className="text-2xl font-bold text-gray-600">{notMarkedCount}</p>
                    </div>
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Class/Stream Breakdown for Teachers */}
        {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && (() => {
          // Parse assigned classes from the new structure
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

          if (assignedClasses.length > 0) {
            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Class & Stream</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedClasses.map((assignment: any) => {
                    // Get students for this specific class and stream
                    const classStudents = students.filter(s => 
                      s.class === assignment.className && s.stream === assignment.streamName
                    );
                    
                    // Get attendance records for these students on the selected date
                    const classAttendance = attendanceRecords.filter(a => {
                      const recordDateStr = new Date(a.date).toDateString();
                      const selectedDateStr = new Date(selectedDate).toDateString();
                      return recordDateStr === selectedDateStr && 
                             classStudents.some(s => s.id?.toString() === a.studentId?.toString());
                    });

                    // Count attendance statuses (handle duplicates by keeping most recent)
                    const studentAttendanceMap = new Map();
                    classAttendance.forEach(record => {
                      const existing = studentAttendanceMap.get(record.studentId);
                      if (!existing || new Date(record.updatedAt || record.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                        studentAttendanceMap.set(record.studentId, record);
                      }
                    });

                    const presentCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'present').length;
                    const lateCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'late').length;
                    const absentCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'absent').length;
                    const holidayCount = Array.from(studentAttendanceMap.values()).filter(r => r.status === 'holiday').length;
                    const totalStudents = classStudents.length;
                    const markedCount = presentCount + lateCount + absentCount + holidayCount;
                    const notMarkedCount = totalStudents - markedCount;

                    // Calculate percentages
                    const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
                    const latePercentage = totalStudents > 0 ? Math.round((lateCount / totalStudents) * 100) : 0;
                    const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;

                    return (
                      <div key={`${assignment.className}-${assignment.streamName}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {assignment.className} {assignment.streamName}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {totalStudents} students
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Present:</span>
                            <span className="font-medium text-green-600">
                              {presentCount} ({presentPercentage}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Late:</span>
                            <span className="font-medium text-orange-600">
                              {lateCount} ({latePercentage}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Absent:</span>
                            <span className="font-medium text-red-600">
                              {absentCount} ({absentPercentage}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Holiday:</span>
                            <span className="font-medium text-purple-600">
                              {holidayCount} ({Math.round((holidayCount / totalStudents) * 100)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Not Marked:</span>
                            <span className="font-medium text-gray-600">
                              {notMarkedCount}
                            </span>
                          </div>
                        </div>

                        {/* Summary line like "2 present out of 70" */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700 text-center">
                            <span className="font-medium text-green-600">{presentCount}</span> present out of{' '}
                            <span className="font-medium text-gray-900">{totalStudents}</span> in{' '}
                            <span className="font-medium text-blue-600">{assignment.className} {assignment.streamName}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};

export default AttendanceManagement;
