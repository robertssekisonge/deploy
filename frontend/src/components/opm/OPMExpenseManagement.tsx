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
  Wrench,
  ShoppingCart,
  Truck,
  Zap,
  Users,
  FileText
} from 'lucide-react';

interface ExpenseRecord {
  id: number;
  expenseType: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  fundSource?: string;
  receiptNumber?: string;
  date: string;
  status: string;
  approvedBy?: string;
  operationsCategory: string; // School, Clinic, Organization
}

const OPMExpenseManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [fundSourceOptions, setFundSourceOptions] = useState<string[]>([]);
  const [availableBySource, setAvailableBySource] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openSources, setOpenSources] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterExpenseType, setFilterExpenseType] = useState('');
  const [filterOperationsCategory, setFilterOperationsCategory] = useState('');
  const [form, setForm] = useState({ 
    expenseType: '', 
    category: '', 
    amount: '', 
    description: '', 
    fundSource: '', 
    receiptNumber: '',
    operationsCategory: ''
  });
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<string>(DEFAULT_CURRENCY);

  // All CFO expense types
  const expenseTypes = [
    'Operations',
    'Maintenance', 
    'Supplies',
    'Salaries',
    'Utilities',
    'Transport',
    'Miscellaneous'
  ];

  // All CFO categories
  const categories = [
    'Administration',
    'Academic',
    'Payroll',
    'Infrastructure',
    'Student Welfare',
    'Healthcare',
    'Farm',
    'Other'
  ];

  // Operations categories for OPM
  const operationsCategories = [
    'School',
    'Clinic', 
    'Organization'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesRes, fundSourcesRes] = await Promise.all([
        fetch('/api/opm/expenses'),
        fetch('/api/opm/fund-sources')
      ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setRecords(expensesData);
      }

      if (fundSourcesRes.ok) {
        const fundData = await fundSourcesRes.json();
        setFundSourceOptions(fundData.sources || []);
        setAvailableBySource(fundData.available || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showAINotification('Error', 'Failed to load expense data', 'error');
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
      const expenseData = {
        ...form,
        amount: formAmount,
        currency: formCurrency,
        date: new Date().toISOString(),
        status: 'pending',
        operationsCategory: form.operationsCategory
      };

      const url = editingId ? `/api/opm/expenses/${editingId}` : '/api/opm/expenses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (res.ok) {
        showAINotification(
          'Success', 
          `Expense ${editingId ? 'updated' : 'added'} successfully`, 
          'success'
        );
        setShowModal(false);
        setEditingId(null);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showAINotification('Error', 'Failed to save expense', 'error');
    }
  };

  const handleEdit = (record: ExpenseRecord) => {
    setForm({
      expenseType: record.expenseType,
      category: record.category,
      amount: record.amount.toString(),
      description: record.description,
      fundSource: record.fundSource || '',
      receiptNumber: record.receiptNumber || '',
      operationsCategory: record.operationsCategory
    });
    setFormAmount(record.amount);
    setFormCurrency(record.currency);
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/opm/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAINotification('Success', 'Expense deleted successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showAINotification('Error', 'Failed to delete expense', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      expenseType: '',
      category: '',
      amount: '',
      description: '',
      fundSource: '',
      receiptNumber: '',
      operationsCategory: ''
    });
    setFormAmount(0);
    setFormCurrency(DEFAULT_CURRENCY);
  };

  const filteredRecords = (records || []).filter(record => {
    const matchesSearch = (record.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (record.category || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (record.expenseType || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !filterCategory || record.category === filterCategory;
    const matchesExpenseType = !filterExpenseType || record.expenseType === filterExpenseType;
    const matchesOperationsCategory = !filterOperationsCategory || record.operationsCategory === filterOperationsCategory;
    
    return matchesSearch && matchesCategory && matchesExpenseType && matchesOperationsCategory;
  });

  const getOperationsCategoryIcon = (category: string) => {
    switch (category) {
      case 'School': return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'Clinic': return <Stethoscope className="h-4 w-4 text-green-500" />;
      case 'Organization': return <Building className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getExpenseTypeIcon = (type: string) => {
    switch (type) {
      case 'Operations': return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'Maintenance': return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'Supplies': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'Salaries': return <Users className="h-4 w-4 text-purple-500" />;
      case 'Utilities': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'Transport': return <Truck className="h-4 w-4 text-red-500" />;
      case 'Miscellaneous': return <FileText className="h-4 w-4 text-gray-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
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
                Operations Expense Management
              </h1>
              <p className="text-gray-600 mt-2">Manage all operational expenses across School, Clinic, and Organization</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
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
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterExpenseType}
              onChange={(e) => setFilterExpenseType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Expense Types</option>
              {expenseTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterOperationsCategory}
              onChange={(e) => setFilterOperationsCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Operations</option>
              {operationsCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Operations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Expense Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getOperationsCategoryIcon(record.operationsCategory)}
                        <span className="text-sm font-medium text-gray-900">{record.operationsCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getExpenseTypeIcon(record.expenseType)}
                        <span className="text-sm text-gray-700">{record.expenseType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{record.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{record.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {record.currency} {(record.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'approved' ? 'bg-green-100 text-green-800' :
                        record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
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
                      </div>
                    </td>
                  </tr>
                ))}
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
                  {editingId ? 'Edit Expense' : 'Add New Expense'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operations Category</label>
                    <select 
                      value={form.operationsCategory} 
                      onChange={e => setForm({ ...form, operationsCategory: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select operations category</option>
                      <option value="School">School</option>
                      <option value="Clinic">Clinic</option>
                      <option value="Organization">Organization</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                    <select 
                      value={form.expenseType} 
                      onChange={e => setForm({ ...form, expenseType: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select expense type</option>
                      {expenseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      value={form.category} 
                      onChange={e => setForm({ ...form, category: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fund Source (optional)</label>
                    <select 
                      value={form.fundSource} 
                      onChange={e => setForm({ ...form, fundSource: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                      <option value="">Select fund source</option>
                      {fundSourceOptions.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <CurrencyAmountInput
                    amount={formAmount}
                    currency={formCurrency}
                    onAmountChange={setFormAmount}
                    onCurrencyChange={setFormCurrency}
                    label="Amount"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number (optional)</label>
                  <input
                    type="text"
                    value={form.receiptNumber}
                    onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
                    {editingId ? 'Update Expense' : 'Add Expense'}
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

export default OPMExpenseManagement;
