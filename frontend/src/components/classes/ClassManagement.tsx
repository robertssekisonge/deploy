import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { GraduationCap, Users, BookOpen, User, Plus, Edit, Trash2 } from 'lucide-react';

const ClassManagement: React.FC = () => {
  const { classes, students, fetchStudents, forceRefresh } = useData();
  const { user, users } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [selectedStream, setSelectedStream] = useState('');
  const [showEditClass, setShowEditClass] = useState<string | null>(null);
  const [showAddStream, setShowAddStream] = useState<string | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    name: '',
    level: '',
    subjects: [] as string[]
  });
  const [addStreamForm, setAddStreamForm] = useState({
    name: '',
    subjects: [] as string[]
  });

  // Removed unused loading and error states to fix linting warnings

  // Memoized calculations to prevent unnecessary re-renders
  const classStats = useMemo(() => {
    if (!students || students.length === 0) return {};
    
    return classes.reduce((acc, cls) => {
      const classStudents = students.filter(s => s.class === cls.name && s.status === 'active');
      acc[cls.name] = {
        total: classStudents.length,
        byStream: cls.streams.reduce((streamAcc, stream) => {
          const streamStudents = classStudents.filter(s => s.stream === stream.name);
          streamAcc[stream.name] = streamStudents.length;
          return streamAcc;
        }, {} as Record<string, number>)
      };
      return acc;
    }, {} as Record<string, { total: number; byStream: Record<string, number> }>);
  }, [classes, students]);

  const streamDistribution = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    return ['A', 'B', 'C', 'Sciences', 'Arts'].map((streamName) => {
      const streamCount = students.filter(s => s.stream === streamName).length;
      const percentage = students.length > 0 ? (streamCount / students.length) * 100 : 0;
      return { streamName, streamCount, percentage };
    });
  }, [students]);


  // Check if data is available
  if (!classes || classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Classes...</h2>
              <p className="text-gray-600 mb-4">
                {classes === undefined ? 'Fetching class data...' : 'No classes found'}
              </p>
              <div className="space-x-4">
                {classes === undefined && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Retry
                  </button>
                )}
                <AIRefreshButton
                  onClick={() => {
                    fetchStudents();
                    forceRefresh();
                  }}
                  variant="data"
                  size="sm"
                >
                  Refresh Data
                </AIRefreshButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStudentCount = (className: string, streamName?: string) => {
    if (streamName) {
      return classStats[className]?.byStream[streamName] || 0;
    }
    return classStats[className]?.total || 0;
  };

  const getTeachers = () => {
    return users.filter(u => u.role === 'TEACHER');
  };

  // Filter classes based on teacher's assigned classes
  const getFilteredClasses = () => {
    if (!user) return classes;
    
    // If user is admin or superuser, show all classes
    if (user.role === 'ADMIN' || user.role === 'SUPERUSER') {
      return classes;
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
      
      return classes.filter(classData => 
        assignedClasses.some((assignment: any) => assignment.classId === classData.id)
      );
    }
    
    return classes;
  };

  const assignTeacherToStream = async (classId: string, streamId: string, teacherId: string) => {
    try {
      // Save to backend
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/streams/${streamId}/teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      });

      if (response.ok) {
        // Refresh data or update local state as needed
      } else {
        throw new Error('Failed to assign teacher to stream');
      }
    } catch (error) {
      console.error('Error assigning teacher to stream:', error);
      showError('Assignment Failed', 'Failed to assign teacher to stream. Please try again.', 5000);
    } finally {
      setShowAssignTeacher(false);
    }
  };

  const handleEditClass = (classData: { id: string; name: string; level: string; subjects: string[] }) => {
    setEditClassForm({
      name: classData.name,
      level: classData.level,
      subjects: classData.subjects
    });
    setShowEditClass(classData.id);
  };

  const handleAddStream = (classId: string) => {
    setAddStreamForm({
      name: '',
      subjects: []
    });
    setShowAddStream(classId);
  };

  const submitEditClass = async () => {
    try {
      // Save to backend
      const response = await fetch(`http://localhost:5000/api/classes/${showEditClass}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClassForm)
      });

      if (response.ok) {
        showSuccess('Class Updated!', 'Class updated successfully!', 3000);
      } else {
        throw new Error('Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      showError('Update Failed', 'Failed to update class. Please try again.', 5000);
    } finally {
      setShowEditClass(null);
    }
  };

  const submitAddStream = async () => {
    try {
      // Save to backend
      const response = await fetch(`http://localhost:5000/api/classes/${showAddStream}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addStreamForm)
      });

      if (response.ok) {
        showSuccess('Stream Added!', 'Stream added successfully!', 3000);
      } else {
        throw new Error('Failed to add stream');
      }
    } catch (error) {
      console.error('Error adding stream:', error);
      showError('Add Failed', 'Failed to add stream. Please try again.', 5000);
    } finally {
      setShowAddStream(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Classes & Streams Management</h1>
        <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-lg">
          <GraduationCap className="h-5 w-5 text-purple-600" />
          <span className="text-purple-800 font-medium">Academic Structure</span>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <AIRefreshButton
          onClick={() => {
            fetchStudents();
            forceRefresh();
          }}
          variant="stats"
          size="sm"
        >
          Refresh Data
        </AIRefreshButton>
      </div>

      {/* Classes Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredClasses().map((classData, idx) => (
          <div
            key={classData.id}
            className={
              `rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ` +
              [
                'bg-blue-100',
                'bg-green-100',
                'bg-pink-100',
                'bg-purple-100',
                'bg-yellow-100',
                'bg-orange-100',
                'bg-teal-100',
              ][idx % 7]
            }
          >
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{classData.name}</h3>
                  <p className="text-purple-100">{classData.level} Level</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{getStudentCount(classData.name)}</p>
                  <p className="text-purple-100 text-sm">Students</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Streams</h4>
                  <div className="space-y-2">
                    {classData.streams.map((stream) => (
                      <div key={stream.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-700">{stream.name}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Stream {stream.name}</p>
                            {stream.teacherName && (
                              <p className="text-xs text-gray-500">Teacher: {stream.teacherName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {getStudentCount(classData.name, stream.name)} students
                          </span>
                          {user?.role?.toLowerCase() === 'admin' && (
                            <button
                              onClick={() => {
                                setSelectedClass(classData.id);
                                setSelectedStream(stream.id);
                                setShowAssignTeacher(true);
                              }}
                              className="text-purple-600 hover:text-purple-700"
                              title="Assign Teacher"
                            >
                              <User className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects</h4>
                  <div className="flex flex-wrap gap-1">
                    {classData.subjects.slice(0, 4).map((subject, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {subject}
                      </span>
                    ))}
                    {classData.subjects.length > 4 && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        +{classData.subjects.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {user?.role?.toLowerCase() === 'admin' && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          handleEditClass(classData);
                        }}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          handleAddStream(classData.id);
                        }}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Stream</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Class Structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Class Structure</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Streams
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((classData) => (
                <tr key={classData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{classData.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      classData.level === 'Advanced' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {classData.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {classData.streams.map((stream) => (
                        <span key={stream.id} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {stream.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{getStudentCount(classData.name)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{classData.subjects.length} subjects</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user?.role?.toLowerCase() === 'admin' && (
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stream Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stream Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {streamDistribution.map(({ streamName, streamCount, percentage }) => (
                <div key={streamName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Stream {streamName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{streamCount} students</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Teacher Assignments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {getTeachers().map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-700">
                        {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.assignedStream || 'No assignment'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    teacher.assignedStream ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {teacher.assignedStream ? 'Assigned' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Teacher Modal */}
      {showAssignTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 p-4 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 px-4 py-2 rounded-lg">Assign Teacher</h2>
              <button
                onClick={() => setShowAssignTeacher(false)}
                className="text-gray-600 hover:text-gray-800 bg-white/20 rounded-full p-1"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Select Teacher
                </label>
                <select className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
                  <option value="">Choose a teacher...</option>
                  {getTeachers().map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.assignedStream ? `(Currently: ${teacher.assignedStream})` : '(Available)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  This will assign the selected teacher to manage this stream's students and attendance.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAssignTeacher(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignTeacherToStream(selectedClass, selectedStream, '')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
                >
                  Assign Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Class</h2>
              <button
                onClick={() => setShowEditClass(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={editClassForm.level}
                  onChange={(e) => setEditClassForm(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="Secondary">Secondary</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditClass(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditClass}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Stream Modal */}
      {showAddStream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Stream</h2>
              <button
                onClick={() => setShowAddStream(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream Name
                </label>
                <input
                  type="text"
                  value={addStreamForm.name}
                  onChange={(e) => setAddStreamForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., D, E, Sciences, Arts"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  The new stream will inherit the subjects from the parent class and can be customized later.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddStream(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddStream}
                  disabled={!addStreamForm.name}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Stream
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;