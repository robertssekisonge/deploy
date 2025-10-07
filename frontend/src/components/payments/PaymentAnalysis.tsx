import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Calendar, 
  Clock, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Mountain,
  CreditCard,
  Users,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';

interface PaymentData {
  paymentMethods: { method: string; count: number; amount: number }[];
  classPerformance: { className: string; amount: number }[];
  overdueAnalysis: {
    gracePeriod: number;
    overdueDate: string;
    overdueRecords: number;
  };
}

const PaymentAnalysis: React.FC = () => {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'trends'>('detailed');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call - replace with actual API endpoint
        const mockData: PaymentData = {
          paymentMethods: [
            { method: 'Cash', count: 1, amount: 100000 },
            { method: 'Mobile Money', count: 0, amount: 0 },
            { method: 'Bank Transfer', count: 0, amount: 0 },
            { method: 'Card', count: 0, amount: 0 }
          ],
          classPerformance: [
            { className: 'Senior 1', amount: 0 },
            { className: 'Senior 2', amount: 0 },
            { className: 'Senior 3', amount: 0 },
            { className: 'Senior 4', amount: 0 }
          ],
          overdueAnalysis: {
            gracePeriod: 30,
            overdueDate: '11/6/2025',
            overdueRecords: 0
          }
        };
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading payment analysis...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
            CFO Portal - School Management System
          </h1>
          <p className="text-gray-700 mt-2 text-lg">Payment Analysis</p>
          <p className="text-gray-600 text-sm">Comprehensive payment overview and analytics for all students.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl">
              <RefreshCw className="h-5 w-5" />
              <span>Refresh Data</span>
            </button>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Last 6 months</option>
                <option>This year</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>30 days grace</option>
                <option>15 days grace</option>
                <option>7 days grace</option>
                <option>No grace period</option>
              </select>
            </div>
            <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option>All Classes</option>
              <option>Senior 1</option>
              <option>Senior 2</option>
              <option>Senior 3</option>
              <option>Senior 4</option>
            </select>
            <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>All Streams</option>
              <option>Science</option>
              <option>Arts</option>
              <option>Commercial</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeView === 'overview'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveView('detailed')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeView === 'detailed'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Detailed</span>
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeView === 'trends'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mountain className="h-4 w-4" />
              <span>Trends</span>
            </button>
          </div>
        </div>

        {/* Detailed Payment Analysis */}
        {activeView === 'detailed' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Payment Analysis</h2>
            
            {/* Enhanced Payment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Payment Methods Breakdown */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Methods Breakdown
                  </h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  {data?.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          method.method === 'Cash' ? 'bg-green-500' :
                          method.method === 'Mobile Money' ? 'bg-blue-500' :
                          method.method === 'Bank Transfer' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="font-medium text-gray-700">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">{method.count} payments</div>
                        <div className="text-sm text-gray-600">UGX {method.amount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <div className="text-sm text-blue-700">
                    <strong>Total Methods:</strong> {data?.paymentMethods.filter(m => m.count > 0).length} active
                  </div>
                </div>
              </div>

              {/* Class Performance */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-800 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Class Performance
                  </h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  {data?.classPerformance.map((classItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          classItem.className === 'Senior 1' ? 'bg-blue-500' :
                          classItem.className === 'Senior 2' ? 'bg-green-500' :
                          classItem.className === 'Senior 3' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="font-medium text-gray-700">{classItem.className}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">UGX {classItem.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {classItem.amount > 0 ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="text-gray-500 flex items-center">
                              <XCircle className="h-3 w-3 mr-1" />
                              No payments
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Performance:</strong> {data?.classPerformance.filter(c => c.amount > 0).length} classes with payments
                  </div>
                </div>
              </div>

              {/* Overdue Analysis */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-orange-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Overdue Analysis
                  </h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-gray-700">Grace Period</span>
                    </div>
                    <div className="font-bold text-orange-700">{data?.overdueAnalysis.gracePeriod} days</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-gray-700">Overdue Date</span>
                    </div>
                    <div className="font-bold text-red-700">{data?.overdueAnalysis.overdueDate}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-gray-700">Overdue Records</span>
                    </div>
                    <div className="font-bold text-red-700">{data?.overdueAnalysis.overdueRecords}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                  <div className="text-sm text-orange-700">
                    <strong>Status:</strong> {data?.overdueAnalysis.overdueRecords === 0 ? 'All payments current' : 'Action required'}
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Payment Records Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Records</h3>
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No payment records found</p>
                <p className="text-sm">Payment records will appear here when students make payments</p>
              </div>
            </div>
          </div>
        )}

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Overview</h2>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <p className="text-center text-gray-500">Overview view content will be implemented here</p>
            </div>
          </div>
        )}

        {/* Trends View */}
        {activeView === 'trends' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Trends</h2>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <p className="text-center text-gray-500">Trends view content will be implemented here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentAnalysis;



