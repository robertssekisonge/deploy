import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Calendar, Clock, Plus, Edit, Trash2, BookOpen, Users, Filter, Lock, AlertCircle, GraduationCap, Layers, Home } from 'lucide-react';

const CompleteTimetable: React.FC = () => {
  const { timetables, classes, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useData();
  const { user, users } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const [formData, setFormData] = useState({
    classId: '',
    streamId: '',
    className: '',
    streamName: '',
    day: 'Monday',
    startTime: '',
    endTime: '',
    subject: '',
    teacherId: '',
    teacherName: '',
    duration: 60,
    room: ''
  });

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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const subjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Literature', 'Economics', 'Computer Science',
    'Art', 'Music', 'Physical Education'
  ];

  // Debug: Log all users and their roles
  console.log('All users from backend:', users);
  console.log('User roles found:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
  
  const teachers = users.filter(u => {
    const role = u.role?.toUpperCase();
    const isTeacher = role === 'TEACHER' || role === 'SUPER_TEACHER';
    console.log(`User ${u.name} (${u.id}) has role "${u.role}" -> isTeacher: ${isTeacher}`);
    return isTeacher;
  });
  
  console.log('Filtered teachers:', teachers);



  // Check backend availability
  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      setBackendAvailable(response.ok);
    } catch (error) {
      console.warn('Backend not available:', error);
      setBackendAvailable(false);
    }
  };

  // Check backend health on component mount
  React.useEffect(() => {
    checkBackendHealth();
  }, []);



  const classColors = [
    'bg-purple-100 border-purple-200 text-purple-900',
    'bg-blue-100 border-blue-200 text-blue-900',
    'bg-green-100 border-green-200 text-green-900',
    'bg-yellow-100 border-yellow-200 text-yellow-900',
    'bg-pink-100 border-pink-200 text-pink-900',
    'bg-indigo-100 border-indigo-200 text-indigo-900',
    'bg-teal-100 border-teal-200 text-teal-900',
    'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-900',
  ];

  const getFilteredTimetables = () => {
    let filteredTimetables = timetables;

    // If teacher, only show their assigned classes
    if (user?.role === 'USER' || user?.role === 'SUPER-TEACHER') {
      if (hasAssignedClasses()) {
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
          filteredTimetables = timetables.filter(entry => 
            assignedClasses.some((assignment: any) => 
              assignment.className === entry.className && assignment.streamName === entry.streamName
            )
          );
        } else if (user.assignedStream) {
          // Fallback to old logic
          const [className, streamName] = user.assignedStream.split(' ');
          filteredTimetables = timetables.filter(entry => 
            entry.className === className && entry.streamName === streamName
          );
        }
      } else {
        // No assigned classes, show empty
        filteredTimetables = [];
      }
    } else {
      // Admin can filter by day, class, and stream
      filteredTimetables = timetables.filter(entry => {
        const matchesDay = entry.day === selectedDay;
        const matchesClass = !selectedClass || entry.className === selectedClass;
        const matchesStream = !selectedStream || entry.streamName === selectedStream;
        return matchesDay && matchesClass && matchesStream;
      });
    }

    return filteredTimetables;
  };

  // If teacher has no assigned classes, show restricted view
      if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
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
                <strong>What you need:</strong> Class and stream assignments to access timetables.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  const getSelectedClassStreams = () => {
    const classData = classes.find(c => c.name === selectedClass);
    return classData?.streams || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setShowErrorMessage(false);
      setShowSuccessMessage(false);
      
      // Check if data is loaded
      if (!classes || classes.length === 0) {
        showError('Data Error', 'Classes data not loaded. Please refresh the page.');
        return;
      }
      
      if (!teachers || teachers.length === 0) {
        showError('Data Error', 'Teachers data not loaded. Please refresh the page.');
        return;
      }
      
      // Simple validation
      if (!formData.className || !formData.streamName || !formData.subject || !formData.teacherId || !formData.startTime) {
        showError('Validation Error', 'Please fill in all required fields');
        return;
      }
      
      // Debug the data to see what's available
      console.log('Available classes:', classes);
      console.log('Available teachers:', teachers);
      console.log('Form data being validated:', formData);
      
      const selectedClass = classes.find(c => c.name === formData.className);
      const selectedStream = selectedClass?.streams.find(s => s.name === formData.streamName);
      
      // Try to find teacher by ID, handling both string and number types
      const selectedTeacher = teachers.find(t => {
        const teacherId = t.id?.toString();
        const formTeacherId = formData.teacherId?.toString();
        return teacherId === formTeacherId;
      });

      console.log('Selected class:', selectedClass);
      console.log('Selected stream:', selectedStream);
      console.log('Selected teacher:', selectedTeacher);
      console.log('Looking for teacher with ID:', formData.teacherId, 'Type:', typeof formData.teacherId);
      console.log('Available teacher IDs:', teachers.map(t => ({ id: t.id, type: typeof t.id, name: t.name })));

      if (!selectedClass || !selectedStream || !selectedTeacher) {
        let errorDetails = [];
        if (!selectedClass) errorDetails.push(`Class "${formData.className}" not found`);
        if (!selectedStream) errorDetails.push(`Stream "${formData.streamName}" not found`);
        if (!selectedTeacher) {
          errorDetails.push(`Teacher with ID "${formData.teacherId}" not found`);
          errorDetails.push(`Available teacher IDs: ${teachers.map(t => t.id).join(', ')}`);
        }
        
        console.error('Validation failed:', errorDetails);
        showError('Validation Failed', `Validation failed: ${errorDetails.join(', ')}`);
        return;
      }

      const entryData = {
        classId: selectedClass.id,
        streamId: selectedStream.id,
        className: formData.className,
        streamName: formData.streamName,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        teacherId: formData.teacherId,
        teacherName: selectedTeacher.name,
        duration: formData.duration,
        room: formData.room
      };

      if (editingEntry) {
        // Update existing entry
        const result = await updateTimetableEntry(editingEntry, entryData);
        if (result.success) {
          setEditingEntry(null);
          showSuccess('Timetable Updated!', 'Timetable entry updated successfully! Teachers will see the changes immediately.');
        } else {
          showError('Update Failed', `Error updating timetable: ${result.error}`);
          return;
        }
      } else {
        // Add new entry
        await addTimetableEntry(entryData);
        showData('Timetable Added!', 'New timetable entry added successfully! Teachers will see it in real-time.');
      }
      
      setShowAddForm(false);
      setFormData({
        classId: '',
        streamId: '',
        className: '',
        streamName: '',
        day: 'Monday',
        startTime: '',
        endTime: '',
        subject: '',
        teacherId: '',
        teacherName: '',
        duration: 60,
        room: ''
      });
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showError('Save Failed', `Error saving timetable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      classId: entry.classId,
      streamId: entry.streamId,
      className: entry.className,
      streamName: entry.streamName,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      duration: entry.duration,
      room: entry.room || ''
    });
    setEditingEntry(entry.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      deleteTimetableEntry(id);
    }
  };

  const canEdit = user?.role?.toUpperCase() === 'ADMIN';

  try {
    return (
      <div className="space-y-6">
      {/* Backend Status */}
      {!backendAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Backend Unavailable</h4>
              <p className="text-sm text-yellow-700">Cannot save timetable changes. Please check if the backend server is running.</p>
            </div>
            <button
              onClick={checkBackendHealth}
              className="ml-auto text-yellow-600 hover:text-yellow-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Error</h4>
              <p className="text-sm text-amber-700">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowErrorMessage(false)}
              className="ml-auto text-amber-600 hover:text-amber-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Success!</h4>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Academic Timetable</h1>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Class</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
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

          <div className="flex items-end">
            <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-900">
                {getFilteredTimetables().length} classes scheduled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-gradient-to-r from-purple-200/50 to-blue-200/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {selectedDay} Schedule
              {selectedClass && ` - ${selectedClass}`}
              {selectedStream && ` Stream ${selectedStream}`}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Time slots */}
            <div className="space-y-4 p-6">
              {timeSlots.map(timeSlot => {
                const classesInSlot = getFilteredTimetables().filter(entry => 
                  entry.startTime === timeSlot
                );

                return (
                  <div key={timeSlot} className="grid grid-cols-12 gap-6 items-center py-4 border-b border-gradient-to-r from-purple-100/50 to-blue-100/50 bg-gradient-to-r from-white/80 to-purple-50/20 rounded-xl backdrop-blur-sm">
                    <div className="col-span-2">
                      <div className="text-center p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                        <p className="text-sm font-bold text-white">{timeSlot}</p>
                        <p className="text-xs text-purple-100">
                          {timeSlot.split(':')[0] < '12' ? 'AM' : 'PM'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-10">
                      {classesInSlot.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classesInSlot.map(entry => {
                            // Comprehensive color schemes for all subjects
                            const subjectColors = {
                              'Mathematics': 'from-blue-500 to-blue-600',
                              'English': 'from-rose-500 to-rose-600',
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
                            <div
                              key={entry.id}
                              className={`bg-gradient-to-br ${colorScheme} backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer border border-white/20 shadow-lg hover:border-white/40 text-white`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-md">
                                    <BookOpen className="h-3 w-3 text-white" />
                                  </div>
                                  <h4 className="font-bold text-white text-sm">{entry.subject}</h4>
                                </div>
                                {canEdit && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(entry)}
                                      className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                      <Edit className="h-3 w-3 text-white" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                      <Trash2 className="h-3 w-3 text-white" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="h-3 w-3 text-white/90" />
                                  <p className="text-sm font-medium text-white/90">
                                    {entry.className} - Stream {entry.streamName}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Users className="h-3 w-3 text-white/90" />
                                  <p className="text-xs font-medium text-white/90">
                                    {entry.teacherName}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3 text-white/90" />
                                    <span className="text-xs font-medium text-white/90">
                                      {entry.startTime} - {entry.endTime}
                                    </span>
                                  </div>
                                  <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium shadow-md">
                                    {entry.room}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-gray-50/80 via-blue-50/30 to-purple-50/30 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                          <div className="flex items-center justify-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl shadow-lg">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-gray-600 text-center font-medium">No classes scheduled</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingEntry ? 'Edit' : 'Add'} Timetable Entry
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
                className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group"
              >
                <span className="text-gray-500 group-hover:text-red-500 transition-colors text-xl font-bold">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1 text-purple-500" />
                      Class
                    </label>
                    <select
                      value={formData.className}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        className: e.target.value,
                        streamName: '' 
                      }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Layers className="h-4 w-4 mr-1 text-blue-500" />
                      Stream
                    </label>
                    <select
                      value={formData.streamName}
                      onChange={(e) => setFormData(prev => ({ ...prev, streamName: e.target.value }))}
                      required
                      disabled={!formData.className}
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 disabled:bg-gray-100"
                    >
                    <option value="">Select Stream</option>
                    {classes.find(c => c.name === formData.className)?.streams.map(stream => (
                      <option key={stream.id} value={stream.name}>{stream.name}</option>
                    ))}
                  </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-green-500" />
                      Day
                    </label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1 text-orange-500" />
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
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
                      <Clock className="h-4 w-4 mr-1 text-teal-500" />
                      Start Time
                    </label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                    <option value="">Select Start Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-pink-500" />
                      End Time
                    </label>
                    <select
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-pink-500 focus:ring-pink-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
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
                    onChange={(e) => {
                      const teacher = teachers.find(t => t.id === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        teacherId: e.target.value,
                        teacherName: teacher?.name || ''
                      }));
                    }}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.role === 'super-teacher' ? 'Super Teacher' : 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Home className="h-4 w-4 mr-1 text-amber-500" />
                    Room
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
                    setShowAddForm(false);
                    setEditingEntry(null);
                  }}
                  className="px-6 py-2 text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !backendAvailable}
                  className={`px-6 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isSubmitting || !backendAvailable
                      ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-400 to-gray-500' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </span>
                  ) : !backendAvailable ? (
                    'Backend Unavailable'
                  ) : (
                    `${editingEntry ? 'Update' : 'Add'} Entry`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('Error rendering CompleteTimetable:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          
          <h1 className="text-lg font-medium text-gray-900 mb-2">
            Something went wrong
          </h1>
          
          <p className="text-sm text-gray-600 mb-6">
            An error occurred while rendering the timetable. Please refresh the page.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default CompleteTimetable;