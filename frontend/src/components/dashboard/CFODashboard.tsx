import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { formatCurrency } from '../../utils/currency';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon, 
  BarChart3,
  Building2,
  Banknote,
  Wheat,
  Stethoscope,
  Receipt,
  Target,
  FileText,
  Calculator,
  AlertCircle,
  CheckCircle,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';

interface FinancialData {
  schoolFunding: any[];
  foundationFunding: any[];
  farmIncome: any[];
  clinicIncome: any[];
  expenditures: any[];
  fundAllocations: any[];
}

const CFODashboard: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [financialData, setFinancialData] = useState<FinancialData>({
    schoolFunding: [],
    foundationFunding: [],
    farmIncome: [],
    clinicIncome: [],
    expenditures: [],
    fundAllocations: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinancialData = async () => {
    try {
      const response = await fetch('/api/cfo/dashboard-data');
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      showAINotification('❌ Failed to fetch financial data', 3000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    showAINotification('💰 Financial data refreshed!', 2000);
  };

  // Calculate totals
  const totalSchoolFunding = financialData.schoolFunding.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalFoundationFunding = financialData.foundationFunding.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalFarmIncome = financialData.farmIncome.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalClinicIncome = financialData.clinicIncome.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenditures = financialData.expenditures.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const totalIncome = totalSchoolFunding + totalFoundationFunding + totalFarmIncome + totalClinicIncome;
  const netIncome = totalIncome - totalExpenditures;

  // Pie chart data for income sources
  const incomePieData = [
    { name: 'School Funding', value: totalSchoolFunding, color: '#8B5CF6' },
    { name: 'Foundation Funding', value: totalFoundationFunding, color: '#06B6D4' },
    { name: 'Farm Income', value: totalFarmIncome, color: '#10B981' },
    { name: 'Clinic Income', value: totalClinicIncome, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  // Bar chart data for monthly trends (mock data for now)
  const monthlyTrends = [
    { month: 'Jan', income: totalIncome * 0.8, expenses: totalExpenditures * 0.7 },
    { month: 'Feb', income: totalIncome * 0.9, expenses: totalExpenditures * 0.8 },
    { month: 'Mar', income: totalIncome * 1.1, expenses: totalExpenditures * 0.9 },
    { month: 'Apr', income: totalIncome * 1.0, expenses: totalExpenditures * 1.0 },
    { month: 'May', income: totalIncome * 1.2, expenses: totalExpenditures * 1.1 },
    { month: 'Jun', income: totalIncome * 1.1, expenses: totalExpenditures * 1.0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                CFO Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive Financial Management Portal</p>
            </div>
            <AIRefreshButton onRefresh={handleRefresh} loading={refreshing} />
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Income */}
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Income</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-500">Total Expenses</p>
                <p className="text-2xl font-black text-red-600">{formatCurrency(totalExpenditures)}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className={`bg-gradient-to-br from-white/90 via-${netIncome >= 0 ? 'green' : 'red'}-50/30 to-${netIncome >= 0 ? 'emerald' : 'rose'}-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500">Net Income</p>
                <p className={`text-2xl font-black ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              <div className={`h-12 w-12 bg-gradient-to-br from-${netIncome >= 0 ? 'green' : 'red'}-500 to-${netIncome >= 0 ? 'emerald' : 'rose'}-500 rounded-xl flex items-center justify-center`}>
                <Calculator className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Expenses</p>
                <p className="text-2xl font-black text-purple-600">UGX {totalExpenditures.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Income Sources Pie Chart */}
          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Income Sources</h3>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={4}
                  >
                    {incomePieData.map((entry, index) => (
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
                      formatCurrency(value), 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatCurrency(totalIncome)}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {incomePieData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-black text-gray-800">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends Bar Chart */}
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-cyan-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Monthly Trends</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value: any, name: any) => [
                    `$${value.toLocaleString()}`, 
                    name === 'income' ? 'Income' : 'Expenses'
                  ]}
                />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">School Funding</h4>
                <p className="text-sm text-gray-600">Record school funding</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-cyan-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Foundation Funding</h4>
                <p className="text-sm text-gray-600">Record foundation funding</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-yellow-50/30 to-orange-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wheat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Farm Income</h4>
                <p className="text-sm text-gray-600">Record farm income</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-pink-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Clinic Income</h4>
                <p className="text-sm text-gray-600">Record clinic income</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CFODashboard;
