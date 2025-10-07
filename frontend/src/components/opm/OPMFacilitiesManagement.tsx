import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAINotification } from '../../contexts/AINotificationContext';
import { 
  Building, 
  Wrench, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  Thermometer,
  Zap,
  Droplets,
  Shield
} from 'lucide-react';

interface Facility {
  id: number;
  facilityName: string;
  facilityType: 'Classroom' | 'Office' | 'Laboratory' | 'Library' | 'Cafeteria' | 'Dormitory' | 'Auditorium' | 'Gymnasium' | 'Maintenance' | 'Other';
  location: string;
  capacity: number;
  currentOccupancy: number;
  status: 'Operational' | 'Under Maintenance' | 'Out of Service' | 'Renovation';
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceType: 'Routine' | 'Emergency' | 'Preventive' | 'Corrective';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  equipment: string[];
  issues: string[];
  assignedStaff: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const OPMFacilitiesManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useAINotification();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [form, setForm] = useState({
    facilityName: '',
    facilityType: 'Classroom',
    location: '',
    capacity: '',
    currentOccupancy: '',
    status: 'Operational',
    lastMaintenance: '',
    nextMaintenance: '',
    maintenanceType: 'Routine',
    priority: 'Medium',
    description: '',
    equipment: '',
    issues: '',
    assignedStaff: '',
    notes: ''
  });

  const facilityTypes = ['Classroom', 'Office', 'Laboratory', 'Library', 'Cafeteria', 'Dormitory', 'Auditorium', 'Gymnasium', 'Maintenance', 'Other'];
  const statuses = ['Operational', 'Under Maintenance', 'Out of Service', 'Renovation'];
  const maintenanceTypes = ['Routine', 'Emergency', 'Preventive', 'Corrective'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opm/facilities');
      if (res.ok) {
        const data = await res.json();
        setFacilities(data);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      showError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      facilityName: '',
      facilityType: 'Classroom',
      location: '',
      capacity: '',
      currentOccupancy: '',
      status: 'Operational',
      lastMaintenance: '',
      nextMaintenance: '',
      maintenanceType: 'Routine',
      priority: 'Medium',
      description: '',
      equipment: '',
      issues: '',
      assignedStaff: '',
      notes: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const facilityData = {
        ...form,
        capacity: parseInt(form.capacity) || 0,
        currentOccupancy: parseInt(form.currentOccupancy) || 0,
        equipment: form.equipment.split(',').map(e => e.trim()).filter(e => e),
        issues: form.issues.split(',').map(i => i.trim()).filter(i => i)
      };

      const url = editingId ? `/api/opm/facilities/${editingId}` : '/api/opm/facilities';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityData)
      });

      if (res.ok) {
        showSuccess(`Facility ${editingId ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to save facility');
      }
    } catch (error) {
      console.error('Error saving facility:', error);
      showError('Failed to save facility');
    }
  };

  const handleEdit = (facility: Facility) => {
    setForm({
      facilityName: facility.facilityName,
      facilityType: facility.facilityType,
      location: facility.location,
      capacity: facility.capacity.toString(),
      currentOccupancy: facility.currentOccupancy.toString(),
      status: facility.status,
      lastMaintenance: facility.lastMaintenance.split('T')[0],
      nextMaintenance: facility.nextMaintenance.split('T')[0],
      maintenanceType: facility.maintenanceType,
      priority: facility.priority,
      description: facility.description,
      equipment: facility.equipment.join(', '),
      issues: facility.issues.join(', '),
      assignedStaff: facility.assignedStaff,
      notes: facility.notes
    });
    setEditingId(facility.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;
    
    try {
      const res = await fetch(`/api/opm/facilities/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showSuccess('Facility deleted successfully');
        loadData();
      } else {
        throw new Error('Failed to delete facility');
      }
    } catch (error) {
      console.error('Error deleting facility:', error);
      showError('Failed to delete facility');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'bg-green-100 text-green-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Service': return 'bg-red-100 text-red-800';
      case 'Renovation': return 'bg-blue-100 text-blue-800';
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

  const filteredFacilities = (facilities || []).filter(facility => {
    const matchesSearch = (facility.facilityName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (facility.location || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (facility.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesType = !filterType || facility.facilityType === filterType;
    const matchesStatus = !filterStatus || facility.status === filterStatus;
    const matchesPriority = !filterPriority || facility.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Facilities Management
              </h1>
              <p className="text-gray-600 mt-2">Manage school facilities, maintenance schedules, and operational status</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Facility</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">Total Facilities</p>
                <p className="text-2xl font-black text-blue-600">{(facilities || []).length}</p>
                <p className="text-xs text-gray-500 mt-1">All facilities</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-500">Operational</p>
                <p className="text-2xl font-black text-green-600">
                  {(facilities || []).filter(f => f.status === 'Operational').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ready for use</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-yellow-50/30 to-orange-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-yellow-500">Under Maintenance</p>
                <p className="text-2xl font-black text-yellow-600">
                  {(facilities || []).filter(f => f.status === 'Under Maintenance').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Being serviced</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-red-50/30 to-rose-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-500">Issues</p>
                <p className="text-2xl font-black text-red-600">
                  {(facilities || []).filter(f => f.issues && f.issues.length > 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                {facilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Facilities Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Maintenance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFacilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{facility.facilityName}</div>
                        <div className="text-sm text-gray-500">{facility.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{facility.facilityType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-700">{facility.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {facility.currentOccupancy || 0}/{facility.capacity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                        {facility.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {new Date(facility.nextMaintenance).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(facility.priority)}`}>
                        {facility.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(facility)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(facility.id)}
                          className="text-red-600 hover:text-red-900"
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Facility' : 'New Facility'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                      <input
                        type="text"
                        required
                        value={form.facilityName}
                        onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
                      <select
                        value={form.facilityType}
                        onChange={(e) => setForm({ ...form, facilityType: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {facilityTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        required
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input
                        type="number"
                        required
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Occupancy</label>
                      <input
                        type="number"
                        value={form.currentOccupancy}
                        onChange={(e) => setForm({ ...form, currentOccupancy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
                      <input
                        type="date"
                        value={form.lastMaintenance}
                        onChange={(e) => setForm({ ...form, lastMaintenance: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
                      <input
                        type="date"
                        value={form.nextMaintenance}
                        onChange={(e) => setForm({ ...form, nextMaintenance: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
                      <select
                        value={form.maintenanceType}
                        onChange={(e) => setForm({ ...form, maintenanceType: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {maintenanceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {priorities.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment (comma-separated)</label>
                    <input
                      type="text"
                      value={form.equipment}
                      onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                      placeholder="Air Conditioner, Projector, Whiteboard, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issues (comma-separated)</label>
                    <input
                      type="text"
                      value={form.issues}
                      onChange={(e) => setForm({ ...form, issues: e.target.value })}
                      placeholder="Broken window, Leaky roof, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff</label>
                    <input
                      type="text"
                      value={form.assignedStaff}
                      onChange={(e) => setForm({ ...form, assignedStaff: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700"
                    >
                      {editingId ? 'Update Facility' : 'Create Facility'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPMFacilitiesManagement;


