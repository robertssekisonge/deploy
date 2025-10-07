import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import CurrencyAmountInput from '../common/CurrencyAmountInput';
import { DEFAULT_CURRENCY } from '../../utils/currency';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Building,
  Stethoscope,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface BudgetRecord {
  id: number;
  budgetName: string;
  operationsCategory: string; // School, Clinic, Organization
  budgetType: string; // Annual, Quarterly, Monthly, Project
  allocatedAmount: number;
  currency: string;
  usedAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  status: string; // Active, Completed, Overdue, Draft
  description: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const OPMBudgetManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [records, setRecords] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBudgetType, setFilterBudgetType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ 
    budgetName: '',
    operationsCategory: '',
    budgetType: '',
    allocatedAmount: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<string>(DEFAULT_CURRENCY);

  // Operations categories
  const operationsCategories = [
    'School',
    'Clinic', 
    'Organization'
  ];

  // Budget types
  const budgetTypes = [
    'Annual',
    'Quarterly',
    'Monthly',
    'Project',
    'Emergency',
    'Maintenance'
  ];

  // Budget statuses
  const budgetStatuses = [
    'Active',
    'Completed',
    'Overdue',
    'Draft',
    'Under Review'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opm/budgets');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      showAINotification('Error', 'Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...form,
        allocatedAmount: formAmount,
        currency: formCurrency,
        usedAmount: 0,
        remainingAmount: formAmount,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const url = editingId ? `/api/opm/budgets/${editingId}` : '/api/opm/budgets';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });

      if (res.ok) {
        showAINotification(
          'Success', 
          `Budget ${editingId ? 'updated' : 'created'} successfully`, 
          'success'
        );
        setShowModal(false);
        setEditingId(null);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to save budget');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      showAINotification('Error', 'Failed to save budget', 'error');
    }
  };

  const handleEdit = (record: BudgetRecord) => {
    setForm({
      budgetName: record.budgetName,
      operationsCategory: record.operationsCategory,
      budgetType: record.budgetType,
      allocatedAmount: record.allocatedAmount.toString(),
      startDate: record.startDate.split('T')[0],
      endDate: record.endDate.split('T')[0],
      description: record.description
    });
    setFormAmount(record.allocatedAmount);
    setFormCurrency(record.currency);
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const res = await fetch(`/api/opm/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAINotification('Success', 'Budget deleted successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      showAINotification('Error', 'Failed to delete budget', 'error');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/opm/budgets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showAINotification('Success', 'Budget status updated successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to update budget status');
      }
    } catch (error) {
      console.error('Error updating budget status:', error);
      showAINotification('Error', 'Failed to update budget status', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      budgetName: '',
      operationsCategory: '',
      budgetType: '',
      allocatedAmount: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setFormAmount(0);
    setFormCurrency(DEFAULT_CURRENCY);
  };

  const filteredRecords = (records || []).filter(record => {
    const matchesSearch = (record.budgetName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (record.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !filterCategory || record.operationsCategory === filterCategory;
    const matchesBudgetType = !filterBudgetType || record.budgetType === filterBudgetType;
    const matchesStatus = !filterStatus || record.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesBudgetType && matchesStatus;
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
      case 'Completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Draft': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Under Review': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Under Review': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateUtilizationPercentage = (used: number, allocated: number) => {
    return allocated > 0 ? (used / allocated) * 100 : 0;
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
                Budget Management
              </h1>
              <p className="text-gray-600 mt-2">Create and manage operational budgets across all departments</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Budget</span>
            </button>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Budgets</p>
                <p className="text-2xl font-black text-green-600">{records.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active & Draft</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Total Allocated</p>
                <p className="text-2xl font-black text-blue-600">
                  {DEFAULT_CURRENCY} {(records || []).reduce((sum, r) => sum + (r.allocatedAmount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all budgets</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-500">Total Used</p>
                <p className="text-2xl font-black text-orange-600">
                  {DEFAULT_CURRENCY} {(records || []).reduce((sum, r) => sum + (r.usedAmount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Expenses incurred</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Remaining</p>
                <p className="text-2xl font-black text-purple-600">
                  {DEFAULT_CURRENCY} {(records || []).reduce((sum, r) => sum + (r.remainingAmount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available balance</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets..."
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
              value={filterBudgetType}
              onChange={(e) => setFilterBudgetType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Budget Types</option>
              {budgetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              {budgetStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budgets Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Budget Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Operations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Allocated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Used</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Remaining</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Utilization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Period</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const utilization = calculateUtilizationPercentage(record.usedAmount, record.allocatedAmount);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{record.budgetName}</span>
                          <p className="text-xs text-gray-500 mt-1">{record.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getOperationsCategoryIcon(record.operationsCategory)}
                          <span className="text-sm text-gray-700">{record.operationsCategory}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{record.budgetType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {record.currency} {(record.allocatedAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-orange-600">
                          {record.currency} {(record.usedAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-green-600">
                          {record.currency} {(record.remainingAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                utilization > 90 ? 'bg-red-500' :
                                utilization > 75 ? 'bg-orange-500' :
                                utilization > 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{utilization.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div>{new Date(record.startDate).toLocaleDateString()}</div>
                          <div>to {new Date(record.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {record.status === 'Draft' && (
                            <button
                              onClick={() => handleStatusChange(record.id, 'Active')}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Activate Budget"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="px-6 py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingId ? 'Edit Budget' : 'Create New Budget'}
                </h3>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    resetForm();
                  }} 
                  className="text-white/90 hover:text-white"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
                    <input
                      type="text"
                      value={form.budgetName}
                      onChange={e => setForm({ ...form, budgetName: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operations Category</label>
                    <select 
                      value={form.operationsCategory} 
                      onChange={e => setForm({ ...form, operationsCategory: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select operations category</option>
                      {operationsCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Type</label>
                    <select 
                      value={form.budgetType} 
                      onChange={e => setForm({ ...form, budgetType: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select budget type</option>
                      {budgetTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <CurrencyAmountInput
                    amount={formAmount}
                    currency={formCurrency}
                    onAmountChange={setFormAmount}
                    onCurrencyChange={setFormCurrency}
                    label="Allocated Amount"
                    showUGXEquivalent={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    {editingId ? 'Update Budget' : 'Create Budget'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPMBudgetManagement;
