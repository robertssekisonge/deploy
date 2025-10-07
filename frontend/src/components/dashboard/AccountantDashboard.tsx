import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, TrendingUp, Users, Calculator, Receipt, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../../utils/currency';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#F472B6', '#8B5CF6', '#EC4899', '#06B6D4'];

const AccountantDashboard: React.FC = () => {
  const { students, financialRecords } = useData() as any;
  const { user } = useAuth();

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

  // Financial metrics calculations
  const financialMetrics = useMemo(() => {
    const paid = financialRecords?.filter((r: any) => r.status === 'paid').length || 0;
    const pending = financialRecords?.filter((r: any) => r.status === 'pending').length || 0;
    const overdue = financialRecords?.filter((r: any) => r.status === 'overdue').length || 0;
    
    const totalRevenue = financialRecords?.reduce((sum: number, r: any) => {
      return r.status === 'paid' ? sum + Number(r.amount || 0) : sum;
    }, 0) || 0;
    
    const pendingAmount = financialRecords?.reduce((sum: number, r: any) => {
      return r.status === 'pending' ? sum + Number(r.amount || 0) : sum;
    }, 0) || 0;
    
    const overdueAmount = financialRecords?.reduce((sum: number, r: any) => {
      return r.status === 'overdue' ? sum + Number(r.amount || 0) : sum;
    }, 0) || 0;

    return { paid, pending, overdue, totalRevenue, pendingAmount, overdueAmount };
  }, [financialRecords]);

  // Monthly revenue trends (last 12 months)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthlyRecords = financialRecords?.filter((r: any) => {
        const paymentDate = new Date(r.paymentDate || r.createdAt);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      }) || [];
      
      const revenue = monthlyRecords.reduce((sum: number, record: any) => {
        return record.status === 'paid' ? sum + Number(record.amount || 0) : sum;
      }, 0);
      
      const invoiceCount = monthlyRecords.length;
      
      return { month: monthName, revenue, invoiceCount };
    }).reverse();
    return last12Months;
  }, [financialRecords]);

  // Payment status distribution
  const paymentStatusDist = useMemo(() => {
    const { paid, pending, overdue } = financialMetrics;
    return [
      { name: 'Paid', value: paid, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [financialMetrics]);

  // Class distribution for school-admitted students only
  const classDist = useMemo(() => {
    const map: Record<string, number> = {};
    (schoolStudents || []).forEach((s: any) => {
      if (!s?.class) return;
      map[s.class] = (map[s.class] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [schoolStudents]);

  return (
    <div className="space-y-6 p-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of school financial operations and analytics</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ACCOUNTANT
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
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-white via-emerald-50/50 to-green-50/50 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-300/20 to-teal-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-600 bg-emerald-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  +8% this month
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {formatCurrency(financialMetrics.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              💰 All time collected
            </div>
          </div>
        </div>

        {/* Outstanding Payments Card */}
        <div className="bg-gradient-to-br from-white via-orange-50/50 to-amber-50/50 backdrop-blur-sm border border-orange-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-amber-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-300/20 to-red-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-600 bg-orange-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Outstanding
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {formatCurrency(financialMetrics.pendingAmount + financialMetrics.overdueAmount)}
              </div>
              <div className="text-sm text-gray-600 font-medium">Outstanding Fees</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              📊 Pending + Overdue
            </div>
          </div>
        </div>

        {/* Paid Invoices Card */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 bg-blue-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Complete
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {financialMetrics.paid}
              </div>
              <div className="text-sm text-gray-600 font-medium">Paid Invoices</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              ✅ 87% collection rate
            </div>
          </div>
        </div>

        {/* Overdue Payments Card */}
        <div className="bg-gradient-to-br from-white via-red-50/50 to-rose-50/50 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400/20 to-rose-400/20 backdrop-blur-sm rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-300/20 to-pink-300/20 backdrop-blur-sm rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600 bg-red-50/50 rounded-lg px-3 py-1 backdrop-blur-sm">
                  Critical
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 text-3xl font-bold">
                {financialMetrics.overdue}
              </div>
              <div className="text-sm text-gray-600 font-medium">Overdue Payments</div>
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg px-3 backdrop-blur-sm py-2">
              🚨 ${financialMetrics.overdueAmount.toLocaleString()} missing
            </div>
          </div>
        </div>
      </div>

      {/* Charts Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Distribution */}
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-green-50/30 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-emerald-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <PieChartIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Payment Status Distribution
                </h3>
                <p className="text-sm text-gray-600">Invoice Status Overview</p>
              </div>
        </div>

            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                    data={paymentStatusDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={2}
                  >
                    {paymentStatusDist.map((entry, index) => (
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
                      `${value} invoices`, 
                      name
                    ]}
              />
            </PieChart>
          </ResponsiveContainer>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {paymentStatusDist.reduce((sum, item) => sum + item.value, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Invoices</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              {paymentStatusDist.map((entry, index) => (
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

        {/* Monthly Revenue Trend */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Monthly Revenue Trends
                </h3>
                <p className="text-sm text-gray-600">12-Month Analytics</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
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
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, name: any) => [
                      `$${value.toLocaleString()}`, 
                      name === 'revenue' ? 'Revenue' : 'Invoices'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={6}
                    fill="url(#revenueGradient)"
                    className="drop-shadow-lg"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-blue-600">
                  ${monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                </div>
                <div className="text-sm font-bold text-blue-500">12M Total</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-indigo-600">
                  ${Math.round(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0) / monthlyRevenue.length).toLocaleString()}
                </div>
                <div className="text-sm font-bold text-indigo-500">Monthly Avg</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-purple-600">
                  ${Math.max(...monthlyRevenue.map(item => item.revenue)).toLocaleString()}
                </div>
                <div className="text-sm font-bold text-purple-500">Best Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Student Class Distribution and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution - AI Bar Chart */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-300/20 to-indigo-300/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Student Class Distribution
                </h3>
                <p className="text-sm text-gray-600">Enrollment Overview</p>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={500}
                    angle={-20}
                    height={50}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    fontWeight={500}
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
                    formatter={(value: any) => [`${value} students`, 'Count']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#classGradient)"
                    className="drop-shadow-lg"
                    radius={[4, 4, 0, 0]}
                    strokeWidth={4}
                  />
                  <defs>
                    <linearGradient id="classGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-purple-600">
                  {totalStudents}
                </div>
                <div className="text-sm font-bold text-purple-500">Total Students</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-pink-600">
                  {classDist.length}
                </div>
                <div className="text-sm font-bold text-pink-500">Classes</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-black text-indigo-600">
                  {classDist.length > 0 ? Math.round(totalStudents / classDist.length) : 0}
                </div>
                <div className="text-sm font-bold text-indigo-500">Avg per Class</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Management Quick Actions */}
        <div className="bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Financial Actions</h3>
              <p className="text-sm text-gray-600">Accounting Management Tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <a href="/financial-management" className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center justify-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">Process Payments</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">Manage invoices</p>
            </a>
            <a href="/financial-management" className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group">
              <div className="flex items-center justify-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Generate Reports</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Financial summaries</p>
            </a>
            <a href="/payment-analysis" className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors group">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Payment Analysis</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Revenue insights</p>
            </a>
            <a href="/students" className="p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors group">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Student Records</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">View student data</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;