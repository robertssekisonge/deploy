import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  ClipboardList, 
  Building, 
  Wrench, 
  Users, 
  Package,
  Hammer,
  Truck,
  Calendar,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import AIRefreshButton from '../common/AIRefreshButton';
import { formatCurrency } from '../../utils/currency';

interface OPMDashboardData {
  totalBudget: number;
  totalExpenses: number;
  totalPurchases: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  fundAllocations: any[];
  recentExpenses: any[];
  recentPurchases: any[];
  activeProjectsList: any[];
  upcomingDeadlines: any[];
}

const OPMDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OPMDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/opm/dashboard-data');
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching OPM dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data) return null;

    const budgetUtilization = data.totalBudget > 0 ? (data.totalExpenses / data.totalBudget) * 100 : 0;
    const taskCompletionRate = (data.completedTasks + data.pendingTasks) > 0 ? 
      (data.completedTasks / (data.completedTasks + data.pendingTasks)) * 100 : 0;
    const projectProgress = data.activeProjects > 0 ? 75 : 0; // Mock data

    return {
      budgetUtilization,
      taskCompletionRate,
      projectProgress,
      remainingBudget: data.totalBudget - data.totalExpenses
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard data</h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                Operations Manager Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive Operations Management Portal</p>
            </div>
            <AIRefreshButton onRefresh={handleRefresh} loading={refreshing} />
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Budget */}
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Budget</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(data.totalBudget)}</p>
                <p className="text-xs text-gray-500 mt-1">Allocated by CFO</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-500">Total Expenses</p>
                <p className="text-2xl font-black text-red-600">{formatCurrency(data.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics ? `${metrics.budgetUtilization.toFixed(1)}% of budget` : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Active Projects</p>
                <p className="text-2xl font-black text-blue-600">{data.activeProjects}</p>
                <p className="text-xs text-gray-500 mt-1">Construction & Renovation</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Task Completion */}
          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Task Completion</p>
                <p className="text-2xl font-black text-purple-600">{data.completedTasks}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics ? `${metrics.taskCompletionRate.toFixed(1)}% complete` : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Remaining Budget */}
          <div className="bg-gradient-to-br from-white/90 via-emerald-50/30 to-teal-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-500">Remaining Budget</p>
                <p className="text-2xl font-black text-emerald-600">
                  {formatCurrency(metrics?.remainingBudget || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available for use</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Purchases */}
          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-500">Total Purchases</p>
                <p className="text-2xl font-black text-orange-600">{formatCurrency(data.totalPurchases)}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-gradient-to-br from-white/90 via-yellow-50/30 to-orange-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-yellow-500">Pending Tasks</p>
                <p className="text-2xl font-black text-yellow-600">{data.pendingTasks}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Fund Allocations */}
          <div className="bg-gradient-to-br from-white/90 via-indigo-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-500">Fund Allocations</p>
                <p className="text-2xl font-black text-indigo-600">{(data.fundAllocations || []).length}</p>
                <p className="text-xs text-gray-500 mt-1">From CFO</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Expenses */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Recent Expenses</h3>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div className="space-y-4">
              {(data.recentExpenses || []).slice(0, 5).map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{expense.description || 'Expense'}</p>
                    <p className="text-sm text-gray-500">{expense.category || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(expense.amount || 0)}</p>
                    <p className="text-xs text-gray-500">{new Date(expense.date || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Active Projects</h3>
              <Building className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {(data.activeProjectsList || []).slice(0, 5).map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{project.name || 'Project'}</p>
                    <p className="text-sm text-gray-500">{project.type || 'Construction'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{project.progress || 0}%</p>
                    <p className="text-xs text-gray-500">{project.status || 'In Progress'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <ShoppingCart className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Purchase</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <ClipboardList className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create Task</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <Building className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Project</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <Users className="h-8 w-8 text-teal-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Contractors</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105">
              <FileText className="h-8 w-8 text-pink-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPMDashboard;
