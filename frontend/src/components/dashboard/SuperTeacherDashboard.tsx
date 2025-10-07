import React, { useState, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Users, Calendar, Clock, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';

const SuperTeacherDashboard: React.FC = () => {
  const { students, timetables, forceRefresh } = useData();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await forceRefresh();
      showSuccess('🔄 Dashboard Refreshed!', 'All data has been updated successfully!', 3000);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showError('Refresh Failed', 'Failed to refresh dashboard data. Please try again.', 4000);
    } finally {
      setIsRefreshing(false);
    }
  }, [forceRefresh, showSuccess, showError]);

  // Parse assigned classes from the new structure
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

  // Filter all data (students, attendance, etc.) to only those in user.assignedClasses
  const myStudents = students.filter(student =>
    assignedClasses.some(assignment => {
      return student.class === assignment.className && student.stream === assignment.streamName;
    })
  );

  // Get my timetable entries based on assigned classes
  const myTimetables = timetables.filter(entry => 
    assignedClasses.some(assignment => 
      entry.className === assignment.className && entry.streamName === assignment.streamName
    )
  );

  // Get current class
  const getCurrentClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    return myTimetables.find(entry => {
      if (entry.day !== currentDay) return false;
      const [startHour, startMin] = entry.startTime.split(':').map(Number);
      const [endHour, endMin] = entry.endTime.split(':').map(Number);
      const startTime = startHour * 100 + startMin;
      const endTime = endHour * 100 + endMin;
      
      return currentTime >= startTime && currentTime < endTime;
    });
  };

  // Get next class
  const getNextClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    return myTimetables
      .filter(entry => entry.day === currentDay)
      .find(entry => {
        const [startHour, startMin] = entry.startTime.split(':').map(Number);
        const startTime = startHour * 100 + startMin;
        return currentTime < startTime;
      });
  };

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const todayClasses = myTimetables.filter(entry => 
    entry.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* AI Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-indigo-100 px-4 py-2 rounded-lg">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <span className="text-indigo-800 font-medium">Super Teacher</span>
          </div>
        </div>
      </div>

      {/* Assigned Classes Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Assigned Classes</h3>
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        {assignedClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClasses.map((assignment: any, index: number) => (
              <div key={assignment.id || index} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">{assignment.className}</h4>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {assignment.isMainTeacher ? 'Main Teacher' : 'Subject Teacher'}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-2">Stream: {assignment.streamName}</p>
                {assignment.subjects && assignment.subjects.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-blue-600 font-medium mb-1">Subjects:</p>
                    <div className="flex flex-wrap gap-1">
                      {assignment.subjects.map((subject: string, subIndex: number) => (
                        <span key={subIndex} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-blue-600">
                  Class ID: {assignment.classId} • Stream ID: {assignment.streamId}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No classes assigned yet</p>
            <p className="text-sm text-gray-400">Contact the administrator to get assigned to classes</p>
          </div>
        )}
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Class</h3>
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          {currentClass ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">{currentClass.subject}</p>
              <p className="text-gray-600">{currentClass.className} - Stream {currentClass.streamName}</p>
              <p className="text-sm text-gray-500">
                Time: {currentClass.startTime} - {currentClass.endTime}
              </p>
              <p className="text-sm text-gray-500">Room: {currentClass.room}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No class currently</p>
              <p className="text-sm text-gray-400">Free period</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Next Class</h3>
            <Calendar className="h-5 w-5 text-orange-600" />
          </div>
          {nextClass ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold text-orange-600">{nextClass.subject}</p>
              <p className="text-gray-600">{nextClass.className} - Stream {nextClass.streamName}</p>
              <p className="text-sm text-gray-500">
                Time: {nextClass.startTime} - {nextClass.endTime}
              </p>
              <p className="text-sm text-gray-500">Room: {nextClass.room}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No more classes today</p>
              <p className="text-sm text-gray-400">Day completed</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">{myStudents.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-blue-600">Across all streams</span>
          </div>
        </div>

        <div className="bg-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Assigned Streams</p>
              <p className="text-3xl font-bold text-purple-900">{user?.assignedStreams?.length || 0}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-purple-600">Multiple classes</span>
          </div>
        </div>

        <div className="bg-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Today's Classes</p>
              <p className="text-3xl font-bold text-green-900">{todayClasses.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">Scheduled today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Hours</p>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(myTimetables.reduce((total, entry) => total + entry.duration, 0) / 60)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Hours per week</span>
          </div>
        </div>
      </div>

      {/* Assigned Streams */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Assigned Streams</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.assignedStreams?.map((stream, index) => {
              const [className, streamName] = stream.split(' ');
              const streamStudents = students.filter(s => s.class === className && s.stream === streamName);
              const streamClasses = myTimetables.filter(t => t.className === className && t.streamName === streamName);
              
              return (
                <div key={index} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-indigo-900">{stream}</h4>
                    <span className="text-sm text-indigo-600">{streamStudents.length} students</span>
                  </div>
                  <p className="text-sm text-indigo-700">{streamClasses.length} classes/week</p>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(streamClasses.map(c => c.subject))].map((subject, idx) => (
                        <span key={idx} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((classEntry) => (
            <div key={classEntry.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{classEntry.startTime}</p>
                    <p className="text-xs text-gray-500">{classEntry.endTime}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{classEntry.subject}</h4>
                    <p className="text-sm text-gray-500">
                      {classEntry.className} - Stream {classEntry.streamName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{classEntry.room}</p>
                  <p className="text-xs text-gray-500">{classEntry.duration} min</p>
                </div>
              </div>
            </div>
          ))}
          {todayClasses.length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperTeacherDashboard;