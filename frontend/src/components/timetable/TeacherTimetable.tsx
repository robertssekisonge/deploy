import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, BookOpen, Plus, Edit, Trash2, Save, X, Lock, Users, GraduationCap, Layers, Home, RefreshCw, AlertCircle } from 'lucide-react';
import { TimeTable } from '../../types';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  streamId: string;
  className: string;
  streamName: string;
  room?: string;
}

const TeacherTimetable: React.FC = () => {
  const { classes, timetables, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useData();
  const { user, users, fetchUsers } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');

  // Ensure users are loaded
  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

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

  const teachers = users.filter(u => {
    const role = u.role?.toUpperCase();
    return role === 'USER' || role === 'SUPER-TEACHER';
  });

  // Ensure we have teachers available
  const availableTeachers = teachers.length > 0 ? teachers : [
    { id: '1', name: 'No teachers available', role: 'user' }
  ];

  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: '',
    subject: '',
    teacherId: '',
    classId: '',
    streamId: '',
    room: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const subjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 
    'History', 'Geography', 'Literature', 'Economics', 'Computer Science',
    'Physical Education', 'Art', 'Music', 'Religious Studies'
  ];

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Teacher Timetable</h1>
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
                <strong>What you need:</strong> Class and stream assignments to access your timetable.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClassData = classes.find(c => c.id === formData.classId);
    const selectedStreamData = selectedClassData?.streams.find(s => s.id === formData.streamId);
    const selectedTeacher = teachers.find(t => t.id === formData.teacherId);

    const timetableEntry: Omit<TimeTable, 'id'> = {
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subject: formData.subject,
      teacherId: formData.teacherId,
      teacherName: selectedTeacher?.name || '',
      classId: formData.classId,
      streamId: formData.streamId,
      className: selectedClassData?.name || '',
      streamName: selectedStreamData?.name || '',
      room: formData.room,
      duration: calculateDuration(formData.startTime, formData.endTime)
    };

    if (editingEntry) {
      updateTimetableEntry(editingEntry, timetableEntry);
      setEditingEntry(null);
    } else {
      addTimetableEntry(timetableEntry);
    }

    setShowForm(false);
    setFormData({
      day: '',
      startTime: '',
      endTime: '',
      subject: '',
      teacherId: '',
      classId: '',
      streamId: '',
      room: ''
    });
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const handleEdit = (entry: TimeTable) => {
    console.log('Editing entry:', entry);
    console.log('Available teachers:', availableTeachers);
    console.log('Teachers array:', teachers);
    console.log('Users array:', users);
    
    setFormData({
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      teacherId: entry.teacherId,
      classId: entry.classId,
      streamId: entry.streamId,
      room: entry.room || ''
    });
    setEditingEntry(entry.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      deleteTimetableEntry(id);
    }
  };

  // Determine assigned classes for teachers
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER';
  
  // Get teacher's assigned classes using the new structure
  const getTeacherAssignedClasses = () => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPERUSER') {
      return classes; // Admins can see all classes
    }

    // Parse assignedClasses from the new structure
    let assignedClasses = [];
    if (user?.assignedClasses) {
      try {
        assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        assignedClasses = [];
      }
    }

    // Filter classes based on assigned classes and streams
    if (assignedClasses.length > 0) {
      return classes.filter(cls => {
        return assignedClasses.some((assignment: any) => {
          // If teacher is main teacher for this class, include all streams
          if (assignment.isMainTeacher && assignment.className === cls.name) {
            return true;
          }
          
          // If teacher is assigned to specific stream, only include that stream
          if (assignment.className === cls.name) {
            // Check if this class has the assigned stream
            return cls.streams.some(stream => stream.name === assignment.streamName);
          }
          
          return false;
        });
      }).map(cls => {
        // If teacher is main teacher for this class, show all streams
        // If teacher is assigned to specific stream, filter streams
        const relevantAssignment = assignedClasses.find((assignment: any) => 
          assignment.className === cls.name
        );
        
        if (relevantAssignment?.isMainTeacher) {
          return cls; // Show all streams for main teacher
        } else {
          // Filter to only show assigned stream
          return {
            ...cls,
            streams: cls.streams.filter(stream => 
              stream.name === relevantAssignment?.streamName
            )
          };
        }
      });
    }

    // Fallback to old assignedStream logic
    if (user?.assignedStream) {
      const [className, streamName] = user.assignedStream.split(' ');
      return classes.filter(cls => 
        cls.name === className && 
        cls.streams.some(stream => stream.name === streamName)
      ).map(cls => ({
        ...cls,
        streams: cls.streams.filter(stream => stream.name === streamName)
      }));
    }

    return [];
  };

  const teacherClasses = getTeacherAssignedClasses();

  // Filter timetable entries for the teacher
  const filteredTimetables = timetables.filter(entry => {
    if (isTeacher) {
      // Check if this entry belongs to one of the teacher's assigned classes
      return teacherClasses.some(cls => {
        if (entry.className === cls.name) {
          // If teacher is main teacher for this class, show all entries
          if (user.assignedClasses) {
            try {
              const assignedClasses = typeof user.assignedClasses === 'string' 
                ? JSON.parse(user.assignedClasses) 
                : user.assignedClasses;
              
              const assignment = assignedClasses.find((a: any) => a.className === cls.name);
              if (assignment?.isMainTeacher) {
                return true;
              }
            } catch (error) {
              console.error('Error parsing assignedClasses:', error);
            }
          }
          
          // Check if entry is for assigned stream
          return cls.streams.some(stream => stream.name === entry.streamName);
        }
        return false;
      });
    }
    
    // For non-teachers (admins), show filtered by selection
    const matchesClass = selectedClass === '' || entry.classId === selectedClass;
    const matchesStream = selectedStream === '' || entry.streamId === selectedStream;
    return matchesClass && matchesStream;
  });

  const getTimetableForDay = (day: string) => {
    return filteredTimetables
      .filter(entry => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);

  // Only allow super-teacher and admin to edit
  const canEdit = user?.role?.toUpperCase() === 'SUPER-TEACHER' || user?.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Teaching Timetable</h1>
        <div className="flex items-center space-x-4">
          {canEdit && (
            <button
              onClick={() => {
                console.log('Opening form...');
                console.log('Users loaded:', users.length);
                console.log('Teachers found:', teachers.length);
                console.log('Available teachers:', availableTeachers);
                setShowForm(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Entry</span>
            </button>
          )}
          <button
            onClick={() => {
              console.log('Current users:', users);
              console.log('Teachers filtered:', teachers);
              console.log('Available teachers:', availableTeachers);
              fetchUsers();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>Debug Users ({users.length})</span>
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Information:</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><strong>Total Users Loaded:</strong> {users.length}</p>
            <p><strong>Teachers Found:</strong> {teachers.length}</p>
            <p><strong>Available Teachers:</strong> {availableTeachers.length}</p>
          </div>
          <div>
            <p><strong>Current User Role:</strong> {user?.role}</p>
            <p><strong>Can Edit:</strong> {canEdit ? 'Yes' : 'No'}</p>
            <p><strong>Form Teacher ID:</strong> {formData.teacherId || 'Not set'}</p>
          </div>
        </div>
        {users.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-yellow-800">All Users in System:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {users.map(u => (
                <span key={u.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {u.name} ({u.role})
                </span>
              ))}
            </div>
          </div>
        )}
        {teachers.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-green-800">Teachers Available:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {teachers.map(t => (
                <span key={t.id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {t.name} ({t.role})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {!isTeacher && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Stream
              </label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                disabled={!selectedClass}
              >
                <option value="">All Streams</option>
                {selectedClassData?.streams.map(stream => (
                  <option key={stream.id} value={stream.id}>{stream.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {isTeacher && user?.assignedStream && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="text-lg font-semibold text-green-700">My Assigned Stream: {user.assignedStream}</div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((time, index) => (
                <tr key={time}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {time}
                  </td>
                  {days.map(day => {
                    const entries = getTimetableForDay(day).filter(entry => 
                      entry.startTime === time
                    );
                    return (
                      <td key={day} className="px-6 py-4 whitespace-nowrap">
                        {entries.map(entry => {
                          // Comprehensive color schemes for all subjects
                          const subjectColors = {
                            'Mathematics': 'from-blue-500 to-blue-600',
                            'English': 'from-red-500 to-red-600',
                            'Physics': 'from-purple-500 to-purple-600',
                            'Chemistry': 'from-green-500 to-green-600',
                            'Biology': 'from-pink-500 to-pink-600',
                            'History': 'from-orange-500 to-orange-600',
                            'Geography': 'from-teal-500 to-teal-600',
                            'Literature': 'from-indigo-500 to-indigo-600',
                            'Economics': 'from-yellow-500 to-yellow-600',
                            'Computer Science': 'from-cyan-500 to-cyan-600',
                            'Physical Education': 'from-emerald-500 to-emerald-600',
                            'Art': 'from-rose-500 to-rose-600',
                            'Music': 'from-violet-500 to-violet-600',
                            'Religious Studies': 'from-amber-500 to-amber-600'
                          };
                          
                          const colorScheme = subjectColors[entry.subject] || 'from-gray-500 to-gray-600';
                          
                          return (
                          <div key={entry.id} className="mb-2">
                            <div className={`bg-gradient-to-r ${colorScheme} rounded-lg p-3 text-white shadow-lg`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">
                                  {entry.subject}
                                </span>
                                <div className="flex space-x-1">
                                  {canEdit && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(entry)}
                                        className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded p-1 transition-all"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="text-white/80 hover:text-white bg-red-500/20 hover:bg-red-500/30 rounded p-1 transition-all"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
              </div>
                              <div className="text-xs text-white/90">
                                <div className="flex items-center space-x-1 mb-1">
                                  <User className="h-3 w-3" />
                                  <span>{entry.teacherName}</span>
                                </div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <BookOpen className="h-3 w-3" />
                                  <span>{entry.className} - {entry.streamName}</span>
                                </div>
                                {entry.room && (
                                  <div className="flex items-center space-x-1">
                                    <span>🏠</span>
                                    <span>Room {entry.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 group"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-purple-500" />
                      Day
                    </label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select Day</option>
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-green-500" />
                      Start Time
                    </label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select Start Time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-orange-500" />
                      End Time
                    </label>
                    <select
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select End Time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-indigo-500" />
                    Teacher
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                    required
                    disabled={users.length === 0}
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {users.length === 0 ? 'Loading teachers...' : 'Select Teacher'}
                    </option>
                    {availableTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.role})
                      </option>
                    ))}
                  </select>
                  {users.length === 0 && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Loading teachers from database...
                    </p>
                  )}
                  {users.length > 0 && teachers.length === 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No teachers found. Check if users have correct roles.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1 text-teal-500" />
                      Class
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value, streamId: '' }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Layers className="h-4 w-4 mr-1 text-pink-500" />
                      Stream
                    </label>
                    <select
                      value={formData.streamId}
                      onChange={(e) => setFormData(prev => ({ ...prev, streamId: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-pink-500 focus:ring-pink-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                      disabled={!formData.classId}
                    >
                      <option value="">Select Stream</option>
                      {formData.classId && classes.find(c => c.id === formData.classId)?.streams.map(stream => (
                        <option key={stream.id} value={stream.id}>{stream.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Home className="h-4 w-4 mr-1 text-amber-500" />
                    Room (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Room 101, Lab 1"
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                  }}
                  className="px-6 py-2 text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingEntry ? 'Update' : 'Add'} Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherTimetable;