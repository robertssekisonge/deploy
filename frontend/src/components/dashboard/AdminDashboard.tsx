import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { Users, DollarSign, Heart, FileText, TrendingUp, AlertTriangle, CheckCircle, X, Eye, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

import { useAuth } from '../../contexts/AuthContext';
import { startOfDay, endOfDay } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { students, financialRecords, sponsorships, updateSponsorship, updateStudent, messages, fetchStudents, forceRefresh } = useData();
  const { users, user } = useAuth();
  const { showSuccess } = useNotification();
  const [showFinalApprovalModal, setShowFinalApprovalModal] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState<any>(null);

  // Add debugging and error handling
  console.log('AdminDashboard: Component rendering with:', {
    totalStudentsCount: students?.length || 0,
    usersCount: users?.length || 0,
    messagesCount: messages?.length || 0,
    currentUser: user
  });
  
  console.log('AdminDashboard: All students:', students?.map(s => ({ name: s.name, status: s.status })) || []);

  // Debug teacher roles
  console.log('AdminDashboard: All users and their roles:', users?.map(u => ({ id: u.id, name: u.name, role: u.role })));
  console.log('AdminDashboard: Users with TEACHER role:', users?.filter(u => u.role === 'TEACHER'));
  console.log('AdminDashboard: Users with SUPER_TEACHER role:', users?.filter(u => u.role === 'SUPER_TEACHER'));
  console.log('AdminDashboard: Users with USER role:', users?.filter(u => u.role === 'USER'));

  // TEMPORARY: Show a simple dashboard if data is not loading
  if (!students || !users || !messages) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Data Loading Issue</h2>
          <p className="text-yellow-700 mb-4">
            The dashboard data is not loading properly. This might be due to backend connection issues.
          </p>
          <div className="space-y-2 text-sm text-yellow-600">
            <p>Students: {students ? students.length : 'Not loaded'}</p>
            <p>Users: {users ? users.length : 'Not loaded'}</p>
            <p>Messages: {messages ? messages.length : 'Not loaded'}</p>
          </div>
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/sponsorships'} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Sponsorships
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Memoize filtered students to prevent unnecessary recalculations
  const filteredStudents = useMemo(() => {
    const baseStudents = user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'sponsorships-overseer' || user?.role === 'SPONSORSHIP-OVERSEER' 
      ? students 
      : students.filter(s => s.admittedBy === 'admin' || s.admittedBy === 'ADMIN');
    
    // Only count ACTIVE students for dashboard statistics
    return baseStudents.filter(s => s.status === 'active');
  }, [students, user?.role]);

  const totalStudents = filteredStudents.length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalMaleStudents = filteredStudents.filter(s => s.gender === 'Male').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalFemaleStudents = filteredStudents.filter(s => s.gender === 'Female').length;

  const teacherUsers = useMemo(() => 
    users.filter(u => u.role === 'TEACHER' || u.role === 'SUPER_TEACHER'), 
    [users]
  );
  const totalTeachers = teacherUsers.length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalMaleTeachers = teacherUsers.filter(t => t.gender === 'Male').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalFemaleTeachers = teacherUsers.filter(t => t.gender === 'Female').length;

  const totalRevenue = financialRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const activeSponshorships = sponsorships.filter(s => s.status === 'active').length;
  const pendingPayments = financialRecords.filter(r => r.status === 'pending').length;

  // Get recent messages for admin
  const recentMessages = messages
    .filter(m => m.to === user?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const unreadMessageCount = messages.filter(m => m.to === user?.id && !m.read).length;

  // Get recent weekly reports for admin
  const [recentWeeklyReports, setRecentWeeklyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Load weekly reports from backend
  useEffect(() => {
    const loadWeeklyReports = async () => {
      setLoadingReports(true);
      try {
        const response = await fetch('/api/reports/weekly');
        if (response.ok) {
          const data = await response.json();
          const parsedReports = data.map((report: any) => ({
            ...report,
            achievements: report.achievements ? JSON.parse(report.achievements) : [],
            challenges: report.challenges ? JSON.parse(report.challenges) : [],
            nextWeekGoals: report.nextWeekGoals ? JSON.parse(report.nextWeekGoals) : [],
            weekStart: new Date(report.weekStart),
            weekEnd: new Date(report.weekEnd),
            submittedAt: new Date(report.submittedAt)
          }));
          setRecentWeeklyReports(parsedReports.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading weekly reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };

    loadWeeklyReports();
  }, []);

  // Memoize chart data to prevent flickering
  const chartData = useMemo(() => {
    const classDistribution = filteredStudents.reduce((acc, student) => {
      acc[student.class] = (acc[student.class] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(classDistribution).map(([className, count]) => ({
      name: className,
      students: count
    }));
  }, [filteredStudents]);

  const pieData = useMemo(() => [
    { name: 'Paid', value: financialRecords.filter(r => r.status === 'paid').length },
    { name: 'Pending', value: financialRecords.filter(r => r.status === 'pending').length },
    { name: 'Overdue', value: financialRecords.filter(r => r.status === 'overdue').length }
  ], [financialRecords]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const today = new Date();
  const presentToday = useMemo(() => 
    filteredStudents.filter(s => s.attendanceRecords && s.attendanceRecords.some(r => r.status === 'present' && r.date >= startOfDay(today) && r.date <= endOfDay(today))).length,
    [filteredStudents, today]
  );

  // Pending sponsorships for admin approval
  const pendingSponsorships = sponsorships.filter(s => s.status === 'coordinator-approved' || s.status === 'pending-admin-approval');

  // Overseer-admitted students should NOT appear in admin dashboard
  // They only appear in overseer boxes 1-4 and come to admin after completing all 4 boxes

  const handleFinalApproval = (sponsorshipId: string) => {
    const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
    if (sponsorship) {
      updateSponsorship(sponsorshipId, { 
        status: 'active',
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 8)
      });
      
      // Update student status
      updateStudent(sponsorship.studentId, {
        sponsorshipStatus: 'sponsored',
        needsSponsorship: false
      });
    }
    setShowFinalApprovalModal(false);
    setSelectedSponsorship(null);
  };

  const handleRejectSponsorship = (sponsorshipId: string) => {
    updateSponsorship(sponsorshipId, { 
      status: 'cancelled'
    });
    setShowFinalApprovalModal(false);
    setSelectedSponsorship(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <AIRefreshButton
            onClick={async () => {
              await forceRefresh();
              showSuccess('Dashboard Refreshed!', 'All data has been successfully updated from the server.', 3000);
            }}
            variant="dashboard"
            size="md"
            title="Refresh dashboard data"
          >
            Refresh
          </AIRefreshButton>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {totalStudents}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Students</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              📊 Properly admitted students only
          </div>
          </div>
        </div>
        {/* Total Teachers Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-300/20 to-rose-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {totalTeachers}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Teachers</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              👨‍🏫 Teaching staff members
            </div>
          </div>
        </div>
        {/* Total Parents Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-pink-50/50 to-rose-50/50 backdrop-blur-sm border border-pink-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-300/20 to-red-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {users.filter(u => u.role === 'PARENT').length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Parents</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              👨‍👩‍👧‍👦 Parent accounts
            </div>
          </div>
        </div>
        {/* Attendance Today Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {presentToday}
                </div>
                <div className="text-sm text-gray-600 font-medium">Present Today</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ✅ Students in attendance
            </div>
          </div>
        </div>
        {/* Messages Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/50 backdrop-blur-sm border border-yellow-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {messages.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Messages</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              💬 System messages
            </div>
          </div>
        </div>
        {/* Total Revenue Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-teal-50/50 to-emerald-50/50 backdrop-blur-sm border border-teal-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-300/20 to-green-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  UGX {totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              </div>
            </div>
            <div className="text-xs text-green-600 bg-green-50/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              📈 +8% from last month
          </div>
          </div>
        </div>
        {/* Sponsorship Summary Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-red-50/50 to-pink-50/50 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-300/20 to-rose-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {activeSponshorships} Active
                </div>
                <div className="text-sm text-gray-600 font-medium">Sponsorships</div>
              </div>
            </div>
            <div className="text-xs text-green-600 bg-green-50/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ❤️ +3 new this month
          </div>
          </div>
        </div>
        {/* Pending Payments Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-orange-50/50 to-yellow-50/50 backdrop-blur-sm border border-orange-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-300/20 to-red-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {pendingPayments}
                </div>
                <div className="text-sm text-gray-600 font-medium">Pending Payments</div>
              </div>
            </div>
            <div className="text-xs text-orange-600 bg-orange-50/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ⚠️ Requires attention
          </div>
          </div>
        </div>
        {/* Available Sponsorships Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 backdrop-blur-sm border border-indigo-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-300/20 to-violet-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {filteredStudents.filter(s => s.sponsorshipStatus === 'pending' && s.needsSponsorship).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Available for Sponsorship</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🎯 Awaiting sponsors
            </div>
          </div>
        </div>
        {/* Pending Approvals Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/50 backdrop-blur-sm border border-amber-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-300/20 to-orange-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {pendingSponsorships.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Pending Approvals</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ⏳ Awaiting approval
            </div>
          </div>
        </div>
      </div>

      {/* Final Admin Approval Section */}
      {pendingSponsorships.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-600" />
              Final Admin Approval Required
            </h3>
            <p className="text-sm text-gray-600 mt-1">Sponsorships approved by coordinator that need final admin approval</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSponsorships.map(sponsorship => {
                const student = students.find(s => s.id === sponsorship.studentId);
                const sponsor = users.find(u => u.id === sponsorship.sponsorId);
                
                console.log('🔍 Admin Dashboard - Rendering sponsorship:', {
                  sponsorshipId: sponsorship.id,
                  studentId: sponsorship.studentId,
                  sponsorId: sponsorship.sponsorId,
                  student: student ? `${student.name} (${student.id})` : 'NOT FOUND',
                  sponsor: sponsor ? `${sponsor.name} (${sponsor.id})` : 'NOT FOUND',
                  allStudentIds: students.map(s => s.id),
                  allSponsorIds: users.map(u => u.id)
                });
                return (
                  <div key={sponsorship.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-yellow-900">{student?.name || 'Student Not Found'}</h4>
                        <p className="text-sm text-yellow-700">{student?.class || 'Unknown'} - {student?.stream || 'Unknown'}</p>
                        <p className="text-xs text-yellow-600">Access: {student?.accessNumber?.startsWith('None-') ? 'None' : (student?.accessNumber || 'Unknown')}</p>
                        <p className="text-xs text-red-600">Sponsorship ID: {sponsorship.id}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-yellow-700">Sponsor: {sponsor?.name || 'Sponsor Not Found'}</p>
                      <p className="text-sm text-yellow-700">Amount: UGX {sponsorship.amount?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-yellow-700">Duration: {sponsorship.duration || 'Unknown'} months</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSponsorship(sponsorship);
                          setShowFinalApprovalModal(true);
                        }}
                        className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Class - AI Designed Pie Chart */}
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
                <p className="text-sm text-gray-600">Distribution Overview</p>
              </div>
            </div>
            
            <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="students"
                    stroke="none"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(${280 + index * 40}, 70%, 60%)`}
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
                </PieChart>
          </ResponsiveContainer>
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {chartData.reduce((sum, item) => sum + item.students, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: `hsl(${280 + index * 40}, 70%, 60%)` }}
                  ></div>
                  <span className="text-gray-800 font-black">{entry.name}</span>
                  <span className="text-gray-600 font-bold ml-auto">{entry.students}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Status - Enhanced AI Design */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Payment Status
                </h3>
                <p className="text-sm text-gray-600">Financial Overview</p>
              </div>
            </div>
            
            <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                dataKey="value"
                    stroke="none"
                    strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(${200 + index * 60}, 70%, 60%)`}
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
                      `${value} payments`, 
                      name
                    ]}
                  />
            </PieChart>
          </ResponsiveContainer>
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {pieData.reduce((sum, item) => sum + item.value, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: `hsl(${200 + index * 60}, 70%, 60%)` }}
                  ></div>
                  <span className="text-gray-800 font-black">{entry.name}</span>
                  <span className="text-gray-600 font-bold ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <div className="flex items-center space-x-2">
              {unreadMessageCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadMessageCount} unread
                </span>
              )}
              <a
                href="/messages"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </a>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No recent messages
            </div>
          ) : (
            recentMessages.map((message) => (
              <div key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {message.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      From: {message.fromRole || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(message.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {!message.read && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {financialRecords.slice(0, 5).map((record) => (
            <div key={record.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {record.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    UGX {record.amount.toLocaleString()}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'paid' ? 'bg-green-100 text-green-800' :
                    record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Weekly Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Weekly Reports</h3>
          <p className="text-sm text-gray-600 mt-1">Latest teacher submissions</p>
        </div>
        <div className="p-6">
          {loadingReports ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading reports...</p>
            </div>
          ) : recentWeeklyReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No weekly reports submitted yet.</p>
            </div>
          ) : (
            recentWeeklyReports.map((report, index) => (
              <div key={index} className="border-b border-gray-100 last:border-b-0 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {report.teacherName || 'Unknown Teacher'}
                  </h4>
                  <span className="text-sm text-gray-500">
                    Week: {report.weekStart.toLocaleDateString()} - {report.weekEnd.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Submitted: {report.submittedAt.toLocaleDateString()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Achievements:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {report.achievements.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Challenges:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {report.challenges.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Next Week Goals:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {report.nextWeekGoals.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      {/* Final Approval Modal */}
      {showFinalApprovalModal && selectedSponsorship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Final Admin Approval</h3>
              <button
                onClick={() => setShowFinalApprovalModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {(() => {
                const student = students.find(s => s.id === selectedSponsorship.studentId);
                const sponsor = users.find(u => u.id === selectedSponsorship.sponsorId);
                return (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Student:</p>
                      <p className="font-medium">{student?.name}</p>
                      <p className="text-sm text-gray-600">{student?.class} - Stream {student?.stream}</p>
                      <p className="text-sm text-gray-600">Access: {student?.accessNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sponsor:</p>
                      <p className="font-medium">{sponsor?.name}</p>
                      <p className="text-sm text-gray-600">{sponsor?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sponsorship Details:</p>
                      <p className="text-sm">Amount: UGX {selectedSponsorship.amount?.toLocaleString()}</p>
                      <p className="text-sm">Duration: {selectedSponsorship.duration} months</p>
                      <p className="text-sm">Payment Schedule: {selectedSponsorship.paymentSchedule}</p>
                    </div>
                  </>
                );
              })()}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleFinalApproval(selectedSponsorship.id)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                >
                  Final Approve
                </button>
                <button
                  onClick={() => handleRejectSponsorship(selectedSponsorship.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;