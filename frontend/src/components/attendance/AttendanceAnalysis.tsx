import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const AttendanceAnalysis: React.FC = React.memo(() => {
  const { students, attendanceRecords, classes } = useData();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [dateRange, setDateRange] = useState('7'); // 7, 30, 90 days
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');

  // Memoize user role and assigned classes to prevent unnecessary re-renders
  const userRole = useMemo(() => user?.role, [user?.role]);
  const userAssignedClasses = useMemo(() => {
    if (!user?.assignedClasses) return [];
    try {
      return typeof user.assignedClasses === 'string' 
        ? JSON.parse(user.assignedClasses) 
        : user.assignedClasses;
    } catch (error) {
      console.error('Error parsing assignedClasses:', error);
      return [];
    }
  }, [user?.assignedClasses]);

  // Calculate attendance statistics for the selected date
  const getAttendanceStats = () => {
    const dateRecords = attendanceRecords.filter(a => 
      a.date.toDateString() === new Date(selectedDate).toDateString()
    );

    // Remove duplicates by keeping the latest record per student
    const uniqueRecords = new Map();
    dateRecords.forEach(record => {
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

    const records = Array.from(uniqueRecords.values());
    
    // For teachers, only count students from their assigned classes
    let relevantStudents = students;
    if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
      if (userAssignedClasses.length > 0) {
        relevantStudents = students.filter(student => 
          userAssignedClasses.some((assignment: any) => 
            assignment.className === student.class && assignment.streamName === student.stream
          )
        );
      } else {
        // SECURITY FIX: If teacher has no assigned classes, return NO STUDENTS
        console.warn(`⚠️ AttendanceAnalysis: Teacher ${user?.name} (${userRole}) has no assigned classes - restricting access to students`);
        relevantStudents = [];
      }
    }
    
    const totalStudents = relevantStudents.length;
    const markedStudents = records.filter(r => 
      relevantStudents.some(s => s.id === r.studentId)
    ).length;
    const presentCount = records.filter(r => 
      relevantStudents.some(s => s.id === r.studentId) && r.status === 'present'
    ).length;
    const lateCount = records.filter(r => 
      relevantStudents.some(s => s.id === r.studentId) && r.status === 'late'
    ).length;
    const absentCount = records.filter(r => 
      relevantStudents.some(s => s.id === r.studentId) && r.status === 'absent'
    ).length;
    const notMarkedCount = Math.max(0, totalStudents - markedStudents); // Prevent negative values
    
    // Calculate attendance rate based on marked students, not total students
    const attendanceRate = markedStudents > 0 ? Math.round(((presentCount + lateCount) / markedStudents) * 100) : 0;

    return {
      total: totalStudents,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      notMarked: notMarkedCount,
      attendanceRate
    };
  };

  // Get attendance by class and stream
  const getAttendanceByClassStream = () => {
    const classStreamData = [];

    // For teachers, only show their assigned classes
    let availableClasses = classes;
    if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
      if (userAssignedClasses.length > 0) {
        // Filter classes to only show assigned ones
        availableClasses = classes.filter(cls => 
          userAssignedClasses.some((assignment: any) => assignment.className === cls.name)
        );
      } else {
        // SECURITY FIX: If teacher has no assigned classes, return NO CLASSES
        console.warn(`⚠️ AttendanceAnalysis: Teacher ${user?.name} (${userRole}) has no assigned classes - restricting access to classes`);
        availableClasses = [];
      }
    }

    availableClasses.forEach(cls => {
      // For teachers, filter streams to only show assigned ones
      let availableStreams = cls.streams;
      if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
        if (userAssignedClasses.length > 0) {
          availableStreams = cls.streams.filter(stream => 
            userAssignedClasses.some((assignment: any) => 
              assignment.className === cls.name && assignment.streamName === stream.name
            )
          );
        }
      }

      availableStreams.forEach(stream => {
        const classStudents = students.filter(s => s.class === cls.name && s.stream === stream.name);
        

        const classAttendance = attendanceRecords.filter(a => {
          const recordDate = new Date(a.date).toDateString();
          const selectedDateStr = new Date(selectedDate).toDateString();
          return recordDate === selectedDateStr && 
                 classStudents.some(s => s.id === a.studentId);
        });



        // Remove duplicates - use a more robust approach
        const uniqueClassRecords = new Map();
        classAttendance.forEach(record => {
          const existingRecord = uniqueClassRecords.get(record.studentId);
          if (!existingRecord) {
            // First record for this student
            uniqueClassRecords.set(record.studentId, record);
          } else {
            // Check if this record is newer
            const existingDate = new Date(existingRecord.updatedAt || existingRecord.createdAt || existingRecord.date);
            const currentDate = new Date(record.updatedAt || record.createdAt || record.date);
            
            if (currentDate > existingDate) {
              uniqueClassRecords.set(record.studentId, record);
            }
          }
        });

        const records = Array.from(uniqueClassRecords.values());
        const totalStudents = classStudents.length;
        const presentCount = records.filter(r => r.status === 'present').length;
        const lateCount = records.filter(r => r.status === 'late').length;
        const absentCount = records.filter(r => r.status === 'absent').length;
        const markedStudents = records.length;
        const notMarkedCount = Math.max(0, totalStudents - markedStudents); // Prevent negative values
        
        // Calculate attendance rate based on marked students, not total students
        const attendanceRate = markedStudents > 0 ? Math.round(((presentCount + lateCount) / markedStudents) * 100) : 0;



        if (totalStudents > 0) {
          classStreamData.push({
            className: cls.name,
            streamName: stream.name,
            totalStudents,
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            notMarked: notMarkedCount,
            attendanceRate
          });
        }
      });
    });

    return classStreamData;
  };

  // Get attendance trends over time
  const getAttendanceTrends = () => {
    const days = parseInt(dateRange);
    const trendData = [];
    
    // For teachers, only count students from their assigned classes
    let relevantStudents = students;
    if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
      if (userAssignedClasses.length > 0) {
        relevantStudents = students.filter(student => 
          userAssignedClasses.some((assignment: any) => 
            assignment.className === student.class && assignment.streamName === student.stream
          )
        );
      }
    }
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = attendanceRecords.filter(a => 
        a.date.toDateString() === date.toDateString()
      );

      // Remove duplicates
      const uniqueRecords = new Map();
      dayRecords.forEach(record => {
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

      const records = Array.from(uniqueRecords.values());
      const totalStudents = relevantStudents.length;
      const markedStudents = records.filter(r => 
        relevantStudents.some(s => s.id === r.studentId)
      ).length;
      const presentCount = records.filter(r => 
        relevantStudents.some(s => s.id === r.studentId) && r.status === 'present'
      ).length;
      const lateCount = records.filter(r => 
        relevantStudents.some(s => s.id === r.studentId) && r.status === 'late'
      ).length;
      const absentCount = records.filter(r => 
        relevantStudents.some(s => s.id === r.studentId) && r.status === 'absent'
      ).length;
      const attendanceRate = markedStudents > 0 ? Math.round(((presentCount + lateCount) / markedStudents) * 100) : 0;

      trendData.push({
        date: dateStr,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendanceRate,
        total: totalStudents
      });
    }

    return trendData;
  };

  // SECURITY DEBUGGING: Log what data is being shown
  if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
    console.log(`🔒 AttendanceAnalysis: Teacher ${user?.name} (${userRole}) - userAssignedClasses:`, userAssignedClasses.length);
    if (userAssignedClasses.length === 0) {
      console.warn(`⚠️ AttendanceAnalysis: Teacher ${user?.name} has no access to any classes or students`);
    }
  }

  // Memoize data calculations to prevent unnecessary re-renders and "shaking"
  const stats = useMemo(() => getAttendanceStats(), [selectedDate, students, attendanceRecords, userRole, userAssignedClasses]);
  const classStreamData = useMemo(() => getAttendanceByClassStream(), [selectedDate, students, attendanceRecords, classes, userRole, userAssignedClasses]);
  const trendData = useMemo(() => getAttendanceTrends(), [dateRange, students, attendanceRecords, userRole, userAssignedClasses]);

  // Chart colors
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  // Export data function
  const exportData = () => {
    const data = {
      date: selectedDate,
      overallStats: stats,
      classStreamBreakdown: classStreamData,
      trends: trendData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-analysis-${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Show assigned classes info for teachers */}
      {(userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') && userAssignedClasses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Your Assigned Classes:</strong> {userAssignedClasses.map((a: any) => `${a.className} - Stream ${a.streamName}`).join(', ')}
          </p>
        </div>
      )}

      {/* SECURITY WARNING: Teacher without assigned classes */}
      {(userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') && userAssignedClasses.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">No Classes Assigned</p>
              <p className="text-xs text-red-700">You cannot access attendance data until you are assigned to specific classes and streams.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStream('');
              }}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {(() => {
                // For teachers, only show their assigned classes
                if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
                  if (userAssignedClasses.length > 0) {
                    const availableClasses = classes.filter(cls => 
                      userAssignedClasses.some((assignment: any) => assignment.className === cls.name)
                    );
                    return availableClasses.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ));
                  }
                }
                
                // For admin/superuser, show all classes
                return classes.map(cls => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
                ));
              })()}
            </select>
            
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              disabled={!selectedClass}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Streams</option>
              {selectedClass && (() => {
                const selectedClassObj = classes.find(c => c.name === selectedClass);
                if (!selectedClassObj) return null;
                
                // For teachers, only show streams from their assigned classes
                if (userRole === 'TEACHER' || userRole === 'SUPER_TEACHER') {
                  if (userAssignedClasses.length > 0) {
                    const availableStreams = selectedClassObj.streams.filter(stream => 
                      userAssignedClasses.some((assignment: any) => 
                        assignment.className === selectedClass && assignment.streamName === stream.name
                      )
                    );
                    return availableStreams.map(stream => (
                      <option key={stream.id} value={stream.name}>{stream.name}</option>
                    ));
                  }
                }
                
                // For admin/superuser, show all streams
                return selectedClassObj.streams.map(stream => (
                <option key={stream.id} value={stream.name}>{stream.name}</option>
                ));
              })()}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChart className="h-4 w-4 inline mr-1" />
              Detailed
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'trends'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LineChart className="h-4 w-4 inline mr-1" />
              Trends
            </button>
          </div>

                    <button
            onClick={exportData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Attendance Rate</p>
                  <p className="text-3xl font-bold text-green-900">{stats.attendanceRate}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {stats.present + stats.late} out of {stats.total} students
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Present</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.present}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-blue-600">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% of total
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Late</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.late}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-orange-600">
                  {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% of total
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Absent</p>
                  <p className="text-3xl font-bold text-red-900">{stats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-red-600">
                  {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% of total
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Distribution - AI Designed Pie Chart */}
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
              {/* AI Design Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Attendance Distribution
                    </h3>
                    <p className="text-sm text-gray-600">Student Status Overview</p>
                  </div>
                </div>
                
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart key={`pie-${selectedDate}-${userRole}`}>
                      <Pie
                        data={[
                          { name: 'Present', value: stats.present, color: '#3B82F6' },
                          { name: 'Late', value: stats.late, color: '#F59E0B' },
                          { name: 'Absent', value: stats.absent, color: '#EF4444' },
                          { name: 'Not Marked', value: stats.notMarked, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        strokeWidth={2}
                      >
                        {[
                          { name: 'Present', value: stats.present, color: '#3B82F6' },
                          { name: 'Late', value: stats.late, color: '#F59E0B' },
                          { name: 'Absent', value: stats.absent, color: '#EF4444' },
                          { name: 'Not Marked', value: stats.notMarked, color: '#6B7280' }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            className="drop-shadow-lg"
                          />
                        ))}
                      </Pie>
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.present + stats.late + stats.absent + stats.notMarked}
                      </div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { name: 'Present', value: stats.present, color: '#3B82F6' },
                    { name: 'Late', value: stats.late, color: '#F59E0B' },
                    { name: 'Absent', value: stats.absent, color: '#EF4444' },
                    { name: 'Not Marked', value: stats.notMarked, color: '#6B7280' }
                  ].map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-gray-700 font-medium">{entry.name}</span>
                      <span className="text-gray-500 ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Class & Stream Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart 
                  data={classStreamData.slice(0, 8)}
                  key={`chart-${selectedDate}-${userRole}`}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    name="Attendance Rate %" 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Class & Stream Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Class & Stream Breakdown</h3>
              <p className="text-sm text-gray-600 mt-1">Attendance statistics for each class and stream combination</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {classStreamData.map((item, index) => (
                  <div key={`${item.className}-${item.streamName}-${selectedDate}`} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {item.className} - {item.streamName}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {item.totalStudents} students
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Present:</span>
                        <span className="font-medium text-green-600">
                          {item.present} ({item.totalStudents > 0 ? Math.round((item.present / item.totalStudents) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Late:</span>
                        <span className="font-medium text-orange-600">
                          {item.late} ({item.totalStudents > 0 ? Math.round((item.late / item.totalStudents) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Absent:</span>
                        <span className="font-medium text-red-600">
                          {item.absent} ({item.totalStudents > 0 ? Math.round((item.absent / item.totalStudents) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Not Marked:</span>
                        <span className="font-medium text-gray-600">
                          {item.notMarked}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Attendance Rate</span>
                        <span className="font-medium">{item.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-gray-700 text-center">
                        <span className="font-medium text-green-600">{item.present + item.late}</span> present out of{' '}
                        <span className="font-medium text-gray-900">{item.totalStudents}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Attendance Trends Over Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
              <p className="text-sm text-gray-600 mt-1">Attendance patterns over the last {dateRange} days</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart 
                  data={trendData}
                  key={`trends-${dateRange}-${userRole}`}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="present" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    name="Present"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="late" 
                    stackId="1" 
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    name="Late"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="absent" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    name="Absent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Rate Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Rate Trend</h3>
              <p className="text-sm text-gray-600 mt-1">Percentage of students present over time</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                  <Line 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Best Day</p>
                  <p className="text-2xl font-bold text-green-900">
                    {trendData.reduce((max, item) => item.attendanceRate > max.attendanceRate ? item : max, trendData[0])?.date || 'N/A'}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {trendData.reduce((max, item) => item.attendanceRate > max.attendanceRate ? item : max, trendData[0])?.attendanceRate || 0}% attendance
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Average Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {trendData.length > 0 ? Math.round(trendData.reduce((sum, item) => sum + item.attendanceRate, 0) / trendData.length) : 0}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-blue-600">
                  Over {trendData.length} days
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Trend</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {trendData.length >= 2 ? 
                      (trendData[trendData.length - 1].attendanceRate > trendData[0].attendanceRate ? '↗️' : '↘️') : '→'
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-purple-600">
                  {trendData.length >= 2 ? 
                    (trendData[trendData.length - 1].attendanceRate > trendData[0].attendanceRate ? 'Improving' : 'Declining') : 'Stable'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Quick Actions</h3>
            <p className="text-sm text-blue-700 mt-1">Common administrative tasks for attendance management</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>View Reports</span>
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AttendanceAnalysis;


