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
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface PurchaseOrder {
  id: number;
  poNumber: string;
  operationsCategory: string; // School, Clinic, Organization
  itemCategory: string; // Furniture, Equipment, Supplies, Services, etc.
  supplierName: string;
  supplierContact: string;
  supplierEmail?: string;
  supplierAddress?: string;
  items: PurchaseItem[];
  totalAmount: number;
  currency: string;
  status: string; // Draft, Pending, Approved, Ordered, Received, Cancelled
  priority: string; // Low, Medium, High, Urgent
  requestedBy: string;
  approvedBy?: string;
  orderDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  description: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseItem {
  id: number;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

const OPMPurchasingSystem: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [records, setRecords] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterItemCategory, setFilterItemCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [form, setForm] = useState({ 
    operationsCategory: '',
    itemCategory: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    supplierAddress: '',
    priority: '',
    description: '',
    notes: ''
  });
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [newItem, setNewItem] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    specifications: ''
  });

  // Operations categories
  const operationsCategories = [
    'School',
    'Clinic', 
    'Organization'
  ];

  // Item categories
  const itemCategories = [
    'Furniture',
    'Equipment',
    'Supplies',
    'Services',
    'Technology',
    'Medical Equipment',
    'Office Supplies',
    'Maintenance Tools',
    'Construction Materials',
    'Transportation',
    'Food & Beverages',
    'Cleaning Supplies',
    'Security Equipment',
    'Other'
  ];

  // Purchase order statuses
  const statuses = [
    'Draft',
    'Pending',
    'Approved',
    'Ordered',
    'Received',
    'Cancelled'
  ];

  // Priority levels
  const priorities = [
    'Low',
    'Medium',
    'High',
    'Urgent'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opm/purchase-orders');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      showAINotification('Error', 'Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generatePONumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${timestamp}-${random}`;
  };

  const calculateTotal = (items: PurchaseItem[]) => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const addItem = () => {
    if (!newItem.itemName || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      showAINotification('Error', 'Please fill in all item details', 'error');
      return;
    }

    const item: PurchaseItem = {
      id: Date.now(),
      ...newItem,
      totalPrice: newItem.quantity * newItem.unitPrice
    };

    setItems([...items, item]);
    setNewItem({
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      specifications: ''
    });
  };

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showAINotification('Error', 'Please add at least one item', 'error');
      return;
    }

    try {
      const totalAmount = calculateTotal(items);
      const purchaseOrderData = {
        ...form,
        poNumber: editingId ? records.find(r => r.id === editingId)?.poNumber : generatePONumber(),
        items,
        totalAmount,
        currency: DEFAULT_CURRENCY,
        status: 'Draft',
        requestedBy: user?.name || 'OPM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const url = editingId ? `/api/opm/purchase-orders/${editingId}` : '/api/opm/purchase-orders';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseOrderData)
      });

      if (res.ok) {
        showAINotification(
          'Success', 
          `Purchase Order ${editingId ? 'updated' : 'created'} successfully`, 
          'success'
        );
        setShowModal(false);
        setEditingId(null);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to save purchase order');
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      showAINotification('Error', 'Failed to save purchase order', 'error');
    }
  };

  const handleEdit = (record: PurchaseOrder) => {
    setForm({
      operationsCategory: record.operationsCategory,
      itemCategory: record.itemCategory,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      supplierEmail: record.supplierEmail || '',
      supplierAddress: record.supplierAddress || '',
      priority: record.priority,
      description: record.description,
      notes: record.notes || ''
    });
    setItems(record.items);
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    try {
      const res = await fetch(`/api/opm/purchase-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAINotification('Success', 'Purchase order deleted successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to delete purchase order');
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      showAINotification('Error', 'Failed to delete purchase order', 'error');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/opm/purchase-orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showAINotification('Success', 'Purchase order status updated successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to update purchase order status');
      }
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      showAINotification('Error', 'Failed to update purchase order status', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      operationsCategory: '',
      itemCategory: '',
      supplierName: '',
      supplierContact: '',
      supplierEmail: '',
      supplierAddress: '',
      priority: '',
      description: '',
      notes: ''
    });
    setItems([]);
    setNewItem({
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      specifications: ''
    });
  };

  const filteredRecords = (records || []).filter(record => {
    const matchesSearch = (record.poNumber || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (record.supplierName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (record.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !filterCategory || record.operationsCategory === filterCategory;
    const matchesItemCategory = !filterItemCategory || record.itemCategory === filterItemCategory;
    const matchesStatus = !filterStatus || record.status === filterStatus;
    const matchesPriority = !filterPriority || record.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesItemCategory && matchesStatus && matchesPriority;
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
      case 'Draft': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Ordered': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'Received': return <Package className="h-4 w-4 text-purple-500" />;
      case 'Cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'Received': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                Purchasing System
              </h1>
              <p className="text-gray-600 mt-2">Manage purchase orders and procurement across all operations</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Purchase Order</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Total Orders</p>
                <p className="text-2xl font-black text-blue-600">{(records || []).length}</p>
                <p className="text-xs text-gray-500 mt-1">All purchase orders</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Total Value</p>
                <p className="text-2xl font-black text-green-600">
                  {DEFAULT_CURRENCY} {(records || []).reduce((sum, r) => sum + (r.totalAmount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">All orders combined</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-yellow-50/30 to-orange-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-yellow-500">Pending Orders</p>
                <p className="text-2xl font-black text-yellow-600">
                  {(records || []).filter(r => r.status === 'Pending').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-violet-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-500">Received Orders</p>
                <p className="text-2xl font-black text-purple-600">
                  {(records || []).filter(r => r.status === 'Received').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
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
              value={filterItemCategory}
              onChange={(e) => setFilterItemCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Item Types</option>
              {itemCategories.map(category => (
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
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">PO Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Operations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Supplier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Total Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{record.poNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getOperationsCategoryIcon(record.operationsCategory)}
                        <span className="text-sm text-gray-700">{record.operationsCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{record.supplierName}</span>
                        <p className="text-xs text-gray-500">{record.supplierContact}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{(record.items || []).length} items</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {record.currency} {(record.totalAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                        {record.priority}
                      </span>
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
                      <span className="text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString()}
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
                        {record.status === 'Draft' && (
                          <button
                            onClick={() => handleStatusChange(record.id, 'Pending')}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Submit for Approval"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
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
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingId ? 'Edit Purchase Order' : 'Create New Purchase Order'}
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
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
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
                      {operationsCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Category</label>
                    <select 
                      value={form.itemCategory} 
                      onChange={e => setForm({ ...form, itemCategory: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select item category</option>
                      {itemCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select 
                      value={form.priority} 
                      onChange={e => setForm({ ...form, priority: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select priority</option>
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Supplier Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                      <input
                        type="text"
                        value={form.supplierName}
                        onChange={e => setForm({ ...form, supplierName: e.target.value })}
                        className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={form.supplierContact}
                        onChange={e => setForm({ ...form, supplierContact: e.target.value })}
                        className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={form.supplierEmail}
                        onChange={e => setForm({ ...form, supplierEmail: e.target.value })}
                        className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
                      <input
                        type="text"
                        value={form.supplierAddress}
                        onChange={e => setForm({ ...form, supplierAddress: e.target.value })}
                        className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Items</h4>
                  
                  {/* Add New Item */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          value={newItem.itemName}
                          onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                          className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.unitPrice}
                          onChange={e => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                        <input
                          type="text"
                          value={`${DEFAULT_CURRENCY} ${((newItem.quantity || 0) * (newItem.unitPrice || 0)).toLocaleString()}`}
                          className="w-full rounded-lg border-gray-300 bg-gray-100"
                          readOnly
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItem}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  {items.length > 0 && (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              Qty: {item.quantity || 0} × {DEFAULT_CURRENCY} {(item.unitPrice || 0).toLocaleString()} = {DEFAULT_CURRENCY} {(item.totalPrice || 0).toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="border-t pt-2">
                        <div className="flex justify-end">
                          <span className="text-lg font-bold text-gray-900">
                            Total: {DEFAULT_CURRENCY} {calculateTotal(items || []).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      rows={3}
                    />
                  </div>
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
                    {editingId ? 'Update Purchase Order' : 'Create Purchase Order'}
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

export default OPMPurchasingSystem;
