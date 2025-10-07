import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Users, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Search, 
  DollarSign,
  TrendingUp,
  Calendar,
  Heart,
  FileText,
  MessageSquare,
  X,
  Send,
  Paperclip
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeeklyReport, MessageAttachment } from '../../types';

const NurseDashboard: React.FC = () => {
  const { students, clinicRecords, messages, addMessage, weeklyReports, deleteWeeklyReport, fetchWeeklyReports } = useData() as any;
  const { user, users } = useAuth();
  const navigate = useNavigate();
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<any[]>([]);
  
  // Report writing states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    category: 'general'
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  const normalizeReport = (r: any) => {
    const userId = r.userId ?? r.user_id ?? r.userid;
    const submittedAt = r.submittedAt ?? r.submitted_at ?? r.createdAt ?? r.created_at ?? r.date;
    const weekStart = r.weekStart ?? r.week_start;
    const weekEnd = r.weekEnd ?? r.week_end;
    const attachments: MessageAttachment[] = Array.isArray(r.attachments) ? r.attachments : [];
    return {
      ...r,
      userId,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      weekStart: weekStart ? new Date(weekStart) : new Date(),
      weekEnd: weekEnd ? new Date(weekEnd) : new Date(),
      attachments
    } as WeeklyReport & { attachments?: MessageAttachment[] } as any;
  };

  const normalizedReports = (weeklyReports || []).map(normalizeReport);

  // Reports authored by current nurse (from weeklyReports)
  const myReportsAll = normalizedReports.filter((r: any) => String(r.userId) === String(user?.id));
  const myActiveReports = myReportsAll.filter((r: any) => r.status !== 'deleted').sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const myTrashedReports = myReportsAll.filter((r: any) => r.status === 'deleted').sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Group by month (YYYY-MM) for active reports
  const reportsByMonth = myActiveReports.reduce((acc: Record<string, WeeklyReport[]>, r: any) => {
    const d = new Date(r.submittedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {} as Record<string, WeeklyReport[]>);
  const monthKeys = Object.keys(reportsByMonth).sort().reverse();
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const toggleMonth = (key: string) => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));
  const colorClasses = [
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-purple-50 border-purple-200',
    'bg-yellow-50 border-yellow-200',
    'bg-pink-50 border-pink-200',
    'bg-indigo-50 border-indigo-200'
  ];

  // Get admin users for report submission
  const adminUsers = users.filter(u => 
    u.role?.toLowerCase() === 'admin' || 
    u.role?.toLowerCase() === 'superuser'
  );

  // Safety checks to prevent crashes
  if (!students || !clinicRecords || !messages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading nurse dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate clinic statistics
  const totalStudents = students.filter(student => 
    clinicRecords.some(record => record.studentId === student.id)
  ).length;
  const totalVisits = clinicRecords.length;
  const todayVisits = clinicRecords.filter(record => {
    const today = new Date().toDateString();
    return new Date(record.visitDate).toDateString() === today;
  }).length;
  
  const pendingFollowUps = clinicRecords.filter(record => 
    record.followUpRequired && 
    record.followUpDate && 
    new Date(record.followUpDate) > new Date()
  ).length;

  const totalRevenue = clinicRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  const monthlyRevenue = clinicRecords
    .filter(record => {
      const recordDate = new Date(record.visitDate);
      const currentMonth = new Date();
      return recordDate.getMonth() === currentMonth.getMonth() && 
             recordDate.getFullYear() === currentMonth.getFullYear();
    })
    .reduce((sum, record) => sum + (record.cost || 0), 0);

  // Get recent clinic visits
  useEffect(() => {
    const recent = clinicRecords
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
      .slice(0, 5);
    setRecentVisits(recent);
  }, [clinicRecords]);

  // Get upcoming follow-ups
  useEffect(() => {
    const followUps = clinicRecords
      .filter(record => 
        record.followUpRequired && 
        record.followUpDate && 
        new Date(record.followUpDate) > new Date()
      )
      .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
      .slice(0, 5);
    setUpcomingFollowUps(followUps);
  }, [clinicRecords]);

  // Get unread messages for nurse
  const unreadMessageCount = messages.filter(m => m.to === user?.id && !m.read).length;

  // Chart data preparation with better handling
  const resolvedCount = clinicRecords.filter(r => r.status === 'resolved').length;
  const activeCount = clinicRecords.filter(r => r.status === 'active').length;
  const followUpCount = clinicRecords.filter(r => r.status === 'follow-up').length;
  
  console.log('📊 Pie Chart Data:', { 
    resolvedCount, 
    activeCount, 
    followUpCount, 
    totalRecords: clinicRecords.length,
    allStatuses: clinicRecords.map(r => r.status),
    recordsWithFollowUp: clinicRecords.filter(r => r.followUpRequired),
    recordsWithFollowUpStatus: clinicRecords.filter(r => r.status === 'follow-up')
  });
  
  const pieChartData = [
    { name: 'Resolved', value: resolvedCount, color: '#10B981' },
    { name: 'Active', value: activeCount, color: '#3B82F6' },
    { name: 'Follow-up', value: followUpCount, color: '#F59E0B' }
  ].filter(item => item.value > 0); // Only show segments with data

  // Line chart data - visits by day for last 7 days
  const lineChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayVisits = clinicRecords.filter(record => {
      const recordDate = new Date(record.visitDate);
      return recordDate.toDateString() === date.toDateString();
    }).length;
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      visits: dayVisits,
      date: date.toLocaleDateString()
    };
  });

  // Handle report submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || adminUsers.length === 0) return;

    setIsSubmittingReport(true);
    try {
      // Send report to all admin users
      const reportPromises = adminUsers.map(admin => 
        addMessage({
          from: user.id,
          to: admin.id,
          title: `[NURSE REPORT] ${reportForm.title}`,
          content: `Category: ${reportForm.category}\nPriority: ${reportForm.priority}\n\n${reportForm.content}`,
          date: new Date(),
          read: false,
          type: 'report'
        })
      );

      await Promise.all(reportPromises);
      
      // Reset form and close modal
      setReportForm({
        title: '',
        content: '',
        priority: 'normal',
        category: 'general'
      });
      setShowReportModal(false);
      
      // Show success message (you can add a toast notification here)
      alert('Report submitted successfully to all administrators!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Quick Action handlers
  const handleSearchStudents = () => {
    navigate('/students');
  };

  const handleViewReports = () => {
    navigate('/weekly-reports');
  };

  const handleViewAllRecords = () => {
    navigate('/clinic');
  };

  const handleSendMessage = () => {
    navigate('/messages');
  };

  const handleEmergencyProtocol = () => {
    setShowEmergencyModal(true);
  };

  const handleWriteReport = () => {
    setShowReportModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* AI Header */}
        <div className="bg-gradient-to-br from-white via-pink-50/30 to-rose-50/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Stethoscope className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent">
                  Nurse Portal
                </h1>
                <p className="text-lg font-medium text-gray-700">
                  Welcome back, {user?.name || 'Nurse'}. Here's your clinic overview.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Generated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/50 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-emerald-300/20 to-green-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    Total
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {totalStudents}
                </div>
                <div className="text-sm text-gray-600 font-medium">Students with Clinic Records</div>
              </div>
            </div>
          </div>

          {/* Today's Visits Card */}
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    Today
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {todayVisits}
                </div>
                <div className="text-sm text-gray-600 font-medium">Today's Visits</div>
              </div>
            </div>
          </div>

          {/* Total Visits Card */}
          <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    All Time
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {totalVisits}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Visits</div>
              </div>
            </div>
          </div>

          {/* Pending Follow-ups Card */}
          <div className="bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 backdrop-blur-sm border border-amber-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-amber-300/20 to-yellow-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    Pending
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {pendingFollowUps}
                </div>
                <div className="text-sm text-gray-600 font-medium">Pending Follow-ups</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Generated Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Card */}
          <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    This Month
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  UGX {monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Monthly Revenue</div>
              </div>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-600 bg-white/50 rounded-lg px-2 py-1 backdrop-blur-sm">
                    All Time
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  UGX {totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Generated Charts & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Visit Status Pie Chart */}
          <div className="bg-gradient-to-br from-white via-pink-50/30 to-rose-50/30 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20 relative overflow-hidden">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-lg"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Visit Status Distribution</h2>
                    <p className="text-sm text-gray-600">Current clinic visit statuses</p>
                  </div>
                </div>
              </div>
              
              <div className="h-64">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={pieChartData.length > 1 ? 5 : 0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Visits']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Activity className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No clinic records yet</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-4 mt-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-800">({item.value})</span>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              {pieChartData.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-gray-700">{pieChartData.reduce((sum, item) => sum + item.value, 0)}</span> visits
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Visits Line Chart */}
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20 relative overflow-hidden">
            {/* AI Design Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Daily Visits Trend</h2>
                    <p className="text-sm text-gray-600">Last 7 days clinic activity</p>
                  </div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Visits']}
                      labelFormatter={(label: any, payload: any) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.date;
                        }
                        return label;
                      }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Protocol & Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border-2 border-emerald-200">
          <div className="p-6 border-b border-emerald-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-800">Emergency Response & Quick Actions</h2>
            </div>
            <p className="text-emerald-700">Access emergency protocols, first aid guides, and essential nursing tools</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={handleSendMessage}
                className="flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                <span className="font-medium">Send Message</span>
              </button>
              
              <button 
                onClick={handleEmergencyProtocol}
                className="flex items-center justify-center p-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer border-2 border-emerald-400 hover:border-emerald-300"
              >
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mr-3 mb-2 mx-auto" />
                  <div className="font-bold text-lg">Emergency Protocol</div>
                  <div className="text-sm opacity-90">First Aid & Response Guide</div>
                </div>
              </button>
              
              <button 
                onClick={handleViewAllRecords}
                className="flex items-center justify-center p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Users className="h-5 w-5 mr-2" />
                <span className="font-medium">View All Records</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {unreadMessageCount > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800">
                You have {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* My Submitted Reports (Grouped) */}
        <div className="mt-8 rounded-lg shadow border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-6 border-b border-blue-200 flex items-center justify-between rounded-t-lg">
            <h2 className="text-lg font-semibold text-blue-800">Reports</h2>
          </div>
          <div className="p-6">
            {monthKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No reports submitted yet.</div>
            ) : (
              <div className="space-y-4">
                {monthKeys.map((key) => {
                  const [year, month] = key.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month)-1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
                  const reports = reportsByMonth[key];
                  const isOpen = !!openMonths[key];
                  return (
                    <div key={key} className="border rounded-lg">
                      <button
                        onClick={() => toggleMonth(key)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-semibold text-gray-700">{monthName}</span>
                        <span className="text-xs text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''} {isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reports.map((rep: any, idx: number) => (
                              <button
                                key={rep.id}
                                onClick={() => setSelectedReport(rep)}
                                className={`text-left border rounded-lg p-4 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${colorClasses[idx % colorClasses.length]}`}
                              >
                                <div className="text-sm text-gray-600">{new Date(rep.submittedAt).toLocaleString()}</div>
                                <div className="font-semibold text-gray-900 mt-1">{(rep.content?.split('\n')[0] || '').replace('Title: ','') || 'Report'}</div>
                                <p className="text-sm text-gray-700 mt-2 line-clamp-3">{rep.content}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{(selectedReport.content?.split('\n')[0] || '').replace('Title: ','') || 'Report'}</h3>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Submitted: {new Date(selectedReport.submittedAt as any).toLocaleString()} • Week: {new Date(selectedReport.weekStart as any).toLocaleDateString()} - {new Date(selectedReport.weekEnd as any).toLocaleDateString()}
              </div>
              <pre className="whitespace-pre-wrap text-gray-800 text-sm border rounded-lg p-4 bg-gray-50">{selectedReport.content}</pre>
              {Array.isArray((selectedReport as any).attachments) && (selectedReport as any).attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(selectedReport as any).attachments.map((att: any) => (
                    <img key={att.url} src={att.url} alt={att.name} className="w-full h-40 object-cover rounded" />
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
                <div className="space-x-2">
                  <button
                    onClick={async () => {
                      // Soft delete: mark as deleted
                      try {
                        await fetch('http://localhost:5000/api/reports/weekly/' + (selectedReport as any).id, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'deleted' })
                        });
                        if (fetchWeeklyReports) await fetchWeeklyReports();
                        setSelectedReport(null);
                      } catch (e) {
                        console.error('Soft delete failed', e);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Move to Trash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trash Section */}
        <div className="mt-8 rounded-lg shadow border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50">
          <div className="p-6 border-b border-rose-200 flex items-center justify-between rounded-t-lg">
            <h2 className="text-lg font-semibold text-rose-800">Trash</h2>
          </div>
          <div className="p-6">
            {myTrashedReports.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No items in trash.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTrashedReports.map((rep: any) => (
                  <div key={rep.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{new Date(rep.submittedAt).toLocaleString()}</div>
                        <div className="font-semibold text-gray-900">{(rep.content?.split('\n')[0] || '').replace('Title: ','') || 'Report'}</div>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={async () => {
                            // Restore
                            try {
                              await fetch('http://localhost:5000/api/reports/weekly/' + rep.id, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'submitted' })
                              });
                              if (fetchWeeklyReports) await fetchWeeklyReports();
                            } catch (e) { console.error('Restore failed', e); }
                          }}
                          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                        >
                          Restore
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              if (deleteWeeklyReport) await deleteWeeklyReport(rep.id);
                              if (fetchWeeklyReports) await fetchWeeklyReports();
                            } catch (e) { console.error('Permanent delete failed', e); }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Writing Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Write Report to Administrators</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={reportForm.title}
                  onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter report title..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({...reportForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="medical">Medical</option>
                    <option value="emergency">Emergency</option>
                    <option value="equipment">Equipment</option>
                    <option value="staffing">Staffing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={reportForm.priority}
                    onChange={(e) => setReportForm({...reportForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={reportForm.content}
                  onChange={(e) => setReportForm({...reportForm, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the situation, findings, or concerns..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This report will be sent to all administrators and superusers in the system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Emergency Protocol Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-emerald-200 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-emerald-800">Emergency Protocol & First Aid Guide</h2>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-emerald-600 hover:text-emerald-800 transition-colors p-2 hover:bg-emerald-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Emergency Response */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-lg">
                  <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Immediate Emergency Response
                  </h3>
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li className="font-semibold">Assess the situation and ensure student safety</li>
                    <li className="font-semibold">Call emergency services (911) if life-threatening</li>
                    <li className="font-semibold">Notify school administrators immediately</li>
                    <li className="font-semibold">Provide appropriate first aid treatment</li>
                    <li className="font-semibold">Document incident in Clinic Records</li>
                    <li className="font-semibold">Contact parent/guardian as required</li>
                  </ol>
                </div>

                <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-lg">
                  <h3 className="text-xl font-bold text-orange-700 mb-4 flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Emergency Contacts
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                      <span className="font-semibold">Ambulance:</span>
                      <span className="text-orange-600 font-bold">911</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                      <span className="font-semibold">School Admin:</span>
                      <span className="text-orange-600 font-bold">Ext. 100</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                      <span className="font-semibold">Nearest Hospital:</span>
                      <span className="text-orange-600 font-bold">City General</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                      <span className="font-semibold">Poison Control:</span>
                      <span className="text-orange-600 font-bold">1-800-222-1222</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - First Aid Procedures */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-lg">
                  <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    First Aid Procedures
                  </h3>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-semibold text-blue-600 mb-2">🩸 Bleeding & Cuts</h4>
                      <p className="text-sm text-gray-600">Apply direct pressure with clean cloth, elevate if possible, clean with antiseptic, apply sterile bandage</p>
                    </div>
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-semibold text-blue-600 mb-2">🦴 Fractures & Sprains</h4>
                      <p className="text-sm text-gray-600">Immobilize the area, apply ice pack, elevate, seek medical attention immediately</p>
                    </div>
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-semibold text-blue-600 mb-2">🤢 Nausea & Vomiting</h4>
                      <p className="text-sm text-gray-600">Keep student hydrated, rest in cool area, monitor for dehydration symptoms</p>
                    </div>
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-semibold text-blue-600 mb-2">😵 Dizziness & Fainting</h4>
                      <p className="text-sm text-gray-600">Lay flat, elevate legs, ensure airway is clear, monitor consciousness</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">🔥 Burns</h4>
                      <p className="text-sm text-gray-600">Cool with running water for 10-20 minutes, cover with sterile dressing, do not pop blisters</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-lg">
                  <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Vital Signs Monitoring
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-700">Temperature</div>
                      <div className="text-gray-600">Normal: 97-99°F</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-700">Pulse</div>
                      <div className="text-gray-600">Normal: 60-100 bpm</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-700">Blood Pressure</div>
                      <div className="text-gray-600">Normal: 90/60-120/80</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-700">Respirations</div>
                      <div className="text-gray-600">Normal: 12-20/min</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Additional Information */}
            <div className="mt-8 bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-lg">
              <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documentation & Follow-up
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-600 mb-2">📝 Incident Report</h4>
                  <ul className="space-y-1">
                    <li>• Date, time, and location</li>
                    <li>• Student identification</li>
                    <li>• Description of incident</li>
                    <li>• First aid provided</li>
                    <li>• Witness statements</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-600 mb-2">🏥 Medical Assessment</h4>
                  <ul className="space-y-1">
                    <li>• Vital signs recorded</li>
                    <li>• Symptoms documented</li>
                    <li>• Treatment administered</li>
                    <li>• Medication given</li>
                    <li>• Follow-up required</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-600 mb-2">📞 Communication</h4>
                  <ul className="space-y-1">
                    <li>• Parent/guardian notified</li>
                    <li>• Administrator informed</li>
                    <li>• Emergency services if needed</li>
                    <li>• Medical professional consulted</li>
                    <li>• Incident report filed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-6 py-3 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors font-semibold"
              >
                Close Protocol
              </button>
              <button
                onClick={() => { setShowEmergencyModal(false); navigate('/clinic'); }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Open Clinic Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseDashboard;
