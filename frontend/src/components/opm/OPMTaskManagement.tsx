import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
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
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  Target,
  Users,
  FileText,
  Wrench,
  ShoppingCart,
  Truck,
  Zap
} from 'lucide-react';

interface Task {
  id: number;
  taskName: string;
  operationsCategory: string; // School, Clinic, Organization
  taskType: string; // Maintenance, Construction, Procurement, Administrative, Emergency
  priority: string; // Low, Medium, High, Urgent
  status: string; // Not Started, In Progress, On Hold, Completed, Cancelled
  assignedTo: string;
  assignedBy: string;
  description: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours?: number;
  budget?: number;
  actualCost?: number;
  location?: string;
  dependencies?: string[];
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

const OPMTaskManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [form, setForm] = useState({ 
    taskName: '',
    operationsCategory: '',
    taskType: '',
    priority: '',
    assignedTo: '',
    description: '',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    budget: '',
    location: '',
    notes: ''
  });

  // Operations categories
  const operationsCategories = [
    'School',
    'Clinic', 
    'Organization'
  ];

  // Task types
  const taskTypes = [
    'Maintenance',
    'Construction',
    'Renovation',
    'Procurement',
    'Administrative',
    'Emergency',
    'Inspection',
    'Training',
    'Equipment Setup',
    'Security',
    'Cleaning',
    'Transportation',
    'Utilities',
    'Other'
  ];

  // Task statuses
  const statuses = [
    'Not Started',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
  ];

  // Priority levels
  const priorities = [
    'Low',
    'Medium',
    'High',
    'Urgent'
  ];

  // Mock staff list (in real app, this would come from API)
  const staffMembers = [
    'John Doe - Maintenance',
    'Jane Smith - Construction',
    'Mike Johnson - Procurement',
    'Sarah Wilson - Administrative',
    'David Brown - Security',
    'Lisa Davis - Cleaning',
    'Tom Miller - Transportation'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opm/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      showAINotification('Error', 'Failed to load tasks', 'error');
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
      const taskData = {
        ...form,
        estimatedHours: parseInt(form.estimatedHours) || 0,
        budget: parseFloat(form.budget) || 0,
        assignedBy: user?.name || 'OPM',
        status: 'Not Started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const url = editingId ? `/api/opm/tasks/${editingId}` : '/api/opm/tasks';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        showAINotification(
          'Success', 
          `Task ${editingId ? 'updated' : 'created'} successfully`, 
          'success'
        );
        setShowModal(false);
        setEditingId(null);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showAINotification('Error', 'Failed to save task', 'error');
    }
  };

  const handleEdit = (task: Task) => {
    setForm({
      taskName: task.taskName,
      operationsCategory: task.operationsCategory,
      taskType: task.taskType,
      priority: task.priority,
      assignedTo: task.assignedTo,
      description: task.description,
      startDate: task.startDate.split('T')[0],
      dueDate: task.dueDate.split('T')[0],
      estimatedHours: task.estimatedHours.toString(),
      budget: task.budget?.toString() || '',
      location: task.location || '',
      notes: task.notes || ''
    });
    setEditingId(task.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/opm/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAINotification('Success', 'Task deleted successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showAINotification('Error', 'Failed to delete task', 'error');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'Completed') {
        updateData.completedDate = new Date().toISOString();
      }
      
      const res = await fetch(`/api/opm/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        showAINotification('Success', 'Task status updated successfully', 'success');
        loadData();
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showAINotification('Error', 'Failed to update task status', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      taskName: '',
      operationsCategory: '',
      taskType: '',
      priority: '',
      assignedTo: '',
      description: '',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      budget: '',
      location: '',
      notes: ''
    });
  };

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = (task.taskName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (task.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (task.assignedTo || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !filterCategory || task.operationsCategory === filterCategory;
    const matchesTaskType = !filterTaskType || task.taskType === filterTaskType;
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesAssignedTo = !filterAssignedTo || task.assignedTo === filterAssignedTo;
    
    return matchesSearch && matchesCategory && matchesTaskType && matchesStatus && matchesPriority && matchesAssignedTo;
  });

  const getOperationsCategoryIcon = (category: string) => {
    switch (category) {
      case 'School': return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'Clinic': return <Stethoscope className="h-4 w-4 text-green-500" />;
      case 'Organization': return <Building className="h-4 w-4 text-purple-500" />;
      default: return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'Maintenance': return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'Construction': return <Building className="h-4 w-4 text-blue-500" />;
      case 'Renovation': return <Building className="h-4 w-4 text-purple-500" />;
      case 'Procurement': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'Administrative': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'Emergency': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Transportation': return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'Utilities': return <Zap className="h-4 w-4 text-yellow-500" />;
      default: return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Started': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'In Progress': return <Target className="h-4 w-4 text-blue-500" />;
      case 'On Hold': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
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

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'Completed' || status === 'Cancelled') return false;
    return new Date(dueDate) < new Date();
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
                Task Management
              </h1>
              <p className="text-gray-600 mt-2">Manage and track operational tasks across all departments</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Total Tasks</p>
                <p className="text-2xl font-black text-blue-600">{(tasks || []).length}</p>
                <p className="text-xs text-gray-500 mt-1">All tasks</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Completed</p>
                <p className="text-2xl font-black text-green-600">
                  {(tasks || []).filter(t => t.status === 'Completed').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-500">In Progress</p>
                <p className="text-2xl font-black text-orange-600">
                  {(tasks || []).filter(t => t.status === 'In Progress').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently active</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-500">Overdue</p>
                <p className="text-2xl font-black text-red-600">
                  {(tasks || []).filter(t => isOverdue(t.dueDate, t.status)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Past due date</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
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
              value={filterTaskType}
              onChange={(e) => setFilterTaskType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Task Types</option>
              {taskTypes.map(type => (
                <option key={type} value={type}>{type}</option>
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
            <select
              value={filterAssignedTo}
              onChange={(e) => setFilterAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Assignees</option>
              {staffMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Task Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Operations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Assigned To</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-gray-50/50 transition-colors ${isOverdue(task.dueDate, task.status) ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{task.taskName}</span>
                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getOperationsCategoryIcon(task.operationsCategory)}
                        <span className="text-sm text-gray-700">{task.operationsCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getTaskTypeIcon(task.taskType)}
                        <span className="text-sm text-gray-700">{task.taskType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{task.assignedTo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate, task.status) && (
                          <div className="text-xs text-red-600 font-semibold">OVERDUE</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              task.status === 'Completed' ? 'bg-green-500' :
                              task.status === 'In Progress' ? 'bg-blue-500' :
                              task.status === 'On Hold' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ 
                              width: task.status === 'Completed' ? '100%' : 
                                     task.status === 'In Progress' ? '50%' :
                                     task.status === 'On Hold' ? '25%' : '0%'
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {task.estimatedHours}h
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {task.status === 'Not Started' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'In Progress')}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Start Task"
                          >
                            <Target className="h-4 w-4" />
                          </button>
                        )}
                        {task.status === 'In Progress' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'Completed')}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Complete Task"
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
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingId ? 'Edit Task' : 'Create New Task'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                    <input
                      type="text"
                      value={form.taskName}
                      onChange={e => setForm({ ...form, taskName: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                    <select 
                      value={form.taskType} 
                      onChange={e => setForm({ ...form, taskType: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select task type</option>
                      {taskTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select 
                      value={form.assignedTo} 
                      onChange={e => setForm({ ...form, assignedTo: e.target.value })} 
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">Select assignee</option>
                      {staffMembers.map(member => (
                        <option key={member} value={member}>{member}</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      min="1"
                      value={form.estimatedHours}
                      onChange={e => setForm({ ...form, estimatedHours: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget (optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    rows={2}
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
                    {editingId ? 'Update Task' : 'Create Task'}
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

export default OPMTaskManagement;
