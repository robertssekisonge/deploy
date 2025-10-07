import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  Eye, 
  Download, 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Building,
  Stethoscope,
  GraduationCap,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface FundAllocation {
  id: number;
  allocationName: string;
  operationsCategory: string; // School, Clinic, Organization
  fundSource: string;
  allocatedAmount: number;
  currency: string;
  usedAmount: number;
  remainingAmount: number;
  allocationDate: string;
  expiryDate?: string;
  status: string; // Active, Expired, Fully Utilized, Suspended
  approvedBy: string;
  description: string;
  conditions?: string;
  utilizationPercentage: number;
}

interface FundSource {
  source: string;
  category: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

const OPMFundAllocation: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [allocations, setAllocations] = useState<FundAllocation[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFundSource, setFilterFundSource] = useState('');
  const [selectedAllocation, setSelectedAllocation] = useState<FundAllocation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Operations categories
  const operationsCategories = [
    'School',
    'Clinic', 
    'Organization'
  ];

  // Allocation statuses
  const statuses = [
    'Active',
    'Expired',
    'Fully Utilized',
    'Suspended'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocationsRes, sourcesRes] = await Promise.all([
        fetch('/api/opm/fund-allocations'),
        fetch('/api/opm/fund-sources-summary')
      ]);

      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json();
        setAllocations(allocationsData);
      }

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setFundSources(sourcesData);
      }
    } catch (error) {
      console.error('Error loading fund allocation data:', error);
      showAINotification('Error', 'Failed to load fund allocation data', 'error');
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

  const handleRequestAdditionalFunds = async (allocationId: number, requestedAmount: number, reason: string) => {
    try {
      const res = await fetch('/api/opm/request-additional-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId,
          requestedAmount,
          reason,
          requestedBy: user?.name || 'OPM'
        })
      });

      if (res.ok) {
        showAINotification('Success', 'Additional fund request submitted successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to submit fund request');
      }
    } catch (error) {
      console.error('Error requesting additional funds:', error);
      showAINotification('Error', 'Failed to submit fund request', 'error');
    }
  };

  const filteredAllocations = (allocations || []).filter(allocation => {
    const matchesSearch = (allocation.allocationName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (allocation.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (allocation.fundSource || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !filterCategory || allocation.operationsCategory === filterCategory;
    const matchesStatus = !filterStatus || allocation.status === filterStatus;
    const matchesFundSource = !filterFundSource || allocation.fundSource === filterFundSource;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFundSource;
  });

  const getOperationsCategoryIcon = (category: string) => {
    switch (category) {
      case 'School': return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'Clinic': return <Stethoscope className="h-4 w-4 text-green-500" />;
      case 'Organization': return <Building className="h-4 w-4 text-purple-500" />;
      default: return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Expired': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Fully Utilized': return <Target className="h-4 w-4 text-blue-500" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                Fund Allocations
              </h1>
              <p className="text-gray-600 mt-2">View and track fund allocations from CFO across all operations</p>
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
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Allocated</p>
                <p className="text-2xl font-black text-green-600">
                  {formatCurrency(allocations.reduce((sum, a) => sum + a.allocatedAmount, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">From all sources</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Total Used</p>
                <p className="text-2xl font-black text-blue-600">
                  {formatCurrency(allocations.reduce((sum, a) => sum + a.usedAmount, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Expenses incurred</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-500">Available Balance</p>
                <p className="text-2xl font-black text-orange-600">
                  {formatCurrency(allocations.reduce((sum, a) => sum + a.remainingAmount, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Remaining funds</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Active Allocations</p>
                <p className="text-2xl font-black text-purple-600">
                  {allocations.filter(a => a.status === 'Active').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently available</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Fund Sources Summary */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Fund Sources Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fundSources.map((source, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{source.source}</h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{source.category}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allocated:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(source.totalAllocated)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(source.totalUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(source.totalRemaining)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Operations</option>
              {operationsCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={filterFundSource}
              onChange={(e) => setFilterFundSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Fund Sources</option>
              {fundSources.map(source => (
                <option key={source.source} value={source.source}>{source.source}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Allocation Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Operations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Fund Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Allocated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Used</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Remaining</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Utilization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Allocation Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{allocation.allocationName}</span>
                        <p className="text-xs text-gray-500 mt-1">{allocation.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getOperationsCategoryIcon(allocation.operationsCategory)}
                        <span className="text-sm text-gray-700">{allocation.operationsCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{allocation.fundSource}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {allocation.currency} {(allocation.allocatedAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-orange-600">
                        {allocation.currency} {(allocation.usedAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-green-600">
                        {allocation.currency} {(allocation.remainingAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUtilizationBarColor(allocation.utilizationPercentage)}`}
                            style={{ width: `${Math.min(allocation.utilizationPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-semibold ${getUtilizationColor(allocation.utilizationPercentage)}`}>
                          {allocation.utilizationPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(allocation.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(allocation.status)}`}>
                          {allocation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(allocation.allocationDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(allocation)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAllocation && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="px-6 py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-2xl flex items-center justify-between">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Name</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.allocationName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operations Category</label>
                    <div className="flex items-center space-x-2">
                      {getOperationsCategoryIcon(selectedAllocation.operationsCategory)}
                      <span className="text-sm text-gray-900">{selectedAllocation.operationsCategory}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fund Source</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.fundSource}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedAllocation.currency} {(selectedAllocation.allocatedAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Used Amount</label>
                    <p className="text-sm font-semibold text-orange-600">
                      {selectedAllocation.currency} {(selectedAllocation.usedAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                    <p className="text-sm font-semibold text-green-600">
                      {selectedAllocation.currency} {(selectedAllocation.remainingAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Utilization</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedAllocation.allocationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.approvedBy}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedAllocation.description}</p>
                </div>
                {selectedAllocation.conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                    <p className="text-sm text-gray-900">{selectedAllocation.conditions}</p>
                  </div>
                )}
                {selectedAllocation.expiryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedAllocation.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPMFundAllocation;
