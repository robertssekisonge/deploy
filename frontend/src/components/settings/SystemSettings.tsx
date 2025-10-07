import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { 
  Database, Users, GraduationCap, DollarSign, Calendar, Heart, Stethoscope, 
  MessageSquare, AlertTriangle, RefreshCw, Activity, Server, HardDrive, 
  Download, Upload, Trash2, Edit3, Eye, Search, Filter, BarChart3, 
  Settings2, Shield, Zap, Clock, CheckCircle, XCircle, AlertCircle,
  DbIcon, Table, Key, Link, Archive, FileText, Lock, Unlock, 
  ChevronDown, ChevronUp, Play, Pause, RotateCcw, Database as DbIcon2,
  Terminal, Code, Cpu, MemoryStick, Wifi, WifiOff, Globe, Monitor
} from 'lucide-react';

interface SystemStats {
  students: number;
  parents: number;
  teachers: number;
  admins: number;
  superusers: number;
  attendanceRecords: number;
  sponsorships: number;
  clinicRecords: number;
  payments: number;
  messages: number;
  notifications: number;
  classes: number;
  timetables: number;
}

interface DbHealth {
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  connections: number;
  uptime: string;
  lastBackup: string;
  diskUsage: number;
  memoryUsage: number;
}

interface TableInfo {
  name: string;
  count: number;
  size: string;
  lastModified: string;
}

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showRefresh, showSystem, showData } = useNotification();
  
  // State management
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'tables' | 'backup' | 'query'>('overview');
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [backupStatus, setBackupStatus] = useState<string>('');

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch system statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch system stats');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  // Fetch database health
  const fetchDbHealth = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/system/health`);
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        setDbHealth({
          status: 'healthy',
          responseTime: endTime - startTime,
          connections: data.connections || 0,
          uptime: data.uptime || 'Unknown',
          lastBackup: data.lastBackup || 'Never',
          diskUsage: data.diskUsage || 0,
          memoryUsage: data.memoryUsage || 0
        });
      } else {
        setDbHealth({
          status: 'error',
          responseTime: endTime - startTime,
          connections: 0,
          uptime: 'Unknown',
          lastBackup: 'Never',
          diskUsage: 0,
          memoryUsage: 0
        });
      }
    } catch (error) {
      setDbHealth({
        status: 'error',
        responseTime: 0,
        connections: 0,
        uptime: 'Unknown',
        lastBackup: 'Never',
        diskUsage: 0,
        memoryUsage: 0
      });
    }
  };

  // Fetch table information
  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  // Fetch table data
  const fetchTableData = async (tableName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/tables/${tableName}`);
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  // Execute SQL query
  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueryResult(data);
        showData('Query Executed!', 'SQL query completed successfully and results are displayed below.');
      } else {
        const error = await response.json();
        showError('Query Failed', error.error);
      }
    } catch (error) {
      showError('Query error', 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  // Create backup
  const createBackup = async () => {
    setIsLoading(true);
    setBackupStatus('Creating backup...');
    try {
      const response = await fetch(`${API_BASE_URL}/system/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupStatus('Backup created successfully');
        showSystem('Backup Created!', 'Database backup has been successfully created and saved.');
      } else {
        setBackupStatus('Backup failed');
        showError('Backup Failed', 'Could not create backup due to system error.');
      }
    } catch (error) {
      setBackupStatus('Backup failed');
      showError('Backup error', 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore backup
  const restoreBackup = async (backupFile: File) => {
    setIsLoading(true);
    setBackupStatus('Restoring backup...');
    try {
      const formData = new FormData();
      formData.append('backup', backupFile);
      
      const response = await fetch(`${API_BASE_URL}/system/restore`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setBackupStatus('Backup restored successfully');
        showSuccess('Backup restored', 'System data has been restored');
        await fetchStats();
        await fetchTables();
      } else {
        setBackupStatus('Restore failed');
        showError('Restore failed', 'Could not restore backup');
      }
    } catch (error) {
      setBackupStatus('Restore failed');
      showError('Restore error', 'Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear operations
  const clearStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showSuccess('Students cleared', 'All student data has been cleared and IDs reset');
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear students');
      }
    } catch (error) {
      showError('Error', 'Failed to clear students');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearParents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showSuccess('Parents cleared', 'All parent accounts have been cleared');
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear parents');
      }
    } catch (error) {
      showError('Error', 'Failed to clear parents');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showSuccess('Teachers cleared', 'All teacher accounts and classes have been cleared');
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear teachers');
      }
    } catch (error) {
      showError('Error', 'Failed to clear teachers');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  // New deletion functions for individual tables
  const clearClinicRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-clinic-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Clinic Records Cleared', `Successfully cleared ${result.deletedCount} clinic records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear clinic records');
      }
    } catch (error) {
      showError('Error', 'Failed to clear clinic records');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Payment Records Cleared', `Successfully cleared ${result.deletedCount} payment and financial records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear payment records');
      }
    } catch (error) {
      showError('Error', 'Failed to clear payment records');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Attendance Records Cleared', `Successfully cleared ${result.deletedCount} attendance records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear attendance records');
      }
    } catch (error) {
      showError('Error', 'Failed to clear attendance records');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearSponsorships = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-sponsorships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Sponsorship Records Cleared', `Successfully cleared ${result.deletedCount} sponsorship records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear sponsorship records');
      }
    } catch (error) {
      showError('Error', 'Failed to clear sponsorship records');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearAcademicRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-academic-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Academic Records Cleared', `Successfully cleared ${result.deletedCount} academic records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear academic records');
      }
    } catch (error) {
      showError('Error', 'Failed to clear academic records');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Messages Cleared', `Successfully cleared ${result.deletedCount} messages`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear messages');
      }
    } catch (error) {
      showError('Error', 'Failed to clear messages');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Notifications Cleared', `Successfully cleared ${result.deletedCount} notifications`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear notifications');
      }
    } catch (error) {
      showError('Error', 'Failed to clear notifications');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearTimetables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-timetables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Timetables Cleared', `Successfully cleared ${result.deletedCount} timetables`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear timetables');
      }
    } catch (error) {
      showError('Error', 'Failed to clear timetables');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearClasses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Classes Cleared', `Successfully cleared ${result.deletedCount} classes`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear classes');
      }
    } catch (error) {
      showError('Error', 'Failed to clear classes');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Analytics Cleared', `Successfully cleared ${result.deletedCount} interaction analytics records`);
        await fetchStats();
        await fetchTables();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear analytics');
      }
    } catch (error) {
      showError('Error', 'Failed to clear analytics');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const clearAll = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('System reset', 'Complete system reset performed successfully');
        
        // Check if logout is required
        if (data.requiresLogout) {
          // Clear all session data
          localStorage.clear();
          sessionStorage.clear();
          
          // Show logout message
          showSuccess('Logging out', 'System reset complete. You will be redirected to login page.');
          
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          await fetchStats();
          await fetchTables();
        }
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to perform system reset');
      }
    } catch (error) {
      showError('Error', 'Failed to perform system reset');
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
      setDeleteConfirmText('');
    }
  };

  const handleDeleteAction = (action: string) => {
    setConfirmDelete(action);
    setDeleteConfirmText('');
  };

  const executeDeleteAction = () => {
    switch (confirmDelete) {
      case 'students':
        clearStudents();
        break;
      case 'parents':
        clearParents();
        break;
      case 'teachers':
        clearTeachers();
        break;
      case 'clinic-records':
        clearClinicRecords();
        break;
      case 'payments':
        clearPayments();
        break;
      case 'attendance':
        clearAttendance();
        break;
      case 'sponsorships':
        clearSponsorships();
        break;
      case 'academic-records':
        clearAcademicRecords();
        break;
      case 'messages':
        clearMessages();
        break;
      case 'notifications':
        clearNotifications();
        break;
      case 'timetables':
        clearTimetables();
        break;
      case 'classes':
        clearClasses();
        break;
      case 'analytics':
        clearAnalytics();
        break;
      case 'all':
        clearAll();
        break;
    }
  };

  const getConfirmText = () => {
    switch (confirmDelete) {
      case 'students':
        return 'DELETE ALL STUDENTS';
      case 'parents':
        return 'DELETE ALL PARENTS';
      case 'teachers':
        return 'DELETE ALL TEACHERS';
      case 'clinic-records':
        return 'DELETE ALL CLINIC RECORDS';
      case 'payments':
        return 'DELETE ALL PAYMENT RECORDS';
      case 'attendance':
        return 'DELETE ALL ATTENDANCE RECORDS';
      case 'sponsorships':
        return 'DELETE ALL SPONSORSHIP RECORDS';
      case 'academic-records':
        return 'DELETE ALL ACADEMIC RECORDS';
      case 'messages':
        return 'DELETE ALL MESSAGES';
      case 'notifications':
        return 'DELETE ALL NOTIFICATIONS';
      case 'timetables':
        return 'DELETE ALL TIMETABLES';
      case 'classes':
        return 'DELETE ALL CLASSES';
      case 'analytics':
        return 'DELETE ALL ANALYTICS';
      case 'all':
        return 'RESET ENTIRE SYSTEM';
      default:
        return '';
    }
  };

  const getConfirmMessage = () => {
    switch (confirmDelete) {
      case 'students':
        return 'This will permanently delete ALL students and reset access numbers/admission IDs to their original pools. This action cannot be undone.';
      case 'parents':
        return 'This will permanently delete ALL parent accounts and related data. This action cannot be undone.';
      case 'teachers':
        return 'This will permanently delete ALL teacher accounts, classes, and timetables. This action cannot be undone.';
      case 'clinic-records':
        return 'This will permanently delete ALL clinic records and medical data. This action cannot be undone.';
      case 'payments':
        return 'This will permanently delete ALL payment records and financial data. This action cannot be undone.';
      case 'attendance':
        return 'This will permanently delete ALL attendance records. This action cannot be undone.';
      case 'sponsorships':
        return 'This will permanently delete ALL sponsorship records and relationships. This action cannot be undone.';
      case 'academic-records':
        return 'This will permanently delete ALL academic records and grades. This action cannot be undone.';
      case 'messages':
        return 'This will permanently delete ALL messages and communication history. This action cannot be undone.';
      case 'notifications':
        return 'This will permanently delete ALL notifications and alerts. This action cannot be undone.';
      case 'timetables':
        return 'This will permanently delete ALL timetables and scheduling data. This action cannot be undone.';
      case 'classes':
        return 'This will permanently delete ALL classes and stream data. This action cannot be undone.';
      case 'analytics':
        return 'This will permanently delete ALL interaction analytics and tracking data. This action cannot be undone.';
      case 'all':
        return 'This will perform a COMPLETE SYSTEM RESET, deleting all users (except admins), students, parents, teachers, and all related data. This action cannot be undone.';
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDbHealth();
    fetchTables();
    
    // Auto-refresh health every 30 seconds
    const interval = setInterval(() => {
      fetchDbHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if user has permission
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERUSER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <Shield className="h-20 w-20 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 text-lg">You don't have permission to access system settings.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">System Management</h1>
              <p className="text-gray-600 text-lg">Comprehensive database administration and system monitoring</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'database', label: 'Database Health', icon: Activity },
                { id: 'tables', label: 'Table Management', icon: Table },
                { id: 'backup', label: 'Backup & Restore', icon: Archive },
                { id: 'query', label: 'SQL Query', icon: Terminal }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.students || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Parents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.parents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.teachers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                    <Database className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats?.attendanceRecords || 0) + (stats?.sponsorships || 0) + (stats?.clinicRecords || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Records</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.attendanceRecords || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sponsorships</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.sponsorships || 0}</p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clinic Records</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.clinicRecords || 0}</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* System Operations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">System Operations</h2>
                  <p className="text-gray-600">Perform maintenance operations on system data</p>
                </div>
                <AIRefreshButton
                  onClick={() => {
                    fetchStats();
                    fetchDbHealth();
                    fetchTables();
                    showRefresh('System Refreshed!', 'All data has been successfully updated from the server.');
                  }}
                  isLoading={isLoading}
                  variant="system"
                  size="md"
                >
                  Refresh All
                </AIRefreshButton>
              </div>

              {/* Delete Operations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-red-900">Delete from System</h3>
                      <p className="text-red-700">Clear specific data types from the system</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete from System
                      {showDeleteDropdown ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    </button>

                    {showDeleteDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-10">
                        <div className="py-2">
                          <button
                            onClick={() => handleDeleteAction('students')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <GraduationCap className="h-4 w-4 mr-3 text-blue-600" />
                            <div>
                              <div className="font-medium">Clear All Students</div>
                              <div className="text-sm text-gray-500">Reset access numbers & admission IDs</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('parents')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Users className="h-4 w-4 mr-3 text-green-600" />
                            <div>
                              <div className="font-medium">Clear All Parents</div>
                              <div className="text-sm text-gray-500">Remove parent accounts</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('teachers')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Users className="h-4 w-4 mr-3 text-purple-600" />
                            <div>
                              <div className="font-medium">Clear All Teachers</div>
                              <div className="text-sm text-gray-500">Remove teachers & classes</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('clinic-records')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Stethoscope className="h-4 w-4 mr-3 text-red-600" />
                            <div>
                              <div className="font-medium">Clear Clinic Records</div>
                              <div className="text-sm text-gray-500">Remove all medical data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('payments')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <DollarSign className="h-4 w-4 mr-3 text-green-600" />
                            <div>
                              <div className="font-medium">Clear Payment Records</div>
                              <div className="text-sm text-gray-500">Remove all financial data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('attendance')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Calendar className="h-4 w-4 mr-3 text-blue-600" />
                            <div>
                              <div className="font-medium">Clear Attendance Records</div>
                              <div className="text-sm text-gray-500">Remove all attendance data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('sponsorships')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Heart className="h-4 w-4 mr-3 text-pink-600" />
                            <div>
                              <div className="font-medium">Clear Sponsorship Records</div>
                              <div className="text-sm text-gray-500">Remove all sponsorship data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('academic-records')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <GraduationCap className="h-4 w-4 mr-3 text-indigo-600" />
                            <div>
                              <div className="font-medium">Clear Academic Records</div>
                              <div className="text-sm text-gray-500">Remove all grades & academic data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('messages')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-3 text-cyan-600" />
                            <div>
                              <div className="font-medium">Clear Messages</div>
                              <div className="text-sm text-gray-500">Remove all communication history</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('notifications')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <AlertCircle className="h-4 w-4 mr-3 text-orange-600" />
                            <div>
                              <div className="font-medium">Clear Notifications</div>
                              <div className="text-sm text-gray-500">Remove all alerts & notifications</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('timetables')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <Clock className="h-4 w-4 mr-3 text-purple-600" />
                            <div>
                              <div className="font-medium">Clear Timetables</div>
                              <div className="text-sm text-gray-500">Remove all scheduling data</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('classes')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <GraduationCap className="h-4 w-4 mr-3 text-teal-600" />
                            <div>
                              <div className="font-medium">Clear Classes</div>
                              <div className="text-sm text-gray-500">Remove all classes & streams</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteAction('analytics')}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                          >
                            <BarChart3 className="h-4 w-4 mr-3 text-violet-600" />
                            <div>
                              <div className="font-medium">Clear Analytics</div>
                              <div className="text-sm text-gray-500">Remove all interaction tracking</div>
                            </div>
                          </button>
                          <hr className="my-2" />
                          <button
                            onClick={() => handleDeleteAction('all')}
                            className="w-full text-left px-4 py-3 text-red-700 hover:bg-red-50 flex items-center transition-colors"
                          >
                            <AlertTriangle className="h-4 w-4 mr-3 text-red-600" />
                            <div>
                              <div className="font-medium">Complete System Reset</div>
                              <div className="text-sm text-red-500">Delete everything (except admins)</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Health Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Database Health Monitor</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Connection Status</p>
                      <p className="text-2xl font-bold text-green-800">
                        {dbHealth?.status === 'healthy' ? 'Healthy' : 'Error'}
                      </p>
                    </div>
                    {dbHealth?.status === 'healthy' ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Response Time</p>
                      <p className="text-2xl font-bold text-blue-800">{dbHealth?.responseTime || 0}ms</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Active Connections</p>
                      <p className="text-2xl font-bold text-purple-800">{dbHealth?.connections || 0}</p>
                    </div>
                    <Link className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Disk Usage</p>
                      <p className="text-2xl font-bold text-orange-800">{dbHealth?.diskUsage || 0}%</p>
                    </div>
                    <HardDrive className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">System Uptime</h3>
                  <p className="text-gray-600">{dbHealth?.uptime || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Last Backup</h3>
                  <p className="text-gray-600">{dbHealth?.lastBackup || 'Never'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Management Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Database Tables</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTable(table.name);
                      fetchTableData(table.name);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{table.name}</h3>
                        <p className="text-sm text-gray-600">{table.count} records</p>
                      </div>
                      <Table className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Size: {table.size} | Modified: {table.lastModified}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTable && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Table: {selectedTable}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tableData.length > 10 && (
                  <p className="mt-4 text-sm text-gray-500">Showing first 10 records of {tableData.length}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Backup & Restore Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Backup & Restore</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Create Backup</h3>
                  <p className="text-green-700 mb-4">Create a complete backup of all system data</p>
                  <button
                    onClick={createBackup}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </button>
                  {backupStatus && (
                    <p className="mt-2 text-sm text-green-600">{backupStatus}</p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Restore Backup</h3>
                  <p className="text-blue-700 mb-4">Restore system from a backup file</p>
                  <input
                    type="file"
                    accept=".sql,.backup"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) restoreBackup(file);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SQL Query Tab */}
        {activeTab === 'query' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">SQL Query Interface</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SQL Query
                  </label>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
                
                <button
                  onClick={executeQuery}
                  disabled={!sqlQuery.trim() || isLoading}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </button>
              </div>

              {queryResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Result</h3>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(queryResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">{getConfirmMessage()}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium mb-2">Type the following to confirm:</p>
                  <p className="text-red-600 font-mono text-lg">{getConfirmText()}</p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type confirmation text here"
                  className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setConfirmDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteAction}
                  disabled={deleteConfirmText !== getConfirmText() || isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;