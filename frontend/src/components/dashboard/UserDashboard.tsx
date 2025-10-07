import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../common/NotificationProvider';
import { useRestrictedAccess } from '../../hooks/useRestrictedAccess';
import RestrictedAccess from '../common/RestrictedAccess';
import { 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  MessageSquare, 
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Memoized chart component to prevent flickering
const MemoizedClassChart = React.memo(({ data }: { data: { name: string; students: number }[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <defs>
          <linearGradient id="classGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.3}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="#6B7280"
          fontSize={12}
          fontWeight={500}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          fontWeight={500}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
          formatter={(value: any, name: any) => [
            `${value} students`, 
            name
          ]}
        />
        <Bar 
          dataKey="students" 
          fill="url(#classGradient)"
          stroke="#8B5CF6"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          className="drop-shadow-lg"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

MemoizedClassChart.displayName = 'MemoizedClassChart';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, messages, attendanceRecords, fetchAttendanceRecords, forceRefresh } = useData();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { shouldShowRestrictedAccess } = useRestrictedAccess();

  // Fetch attendance records for today when component mounts
  React.useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      fetchAttendanceRecords(today);
    }
  }, [user, fetchAttendanceRecords]);

  // Set loading to false when data is ready
  React.useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await forceRefresh();
      const today = new Date().toISOString().split('T')[0];
      await fetchAttendanceRecords(today);
      showSuccess('🔄 Dashboard Refreshed!', 'All data has been updated successfully!', 3000);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showError('Refresh Failed', 'Failed to refresh dashboard data. Please try again.', 4000);
    } finally {
      setIsRefreshing(false);
    }
  }, [forceRefresh, fetchAttendanceRecords, showSuccess, showError]);

  // Filter students based on teacher's assigned classes/streams
  const myStudents = React.useMemo(() => {
    if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
      // Check for new assignedClasses structure first
      if (user.assignedClasses) {
        try {
          const assignedClasses = typeof user.assignedClasses === 'string' 
            ? JSON.parse(user.assignedClasses) 
            : user.assignedClasses;
          
          // Remove console.log to prevent re-renders
          
          if (assignedClasses && assignedClasses.length > 0) {
            const filteredStudents = students.filter(student => 
              assignedClasses.some((assignment: any) => 
                assignment.className === student.class && assignment.streamName === student.stream
              )
            );
            return filteredStudents;
          }
        } catch (error) {
          console.error('❌ Error parsing assignedClasses:', error);
        }
      }
      
      // Fallback to old assignedStream logic
      if (user.assignedStream) {
        try {
          const [className, streamName] = user.assignedStream.split(' ');
          // Remove console.log to prevent re-renders
          
          if (className && streamName) {
            const filteredStudents = students.filter(student => 
              student.class === className && student.stream === streamName
            );
            // Remove console.log to prevent re-renders
            return filteredStudents;
          }
        } catch (error) {
          console.error('❌ Error parsing assignedStream:', error);
        }
      }
      
      // Fallback to assignedStreams array
      if (user.assignedStreams && user.assignedStreams.length > 0) {
        try {
          // Remove console.log to prevent re-renders
          
          const filteredStudents = students.filter(student => {
            return user.assignedStreams.some(stream => {
              const [className, streamName] = stream.split(' ');
              return student.class === className && student.stream === streamName;
            });
          });
          // Remove console.log to prevent re-renders
          return filteredStudents;
        } catch (error) {
          console.error('❌ Error parsing assignedStreams:', error);
        }
      }
      
      // Remove console.log to prevent re-renders
      // SECURITY FIX: If teacher has no assigned classes, return empty array
      return [];
    }
    
    // For non-teachers, return all students (admin, etc.)
    return students;
  }, [students, user]);

  // Memoize attendance calculations for better performance
  const attendanceStats = useMemo(() => {
    // Use local date string to avoid timezone-related day shifts
    const todayLocal = new Date().toDateString();
    
    const todayAttendance = attendanceRecords.filter(record => {
      const recordDateLocal = new Date(record.date).toDateString();
      return recordDateLocal === todayLocal &&
             myStudents.some(student => String(student.id) === String(record.studentId));
    });

    // Remove duplicates by keeping the latest record per student
    const uniqueRecords = new Map();
    todayAttendance.forEach(record => {
      const existingRecord = uniqueRecords.get(record.studentId);
      if (!existingRecord) {
        // First record for this student
        uniqueRecords.set(record.studentId, record);
      } else {
        // Check if this record is newer
        const existingDate = new Date(existingRecord.updatedAt || existingRecord.createdAt || existingRecord.date);
        const currentDate = new Date(record.updatedAt || record.createdAt || record.date);
        
        if (currentDate > existingDate) {
          uniqueRecords.set(record.studentId, record);
        }
      }
    });

    const uniqueTodayAttendance = Array.from(uniqueRecords.values());

    const totalStudents = myStudents.length;
    const presentToday = uniqueTodayAttendance.filter(record => record.status === 'present').length;
    const lateToday = uniqueTodayAttendance.filter(record => record.status === 'late').length;
    const absentToday = uniqueTodayAttendance.filter(record => record.status === 'absent').length;
    
    // Calculate attendance rate based on marked students
    const markedStudents = presentToday + lateToday + absentToday;
    const notMarkedToday = Math.max(0, totalStudents - markedStudents); // Prevent negative values
    const averageAttendance = markedStudents > 0 ? Math.round(((presentToday + lateToday) / markedStudents) * 100) : 0;
    
    return {
      totalStudents,
      presentToday,
      lateToday,
      absentToday,
      notMarkedToday,
      averageAttendance
    };
  }, [attendanceRecords, myStudents]);

  // Memoize other calculations
  const totalReports = useMemo(() => myStudents.length * 2, [myStudents.length]);
  const unreadMessages = useMemo(() => messages.filter(m => !m.read).length, [messages]);

  const stats = [
    {
      title: 'Total Students',
      value: attendanceStats.totalStudents,
      change: attendanceStats.totalStudents > 0 ? `+${attendanceStats.totalStudents}` : '0',
      icon: Users,
      color: 'bg-blue-500',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Present Today',
      value: attendanceStats.presentToday,
      change: attendanceStats.presentToday > 0 ? `+${attendanceStats.presentToday}` : '0',
      icon: CheckCircle,
      color: 'bg-green-500',
      changeColor: 'text-green-600'
    },
    {
      title: 'Late Today',
      value: attendanceStats.lateToday,
      change: attendanceStats.lateToday > 0 ? `+${attendanceStats.lateToday}` : '0',
      icon: Clock,
      color: 'bg-orange-500',
      changeColor: 'text-orange-600'
    },
    {
      title: 'Absent Today',
      value: attendanceStats.absentToday,
      change: attendanceStats.absentToday > 0 ? `+${attendanceStats.absentToday}` : '0',
      icon: AlertCircle,
      color: 'bg-red-500',
      changeColor: 'text-red-600'
    },
    {
      title: 'Not Marked',
      value: attendanceStats.notMarkedToday,
      change: attendanceStats.notMarkedToday > 0 ? `+${attendanceStats.notMarkedToday}` : '0',
      icon: Users,
      color: 'bg-gray-500',
      changeColor: 'text-gray-600'
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceStats.averageAttendance}%`,
      change: attendanceStats.averageAttendance > 0 ? `+${attendanceStats.averageAttendance}%` : '0%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      changeColor: 'text-purple-600'
    }
  ];

  // Memoize class distribution data to prevent flickering
  const classDistributionData = useMemo(() => {
    return myStudents.reduce((acc, student) => {
    const className = student.class || 'Unassigned';
    const existing = acc.find(item => item.name === className);
    if (existing) {
      existing.students += 1;
    } else {
      acc.push({ name: className, students: 1 });
    }
    return acc;
  }, [] as { name: string; students: number }[]);
  }, [myStudents]);

  // Memoize summary stats to prevent unnecessary recalculations
  const summaryStats = useMemo(() => ({
    classes: classDistributionData.length,
    students: myStudents.length,
    avgPerClass: classDistributionData.length > 0 ? Math.round(myStudents.length / classDistributionData.length) : 0
  }), [classDistributionData.length, myStudents.length]);

  // Create stable data reference to prevent unnecessary re-renders
  const stableChartData = useMemo(() => {
    return classDistributionData.map(item => ({ ...item }));
  }, [classDistributionData]);

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record student attendance for today',
      icon: Calendar,
      color: 'bg-green-100 text-green-800',
      href: '/attendance'
    },
    {
      title: 'View Students',
      description: 'See all your assigned students',
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      href: '/students'
    },
    // Only show Generate Reports if teacher has assigned classes
    ...(myStudents.length > 0 ? [{
      title: 'Generate Reports',
      description: 'Create student report cards',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800',
      href: '/reports'
    }] : []),
    // Always show Enter Marks for teachers (even without assigned classes)
    {
      title: 'Enter Marks',
      description: 'Enter and edit student marks',
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-800',
      href: '/teacher-marks'
    },
    // Always show My Scheduling for teachers
    {
      title: 'My Scheduling',
      description: 'View your teaching schedule',
      icon: Clock,
      color: 'bg-indigo-100 text-indigo-800',
      href: '/teacher-scheduling'
    },
    {
      title: 'Messages',
      description: 'Check and send messages',
      icon: MessageSquare,
      color: 'bg-indigo-100 text-indigo-800',
      href: '/messages'
    },
    {
      title: 'Resources',
      description: 'Access teaching materials',
      icon: BookOpen,
      color: 'bg-teal-100 text-teal-800',
      href: '/class-resources'
    }
  ];

  const recentStudents = myStudents.slice(0, 5);

  // Show loading spinner while data is being processed
  if (isLoading || !user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  // Show restricted access if user has no privileges
  if (shouldShowRestrictedAccess) {
    return (
      <RestrictedAccess
        title="Dashboard Access Restricted"
        message="You don't have any privileges assigned yet. Please contact an administrator to get access to the dashboard."
        details="An administrator needs to assign you specific privileges based on your role and responsibilities."
        severity="warning"
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold text-gray-900">{user?.role === 'TEACHER' ? 'Teacher' : user?.role} Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Here's your overview.</p>
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
          
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">{user?.role === 'TEACHER' ? 'Teacher' : user?.role}</span>
          </div>
        </div>
      </div>

      {/* Loading message for students data */}
      {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && 
       students.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Loading Student Data</h3>
              <p className="text-blue-700 mt-1">
                Please wait while we load your assigned students and classes...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY WARNING: Teacher without assigned classes - Only show when data is loaded and confirmed no assignments */}
      {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && 
       !isLoading && 
       students.length > 0 && 
       myStudents.length === 0 && 
       !user?.assignedClasses && 
       !user?.assignedStream && 
       (!user?.assignedStreams || user.assignedStreams.length === 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">No Classes Assigned</h3>
              <p className="text-red-700 mt-1">
                You currently don't have any classes or streams assigned to you. 
                This means you cannot see any student data, mark attendance, or access other teacher features.
              </p>
              <p className="text-red-600 mt-2 text-sm">
                <strong>Action Required:</strong> Please contact your school administrator to assign you to specific classes and streams.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI-Designed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color.replace('bg-', 'from-').replace('-500', '-400/20')} to-blue-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300`}></div>
            <div className={`absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr ${stat.color.replace('bg-', 'from-').replace('-500', '-300/20')} to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <div className={`text-xs ${stat.changeColor} bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm`}>
                    {stat.change}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color.replace('bg-', 'from-').replace('-500', '-600')} to-blue-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI-Designed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview - AI Designed Pie Chart */}
        <div className="bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-green-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Today's Attendance
                </h3>
                <p className="text-sm text-gray-600">Student Status Overview</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-[300px] flex items-center justify-center">
                {attendanceStats.totalStudents > 0 ? (
                  <div 
                    key={`pie-chart-${attendanceStats.totalStudents}-${attendanceStats.presentToday}-${attendanceStats.lateToday}-${attendanceStats.absentToday}-${attendanceStats.notMarkedToday}`}
                    className="relative w-60 h-60"
                  >
                    {/* Dynamic CSS Pie Chart with proper recreation */}
                    <div 
                      className="absolute w-full h-full rounded-full"
                      style={{
                        background: `conic-gradient(
                          from 0deg,
                          #10B981 0deg ${(attendanceStats.presentToday / attendanceStats.totalStudents) * 360}deg,
                          #F59E0B ${(attendanceStats.presentToday / attendanceStats.totalStudents) * 360}deg ${((attendanceStats.presentToday + attendanceStats.lateToday) / attendanceStats.totalStudents) * 360}deg,
                          #8B5CF6 ${((attendanceStats.presentToday + attendanceStats.lateToday) / attendanceStats.totalStudents) * 360}deg ${((attendanceStats.presentToday + attendanceStats.lateToday + attendanceStats.absentToday) / attendanceStats.totalStudents) * 360}deg,
                          #6B7280 ${((attendanceStats.presentToday + attendanceStats.lateToday + attendanceStats.absentToday) / attendanceStats.totalStudents) * 360}deg 360deg
                        )`
                      }}
                    ></div>
                    
                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{attendanceStats.totalStudents}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-60 h-60">
                    <div className="text-center text-gray-500">
                      <div className="text-lg font-medium">No Data Available</div>
                      <div className="text-sm">No students assigned</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { name: 'Present', value: attendanceStats.presentToday, color: '#10B981' },
                { name: 'Late', value: attendanceStats.lateToday, color: '#F59E0B' },
                { name: 'Absent', value: attendanceStats.absentToday, color: '#8B5CF6' },
                { name: 'Not Marked', value: attendanceStats.notMarkedToday, color: '#6B7280' }
              ].map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-700 font-medium">{entry.name}</span>
                  <span className="text-gray-500 font-bold">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Distribution - AI Designed Bar Chart */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Students by Class
                </h3>
                <p className="text-sm text-gray-600">Class Distribution</p>
              </div>
            </div>
            
            <div className="relative">
              <MemoizedClassChart data={stableChartData} />
            </div>
            
            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-purple-600">
                  {summaryStats.classes}
                </div>
                <div className="text-xs text-gray-600">Classes</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-pink-600">
                  {summaryStats.students}
                </div>
                <div className="text-xs text-gray-600">Students</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-blue-600">
                  {summaryStats.avgPerClass}
                </div>
                <div className="text-xs text-gray-600">Avg/Class</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                navigate(action.href);
              }}
              className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Students</h2>
        <div className="space-y-4">
          {recentStudents.map((student, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-600">Class: {student.class || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
        <div className="space-y-3">
          {attendanceStats.absentToday > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{attendanceStats.absentToday} students absent today</p>
                <p className="text-sm text-red-700">Check attendance records</p>
              </div>
            </div>
          )}
          {attendanceStats.lateToday > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">{attendanceStats.lateToday} students arrived late today</p>
                <p className="text-sm text-orange-700">Review late arrival reasons</p>
              </div>
            </div>
          )}
          {attendanceStats.notMarkedToday > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Users className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{attendanceStats.notMarkedToday} students not marked yet</p>
                <p className="text-sm text-yellow-700">Complete attendance marking</p>
              </div>
            </div>
          )}
          {unreadMessages > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">{unreadMessages} unread messages</p>
                <p className="text-sm text-blue-700">Check your inbox for updates</p>
              </div>
            </div>
          )}
          {attendanceStats.averageAttendance < 80 && (attendanceStats.presentToday + attendanceStats.lateToday + attendanceStats.absentToday) > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Low attendance rate ({attendanceStats.averageAttendance}%)</p>
                <p className="text-sm text-yellow-700">Consider reaching out to absent students</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;