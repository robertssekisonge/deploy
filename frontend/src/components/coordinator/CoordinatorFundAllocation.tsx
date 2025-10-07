import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  DollarSign, 
  Heart, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  Search, 
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  BarChart3,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface FundAllocation {
  id: number;
  fundSource: string;
  allocatedAmount: number;
  allocatedFor: string;
  description: string;
  date: string;
  allocatedBy: string;
  status: string;
  usedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
}

interface SponsoredChild {
  id: number;
  name: string;
  class: string;
  stream: string;
  sponsorshipStatus: string;
  sponsorName?: string;
  sponsorAmount?: number;
  lastPaymentDate?: string;
  totalPaid?: number;
  remainingBalance?: number;
}

interface SponsorPayment {
  id: number;
  sponsorName: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  description: string;
}

const CoordinatorFundAllocation: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [allocations, setAllocations] = useState<FundAllocation[]>([]);
  const [sponsoredChildren, setSponsoredChildren] = useState<SponsoredChild[]>([]);
  const [sponsorPayments, setSponsorPayments] = useState<SponsorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAllocation, setSelectedAllocation] = useState<FundAllocation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocationsRes, childrenRes, paymentsRes] = await Promise.all([
        fetch('/api/coordinator/fund-allocations'),
        fetch('/api/coordinator/sponsored-children'),
        fetch('/api/coordinator/sponsor-payments')
      ]);

      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json();
        setAllocations(allocationsData);
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setSponsoredChildren(childrenData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setSponsorPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error loading coordinator data:', error);
      showAINotification('Error', 'Failed to load coordinator data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDetails = (allocation: FundAllocation) => {
    setSelectedAllocation(allocation);
    setShowDetailsModal(true);
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.allocatedFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.fundSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || allocation.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Expired': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Fully Utilized': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'Suspended': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Fully Utilized': return 'bg-blue-100 text-blue-800';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate summary statistics
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const totalUsed = allocations.reduce((sum, a) => sum + a.usedAmount, 0);
  const totalRemaining = allocations.reduce((sum, a) => sum + a.remainingAmount, 0);
  const activeAllocations = allocations.filter(a => a.status === 'Active').length;
  const totalSponsoredChildren = sponsoredChildren.length;
  const totalSponsorPayments = sponsorPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent">
                Sponsorship Fund Management
              </h1>
              <p className="text-gray-600 mt-2">Manage allocated funds for sponsored children and track sponsor payments</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-pink-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-pink-500">Total Allocated</p>
                <p className="text-2xl font-black text-pink-600">{formatCurrency(totalAllocated)}</p>
                <p className="text-xs text-gray-500 mt-1">From CFO</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Total Used</p>
                <p className="text-2xl font-black text-purple-600">{formatCurrency(totalUsed)}</p>
                <p className="text-xs text-gray-500 mt-1">For sponsored children</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Remaining Balance</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(totalRemaining)}</p>
                <p className="text-xs text-gray-500 mt-1">Available for use</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Sponsored Children</p>
                <p className="text-2xl font-black text-blue-600">{totalSponsoredChildren}</p>
                <p className="text-xs text-gray-500 mt-1">Currently supported</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor Payments Summary */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Sponsor Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsorPayments.slice(0, 6).map((payment, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{payment.sponsorName}</h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {payment.paymentMethod}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Student: {payment.studentName}</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                  <div className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fund Allocations */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Fund Allocations</h3>
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search allocations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Fully Utilized">Fully Utilized</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredAllocations.map((allocation) => (
              <div key={allocation.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{allocation.allocatedFor}</h4>
                    <p className="text-sm text-gray-600">{allocation.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Fund Source: {allocation.fundSource} • Allocated by: {allocation.allocatedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{formatCurrency(allocation.allocatedAmount)}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(allocation.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(allocation.status)}`}>
                        {allocation.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Used</div>
                    <div className="text-lg font-semibold text-orange-600">{formatCurrency(allocation.usedAmount)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Remaining</div>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(allocation.remainingAmount)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Utilization</div>
                    <div className={`text-lg font-semibold ${getUtilizationColor(allocation.utilizationPercentage)}`}>
                      {allocation.utilizationPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getUtilizationBarColor(allocation.utilizationPercentage)}`}
                      style={{ width: `${Math.min(allocation.utilizationPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Allocated: {new Date(allocation.date).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleViewDetails(allocation)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sponsored Children List */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Sponsored Children</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsoredChildren.slice(0, 9).map((child, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{child.name}</h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {child.class} {child.stream}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Sponsor: {child.sponsorName || 'Pending'}</div>
                  <div className="text-sm text-gray-600">Status: {child.sponsorshipStatus}</div>
                  {child.sponsorAmount && (
                    <div className="text-sm font-semibold text-green-600">
                      Amount: {formatCurrency(child.sponsorAmount)}
                    </div>
                  )}
                  {child.lastPaymentDate && (
                    <div className="text-xs text-gray-500">
                      Last Payment: {new Date(child.lastPaymentDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAllocation && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="px-6 py-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold">Fund Allocation Details</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="text-white/90 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocated For</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.allocatedFor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fund Source</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.fundSource}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount</label>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedAllocation.allocatedAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAllocation.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAllocation.status)}`}>
                        {selectedAllocation.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Used Amount</label>
                    <p className="text-sm font-semibold text-orange-600">{formatCurrency(selectedAllocation.usedAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedAllocation.remainingAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedAllocation.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocated By</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.allocatedBy}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedAllocation.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilization</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUtilizationBarColor(selectedAllocation.utilizationPercentage)}`}
                        style={{ width: `${Math.min(selectedAllocation.utilizationPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${getUtilizationColor(selectedAllocation.utilizationPercentage)}`}>
                      {selectedAllocation.utilizationPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorFundAllocation;



