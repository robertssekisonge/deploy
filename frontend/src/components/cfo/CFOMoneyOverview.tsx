import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  Search, 
  Filter,
  Building,
  Stethoscope,
  GraduationCap,
  Users,
  Heart,
  Package,
  Truck,
  Wrench,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface MoneyOverviewData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  fundSources: FundSourceSummary[];
  expenseCategories: ExpenseCategorySummary[];
  allocations: AllocationSummary[];
  recentTransactions: Transaction[];
  monthlyTrends: MonthlyTrend[];
  userAllocations: UserAllocationSummary[];
}

interface FundSourceSummary {
  source: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  percentage: number;
}

interface ExpenseCategorySummary {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

interface AllocationSummary {
  id: number;
  allocatedTo: string;
  totalAllocated: number;
  totalUsed: number;
  remainingAmount: number;
  percentage: number;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'allocation';
  description: string;
  amount: number;
  date: string;
  category: string;
  source: string;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface UserAllocationSummary {
  user: string;
  totalAllocated: number;
  totalUsed: number;
  remainingAmount: number;
  allocations: number;
}

const CFOMoneyOverview: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [data, setData] = useState<MoneyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cfo/money-overview');
      if (res.ok) {
        const overviewData = await res.json();
        setData(overviewData);
      }
    } catch (error) {
      console.error('Error loading money overview:', error);
      showAINotification('Error', 'Failed to load money overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = data?.recentTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  }) || [];

  const getUserIcon = (user: string) => {
    switch (user.toLowerCase()) {
      case 'opm':
      case 'operations manager':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'accountant':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'sponsorship coordinator':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'hr':
      case 'human resources':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'nurse':
        return <Stethoscope className="h-4 w-4 text-red-500" />;
      case 'secretary':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'school':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'clinic':
        return <Stethoscope className="h-4 w-4 text-green-500" />;
      case 'organization':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'salaries':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'infrastructure':
        return <Building className="h-4 w-4 text-indigo-500" />;
      case 'supplies':
        return <Package className="h-4 w-4 text-yellow-500" />;
      case 'transport':
        return <Truck className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'text-green-600 bg-green-100';
      case 'expense': return 'text-red-600 bg-red-100';
      case 'allocation': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load money overview</h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
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
                Complete Money Overview
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive view of all money in the system</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => loadData()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Income</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(data.totalIncome)}</p>
                <p className="text-xs text-gray-500 mt-1">All sources combined</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-500">Total Expenses</p>
                <p className="text-2xl font-black text-red-600">{formatCurrency(data.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">All expenses recorded</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Net Balance</p>
                <p className={`text-2xl font-black ${data.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Total Allocations</p>
                <p className="text-2xl font-black text-purple-600">
                  {formatCurrency(data.allocations.reduce((sum, a) => sum + a.totalAllocated, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Funds allocated to users</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* User Allocations Summary */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Fund Allocations by User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.userAllocations.map((userAlloc, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getUserIcon(userAlloc.user)}
                    <h4 className="font-semibold text-gray-800">{userAlloc.user}</h4>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {userAlloc.allocations} allocations
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allocated:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(userAlloc.totalAllocated)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(userAlloc.totalUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(userAlloc.remainingAmount)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${Math.min((userAlloc.totalUsed / userAlloc.totalAllocated) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((userAlloc.totalUsed / userAlloc.totalAllocated) * 100).toFixed(1)}% utilized
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fund Sources Summary */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Fund Sources Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.fundSources.map((source, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(source.category)}
                    <h4 className="font-semibold text-gray-800">{source.source}</h4>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {source.category}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(source.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(source.usedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(source.remainingAmount)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {source.percentage.toFixed(1)}% utilized
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Expense Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.expenseCategories.map((category, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(category.category)}
                  <h4 className="font-semibold text-gray-800">{category.category}</h4>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(category.totalAmount)}</div>
                  <div className="text-xs text-gray-500">{category.count} transactions</div>
                  <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="allocation">Allocation</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(transaction.category)}
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </div>
                  <p className={`text-sm font-semibold mt-1 ${
                    transaction.type === 'income' ? 'text-green-600' : 
                    transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CFOMoneyOverview;



