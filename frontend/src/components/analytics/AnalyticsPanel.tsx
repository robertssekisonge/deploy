import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, DollarSign, Calendar, Award } from 'lucide-react';

const pieColors = ['#10B981', '#F59E0B', '#EF4444'];
const renderPieLabel = (paymentStatusData: Array<{ color?: string }>) => (props: { name: string; percent: number; index: number }) => {
  const { name, percent, index } = props;
  const color = (typeof index === 'number') ? (paymentStatusData[index]?.color || pieColors[index % pieColors.length]) : '#333';
  return (
    <tspan fill={color} fontWeight="bold">{`${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}</tspan>
  );
};

const classColors = [
  '#a78bfa', // purple-400
  '#38bdf8', // blue-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#f472b6', // pink-400
  '#818cf8', // indigo-400
  '#2dd4bf', // teal-400
  '#f472b6', // fuchsia-400
];

const AnalyticsPanel: React.FC = () => {
  const { students, financialRecords, attendanceRecords } = useData();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Calculate analytics data
  const totalStudents = students.length;
  const totalRevenue = financialRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const attendanceRate = attendanceRecords.length > 0 
    ? (attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100
    : 0;

  const paymentRate = students.length > 0
    ? (students.filter(s => s.paymentStatus === 'paid').length / students.length) * 100
    : 0;

  // Class distribution
  const classDistribution = students.reduce((acc, student) => {
    acc[student.class] = (acc[student.class] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const classChartData = Object.entries(classDistribution).map(([className, count]) => ({
    name: className,
    students: count,
    percentage: ((count / totalStudents) * 100).toFixed(1)
  }));

  // Stream distribution
  const streamDistribution = students.reduce((acc, student) => {
    const streamKey = `${student.class} ${student.stream}`;
    acc[streamKey] = (acc[streamKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const streamChartData = Object.entries(streamDistribution).map(([stream, count]) => ({
    name: stream,
    students: count
  }));

  // Payment status distribution
  const paymentStatusData = [
    { name: 'Paid', value: students.filter(s => s.paymentStatus === 'paid').length, color: '#10B981' },
    { name: 'Partial', value: students.filter(s => s.paymentStatus === 'partial').length, color: '#F59E0B' },
    { name: 'Unpaid', value: students.filter(s => s.paymentStatus === 'unpaid').length, color: '#EF4444' }
  ];

  // Monthly revenue trend
  const monthlyRevenue = financialRecords
    .filter(r => r.status === 'paid' && r.paymentDate)
    .reduce((acc, record) => {
      const month = record.paymentDate!.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const revenueChartData = Object.entries(monthlyRevenue).map(([month, amount]) => ({
    month,
    amount: amount / 1000000 // Convert to millions for better display
  }));

  // Attendance trends
  const attendanceTrends = attendanceRecords.reduce((acc, record) => {
    const date = record.date.toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, present: 0, absent: 0, late: 0 };
    }
    acc[date][record.status]++;
    return acc;
  }, {} as Record<string, { date: string; present: number; absent: number; late: number }>);

  const attendanceChartData = Object.values(attendanceTrends).slice(-7); // Last 7 days

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8" />
          </div>
          <div className="mt-2">
            <span className="text-sm">+12% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">
                UGX {(totalRevenue / 1000000).toFixed(1)}M
              </p>
            </div>
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="mt-2">
            <span className="text-sm">+8% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-lime-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Attendance Rate</p>
              <p className="text-3xl font-bold">{attendanceRate.toFixed(1)}%</p>
            </div>
            <Calendar className="h-8 w-8" />
          </div>
          <div className="mt-2">
            <span className="text-sm">Above average</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Rate</p>
              <p className="text-3xl font-bold">{paymentRate.toFixed(1)}%</p>
            </div>
            <Award className="h-8 w-8" />
          </div>
          <div className="mt-2">
            <span className="text-sm">Needs improvement</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <h3 className="text-lg font-semibold mb-4">Students by Class</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip formatter={(value) => [value, 'Students']} contentStyle={{ background: '#fff', color: '#333' }} />
              <Bar dataKey="students">
                {classChartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={classColors[idx % classColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel(paymentStatusData)}
                outerRadius={80}
                fill="#fff"
                dataKey="value"
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', color: '#333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trends */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-xl shadow-sm border-0 text-white transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends (Millions UGX)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip formatter={(value) => [`${value}M UGX`, 'Revenue']} contentStyle={{ background: '#fff', color: '#333' }} />
              <Line type="monotone" dataKey="amount" stroke="#fff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#10B981" name="Present" />
              <Bar dataKey="absent" fill="#EF4444" name="Absent" />
              <Bar dataKey="late" fill="#F59E0B" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stream Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Stream Performance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stream
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {streamChartData.map((stream) => {
                const streamStudents = students.filter(s => `${s.class} ${s.stream}` === stream.name);
                const streamAttendance = streamStudents.length > 0 
                  ? (streamStudents.filter(s => 
                      attendanceRecords.some(a => a.studentId === s.id && a.status === 'present')
                    ).length / streamStudents.length) * 100
                  : 0;
                const streamPaymentRate = streamStudents.length > 0
                  ? (streamStudents.filter(s => s.paymentStatus === 'paid').length / streamStudents.length) * 100
                  : 0;

                return (
                  <tr key={stream.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stream.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stream.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${streamAttendance}%` }}
                          ></div>
                        </div>
                        <span>{streamAttendance.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${streamPaymentRate}%` }}
                          ></div>
                        </div>
                        <span>{streamPaymentRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        streamAttendance >= 90 && streamPaymentRate >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : streamAttendance >= 75 && streamPaymentRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {streamAttendance >= 90 && streamPaymentRate >= 80 
                          ? 'Excellent' 
                          : streamAttendance >= 75 && streamPaymentRate >= 60
                          ? 'Good'
                          : 'Needs Attention'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;