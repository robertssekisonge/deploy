import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { 
  Heart, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  PieChart as PieChartIcon, 
  MessageCircle, 
  Stethoscope, 
  DollarSign,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  Activity,
  Target,
  BarChart3,
  Calendar,
  Award,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#F472B6', '#8B5CF6'];

const OverseerDashboard: React.FC = () => {
  const { students, sponsorships, attendanceRecords, clinicRecords, messages, updateSponsorship, forceRefresh } = useData();
  const { users } = useAuth();
  const { showRefresh } = useNotification();
  const navigate = useNavigate();

  // Calculate key metrics
  const sponsoredChildren = students.filter(s => s.sponsorshipStatus === 'sponsored');
  const totalSponsors = users.filter(u => u.role === 'sponsor').length;
  const activeSponsorships = sponsorships.filter(s => s.status === 'active' || s.status === 'sponsored');
  const pendingSponsorships = sponsorships.filter(s => s.status === 'pending');

  // Debug: Log all students and their sponsorship statuses
  console.log('🔍 OverseerDashboard Debug - All Students:', students.map(s => ({
    id: s.id,
    name: s.name,
    sponsorshipStatus: s.sponsorshipStatus,
    needsSponsorship: s.needsSponsorship
  })));

  // Children in different flow stages (buckets may overlap for charts)
  const childrenInFlow = {
    // Box 1: Eligibility Check (includes both 'eligibility-check' and 'awaiting' for overseer students)
    eligibilityCheck: students.filter(s => 
      (s.sponsorshipStatus === 'eligibility-check' || 
       (s.sponsorshipStatus === 'awaiting' && s.admittedBy === 'overseer')) && 
      s.needsSponsorship
    ).length,
    // Box 2: Eligible
    eligible: students.filter(s => s.sponsorshipStatus === 'eligible' && s.needsSponsorship).length,
    // Box 3: Available for Sponsors
    availableForSponsors: students.filter(s => s.sponsorshipStatus === 'available-for-sponsors' && s.needsSponsorship).length,
    // Under Sponsorship Review
    underReview: students.filter(s => s.sponsorshipStatus === 'under-sponsorship-review' && s.needsSponsorship).length,
    // Pending (overseer-admitted)
    pending: students.filter(s => s.sponsorshipStatus === 'pending' && s.needsSponsorship).length,
    // Awaiting (admin-admitted)
    awaiting: students.filter(s => s.sponsorshipStatus === 'awaiting' && s.admittedBy === 'admin' && s.needsSponsorship).length,
    // Coordinator Approved
    coordinatorApproved: students.filter(s => s.sponsorshipStatus === 'coordinator-approved' && s.needsSponsorship).length,
    // Box 4: Pending Requests (from sponsorships pending)
    pendingRequests: sponsorships.filter(s => s.status === 'pending').length,
    // Box 5: Admin Approval (students with coordinator-approved sponsorships)
    pendingAdminApproval: sponsorships.filter(s => s.status === 'coordinator-approved').length,
    // Final: Sponsored
    sponsored: sponsoredChildren.length
  };

  // Debug: Log children in flow breakdown
  console.log('📊 Children in Flow Breakdown:', childrenInFlow);

  // Calculate Admin and Overseer admitted students
  const adminAdmittedStudents = students.filter(s => 
    s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'admin'
  );
  
  const overseerAdmittedStudents = students.filter(s => 
    s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'overseer'
  );

  // Debug: Log admitted students
  console.log('👨‍💼 Admin Admitted Students:', adminAdmittedStudents.map(s => ({
    id: s.id,
    name: s.name,
    sponsorshipStatus: s.sponsorshipStatus,
    admittedBy: s.admittedBy
  })));
  
  console.log('👨‍💻 Overseer Admitted Students:', overseerAdmittedStudents.map(s => ({
    id: s.id,
    name: s.name,
    sponsorshipStatus: s.sponsorshipStatus,
    admittedBy: s.admittedBy
  })));

  // Unique count of children currently in the sponsorship flow (no double counting)
  // Include all students in the sponsorship process, including those who have been sponsored
  const inFlowStatuses = ['eligibility-check', 'eligible', 'available-for-sponsors', 'under-sponsorship-review', 'pending', 'coordinator-approved', 'sponsored'];
  const studentsInFlow = students.filter(s => 
    inFlowStatuses.includes(s.sponsorshipStatus) || 
    (s.sponsorshipStatus === 'awaiting' && s.admittedBy === 'overseer')
  );
  console.log('🎯 Students in Flow:', studentsInFlow.map(s => ({
    id: s.id,
    name: s.name,
    sponsorshipStatus: s.sponsorshipStatus,
    admittedBy: s.admittedBy
  })));
  
  const childrenInFlowCount = new Set(
    studentsInFlow.map(s => s.id)
  ).size;
  
  console.log('🔢 Children in Flow Count:', childrenInFlowCount);

  // Monthly sponsorship trends (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const monthSponsorships = sponsorships.filter(s => {
      const sponsorshipDate = new Date(s.startDate);
      return sponsorshipDate.getMonth() === date.getMonth() && sponsorshipDate.getFullYear() === date.getFullYear();
    });
    return {
      month: monthName,
      sponsorships: monthSponsorships.length,
      amount: monthSponsorships.reduce((sum, s) => sum + (s.amount || 0), 0)
    };
  }).reverse();

  // Sponsorship flow data
  const flowData = [
    { name: 'Eligibility Check', value: childrenInFlow.eligibilityCheck, color: '#F59E0B' }, // Yellow
    { name: 'Eligible', value: childrenInFlow.eligible, color: '#EA580C' }, // Orange
    { name: 'Available for Sponsors', value: childrenInFlow.availableForSponsors, color: '#059669' }, // Green
    { name: 'Pending Requests', value: childrenInFlow.pendingRequests, color: '#7C3AED' }, // Purple
    { name: 'Admin Approval', value: childrenInFlow.pendingAdminApproval, color: '#6366F1' }, // Indigo
    { name: 'Sponsored', value: childrenInFlow.sponsored, color: '#10B981' }, // Emerald
    { name: 'Admin Admitted', value: adminAdmittedStudents.length, color: '#06B6D4' }, // Cyan
    { name: 'Overseer Admitted', value: overseerAdmittedStudents.length, color: '#8B5CF6' }, // Violet
  ];

  // Recent activity
  const recentSponsorships = sponsorships
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  const handleApproveSponsorship = async (sponsorshipId: string) => {
    try {
      // Update sponsorship status to approved
      const updatedSponsorship = {
        ...sponsorships.find(s => s.id === sponsorshipId),
        status: 'coordinator-approved'
      };
      
      // Call the update function from context
      await updateSponsorship(sponsorshipId, updatedSponsorship);
      
      // Show success message
      showSuccess('Sponsorship Approved!', 'Sponsorship request approved successfully!');
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error approving sponsorship:', error);
      showError('Approval Failed', 'Error approving sponsorship request');
    }
  };

  const handleDisapproveSponsorship = async (sponsorshipId: string) => {
    try {
      // Update sponsorship status to disapproved
      const updatedSponsorship = {
        ...sponsorships.find(s => s.id === sponsorshipId),
        status: 'disapproved'
      };
      
      // Call the update function from context
      await updateSponsorship(sponsorshipId, updatedSponsorship);
      
      // Show success message
      showSuccess('Sponsorship Disapproved!', 'Sponsorship request disapproved successfully!');
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error disapproving sponsorship:', error);
      showError('Disapproval Failed', 'Error disapproving sponsorship request');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsorship Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of sponsorship operations and metrics</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-4">
            <AIRefreshButton
              onClick={async () => {
                await forceRefresh();
                showRefresh('Dashboard Refreshed!', 'All sponsorship data has been successfully updated from the server.', 3000);
              }}
              variant="dashboard"
              size="md"
              title="Refresh sponsorship dashboard data"
            >
              Refresh
            </AIRefreshButton>
            <div>
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Designed Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sponsored Children Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 bg-green-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  +12% this month
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {sponsoredChildren.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Sponsored Children</div>
          </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ❤️ {((sponsoredChildren.length / students.length) * 100).toFixed(1)}% of total students
          </div>
          </div>
        </div>

        {/* Total Sponsors Card - AI Designed */}
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
                <div className="text-xs text-blue-600 bg-blue-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Active
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {totalSponsors}
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Sponsors</div>
          </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              👥 {activeSponsorships.length} active sponsorships
          </div>
          </div>
        </div>

        {/* Children in Flow Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-purple-50/50 to-violet-50/50 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-300/20 to-pink-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600 bg-purple-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  In Progress
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {childrenInFlowCount}
              </div>
              <div className="text-sm text-gray-600 font-medium">Children in Flow</div>
          </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🔄 Across all stages
          </div>
          </div>
        </div>

        {/* Pending Requests Card - AI Designed */}
        <div className="bg-gradient-to-br from-white via-orange-50/50 to-amber-50/50 backdrop-blur-sm border border-orange-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-300/20 to-red-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-600 bg-orange-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Requires Action
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {pendingSponsorships.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Pending Requests</div>
          </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ⏳ Awaiting approval
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Flow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sponsorship Flow Chart - AI Designed Pie Chart */}
        <div className="bg-gradient-to-br from-white via-green-50/30 to-teal-50/30 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Sponsorship Flow Breakdown
                </h3>
                <p className="text-sm text-gray-600">Process Distribution</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={flowData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={2}
                  >
                    {flowData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="drop-shadow-lg"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} children`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {flowData.reduce((sum, item) => sum + item.value, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {flowData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-sm">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-800 font-black">{entry.name}</span>
                  <span className="text-gray-600 font-bold">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trends - AI Designed Area Chart */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Monthly Sponsorship Trends
                </h3>
                <p className="text-sm text-gray-600">Growth Analytics</p>
              </div>
            </div>
            
            <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="sponsorshipGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={500}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={500}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} sponsorships`, 
                      name
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sponsorships" 
                    stroke="#10B981" 
                    strokeWidth={6}
                    fill="url(#sponsorshipGradient)"
                    className="drop-shadow-lg"
                  />
                </AreaChart>
          </ResponsiveContainer>
        </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-green-600">
                  {monthlyData.reduce((sum, item) => sum + item.sponsorships, 0)}
                </div>
                <div className="text-sm font-bold text-green-500">Total</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-blue-600">
                  {Math.round(monthlyData.reduce((sum, item) => sum + item.sponsorships, 0) / monthlyData.length)}
                </div>
                <div className="text-sm font-bold text-blue-500">Average</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-purple-600">
                  {Math.max(...monthlyData.map(item => item.sponsorships))}
                </div>
                <div className="text-sm font-bold text-purple-500">Peak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin & Overseer Admitted Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Admitted Students Card */}
        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 bg-green-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Admin Approved
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {adminAdmittedStudents.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Admitted by Admin</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🎓 Admin admitted & sponsored
            </div>
          </div>
        </div>

        {/* Overseer Admitted Students Card */}
        <div className="bg-gradient-to-br from-white via-teal-50/50 to-cyan-50/50 backdrop-blur-sm border border-teal-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-300/20 to-blue-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-teal-600 bg-teal-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Overseer Approved
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {overseerAdmittedStudents.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Admitted by Overseer</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🎯 Overseer admitted & sponsored
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Summary only */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pending Sponsorship Requests</h2>
          </div>
          <button
            className="px-3 py-1.5 text-sm bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors"
            onClick={() => navigate('/sponsorships', { state: { selectedBox: 'pending-requests' } })}
          >
            View {pendingSponsorships.length} pending
          </button>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sponsorships */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Sponsorships</h3>
            </div>
            <span className="text-sm text-gray-500">{recentSponsorships.length} new</span>
          </div>
          <div className="space-y-3">
            {recentSponsorships.map((sponsorship) => (
              <div key={sponsorship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sponsorship.sponsorName}</p>
                  <p className="text-sm text-gray-600">Sponsored on {new Date(sponsorship.startDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">UGX {sponsorship.amount?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sponsorship.status === 'active' ? 'bg-green-100 text-green-700' :
                    sponsorship.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {sponsorship.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Review Eligibility</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">{childrenInFlow.eligibilityCheck} pending</p>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Approve Requests</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{childrenInFlow.pendingAdminApproval} waiting</p>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Generate Report</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">Monthly summary</p>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Manage Students</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">{students.length} total</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverseerDashboard; 









