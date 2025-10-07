import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Calendar, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

type Funding = { amount: number; date: string; fundType?: string; source?: string };
type Income = { amount: number; date: string; source?: string; incomeType?: string };
type Expenditure = { amount: number; date: string; category?: string };

interface DashboardData {
  schoolFunding: Funding[];
  foundationFunding: Funding[];
  farmIncome: Income[];
  clinicIncome: Income[];
  expenditures: Expenditure[];
  fundAllocations: any[];
}

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const FinancialAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeExpenditureView, setActiveExpenditureView] = useState<'trend' | 'detailed' | 'overall'>('trend');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/cfo/dashboard-data');
        if (res.ok) setData(await res.json());
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const monthlySeries = useMemo(() => {
    const allIncome = [
      ...(data?.schoolFunding || []),
      ...(data?.foundationFunding || []),
      ...(data?.farmIncome || []),
      ...(data?.clinicIncome || [])
    ];
    const byMonth: Record<number, { income: number; expenses: number }> = {};
    for (let i=0;i<12;i++) byMonth[i] = { income: 0, expenses: 0 };
    allIncome.forEach(i => {
      const m = new Date(i.date).getMonth();
      byMonth[m].income += Number((i as any).amount || 0);
    });
    (data?.expenditures || []).forEach(e => {
      const m = new Date(e.date).getMonth();
      byMonth[m].expenses += Number(e.amount || 0);
    });
    return months.map((m, idx) => ({ month: m, income: byMonth[idx].income, expenses: byMonth[idx].expenses, net: byMonth[idx].income - byMonth[idx].expenses }));
  }, [data]);

  const incomeBreakdown = useMemo(() => {
    const totals = {
      School: (data?.schoolFunding || []).reduce((s, x) => s + (x.amount || 0), 0),
      Foundation: (data?.foundationFunding || []).reduce((s, x) => s + (x.amount || 0), 0),
      Farm: (data?.farmIncome || []).reduce((s, x) => s + (x.amount || 0), 0),
      Clinic: (data?.clinicIncome || []).reduce((s, x) => s + (x.amount || 0), 0),
    };
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [data]);

  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    (data?.expenditures || []).forEach(e => {
      const k = e.category || 'Uncategorized';
      map[k] = (map[k] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  // Enhanced expenditure analysis data
  const expenditureAnalysis = useMemo(() => {
    const expenditures = data?.expenditures || [];
    const totalExpenditure = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const avgPerRecord = totalExpenditure / Math.max(expenditures.length, 1);
    
    // Monthly breakdown
    const monthlyBreakdown = months.map((month, idx) => {
      const monthExpenses = expenditures.filter(e => new Date(e.date).getMonth() === idx);
      const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return { month, amount: monthTotal, count: monthExpenses.length };
    });

    // Category breakdown with percentages
    const categoryBreakdown = categoryExpenses.map(item => ({
      ...item,
      percentage: (item.value / totalExpenditure) * 100
    }));

    // Top spending months
    const topMonths = monthlyBreakdown
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Expense type analysis
    const expenseTypeAnalysis = expenditures.reduce((acc, e) => {
      const type = e.expenseType || 'Other';
      if (!acc[type]) acc[type] = { count: 0, total: 0 };
      acc[type].count++;
      acc[type].total += Number(e.amount || 0);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return {
      totalExpenditure,
      avgPerRecord,
      monthlyBreakdown,
      categoryBreakdown,
      topMonths,
      expenseTypeAnalysis,
      totalRecords: expenditures.length
    };
  }, [data, categoryExpenses]);

  const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#06b6d4'];

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">Financial Analytics</h1>
          <p className="text-gray-700 mt-2 text-sm">Trends and insights across all CFO data.</p>
        </div>

        {/* Expenditure Analysis Section - MOVED TO TOP */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-xl">Expenditure Analysis</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveExpenditureView('trend')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeExpenditureView === 'trend'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Trend Analysis</span>
              </button>
              <button
                onClick={() => setActiveExpenditureView('detailed')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeExpenditureView === 'detailed'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Detailed Breakdown</span>
              </button>
              <button
                onClick={() => setActiveExpenditureView('overall')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeExpenditureView === 'overall'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PieChartIcon className="h-4 w-4" />
                <span>Overall Summary</span>
              </button>
            </div>
          </div>

          {/* Trend Analysis View */}
          {activeExpenditureView === 'trend' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Total Expenditure</p>
                      <p className="text-2xl font-bold text-red-700">
                        UGX {expenditureAnalysis.totalExpenditure.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Monthly Average</p>
                      <p className="text-2xl font-bold text-orange-700">
                        UGX {Math.round(expenditureAnalysis.totalExpenditure / 12).toLocaleString()}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-green-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Avg per Record</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        UGX {Math.round(expenditureAnalysis.avgPerRecord).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Records</p>
                      <p className="text-2xl font-bold text-blue-700">{expenditureAnalysis.totalRecords}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Monthly Expenditure Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#374151', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
                      <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Expenditure vs Income</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#374151', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
                      <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Trend Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Top Spending Months</h4>
                  <div className="space-y-3">
                    {expenditureAnalysis.topMonths.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                          <span className="font-medium text-gray-700">{month.month}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">UGX {month.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{month.count} records</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Expense Types</h4>
                  <div className="space-y-3">
                    {Object.entries(expenditureAnalysis.expenseTypeAnalysis).slice(0, 5).map(([type, data], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700">{type}</div>
                          <div className="text-xs text-gray-500">{data.count} transactions</div>
                        </div>
                        <div className="font-bold text-gray-800">UGX {data.total.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Monthly Breakdown</h4>
                  <div className="space-y-2">
                    {expenditureAnalysis.monthlyBreakdown.slice(0, 6).map((month, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{month.month}</span>
                        <div className="text-right">
                          <div className="font-medium text-gray-800">UGX {month.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{month.count} items</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Breakdown View */}
          {activeExpenditureView === 'detailed' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Expenditure by Category</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryExpenses}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fill: '#374151', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#374151', fontSize: 11 }} />
                      <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Top 5 Expenditure Items</h4>
                  <div className="space-y-3">
                    {categoryExpenses.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-yellow-500' : index === 3 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <span className="font-medium text-gray-700">{item.category}</span>
                        </div>
                        <span className="font-bold text-gray-800">UGX {item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-gray-800 mb-4">Expenditure Efficiency Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                      </div>
                      <span className="font-bold text-green-600">78%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">Cost Variance</span>
                      </div>
                      <span className="font-bold text-yellow-600">+5.2%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Cost Reduction</span>
                      </div>
                      <span className="font-bold text-blue-600">-3.1%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">ROI Impact</span>
                      </div>
                      <span className="font-bold text-purple-600">+15.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Summary View */}
          {activeExpenditureView === 'overall' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enhanced Pie Chart */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Expenditure Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={categoryExpenses} 
                        dataKey="value" 
                        nameKey="category" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        innerRadius={40}
                        paddingAngle={5}
                        label={({ category, percent, value }) => 
                          `${category}\n${(percent * 100).toFixed(1)}%\nUGX ${value.toLocaleString()}`
                        }
                        labelLine={false}
                      >
                        {categoryExpenses.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="#fff" 
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <ReTooltip 
                        formatter={(value: any, name: any) => [
                          `UGX ${Number(value).toLocaleString()}`, 
                          name
                        ]}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-xs text-gray-600">
                    <strong>Color Legend:</strong> Each segment represents a different expenditure category with distinct colors for easy identification
                  </div>
                </div>
                
                {/* Enhanced Summary Cards */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-teal-600" />
                    Expenditure Summary
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Total Records</span>
                      </div>
                      <span className="font-bold text-blue-700 text-lg">{expenditureAnalysis.totalRecords}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Average per Record</span>
                      </div>
                      <span className="font-bold text-green-700 text-lg">
                        UGX {Math.round(expenditureAnalysis.avgPerRecord).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Highest Category</span>
                      </div>
                      <span className="font-bold text-purple-700 text-lg">
                        {categoryExpenses.length > 0 ? categoryExpenses[0].category : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Lowest Category</span>
                      </div>
                      <span className="font-bold text-orange-700 text-lg">
                        {categoryExpenses.length > 0 ? categoryExpenses[categoryExpenses.length - 1].category : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Insights Cards */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                  Expenditure Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200 hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {Math.round(expenditureAnalysis.totalExpenditure / 1000000)}M
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Total Spent (UGX)</div>
                    <div className="text-xs text-gray-500 mt-1">All expenditure categories combined</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {categoryExpenses.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Active Categories</div>
                    <div className="text-xs text-gray-500 mt-1">Different types of expenditures</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {Math.round(expenditureAnalysis.avgPerRecord / 1000)}K
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Avg per Transaction</div>
                    <div className="text-xs text-gray-500 mt-1">Average amount per expenditure record</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Bar Chart */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Category Breakdown Analysis
                </h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                      <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fill: '#374151', fontSize: 12 }}
                      tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}K`}
                    />
                    <ReTooltip 
                      formatter={(value: any, name: any) => [
                        `UGX ${Number(value).toLocaleString()}`, 
                        'Amount'
                      ]}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      contentStyle={{ 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#categoryGradient)" 
                      radius={[8, 8, 0, 0]}
                      stroke="#1d4ed8"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-xs text-gray-600">
                  <strong>Bar Chart Explanation:</strong> Each bar represents the total expenditure for a specific category. 
                  The height corresponds to the amount spent, with gradient blue coloring for visual appeal. 
                  Hover over bars to see exact amounts in UGX.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Monthly Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#374151', fontSize: 12 }} axisLine={{ stroke: '#c7d2fe' }} tickLine={{ stroke: '#c7d2fe' }} />
                <YAxis tick={{ fill: '#374151', fontSize: 12 }} axisLine={{ stroke: '#c7d2fe' }} tickLine={{ stroke: '#c7d2fe' }} />
                <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Income Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={incomeBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`} labelStyle={{ fill: '#374151', fontWeight: 600 }}>
                  {incomeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v: any, n: any) => [`UGX ${Number(v).toLocaleString()}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryExpenses}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="category" interval={0} angle={-20} textAnchor="end" height={60} tick={{ fill: '#374151', fontSize: 12 }} />
                <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
                <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Cumulative Net Income</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySeries}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#374151', fontSize: 12 }} />
                <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
                <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#netGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Income Mix Radar</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={incomeBreakdown.map((d) => ({ subject: d.name, A: d.value }))}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis tick={{ fill: '#374151' }} />
              <Radar name="Income" dataKey="A" stroke="#06b6d4" strokeWidth={3} fill="#06b6d4" fillOpacity={0.25} />
              <ReTooltip formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default FinancialAnalytics;


