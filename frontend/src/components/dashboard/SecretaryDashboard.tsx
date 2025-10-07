import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Users, DollarSign, FileText, ClipboardList, UserPlus, TrendingUp, Calendar, GraduationCap } from 'lucide-react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, Cell as BarCell } from 'recharts';

const SecretaryDashboard: React.FC = () => {
  const { students, financialRecords } = useData() as any;

  // Filter out overseer-admitted students - only include school-admitted students
  const schoolStudents = useMemo(() => {
    return (students || []).filter((student: any) => {
      // Include students admitted by admin/secretary or with no admittedBy field (legacy students)
      return student.admittedBy === 'admin' || 
             student.admittedBy === 'secretary' || 
             !student.admittedBy;
    });
  }, [students]);

  const totalStudents = schoolStudents?.length || 0;
  
  // Calculate fee status metrics
  const feesMetrics = useMemo(() => {
    const paid = (financialRecords || []).filter((r: any) => r.status === 'paid').length;
    const pending = (financialRecords || []).filter((r: any) => r.status === 'pending').length;
    const overdue = (financialRecords || []).filter((r: any) => r.status === 'overdue').length;
    const totalAmount = financialRecords?.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0) || 0;
    
    return { paid, pending, overdue, totalAmount };
  }, [financialRecords]);

  // Monthly admission trends (last 6 months) - only for school-admitted students
  const monthlyAdmissions = useMemo(() => {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStudents = schoolStudents?.filter((s: any) => {
        const admissionDate = new Date(s.createdAt);
        return admissionDate.getMonth() === date.getMonth() && 
               admissionDate.getFullYear() === date.getFullYear();
      }) || [];
      return {
        month: monthName,
        admissions: monthStudents.length,
        classDistribution: monthStudents.reduce((acc: any, student: any) => {
          acc[student.class] = (acc[student.class] || 0) + 1;
          return acc;
        }, {})
      };
    }).reverse();
    return last6Months;
  }, [schoolStudents]);

  // Class distribution with modern styling - only for school-admitted students
  const classDist = useMemo(() => {
    const map: Record<string, number> = {};
    (schoolStudents || []).forEach((s: any) => {
      if (!s?.class) return;
      map[s.class] = (map[s.class] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [schoolStudents]);

  // Fee status distribution for pie chart
  const feeStatusDist = useMemo(() => {
    const { paid, pending, overdue } = feesMetrics;
    return [
      { name: 'Paid', value: paid, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [feesMetrics]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#F472B6', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-6 p-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Secretary Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of school admissions and fee operations</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
              SECRETARY
            </span>
            <div>
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Designed Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <div className="bg-gradient-to-br from-white via-fuchsia-50/50 to-violet-50/50 backdrop-blur-sm border border-fuchsia-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-fuchsia-400/20 to-violet-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-fuchsia-300/20 to-purple-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-fuchsia-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-fuchsia-600 bg-fuchsia-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  +15% this month
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {totalStudents}
              </div>
              <div className="text-sm text-gray-600 font-medium">School Students</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              🎓 School-admitted students only
            </div>
          </div>
        </div>

        {/* New Admissions Card */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 bg-blue-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Active
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {monthlyAdmissions[monthlyAdmissions.length - 1]?.admissions || 0}
              </div>
              <div className="text-sm text-gray-600 font-medium">School Admissions</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              📅 School-admitted this month
            </div>
          </div>
        </div>

        {/* Fee Status Card */}
        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-300/20 to-teal-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 bg-green-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Paid
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {feesMetrics.paid}
              </div>
              <div className="text-sm text-gray-600 font-medium">Paid Fees</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              ✅ ${feesMetrics.totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Pending Fees Card */}
        <div className="bg-gradient-to-br from-white via-orange-50/50 to-amber-50/50 backdrop-blur-sm border border-orange-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-amber-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-300/20 to-red-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-600 bg-orange-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Requires Action
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {feesMetrics.pending + feesMetrics.overdue}
              </div>
              <div className="text-sm text-gray-600 font-medium">Pending Fees</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              ⏳ {feesMetrics.overdue} overdue
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution - AI Bar Chart */}
        <div className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 backdrop-blur-sm border border-violet-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Class Distribution
                </h3>
                <p className="text-sm text-gray-600">Student Count Analytics</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={classDist.map((d, i) => ({ 
                    name: d.name, 
                    value: d.value,
                    color: COLORS[i % COLORS.length],
                    fill: COLORS[i % COLORS.length]
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    {classDist.map((_, i) => (
                      <linearGradient key={i} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.9}/>
                        <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.6}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={500}
                    tick={{ fill: '#6B7280' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, _name: any, props: any) => [
                      `${value} students`, 
                      props.payload.name
                    ]}
                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                    className="drop-shadow-lg"
                  >
                    {classDist.map((_entry, index) => (
                      <BarCell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Class Legend */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {classDist.map((entry, index) => (
                <div 
                  key={entry.name} 
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm border border-white/20"
                >
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-800">{entry.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({entry.value})</span>
            </div>
          </div>
              ))}
            </div>
            
            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-violet-600">
                  {classDist.length}
                </div>
                <div className="text-xs text-gray-600">Classes</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-purple-600">
                  {classDist.reduce((sum, item) => sum + item.value, 0)}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-indigo-600">
                  {Math.round(classDist.reduce((sum, item) => sum + item.value, 0) / classDist.length) || 0}
                </div>
                <div className="text-xs text-gray-600">Avg/Class</div>
          </div>
            </div>
          </div>
        </div>
        {/* Fee Status Distribution */}
        <div className="bg-gradient-to-br from-white via-fuchsia-50/30 to-violet-50/30 backdrop-blur-sm border border-fuchsia-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-400/20 to-violet-400/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-fuchsia-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                  Fee Status Distribution
                </h3>
                <p className="text-sm text-gray-600">Payment Status Chart</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                    data={feeStatusDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={2}
                  >
                    {feeStatusDist.map((entry, index) => (
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
                      `${value} fees`, 
                      name
                    ]}
                  />
            </PieChart>
          </ResponsiveContainer>
              
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {feeStatusDist.reduce((sum, item) => sum + item.value, 0)}
                  </div>
              <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              {feeStatusDist.map((entry, _index) => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Admissions Trend */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Monthly Admissions Trend
                </h3>
                <p className="text-sm text-gray-600">Growth Analytics</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyAdmissions}>
                  <defs>
                    <linearGradient id="admissionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
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
                      `${value} admissions`, 
                      name
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="admissions" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fill="url(#admissionsGradient)"
                    className="drop-shadow-lg"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-blue-600">
                  {monthlyAdmissions.reduce((sum, item) => sum + item.admissions, 0)}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-indigo-600">
                  {Math.round(monthlyAdmissions.reduce((sum, item) => sum + item.admissions, 0) / monthlyAdmissions.length)}
                </div>
                <div className="text-xs text-gray-600">Average</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-lg font-bold text-purple-600">
                  {Math.max(...monthlyAdmissions.map(item => item.admissions))}
                </div>
                <div className="text-xs text-gray-600">Peak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
              <p className="text-sm text-gray-600">Secretary Management Tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl hover:bg-fuchsia-100 transition-colors group">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-fuchsia-600" />
                <span className="text-sm font-medium text-fuchsia-900">Admissions</span>
              </div>
              <p className="text-xs text-fuchsia-600 mt-1">Manage student records</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Fee Balances</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Check payment status</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Reports</span>
              </div>
              <p className="text-xs text-green-600 mt-1">View weekly summaries</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors group">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Forms</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">Manage documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;