import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserCheck, 
  UserX,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  X,
  Clock,
  Star,
  User,
  Download,
  RefreshCw
} from 'lucide-react';

const ParentManagement: React.FC = () => {
  const { students } = useData();
  const { user, users, addUser, updateUser } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Local state for users to allow updates
  const [localUsers, setLocalUsers] = useState(users);
  
  // Load users from backend on component mount
  useEffect(() => {
    const loadUsersFromBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        if (response.ok) {
          const backendUsers = await response.json();
          // Normalize studentIds and status for consistency across refreshes
          const normalized = (backendUsers || []).map((u: any) => {
            try {
              // Coerce studentIds into a JSON string of string IDs
              let ids: string[] = [];
              if (u && u.studentIds) {
                if (typeof u.studentIds === 'string') {
                  const parsed = JSON.parse(u.studentIds);
                  ids = Array.isArray(parsed) ? parsed.map((id: any) => id?.toString()) : [];
                } else if (Array.isArray(u.studentIds)) {
                  ids = u.studentIds.map((id: any) => id?.toString());
                }
              }
              return {
                ...u,
                studentIds: JSON.stringify(ids),
                status: (u.status || '').toString().toLowerCase(),
              };
            } catch (_e) {
              return {
                ...u,
                studentIds: '[]',
                status: (u?.status || '').toString().toLowerCase(),
              };
            }
          });
          // Merge with localStorage fallback
          try {
            const stored = localStorage.getItem('parentAssignments');
            if (stored) {
              const map = JSON.parse(stored) as Record<string, string[]>;
              for (let i = 0; i < normalized.length; i++) {
                const p = normalized[i];
                if (p && p.id && map[p.id]) {
                  const ids = (map[p.id] || []).map((id: any) => id?.toString());
                  normalized[i] = { ...p, studentIds: JSON.stringify(ids) };
                }
              }
            }
          } catch (_err) {}
          setLocalUsers(normalized);
          console.log('✅ Loaded users from backend:', backendUsers);
        } else {
          console.error('Failed to load users from backend:', response.status);
          // Fallback to context users merged with localStorage assignments
          try {
            const stored = localStorage.getItem('parentAssignments');
            if (stored) {
              const map = JSON.parse(stored) as Record<string, string[]>;
              const merged = (users || []).map((u: any) => {
                const ids = (map[u.id] || []).map((id: any) => id?.toString());
                return { ...u, studentIds: JSON.stringify(ids) };
              });
              setLocalUsers(merged);
            } else {
              setLocalUsers(users);
            }
          } catch (_e) {
            setLocalUsers(users);
          }
        }
      } catch (error) {
        console.error('Error loading users from backend:', error);
        // Fallback to context users merged with localStorage
        try {
          const stored = localStorage.getItem('parentAssignments');
          if (stored) {
            const map = JSON.parse(stored) as Record<string, string[]>;
            const merged = (users || []).map((u: any) => {
              const ids = (map[u.id] || []).map((id: any) => id?.toString());
              return { ...u, studentIds: JSON.stringify(ids) };
            });
            setLocalUsers(merged);
          } else {
            setLocalUsers(users);
          }
        } catch (_e) {
          setLocalUsers(users);
        }
      }
    };
    
    loadUsersFromBackend();
  }, [users]);
  
  // Function to sync with backend
  const syncWithBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (response.ok) {
        const backendUsers = await response.json();
        const normalized = (backendUsers || []).map((u: any) => {
          try {
            let ids: string[] = [];
            if (u && u.studentIds) {
              if (typeof u.studentIds === 'string') {
                const parsed = JSON.parse(u.studentIds);
                ids = Array.isArray(parsed) ? parsed.map((id: any) => id?.toString()) : [];
              } else if (Array.isArray(u.studentIds)) {
                ids = u.studentIds.map((id: any) => id?.toString());
              }
            }
            return {
              ...u,
              studentIds: JSON.stringify(ids),
              status: (u.status || '').toString().toLowerCase(),
            };
          } catch (_e) {
            return {
              ...u,
              studentIds: '[]',
              status: (u?.status || '').toString().toLowerCase(),
            };
          }
        });
        // Merge with localStorage fallback
        try {
          const stored = localStorage.getItem('parentAssignments');
          if (stored) {
            const map = JSON.parse(stored) as Record<string, string[]>;
            for (let i = 0; i < normalized.length; i++) {
              const p = normalized[i];
              if (p && p.id && map[p.id]) {
                const ids = (map[p.id] || []).map((id: any) => id?.toString());
                normalized[i] = { ...p, studentIds: JSON.stringify(ids) };
              }
            }
          }
        } catch (_err) {}
        setLocalUsers(normalized);
      showSuccess(
        '🔄 Data Synced!',
        'Parent data has been successfully synced with the backend!'
      );
        setSuccessMessage('Data synced with backend successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      } else {
      showError(
        '❌ Sync Failed',
        'Failed to sync with backend. Please try again.'
      );
        setSuccessMessage('Failed to sync with backend');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
    showError(
      '❌ Sync Error',
      'An error occurred while syncing with backend. Please try again.'
    );
      setSuccessMessage('Error syncing with backend');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };
  
  // Function to clear all assignments (for testing)
  const clearAllAssignments = async () => {
    if (window.confirm('Are you sure you want to clear ALL student assignments? This cannot be undone!')) {
      try {
        // Clear assignments for each parent
        for (const user of localUsers) {
          if (user.role === 'PARENT' && user.studentIds !== '[]') {
            await fetch(`http://localhost:5000/api/users/${user.id}/assign-students`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentIds: [] })
            });
          }
        }
        
        // Reload from backend
        await syncWithBackend();
        showSuccess(
          '🗑️ Assignments Cleared!',
          'All student assignments have been successfully cleared!'
        );
        setSuccessMessage('All assignments cleared successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
        // Clear fallback storage
        try { localStorage.removeItem('parentAssignments'); } catch (_e) {}
      } catch (error) {
        console.error('Error clearing assignments:', error);
        showError('Clear Failed', 'Error clearing assignments. Please try again.', 5000);
      }
    }
  };
  
  // Function to export assignments to JSON file
  const exportAssignments = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalParents: localUsers.length,
      assignments: localUsers.map(user => ({
        parentId: user.id,
        parentName: user.name,
        parentEmail: user.email,
        assignedStudents: getAssignedStudents(user.id).map(student => ({
          studentId: student.id,
          studentName: student.name,
          accessNumber: student.accessNumber,
          class: student.class,
          stream: student.stream
        })),
        status: user.status,
        lastUpdated: user.updatedAt
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parent-assignments-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(
      '📊 Export Complete!',
      'Parent assignments have been successfully exported to JSON file!'
    );
    setSuccessMessage('Assignments exported successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Check if data is loading
  if (!students || !users) {
    console.log('Data not loaded yet:', { students, users });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parent management...</p>
        </div>
      </div>
    );
  }



  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParentForDetails, setSelectedParentForDetails] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParent, setEditingParent] = useState<any>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [unassigningParent, setUnassigningParent] = useState<any>(null);
  const [unassigningStudent, setUnassigningStudent] = useState<any>(null);



  const [newParent, setNewParent] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    password: '',
    confirmPassword: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    parentId: '',
    studentIds: [] as string[]
  });

  // Filter users to show only parents
  const parentUsers = localUsers.filter(u => {
    try {
      return u && u.role && u.role.toLowerCase() === 'parent';
    } catch (error) {
      console.error('Error filtering parent users:', error, u);
      return false;
    }
  });
  
  // Filter students who are not assigned to any parent
  const unassignedStudents = students.filter(student => 
    !localUsers.some(u => {
      try {
        if (u.role?.toLowerCase() !== 'parent') return false;
        if (u.studentId && u.studentId.toString() === student.id?.toString()) return true;
        if (u.studentIds) {
          const ids = JSON.parse(u.studentIds).map((id: any) => id?.toString());
          return ids.includes(student.id?.toString());
        }
        return false;
      } catch (_e) {
        return false;
      }
    })
  );

  // Filter students assigned to a specific parent
  const getAssignedStudents = (parentId: string) => {
    try {
      const parent = localUsers.find(u => u.id === parentId);
      if (!parent || parent.role?.toLowerCase() !== 'parent') return [];
      
      if (parent.studentId) {
        return students.filter(s => s.id?.toString() === parent.studentId?.toString());
      } else if (parent.studentIds) {
        try {
          const studentIds = JSON.parse(parent.studentIds).map((id: any) => id?.toString());
          return students.filter(s => studentIds.includes(s.id?.toString()))
        } catch (parseError) {
          console.error('Error parsing studentIds for parent:', parentId, parseError);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error in getAssignedStudents:', error);
      return [];
    }
  };

  const handleAddParent = async () => {
    if (newParent.password !== newParent.confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match', 4000);
      return;
    }

    if (newParent.password.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters', 4000);
      return;
    }

    const parentData = {
      name: newParent.name,
      email: newParent.email,
      phone: newParent.phone,
      address: newParent.address,
      occupation: newParent.occupation,
      password: newParent.password,
      role: 'PARENT',
      studentId: '', // Will be assigned later
      studentIds: '[]', // Will be assigned later
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add via backend API for permanent storage
    try {
              const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentData)
      });
      
      if (response.ok) {
        const newParent = await response.json();
        console.log('✅ New parent saved to backend:', newParent);
        
        // Update local state with backend response
        setLocalUsers(prev => [...prev, newParent]);
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (apiError) {
      console.error('❌ Backend add failed:', apiError);
      showError('Parent Creation Failed', 'Failed to save new parent to backend. Please try again.', 5000);
      return;
    }

    // Show success message
    showSuccess(
      '👨‍👩‍👧‍👦 Parent Added!',
      `Parent ${newParent.name} has been successfully added to the system!`
    );
    setSuccessMessage(`Parent ${newParent.name} added successfully!`);
    setShowSuccessMessage(true);
    
    setShowAddForm(false);
    setNewParent({
      name: '',
      email: '',
      phone: '',
      address: '',
      occupation: '',
      password: '',
      confirmPassword: ''
    });
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleAssignStudents = async () => {
    console.log('🔍 Assignment function called with:', { selectedParent, selectedStudents });
    
    if (!selectedParent || selectedStudents.length === 0) {
      console.log('❌ Validation failed:', { selectedParent: !!selectedParent, selectedStudentsLength: selectedStudents.length });
      showError('Selection Required', 'Please select a parent and at least one student', 4000);
      return;
    }

    // Update parent with assigned students and activate account
    const updatedParent = {
      ...selectedParent,
      studentIds: JSON.stringify(selectedStudents),
      status: 'active', // Ensure parent account is active
      updatedAt: new Date()
    };

    console.log('📝 Updating parent with:', updatedParent);

    // Update via backend API for permanent storage
    try {
        console.log('🔍 Sending assignment request to:', `http://localhost:5000/api/users/${selectedParent.id}/assign-students`);
        console.log('🔍 Request body:', { studentIds: selectedStudents });
        console.log('🔍 Selected parent:', selectedParent);
        
        const response = await fetch(`http://localhost:5000/api/users/${selectedParent.id}/assign-students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds: selectedStudents })
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Assignment saved to backend:', result);
          
          // Update local state with the assignment
          const updatedLocalUsers = localUsers.map(user => 
            user.id === selectedParent.id ? {
              ...user,
              studentIds: JSON.stringify(selectedStudents)
            } : user
          );
          setLocalUsers(updatedLocalUsers);

          // Persist immediately to localStorage fallback so a quick refresh keeps it
          try {
            const stored = localStorage.getItem('parentAssignments');
            const map = stored ? JSON.parse(stored) : {};
            map[selectedParent.id] = selectedStudents.map(id => id.toString());
            localStorage.setItem('parentAssignments', JSON.stringify(map));
          } catch (_err) {}
        } else {
          const errorText = await response.text();
          console.error('❌ Backend error response:', errorText);
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.error('❌ Backend assignment failed:', apiError);
        showError('Assignment Failed', `Failed to save assignment to backend: ${apiError.message}`, 5000);
        return;
      }

      // Show success message
      setSuccessMessage(`Successfully assigned ${selectedStudents.length} student(s) to ${selectedParent.name}! Parent account is now active.`);
      setShowSuccessMessage(true);
      
      // Set assignment success state
      setAssignmentSuccess(true);
      
      // Show success notification
      showSuccess('Assignment Complete!', `${selectedStudents.length} student(s) have been successfully assigned to ${selectedParent.name}! Parent account is now ACTIVE and can access student data.`, 6000);
      
      // Close modal and reset form
      setShowAssignForm(false);
      setSelectedParent(null);
      setSelectedStudents([]);
      setStudentSearchTerm('');
      setAssignmentForm({ parentId: '', studentIds: [] });
      
      // Ensure any other modals are also closed
      setShowParentDetails(false);
      setSelectedParentForDetails(null);
      
      // Ensure we're back to the main parent list view
      // Force a refresh of the parent data to show updated assignments
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:5000/api/users');
          if (response.ok) {
            const backendUsers = await response.json();
            // Persist to localStorage fallback immediately
            try {
              const stored = localStorage.getItem('parentAssignments');
              const map = stored ? JSON.parse(stored) : {};
              map[selectedParent.id] = selectedStudents.map(id => id.toString());
              localStorage.setItem('parentAssignments', JSON.stringify(map));
            } catch (_err) {}

            // Normalize and merge fallback
            const normalized = (backendUsers || []).map((u: any) => {
              try {
                let ids: string[] = [];
                if (u && u.studentIds) {
                  if (typeof u.studentIds === 'string') {
                    const parsed = JSON.parse(u.studentIds);
                    ids = Array.isArray(parsed) ? parsed.map((id: any) => id?.toString()) : [];
                  } else if (Array.isArray(u.studentIds)) {
                    ids = u.studentIds.map((id: any) => id?.toString());
                  }
                }
                return { ...u, studentIds: JSON.stringify(ids), status: (u.status || '').toString().toLowerCase() };
              } catch (_e) {
                return { ...u, studentIds: '[]', status: (u?.status || '').toString().toLowerCase() };
              }
            });
            try {
              const stored = localStorage.getItem('parentAssignments');
              if (stored) {
                const map = JSON.parse(stored) as Record<string, string[]>;
                for (let i = 0; i < normalized.length; i++) {
                  const p = normalized[i];
                  if (p && p.id && map[p.id]) {
                    const ids = (map[p.id] || []).map((id: any) => id?.toString());
                    normalized[i] = { ...p, studentIds: JSON.stringify(ids) };
                  }
                }
              }
            } catch (_err) {}
            setLocalUsers(normalized);
            console.log('✅ Parent data refreshed after assignment');
          }
        } catch (error) {
          console.error('Error refreshing parent data:', error);
        }
      }, 1000);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Reset assignment success after 3 seconds
      setTimeout(() => setAssignmentSuccess(false), 3000);
      
      console.log('✅ Assignment completed successfully!');
  };

  const handleRemoveAssignment = (parentId: string, studentId: string) => {
    const parent = localUsers.find(u => u.id === parentId);
    const student = students.find(s => s.id === studentId);
    
    if (!parent || !student) return;

    // Show confirmation dialog
    setUnassigningParent(parent);
    setUnassigningStudent(student);
    setShowUnassignConfirm(true);
  };

  const confirmUnassign = async () => {
    if (!unassigningParent || !unassigningStudent) return;

    let currentStudentIds = [];
    if (unassigningParent.studentIds) {
      currentStudentIds = JSON.parse(unassigningParent.studentIds);
    }
    
    const updatedStudentIds = currentStudentIds.filter((id: string) => id !== unassigningStudent.id);
    
    // Update parent with proper status
    const updatedParent = {
      ...unassigningParent,
      studentIds: JSON.stringify(updatedStudentIds),
      status: updatedStudentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

    // Update via backend API for permanent storage
    try {
        const response = await fetch(`http://localhost:5000/api/users/${unassigningParent.id}/assigned-students/${unassigningStudent.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Unassignment saved to backend:', result);
          
          // Update local state with the unassignment
          const updatedLocalUsers = localUsers.map(user => 
            user.id === unassigningParent.id ? {
              ...user,
              studentIds: JSON.stringify(updatedStudentIds)
            } : user
          );
          setLocalUsers(updatedLocalUsers);
        } else {
          throw new Error(`Backend error: ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ Backend unassignment failed:', apiError);
        showError('Unassignment Failed', 'Failed to save unassignment to backend. Please try again.', 5000);
        return;
      }

      // Show success message
      setSuccessMessage(`Successfully unassigned ${unassigningStudent.name} from ${unassigningParent.name}!`);
      setShowSuccessMessage(true);
      
      // Close confirmation dialog
      setShowUnassignConfirm(false);
      setUnassigningParent(null);
      setUnassigningStudent(null);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const filteredParents = parentUsers.filter(parent =>
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.phone.includes(searchTerm)
  );

  const handleViewDetails = (parent: any) => {
    setSelectedParentForDetails(parent);
    setShowDetailsModal(true);
  };

  const handleEditParent = (parent: any) => {
    setEditingParent(parent);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingParent) return;

    try {
      // Update via backend API for permanent storage
      try {
        const response = await fetch(`http://localhost:5000/api/users/${editingParent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingParent)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Edit saved to backend:', result);
          
          // Update local state with backend response
          const updatedLocalUsers = localUsers.map(user => 
            user.id === editingParent.id ? result : user
          );
          setLocalUsers(updatedLocalUsers);
        } else {
          throw new Error(`Backend error: ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ Backend edit failed:', apiError);
        showError('Edit Failed', 'Failed to save edit to backend. Please try again.', 5000);
        return;
      }

      setShowEditModal(false);
      setEditingParent(null);
      setShowSuccessMessage(true);
      setSuccessMessage(`Parent ${editingParent.name} updated successfully!`);
      
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (error) {
      console.error('Error updating parent:', error);
      showError('Update Failed', 'Error updating parent. Please try again.', 5000);
    }
  };

  return (
      <div className="space-y-8">
        {/* AI-Generated Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  👨‍👩‍👧‍👦 Parent Management
                </h1>
                <p className="text-purple-100 mt-2 text-lg">
                  Manage parent accounts and student assignments
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">
                  {parentUsers.length} Parents Registered
                </span>
              </div>
            </div>
          </div>
          
          {/* AI-Generated Action Buttons */}
          <div className="flex flex-wrap items-center justify-end space-x-3 mt-6">
            <button
              onClick={exportAssignments}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              title="Export all assignments to JSON file"
            >
              <Download className="h-5 w-5" />
              <span>📊 Export</span>
            </button>
            <button
              onClick={clearAllAssignments}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              title="Clear all student assignments (for testing)"
            >
              <Trash2 className="h-5 w-5" />
              <span>🗑️ Clear All</span>
            </button>
            <AIRefreshButton
              onClick={syncWithBackend}
              variant="system"
              size="md"
            >
              🔄 Sync
            </AIRefreshButton>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>➕ Add Parent</span>
            </button>
          </div>
        </div>

      {/* AI-Generated Status Messages */}
      {showSuccessMessage && (
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-2 border-green-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900">✅ Success!</h3>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* AI-Generated Data Source Indicator */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <RefreshCw className="h-6 w-6 text-white" />
          </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900">🔄 Data Source</h3>
              <p className="text-blue-800 font-medium">Backend API (Permanent Storage)</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl px-4 py-2">
            <span className="text-sm font-medium text-blue-800">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          </div>
        </div>
      </div>

      {/* AI-Generated Parent Dashboard */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 border-2 border-purple-200/50 rounded-2xl shadow-2xl backdrop-blur-sm">
        {/* AI-Generated Dashboard Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                📊 Parent Dashboard
              </h2>
              <p className="text-purple-100 text-sm">Overview of parent accounts and student assignments</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {/* AI-Generated Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-200 border-2 border-purple-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-md">
                    <Users className="h-6 w-6 text-white" />
          </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-purple-800">Total Parents</p>
                    <p className="text-3xl font-bold text-purple-900">{parentUsers.length}</p>
          </div>
          </div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          </div>
            
            <div className="bg-gradient-to-br from-green-100 via-emerald-100 to-green-200 border-2 border-green-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-green-800">Active Parents</p>
                    <p className="text-3xl font-bold text-green-900">{parentUsers.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
            <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 border-2 border-blue-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <GraduationCap className="h-6 w-6 text-white" />
          </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-blue-800">With Students</p>
                    <p className="text-3xl font-bold text-blue-900">{parentUsers.filter(p => getAssignedStudents(p.id).length > 0).length}</p>
          </div>
          </div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

            <div className="bg-gradient-to-br from-orange-100 via-amber-100 to-orange-200 border-2 border-orange-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-md">
                    <UserX className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-orange-800">Unassigned</p>
                    <p className="text-3xl font-bold text-orange-900">{parentUsers.filter(p => getAssignedStudents(p.id).length === 0).length}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 border-2 border-indigo-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-indigo-800">Assignments</p>
                    <p className="text-3xl font-bold text-indigo-900">{parentUsers.reduce((total, p) => total + getAssignedStudents(p.id).length, 0)}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 border-2 border-pink-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-pink-800">Assigned %</p>
                    <p className="text-3xl font-bold text-pink-900">{parentUsers.length > 0 ? Math.round((parentUsers.filter(p => getAssignedStudents(p.id).length > 0).length / parentUsers.length) * 100) : 0}%</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* AI-Generated Summary Information */}
          <div className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/30 border-2 border-gray-200/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 text-indigo-600 mr-2" />
              📈 Summary Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Last Updated</p>
                  <p className="text-blue-700">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4">
                <Star className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Assignment Rate</p>
                  <p className="text-green-700">{parentUsers.length > 0 ? Math.round((parentUsers.filter(p => getAssignedStudents(p.id).length > 0).length / parentUsers.length) * 100) : 0}% have students assigned</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900">Average Assignments</p>
                  <p className="text-purple-700">{parentUsers.length > 0 ? (parentUsers.reduce((total, p) => total + getAssignedStudents(p.id).length, 0) / parentUsers.length).toFixed(1) : 0} per parent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Search Section */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* AI-Generated Search Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🔍 Search Parents
              </h2>
              <p className="text-blue-100 text-sm">Find parents by name, email, or phone number</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search parents by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full rounded-xl border-2 border-blue-200/50 shadow-lg focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-blue-50/30 px-4 py-3 text-gray-800 font-medium transition-all duration-200 hover:shadow-xl"
            />
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Parent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredParents.map((parent) => {
          const assignedStudents = getAssignedStudents(parent.id);
          return (
            <div key={parent.id} className={`rounded-xl shadow-lg border overflow-hidden max-w-sm mx-auto cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              assignedStudents.length > 0 
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            }`}>
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3">
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    assignedStudents.length > 0 
                      ? 'bg-green-100' 
                      : 'bg-orange-100'
                  }`}>
                    {parent.profilePicture ? (
                      <img 
                        src={parent.profilePicture} 
                        alt={parent.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Users className={`h-4 w-4 ${
                        assignedStudents.length > 0 ? 'text-green-600' : 'text-orange-600'
                      }`} />
                    )}
                  </div>
                  <span className="px-2 py-1 bg-yellow-400 rounded-full text-xs font-bold text-white">
                    {assignedStudents.length > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Compact Content */}
              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">{parent.name}</h3>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center text-gray-600 bg-purple-100 rounded p-1">
                    <span className="mr-1">📧</span>
                    <span className="font-medium text-purple-800 truncate">{parent.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-green-100 rounded p-1">
                    <span className="mr-1">📞</span>
                    <span className="font-medium text-green-800">{parent.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-orange-100 rounded p-1">
                    <span className="mr-1">👨‍👩‍👧‍👦</span>
                    <span className="font-medium text-orange-800">{assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              {/* Compact Assigned Students */}
              <div className="px-3 pb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-bold text-gray-700">Students:</span>
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                    assignedStudents.length > 0 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {assignedStudents.length}
                  </span>
                </div>
                
                {assignedStudents.length > 0 ? (
                  <div className="space-y-1">
                    {assignedStudents.slice(0, 2).map((student) => (
                      <div key={student.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-2 py-1">
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-3 w-3 text-green-600" />
                          <div>
                            <span className="text-xs font-bold text-gray-900">{student.name}</span>
                            <div className="text-xs text-gray-600">{student.accessNumber}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(parent.id, student.id)}
                          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                          title="Remove assignment"
                        >
                          <UserX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {assignedStudents.length > 2 && (
                      <div className="text-xs text-green-700 text-center py-1 bg-green-100 rounded">
                        +{assignedStudents.length - 2} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 bg-orange-100 rounded text-xs">
                    <p className="text-gray-600">No students assigned</p>
                    <p className="text-red-700 font-bold">⚠️ Account inactive</p>
                  </div>
                )}
              </div>
              
              {/* Compact Action Buttons */}
              <div className="flex space-x-1 px-3 pb-3">
                <button
                  onClick={() => handleEditParent(parent)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedParent(parent);
                    setSelectedStudents(assignedStudents.map(s => s.id));
                    setShowAssignForm(true);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-bold"
                >
                  Assign
                </button>
                <button
                  onClick={() => handleViewDetails(parent)}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold"
                >
                  Details
                </button>
                <button
                  onClick={() => {
                    showInfo('Profile Picture Status', `Profile Picture Status for ${parent.name}: ${parent.profilePicture ? '✅ Has profile picture' : '❌ No profile picture set'}. To upload/change profile picture, go to Settings in your account.`, 6000);
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold"
                  title="View Profile Picture Status"
                >
                  Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Parent Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Parent</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newParent.name}
                    onChange={(e) => setNewParent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newParent.email}
                    onChange={(e) => setNewParent(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newParent.phone}
                    onChange={(e) => setNewParent(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={newParent.occupation}
                    onChange={(e) => setNewParent(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newParent.address}
                  onChange={(e) => setNewParent(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={newParent.password}
                    onChange={(e) => setNewParent(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={newParent.confirmPassword}
                    onChange={(e) => setNewParent(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParent}
                  disabled={!newParent.name || !newParent.email || !newParent.phone || !newParent.password}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Parent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 p-4 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 px-4 py-2 rounded-lg">Assign Students to Parent</h2>
              <button
                onClick={() => setShowAssignForm(false)}
                className="text-gray-600 hover:text-gray-800 bg-white/20 rounded-full p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-800">
                  <strong>Assigning students to:</strong> {selectedParent?.name} ({selectedParent?.email})
                </p>
                <p className="text-xs text-purple-700 mt-2">
                  <strong>Important:</strong> Once students are assigned, the parent account becomes active and 
                  can immediately access the parent dashboard to view their children's information.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Select Students to Assign
                </label>
                
                {/* Student Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students by name or access number..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Student List - Only Show Searched Students */}
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {studentSearchTerm ? (
                    // Only show students that match the search
                    students
                      .filter(student => 
                        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        student.accessNumber.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      )
                      .map((student) => (
                        <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudents(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {student.accessNumber}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.class} - {student.stream}
                            </div>
                          </div>
                        </label>
                      ))
                  ) : (
                    // Show message when no search term
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Start typing to search for students</p>
                      <p className="text-xs text-gray-400 mt-1">Search by name or access number</p>
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {studentSearchTerm && students.filter(student => 
                    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    student.accessNumber.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <UserX className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No students found matching "{studentSearchTerm}"</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
                
                {/* Selected Students Summary */}
                {selectedStudents.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="text-xs text-green-700">
                      {selectedStudents.map(studentId => {
                        const student = students.find(s => s.id === studentId);
                        return student ? `${student.name} (${student.accessNumber})` : '';
                      }).filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Status */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800">
                    <strong>Ready to Assign:</strong> {selectedParent?.name} ← {selectedStudents.length} student(s) selected
                  </span>
                </div>
                {selectedStudents.length > 0 && (
                  <div className="text-xs text-purple-700 mt-1">
                    Students: {selectedStudents.map(id => {
                      const student = students.find(s => s.id === id);
                      return student ? `${student.name} (${student.accessNumber})` : '';
                    }).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStudents}
                  disabled={!selectedParent || selectedStudents.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirmation Modal */}
      {showUnassignConfirm && unassigningParent && unassigningStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Unassignment</h3>
                <p className="text-sm text-gray-600">Remove student from parent</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to unassign <strong>{unassigningStudent.name}</strong> from <strong>{unassigningParent.name}</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will deactivate the parent account if no students remain assigned.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnassignConfirm(false);
                  setUnassigningParent(null);
                  setUnassigningStudent(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnassign}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Unassign Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Details Modal */}
      {showDetailsModal && selectedParentForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Parent Details</h2>
                </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1"
              >
                <X className="h-6 w-6" />
              </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-6">
                  {selectedParentForDetails.profilePicture ? (
                    <div className="relative">
                    <img 
                      src={selectedParentForDetails.profilePicture} 
                      alt={selectedParentForDetails.name}
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="h-32 w-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <Users className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedParentForDetails.name}</h3>
                    <p className="text-lg text-gray-600 mb-3">{selectedParentForDetails.email}</p>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Parent
                      </span>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        selectedParentForDetails.status === 'active' || selectedParentForDetails.status === 'ACTIVE'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}>
                        {selectedParentForDetails.status === 'ACTIVE' ? 'active' : selectedParentForDetails.status}
                      </span>
                </div>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                </div>
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                      <Mail className="h-5 w-5 text-purple-500" />
                <div>
                        <div className="text-sm text-gray-500 font-medium">Email</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedParentForDetails.email}</div>
                </div>
                    </div>
                    {selectedParentForDetails.phone && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                        <Phone className="h-5 w-5 text-green-500" />
                <div>
                          <div className="text-sm text-gray-500 font-medium">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedParentForDetails.phone}</div>
                </div>
                      </div>
                    )}
                    {selectedParentForDetails.address && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                        <MapPin className="h-5 w-5 text-purple-500" />
                <div>
                          <div className="text-sm text-gray-500 font-medium">Address</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedParentForDetails.address}</div>
                </div>
                      </div>
                    )}
                </div>
              </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl p-6 border border-pink-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
                      <Users className="h-5 w-5 text-pink-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200">
                      <div className="text-sm text-gray-500 font-medium">Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedParentForDetails.status === 'active' || selectedParentForDetails.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                        {selectedParentForDetails.status === 'ACTIVE' ? 'active' : selectedParentForDetails.status}
                    </span>
                  </div>
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                      <div className="text-sm text-gray-500 font-medium">Role</div>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Parent
                      </span>
                  </div>
                  </div>
                </div>
              </div>

              {/* Assigned Students */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Assigned Students</h4>
                {(() => {
                  const assignedStudents = getAssignedStudents(selectedParentForDetails.id);
                  if (assignedStudents.length === 0) {
                    return (
                      <p className="text-gray-500 italic">No students assigned yet</p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {assignedStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                              <div className="text-xs text-gray-500">
                                {student.accessNumber} • {student.class} - {student.stream}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirmation Modal */}
      {showUnassignConfirm && unassigningParent && unassigningStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Unassignment</h3>
                <p className="text-sm text-gray-600">Remove student from parent</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to unassign <strong>{unassigningStudent.name}</strong> from <strong>{unassigningParent.name}</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will deactivate the parent account if no students remain assigned.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnassignConfirm(false);
                  setUnassigningParent(null);
                  setUnassigningStudent(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnassign}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Unassign Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {showEditModal && editingParent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 p-4 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 px-4 py-2 rounded-lg">Edit Parent</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-gray-800 bg-white/20 rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-2 border border-purple-200">
                  <label className="block text-sm font-medium text-purple-800 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editingParent.name}
                    onChange={(e) => setEditingParent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2 border border-blue-200">
                  <label className="block text-sm font-medium text-blue-800 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editingParent.email}
                    onChange={(e) => setEditingParent(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 text-gray-800"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-2 border border-green-200">
                  <label className="block text-sm font-medium text-green-800 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={editingParent.phone}
                    onChange={(e) => setEditingParent(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border-green-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-100 text-gray-800"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-2 border border-orange-200">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={editingParent.occupation}
                    onChange={(e) => setEditingParent(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full rounded-lg border-orange-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-100 text-gray-800"
                    placeholder="Enter occupation"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-2 border border-pink-200">
                <label className="block text-sm font-medium text-pink-800 mb-1">Address</label>
                <input
                  type="text"
                  value={editingParent.address}
                  onChange={(e) => setEditingParent(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border-pink-200 shadow-sm focus:border-pink-500 focus:ring-pink-500 bg-gray-100 text-gray-800"
                  placeholder="Enter address"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ParentManagement;



