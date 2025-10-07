import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';
import SecurityNotification from '../common/SecurityNotification';
import { Search, Plus, Edit, Trash2, Key, Shield, UserCheck, UserX, Calendar, Mail, Phone, Eye, EyeOff, Lock, Unlock, Clock, CheckCircle, X, Check, Save } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '../../types';
import { ALL_PRIVILEGES, PrivilegeName } from '../../types';
import { getDefaultPrivilegesForRole } from '../../utils/roleDefaultPrivileges';


const UserManagement: React.FC = () => {
  const { user: currentUser, users, addUser, updateUser, deleteUser, resetPassword, fetchUsers, assignPrivilege, removePrivilege } = useAuth();
  const { addNotification } = useData();
  const { showSuccess, showError, showData, showSystem } = useNotification();


  // Ensure users are loaded when the page mounts
  useEffect(() => {
    (async () => {
      try {
        await fetchUsers();
      } catch (e) {
        showError('Failed to load users', 'Could not fetch users from the server.');
      }
    })();
  }, [fetchUsers, showError]);

  // Helper function to format privilege names
  const formatPrivilegeName = (priv: string) => {
    // Special formatting for messaging privileges
    if (priv.startsWith('message_')) {
      const role = priv.replace('message_', '');
      const roleMap: { [key: string]: string } = {
        'admin': 'Message Admin',
        'teacher': 'Message Teacher',
        'super_teacher': 'Message Super Teacher',
        'parent': 'Message Parent',
        'nurse': 'Message Nurse',
        'sponsor': 'Message Sponsor',
        'sponsorships_overseer': 'Message Sponsorships Overseer',
        'sponsorship_coordinator': 'Message Sponsorship Coordinator',
        'superuser': 'Message Super User'
      };
      return roleMap[role] || `Message ${role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }
    
    // Default formatting for other privileges
    return priv.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const getUsersByRole = (role: string) => {
    return users.filter(u => u.role.toLowerCase() === role.toLowerCase() || u.role === role.toUpperCase());
  };

  const getActiveUsers = () => {
    return users.filter(u => u.status === 'active' || u.status === 'ACTIVE');
  };

  const getLockedUsers = () => {
    return users.filter(u => 
      u.status === 'inactive' || 
      u.status === 'INACTIVE' || 
      u.accountLocked || 
      (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())
    );
  };

  const getUsersWithLoginHistory = () => {
    return users.filter(u => u.lastLogin);
  };

  const getUsersNeverLoggedIn = () => {
    return users.filter(u => !u.lastLogin);
  };

  const getMostRecentLogin = () => {
    const usersWithLogin = users.filter(u => u.lastLogin);
    if (usersWithLogin.length === 0) return null;
    
    const mostRecent = usersWithLogin.reduce((latest, user) => {
      const userLoginTime = new Date(user.lastLogin!).getTime();
      const latestTime = new Date(latest.lastLogin!).getTime();
      return userLoginTime > latestTime ? user : latest;
    });
    
    return mostRecent.lastLogin;
  };

  const getActiveInLast24h = () => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    return users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() > oneDayAgo);
  };



  const getRoleName = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'USER': return 'Teacher';
      case 'TEACHER': return 'Teacher';
      case 'ADMIN': return 'Administrator';
      case 'PARENT': return 'Parent';
      case 'NURSE': return 'School Nurse';
      case 'SPONSOR': return 'Sponsor';
      case 'SUPERUSER': return 'Super User';
      case 'SUPER_TEACHER': return 'Super Teacher';
      case 'SPONSORSHIP_COORDINATOR': return 'Sponsorship Coordinator';
      case 'SPONSORSHIPS_OVERSEER': return 'Sponsorships Overseer';
      default: return role || 'Unknown';
    }
  };


  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLogin, setFilterLogin] = useState('');
  


  // Filter users based on search and filters
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole) {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === filterRole.toLowerCase() || 
        user.role === filterRole.toUpperCase()
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(user => 
        user.status.toLowerCase() === filterStatus.toLowerCase() || 
        user.status === filterStatus.toUpperCase()
      );
    }

    // Filter by login status
    if (filterLogin) {
      switch (filterLogin) {
        case 'logged':
          filtered = filtered.filter(user => user.lastLogin);
          break;
        case 'never':
          filtered = filtered.filter(user => !user.lastLogin);
          break;
        case 'recent':
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => 
            user.lastLogin && new Date(user.lastLogin) > oneWeekAgo
          );
          break;
      }
    }

    return filtered;
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserRole, setAddUserRole] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', status: 'active', gender: '', age: '', residence: '' });
  const [editUserData, setEditUserData] = useState({ name: '', email: '', status: 'active', gender: '', age: '', residence: '' });
  const [editUserModal, setEditUserModal] = useState<{ open: boolean, user: any | null }>({ open: false, user: null });
  const [resetPassModal, setResetPassModal] = useState<{ open: boolean, user: any | null }>({ open: false, user: null });
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [lockScheduleModal, setLockScheduleModal] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });
  const [bulkLockModal, setBulkLockModal] = useState<{ open: boolean, role: string }>({ open: false, role: '' });
  const [lockDuration, setLockDuration] = useState<'15m' | '30m' | '1h' | '1d' | 'custom'>('1h');
  const [customLockDate, setCustomLockDate] = useState('');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [unlockModal, setUnlockModal] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockRequestModal, setUnlockRequestModal] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });
  const [unlockRequestData, setUnlockRequestData] = useState({ reason: '', contactInfo: '' });
  const [lockCountdowns, setLockCountdowns] = useState<{ [userId: string]: number }>({});
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [passwordResetRequests, setPasswordResetRequests] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [privilegeModal, setPrivilegeModal] = useState<{ 
    open: boolean, 
    user: User | null,
    searchTerm: string 
  }>({ 
    open: false, 
    user: null,
    searchTerm: ''
  });
  const [privState, setPrivState] = useState<{ [priv: string]: boolean }>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });
  const [resetPasswordModal, setResetPasswordModal] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });
  const [securityNotification, setSecurityNotification] = useState<{
    isOpen: boolean;
    type: 'breach-warning' | 'weak-password' | 'security-tip' | 'password-changed';
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    type: 'security-tip',
    title: '',
    message: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'manual' | 'whatsapp' | 'email'>('manual');
  const [deliveryContact, setDeliveryContact] = useState('');
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  // Function to format countdown time
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Update lock countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns: { [userId: string]: number } = {};

      users.forEach(user => {
        if (user.lockedUntil && new Date(user.lockedUntil).getTime() > now) {
          const timeLeft = Math.max(0, Math.floor((new Date(user.lockedUntil).getTime() - now) / 1000));
          newCountdowns[user.id] = timeLeft;
        }
      });

      setLockCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [users]);

  // Handler to open privilege modal for a user
  const openPrivilegeModal = (user: User) => {
    const userPrivileges = (user.privileges || []).map(p => p.privilege);
    const newPrivState: { [priv: string]: boolean } = {};
    ALL_PRIVILEGES.forEach(priv => {
      newPrivState[priv] = userPrivileges.includes(priv);
    });
    setPrivState(newPrivState);
    setPrivilegeModal({ open: true, user, searchTerm: '' });
  };

  // Handler to toggle a privilege
  const togglePrivilege = (priv: string) => {
    setPrivState(s => ({ ...s, [priv]: !s[priv] }));
  };

  // Handler to grant all privileges
  const grantAllPrivileges = () => {
    const all: { [priv: string]: boolean } = {};
    ALL_PRIVILEGES.forEach(priv => { all[priv] = true; });
    setPrivState(all);
  };

  // Handler to remove all privileges
  const removeAllPrivileges = () => {
    const none: { [priv: string]: boolean } = {};
    ALL_PRIVILEGES.forEach(priv => { none[priv] = false; });
    setPrivState(none);
  };

  // Add function to get default privileges for a role
  const getDefaultPrivileges = (role: string): PrivilegeName[] => {
    const rolePrivileges: Record<string, PrivilegeName[]> = {
      ADMIN: [
        "view_students", "add_student", "edit_student", "delete_student", "export_students",
        "view_teachers", "add_teacher", "edit_teacher", "delete_teacher",
        "view_classes", "add_class", "edit_class", "delete_class",
        "view_streams", "add_stream", "edit_stream", "delete_stream",
        "view_attendance", "mark_attendance", "edit_attendance", "delete_attendance", "export_attendance",
        "view_attendance_analysis",
        "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record", "export_financial",
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship",
        "view_reports", "generate_report", "view_weekly_reports", "manage_weekly_reports", "submit_reports", "approve_weekly_reports", "review_weekly_reports", "export_reports",
        "view_report_cards", "generate_report_cards",
        "view_payments", "process_payment", "refund_payment", "export_payments",
        "view_messages", "send_message", "delete_message",
        "view_notifications", "send_notification", "delete_notification",
        "view_settings", "edit_settings", "view_advanced_settings", "edit_advanced_settings",
        "view_analytics", "export_analytics",
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "delete_clinic_record", "export_clinic_records", "view_clinic_analytics",
        "view_photos", "add_photo", "edit_photo", "delete_photo",
        "view_resources", "add_resource", "edit_resource", "delete_resource", "export_resources",
        "view_timetables", "add_timetable", "edit_timetable", "delete_timetable",
        "view_users", "add_user", "edit_user", "delete_user", "lock_user", "unlock_user", "reset_user_password", "generate_temp_password", "export_users",
        "admin_panel"
      ],
      TEACHER: [
        "view_students", "add_student", "edit_student",
        "view_attendance", "mark_attendance", "edit_attendance",
        "view_reports", "submit_reports", "view_weekly_reports",
        "view_messages", "send_message",
        "view_classes", "view_streams",
        "view_timetables", "view_resources", "view_photos"
      ],
      USER: [
        "view_students", "add_student", "edit_student",
        "view_attendance", "mark_attendance", "edit_attendance",
        "view_reports", "submit_reports", "view_weekly_reports",
        "view_messages", "send_message",
        "view_classes", "view_streams",
        "view_timetables", "view_resources", "view_photos"
      ],
      SPONSOR: [
        "view_sponsorships", "view_students", "view_messages", "send_message", "view_payments"
      ],
      PARENT: [
        "view_students", "view_attendance", "view_financial", "view_reports", "view_messages", "send_message", "view_notifications", "view_clinic_records", "view_timetables", "view_resources", "view_photos", "manage_assigned_students"
      ],
      NURSE: [
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "view_messages", "send_message", "notify_clinic_visits"
      ],
      SUPERUSER: [
        "view_students", "view_teachers", "view_classes", "view_streams", "view_attendance", "view_financial", "view_sponsorships", "view_reports", "view_payments", "view_messages", "view_settings", "view_analytics", "view_clinic_records", "view_timetables", "view_photos", "view_resources", "view_notifications", "view_report_cards"
      ],
      SUPER_TEACHER: [
        "view_students", "view_attendance", "view_reports", "submit_reports", "view_weekly_reports", "view_messages", "send_message", "view_classes", "view_streams", "view_timetables", "view_resources", "view_photos"
      ],
      SPONSORSHIP_COORDINATOR: [
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "view_messages", "send_message", "view_payments"
      ],
      SPONSORSHIPS_OVERSEER: [
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "add_student", "edit_student", "view_messages", "send_message", "view_payments"
      ]
    };
    return getDefaultPrivilegesForRole(role);
  };

  // Handler to assign default privileges based on user role
  const assignDefaultPrivileges = () => {
    if (!privilegeModal.user) return;
    const defaultPrivileges = getDefaultPrivileges(privilegeModal.user.role);
    const newPrivState: { [priv: string]: boolean } = {};
      ALL_PRIVILEGES.forEach(priv => {
      newPrivState[priv] = defaultPrivileges.includes(priv);
      });
      setPrivState(newPrivState);
  };

  // Update the savePrivileges function with better error handling and confirmation
  const savePrivileges = async () => {
    if (!privilegeModal.user) return;
    setIsLoading(true);
    try {
      // Get current user privileges
      const currentPrivileges = (privilegeModal.user.privileges || []).map(p => p.privilege) as PrivilegeName[];
      
      // Get desired privileges
      const desiredPrivileges = Object.entries(privState)
        .filter(([_, v]) => v)
        .map(([priv]) => priv as PrivilegeName);
      
      console.log('Current privileges:', currentPrivileges);
      console.log('Desired privileges:', desiredPrivileges);
      
      // Track changes for confirmation
      const privilegesToAdd = desiredPrivileges.filter(p => !currentPrivileges.includes(p));
      const privilegesToRemove = currentPrivileges.filter(p => !desiredPrivileges.includes(p));
      
      console.log('Privileges to add:', privilegesToAdd);
      console.log('Privileges to remove:', privilegesToRemove);
      
      // Remove privileges that are no longer needed
      for (const privilege of privilegesToRemove) {
        console.log('Removing privilege:', privilege);
        await removePrivilege(privilegeModal.user.id, privilege);
      }
      
      // Add new privileges
      for (const privilege of privilegesToAdd) {
        console.log('Adding privilege:', privilege);
        await assignPrivilege(privilegeModal.user.id, privilege);
      }
      
      // Refresh users list to get updated data from backend
      await fetchUsers();
      
      // Close modal and show success message
      setPrivilegeModal({ open: false, user: null, searchTerm: '' });
      
      // Show detailed success message
      const changes = [];
      if (privilegesToAdd.length > 0) {
        changes.push(`Added: ${privilegesToAdd.join(', ')}`);
      }
      if (privilegesToRemove.length > 0) {
        changes.push(`Removed: ${privilegesToRemove.join(', ')}`);
      }
      
      const message = changes.length > 0 
        ? `Privileges updated successfully for ${privilegeModal.user.name}!\n\nChanges:\n${changes.join('\n')}`
        : `No changes made for ${privilegeModal.user.name}`;
      
      // Show AI-generated success notification instead of browser alert
      if (changes.length > 0) {
        showSuccess(
          'Privileges Updated Successfully!', 
          `Privileges for ${privilegeModal.user.name} have been updated successfully.`,
          5000
        );
      } else {
        showData(
          'No Changes Made',
          `No privilege changes were made for ${privilegeModal.user.name}.`,
          3000
        );
      }
      
      // Add notification
      addNotification({
        userId: privilegeModal.user.id,
        type: 'message',
        title: 'Privileges Updated',
        message: `Privileges for ${privilegeModal.user.name} have been updated successfully.`,
        date: new Date(),
        read: false
      });
      
    } catch (error) {
      console.error('Error updating privileges:', error);
      showError(
        'Privilege Update Failed', 
        `Failed to update privileges: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (formData: any) => {
      setIsLoading(true);
    try {
      const userData = {
      ...formData,
      password: 'user123',
      firstTimeLogin: true
    };
      await addUser(userData);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', status: 'active', gender: '', age: '', residence: '' });
      showSuccess('User Created!', 'User created successfully! Default password is "user123". User must change password on first login.');
    } catch (error) {
      console.error('Error adding user:', error);
      showError('User Creation Failed', 'Failed to add user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, formData: any) => {
      setIsLoading(true);
    try {
      console.log('Updating user:', userId, 'with data:', formData);
      
      // Update user in backend
      await updateUser(userId, formData);
      
      // Refresh users list to get updated data
      await fetchUsers();
      
      // Close modal
      setEditUserModal({ open: false, user: null });
      
      // Show success notification
      showSuccess('User Updated!', `User ${formData.name} updated successfully!`);
      
      // Add notification
      addNotification({
        userId: userId,
        type: 'message',
        title: 'User Updated',
        message: `User ${formData.name} has been updated successfully.`,
        date: new Date(),
        read: false
      });
      
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Update Failed', `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showError('Cannot Delete Account', "You cannot delete your own account!");
      return;
    }
    
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      showError('User Not Found', 'User not found!');
      return;
    }
    
    // Show AI-generated confirmation modal instead of browser confirm
    setDeleteConfirmModal({ open: true, user: userToDelete });
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmModal.user) return;
    
    setIsLoading(true);
    try {
      await deleteUser(deleteConfirmModal.user.id);
      showSystem('User Deleted!', `User ${deleteConfirmModal.user.name} deleted successfully!`);
      setDeleteConfirmModal({ open: false, user: null });
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Delete Failed', 'Failed to delete user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password: string): { isValid: boolean; error: string } => {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    const symbolRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (!symbolRegex.test(password)) {
      return { isValid: false, error: 'Password must contain at least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
    }
    
    return { isValid: true, error: '' };
  };

  const handlePasswordReset = async (userId: string) => {
    if (!resetPasswordValue) {
      alert('Please enter a new password');
      return;
    }

    const passwordValidation = validatePassword(resetPasswordValue);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.error);
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });

      if (response.ok) {
        alert('Password reset successfully');
        setResetPassModal({ open: false, user: null });
        setResetPasswordValue('');
        
        setPasswordResetRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        
        addNotification({
          userId: userId.toString(),
          type: 'message',
          title: 'Password Reset Completed',
          message: `Password was reset for user ID ${userId}.`,
          date: new Date(),
          read: false
        });
      } else {
        alert('Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Error resetting password');
    }
  };

  const clearPasswordResetRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: parseInt(userId),
          title: 'Password Reset Request',
          read: true 
        }),
      });

      if (response.ok) {
        setPasswordResetRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error clearing password reset request:', error);
    }
  };

  const handleLockUser = async (userId: string, lockUntil?: Date) => {
    setIsLoading(true);
    try {
      console.log('Locking user:', userId, 'until:', lockUntil);
      
      const response = await fetch(`/api/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lockUntil: lockUntil?.toISOString(),
          lockReason: 'Locked by administrator'
        }),
      });

      if (response.ok) {
        // Refresh users list to get updated data
        await fetchUsers();
        
        const user = users.find(u => u.id === userId);
        const lockMessage = lockUntil 
          ? `User ${user?.name} locked until ${lockUntil.toLocaleString()}`
          : `User ${user?.name} locked permanently`;
        
        alert(lockMessage);
        
        // Add notification
        addNotification({
          userId: userId,
          type: 'message',
          title: 'User Locked',
          message: lockMessage,
          date: new Date(),
          read: false
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error locking user:', error);
      alert(`Failed to lock user: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    if (!unlockPassword) {
      alert('Please enter a password');
      return;
    }
    
    const passwordValidation = validatePassword(unlockPassword);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.error);
      return;
    }
    setIsLoading(true);
    try {
      console.log('Unlocking user:', userId);
      
      const response = await fetch(`/api/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: unlockPassword }),
      });

      if (response.ok) {
        // Refresh users list to get updated data
        await fetchUsers();
        
        const user = users.find(u => u.id === userId);
        alert(`User ${user?.name} unlocked successfully!`);
        
        // Add notification
        addNotification({
          userId: userId,
          type: 'message',
          title: 'User Unlocked',
          message: `User ${user?.name} has been unlocked successfully.`,
          date: new Date(),
          read: false
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      alert(`Failed to unlock user: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpleUnlock = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'ACTIVE',
          lockedUntil: null,
          accountLocked: false,
          lockReason: null
        }),
      });

      if (response.ok) {
        await fetchUsers();
        alert('Account unlocked successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to unlock account: ${error.error}`);
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      alert('Failed to unlock user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkLock = async (role: string, lockUntil?: Date) => {
    setIsLoading(true);
    try {
      const roleUsers = users.filter(u => u.role.toLowerCase() === role.toLowerCase() || u.role === role.toUpperCase());
      
      if (roleUsers.length === 0) {
        alert('No users found for this role.');
        return;
      }

      const lockPromises = roleUsers.map(user => 
        fetch(`/api/users/${user.id}/lock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            lockUntil: lockUntil,
            lockReason: lockUntil ? `Bulk temporary lock by administrator` : 'Bulk permanent lock by administrator'
          }),
        })
      );

      const responses = await Promise.all(lockPromises);
      const failedResponses = responses.filter(response => !response.ok);

      if (failedResponses.length === 0) {
        await fetchUsers();
        alert(`Successfully locked ${roleUsers.length} users in ${role} role!`);
      } else {
        alert(`Failed to lock ${failedResponses.length} users. Please try again.`);
      }
    } catch (error) {
      console.error('Error bulk locking users:', error);
      alert('Failed to bulk lock users. Please try again.');
    } finally {
      setIsLoading(false);
      setBulkLockModal({ open: false, role: '' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (lockScheduleModal.open || bulkLockModal.open) {
      setModalPosition({ x: 0, y: 0 });
    }
  }, [lockScheduleModal.open, bulkLockModal.open]);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const newX = e.clientX - centerX;
      const newY = e.clientY - centerY;
      
      const maxX = window.innerWidth / 2 - 200;
      const maxY = window.innerHeight / 2 - 150;
      
      setModalPosition({
        x: Math.max(-maxX, Math.min(newX, maxX)),
        y: Math.max(-maxY, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (lockScheduleModal.open) {
      setLockDuration('1h');
      setCustomLockDate('');
      setCustomMinutes(30);
    }
  }, [lockScheduleModal.open]);

  useEffect(() => {
    if (bulkLockModal.open) {
      setLockDuration('1h');
      setCustomLockDate('');
      setCustomMinutes(30);
    }
  }, [bulkLockModal.open]);

  // Function to handle unlock requests
  const handleUnlockRequest = async () => {
    if (!unlockRequestModal.user) return;
      setIsLoading(true);
    try {
      console.log('Submitting unlock request for:', unlockRequestModal.user.name);
      
      const response = await fetch(`/api/users/${unlockRequestModal.user.id}/request-unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unlockRequestData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Unlock request submitted successfully!\n\nRequest ID: ${result.requestId}\n\nAdministrators will be notified of your request.`);
        
        // Close modal and reset form
        setUnlockRequestModal({ open: false, user: null });
        setUnlockRequestData({ reason: '', contactInfo: '' });
        
        // Add notification for admins (in a real app, this would be handled by the backend)
        addNotification({
          userId: 'admin', // This would be sent to all admins
          type: 'message',
          title: 'Unlock Request',
          message: `${unlockRequestModal.user.name} (${unlockRequestModal.user.email}) is requesting account unlock. Reason: ${unlockRequestData.reason || 'No reason provided'}. Contact: ${unlockRequestData.contactInfo || 'Not provided'}`,
          date: new Date(),
          read: false
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting unlock request:', error);
      alert(`Failed to submit unlock request: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support directly.`);
    } finally {
      setIsLoading(false);
    }
  };



  // Function to generate secure password
  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let result = '';
    
    // Ensure at least one character from each category
    result += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    result += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    result += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    result = result.split('').sort(() => Math.random() - 0.5).join('');
    setNewPassword(result);
    setConfirmPassword(result);
  };

  // Function to send password via WhatsApp
  const sendPasswordViaWhatsApp = async (phoneNumber: string, password: string, userName: string) => {
    const message = `🔐 Password Reset for ${userName}

Your new password has been generated:
${password}

Please login with this password immediately.
For security, change your password after login.

Best regards,
School Administration`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Function to send password via email
  const sendPasswordViaEmail = async (email: string, password: string, userName: string) => {
    const subject = 'Password Reset - School Management System';
    const body = `Dear ${userName},

Your password has been reset successfully.

New Password: ${password}

Please login with this password immediately.
For security, change your password after login.

Best regards,
School Administration Team`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Function to check password strength
  const checkPasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(Boolean).length;
    
    return {
      strength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isWeak: strength < 3,
      isStrong: strength >= 4
    };
  };

  // Function to check if password might be in a breach
  const checkPasswordBreach = (password: string) => {
    // Common weak passwords that might be in breaches
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
      'welcome', 'monkey', '1234567890', 'abc123', '111111', 'dragon',
      'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  };

  // Function to reset user password
  const handleResetPassword = async () => {
    if (!resetPasswordModal.user || !newPassword || !confirmPassword || !currentUser?.email) return;
    
    if (newPassword !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match!');
      return;
    }
    
    if (newPassword.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters long!');
      return;
    }

    // Check password strength and security
    const passwordStrength = checkPasswordStrength(newPassword);
    const isBreached = checkPasswordBreach(newPassword);

    // Show security warnings if needed
    if (isBreached) {
      setSecurityNotification({
        isOpen: true,
        type: 'breach-warning',
        title: 'Security Risk Detected',
        message: 'This password has been found in known data breaches and is considered unsafe. We strongly recommend using a different, more secure password.',
        actionText: 'Use Different Password',
        onAction: () => {
          setSecurityNotification({ isOpen: false, type: 'security-tip', title: '', message: '' });
          setNewPassword('');
          setConfirmPassword('');
        }
      });
      return;
    }

    if (passwordStrength.isWeak) {
      setSecurityNotification({
        isOpen: true,
        type: 'weak-password',
        title: 'Weak Password Detected',
        message: 'This password is weak and may be easily guessed. For better security, consider using a stronger password with mixed characters.',
        actionText: 'Continue Anyway',
        onAction: () => {
          setSecurityNotification({ isOpen: false, type: 'security-tip', title: '', message: '' });
          proceedWithPasswordReset();
        }
      });
      return;
    }
    
    proceedWithPasswordReset();
  };

  const proceedWithPasswordReset = async () => {
    try {
      setIsLoading(true);
      
      // Call the resetPassword function from AuthContext
      await resetPassword(resetPasswordModal.user.id, newPassword);
      
      // Handle delivery method
      if (deliveryMethod === 'whatsapp' && deliveryContact) {
        await sendPasswordViaWhatsApp(deliveryContact, newPassword, resetPasswordModal.user.name);
      } else if (deliveryMethod === 'email' && deliveryContact) {
        await sendPasswordViaEmail(deliveryContact, newPassword, resetPasswordModal.user.name);
      }
      
      // Show success message
      let successMessage = `✅ TEMPORARY PASSWORD PROVIDED SUCCESSFULLY!\n\n` +
        `👤 User: ${resetPasswordModal.user.name}\n` +
        `📧 Email: ${resetPasswordModal.user.email}\n` +
        `🔐 Temporary Password: ${newPassword}\n\n`;
      
      if (deliveryMethod === 'whatsapp' && deliveryContact) {
        successMessage += `📱 Password sent to WhatsApp: ${deliveryContact}\n`;
      } else if (deliveryMethod === 'email' && deliveryContact) {
        successMessage += `📧 Password sent to email: ${deliveryContact}\n`;
      } else {
        successMessage += `⚠️ The user can now login with this temporary password and will be required to change it on first login.`;
      }
      
      // Show success notification
      showSystem('Temporary Password Provided!', `Temporary password provided successfully for ${resetPasswordModal.user.name}. Password: ${newPassword}`);
      
      // Show security success notification
      setSecurityNotification({
        isOpen: true,
        type: 'password-changed',
        title: 'Temporary Password Successfully Provided',
        message: `A temporary password has been successfully provided for ${resetPasswordModal.user.name}. The user can now login with this password and will be required to change it on their first login.`,
        actionText: 'Close',
        onAction: () => {
          setSecurityNotification({ isOpen: false, type: 'security-tip', title: '', message: '' });
          // Close the modal
          setResetPasswordModal({ open: false, user: null });
          setNewPassword('');
          setConfirmPassword('');
          setShowNewPassword(false);
          setDeliveryMethod('manual');
          setDeliveryContact('');
        }
      });
      
      // Refresh users
      await fetchUsers();
    } catch (error) {
      console.error('Error resetting password:', error);
      showError('Password Reset Failed', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-300/20 to-rose-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{users.length}</div>
                <div className="text-sm text-gray-600 font-medium">Total Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{getActiveUsers().length}</div>
                <div className="text-sm text-gray-600 font-medium">Active Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-gradient-to-br from-white via-red-50/50 to-rose-50/50 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-red-300/20 to-rose-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{getUsersByRole('admin').length}</div>
                <div className="text-sm text-gray-600 font-medium">Admins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsors */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{getUsersByRole('sponsor').length}</div>
                <div className="text-sm text-gray-600 font-medium">Sponsors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="bg-gradient-to-br from-white via-red-50/50 to-rose-50/50 backdrop-blur-sm border border-red-300/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2"><UserX className="h-5 w-5" /> Locked Accounts</h2>
          </div>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {getLockedUsers().length === 0 ? (
              <div className="text-sm text-red-700 italic">No locked accounts.</div>
            ) : (
              getLockedUsers().slice(0, 3).map(u => (
                <div key={u.id} className="bg-white border border-red-200 rounded-lg px-3 py-1 flex flex-col gap-1 shadow-sm">
                  <span className="font-semibold text-red-700">{u.name}</span>
                  <span className="text-xs text-gray-500">{u.email}</span>
                  {u.lockedUntil && (
                    <span className="text-xs text-red-500">
                      {lockCountdowns[u.id] ? (
                        <span className="font-bold">⏰ Auto-unlock in: {formatCountdown(lockCountdowns[u.id])}</span>
                      ) : (
                        <span>Locked until: {typeof u.lockedUntil === 'string' ? u.lockedUntil : u.lockedUntil?.toLocaleString()}</span>
                      )}
                    </span>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      className="px-2 py-1 rounded bg-green-200 hover:bg-green-300 text-xs"
                      onClick={() => handleSimpleUnlock(u.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Unlocking...' : 'Unlock'}
                    </button>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERUSER') && (
                    <button
                        className="px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold shadow-sm hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                        onClick={() => setResetPasswordModal({ open: true, user: u })}
                      disabled={isLoading}
                        title="Reset Password"
                    >
                        🔐 RESET PW
                    </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Login Statistics
        </h3>
        
        {/* Current Filter Status */}
        {(searchTerm || filterRole || filterStatus || filterLogin) && (
          <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Current View:</span> Showing {getFilteredUsers().length} of {users.length} total users
              </div>
              <div className="flex gap-2">
                {searchTerm && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border">
                    Search: "{searchTerm}"
                  </span>
                )}
                {filterRole && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border">
                    Role: {filterRole}
                  </span>
                )}
                {filterStatus && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full border">
                    Status: {filterStatus}
                  </span>
                )}
                {filterLogin && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full border">
                    Login: {filterLogin}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users with Login History */}
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-6 w-6 text-white" />
          </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {getUsersWithLoginHistory().length}
          </div>
                  <div className="text-sm text-gray-600 font-medium">Users with Login History</div>
            </div>
          </div>
              <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">📘 Have at least one login record</div>
            </div>
          </div>

          {/* Users Never Logged In */}
          <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserX className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {getUsersNeverLoggedIn().length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Users Never Logged In</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">🟢 Accounts with no login yet</div>
            </div>
          </div>

          {/* Most Recent Login */}
          <div className="bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-300/20 to-rose-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {getMostRecentLogin() ? format(new Date(getMostRecentLogin()!), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Most Recent Login</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">⏱ Updates as users sign in</div>
            </div>
          </div>

          {/* Active in Last 24h */}
          <div className="bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 backdrop-blur-sm border border-amber-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-amber-300/20 to-orange-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              {getActiveInLast24h().length}
            </div>
                  <div className="text-sm text-gray-600 font-medium">Active in Last 24h</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">🔥 Recently active users</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or access number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Teacher</option>
            <option value="hr">HR</option>
            <option value="cfo">CFO</option>
            <option value="opm">Operations Manager</option>
            <option value="sponsor">Sponsor</option>
            <option value="parent">Parent</option>
            <option value="nurse">Nurse</option>
            <option value="superuser">Super User</option>
            <option value="super-teacher">Super Teacher</option>
            <option value="sponsorship-coordinator">Sponsorship Coordinator</option>
            <option value="sponsorships-overseer">Sponsorships Overseer</option>
            <option value="accountant">Accountant</option>
            <option value="secretary">Secretary</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <select
            value={filterLogin}
            onChange={(e) => setFilterLogin(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="">All Login Status</option>
            <option value="logged">Has Logged In</option>
            <option value="never">Never Logged In</option>
            <option value="recent">Logged In Last 7 Days</option>
          </select>
        </div>
        
        {/* Search Results Summary */}
        {(searchTerm || filterRole || filterStatus || filterLogin) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Search Results:</span> {getFilteredUsers().length} users found
                {searchTerm && <span className="ml-2">for "{searchTerm}"</span>}
                {filterRole && <span className="ml-2">in {filterRole} role</span>}
                {filterStatus && <span className="ml-2">with {filterStatus} status</span>}
                {filterLogin && <span className="ml-2">with {filterLogin} login status</span>}
      </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('');
                  setFilterStatus('');
                  setFilterLogin('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {(searchTerm || filterRole || filterStatus || filterLogin) && getFilteredUsers().length === 0 && (
          <div className="mt-4 p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <div className="text-yellow-600 mb-2">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p className="text-lg font-medium">No users found</p>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              No users match your current search criteria and filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterStatus('');
                setFilterLogin('');
              }}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              Clear all filters to see all users
            </button>
          </div>
        )}
      </div>



      {/* Search Results Display */}
      {(searchTerm || filterRole || filterStatus || filterLogin) && getFilteredUsers().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search Results ({getFilteredUsers().length} users)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredUsers().map(u => (
              <div key={u.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{u.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border font-semibold uppercase">{u.role}</span>
                  {u.status === 'active' || u.status === 'ACTIVE' ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border">ACTIVE</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full border">INACTIVE</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">{u.email}</div>
                <div className="text-xs text-gray-500 mb-2">
                  Created: {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : '-'}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Last Login: {u.lastLogin ? format(new Date(u.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-1 rounded bg-blue-200 hover:bg-blue-300 text-xs"
                    title="Edit User"
                    onClick={() => {
                      setEditUserModal({ open: true, user: u });
                      setEditUserData({ name: u.name, email: u.email, status: u.status, gender: u.gender || '', age: String(u.age || ''), residence: u.residence || '' });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 rounded bg-green-200 hover:bg-green-300 text-xs"
                    title="Reset Password"
                    onClick={() => setResetPasswordModal({ open: true, user: u })}
                  >
                    <Key className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 rounded bg-red-200 hover:bg-red-300 text-xs"
                    title="Delete User"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div key={refreshKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
        {[
          { role: 'ADMIN', label: 'Admin', color: 'bg-purple-200 border-purple-500 shadow-purple-200', text: 'text-purple-900', button: 'bg-purple-600 hover:bg-purple-700' },
          { role: 'SUPERUSER', label: 'Super User', color: 'bg-orange-200 border-orange-500 shadow-orange-200', text: 'text-orange-900', button: 'bg-orange-600 hover:bg-orange-700' },
          { role: 'TEACHER', label: 'Teacher', color: 'bg-blue-200 border-blue-500 shadow-blue-200', text: 'text-blue-900', button: 'bg-blue-600 hover:bg-blue-700' },
          { role: 'SUPER_TEACHER', label: 'Super Teacher', color: 'bg-indigo-200 border-indigo-500 shadow-indigo-200', text: 'text-indigo-900', button: 'bg-indigo-600 hover:bg-indigo-700' },
          { role: 'SECRETARY', label: 'Secretary', color: 'bg-fuchsia-200 border-fuchsia-500 shadow-fuchsia-200', text: 'text-fuchsia-900', button: 'bg-fuchsia-600 hover:bg-fuchsia-700' },
          { role: 'ACCOUNTANT', label: 'Accountant', color: 'bg-emerald-200 border-emerald-500 shadow-emerald-200', text: 'text-emerald-900', button: 'bg-emerald-600 hover:bg-emerald-700' },
          { role: 'CFO', label: 'CFO', color: 'bg-purple-200 border-purple-500 shadow-purple-200', text: 'text-purple-900', button: 'bg-purple-600 hover:bg-purple-700' },
          { role: 'OPM', label: 'Operations Manager', color: 'bg-orange-200 border-orange-500 shadow-orange-200', text: 'text-orange-900', button: 'bg-orange-600 hover:bg-orange-700' },
          { role: 'HR', label: 'HR', color: 'bg-rose-200 border-rose-500 shadow-rose-200', text: 'text-rose-900', button: 'bg-rose-600 hover:bg-rose-700' },
          { role: 'SPONSOR', label: 'Sponsor', color: 'bg-green-200 border-green-500 shadow-green-200', text: 'text-green-900', button: 'bg-green-600 hover:bg-green-700' },
          { role: 'PARENT', label: 'Parent', color: 'bg-pink-200 border-pink-500 shadow-pink-200', text: 'text-pink-900', button: 'bg-pink-600 hover:bg-pink-700' },
          { role: 'NURSE', label: 'Nurse', color: 'bg-teal-200 border-teal-500 shadow-teal-200', text: 'text-teal-900', button: 'bg-teal-600 hover:bg-teal-700' },
          { role: 'SPONSORSHIP_COORDINATOR', label: 'Sponsorship Coordinator', color: 'bg-yellow-200 border-yellow-500 shadow-yellow-200', text: 'text-yellow-900', button: 'bg-yellow-500 hover:bg-yellow-600' },
          { role: 'SPONSORSHIPS_OVERSEER', label: 'Sponsorships Overseer', color: 'bg-amber-200 border-amber-500 shadow-amber-200', text: 'text-amber-900', button: 'bg-amber-600 hover:bg-amber-700' },
        ].map(roleBox => (
          <div
            key={roleBox.role}
              className={`rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 cursor-pointer ${roleBox.color} ${roleBox.text} shadow-lg overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold tracking-wide">{roleBox.label}</span>
              <div className="flex gap-1">
              <button
                className={`px-2 py-1 rounded text-white text-xs font-semibold shadow-md transition-colors duration-150 ${roleBox.button}`}
                onClick={() => { setShowAddUserModal(true); setAddUserRole(roleBox.role); }}
                  disabled={isLoading}
              >
                Add {roleBox.label}
              </button>
                {getUsersByRole(roleBox.role).length > 0 && (
                  <button
                    className={`px-1 py-0.5 rounded text-white text-[9px] font-bold shadow-md transition-colors duration-150 
                      ${getUsersByRole(roleBox.role).every(u => u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now()))
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'}
                    `}
                    onClick={() => {
                      const roleUsers = getUsersByRole(roleBox.role);
                      const allLocked = roleUsers.every(u => u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now()));
                      if (allLocked) {
                        handleBulkLock(roleBox.role);
                      } else {
                        setBulkLockModal({ open: true, role: roleBox.role });
                      }
                    }}
                    style={{ minWidth: 0, minHeight: 0 }}
                  >
                    {getUsersByRole(roleBox.role).every(u => u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) ? (
                      <svg className="inline w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="inline w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m6 4V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2z" /></svg>
                    )}
                    {getUsersByRole(roleBox.role).every(u => u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) ? 'Unlock All' : 'Lock All'}
                  </button>
                )}
              </div>
                      </div>
            <div className="divide-y divide-gray-200">
              {                getUsersByRole(roleBox.role).length === 0 ? (
                <div className="py-4 text-gray-400 italic">No users for this role.</div>
              ) : (
                  getUsersByRole(roleBox.role).map(u => (
                  <div 
                    key={u.id} 
                    className={`py-2 flex flex-col gap-1 ${
                      passwordResetRequests.has(u.id.toString()) 
                        ? 'animate-shake bg-yellow-50 border-l-4 border-yellow-400 pl-2' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base">{u.name}</span>
                      <span className="text-[10px] bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full border font-semibold uppercase">{u.role}</span>
                      {/* Privilege count badge */}
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full border font-medium">
                        {u.privileges ? u.privileges.length : 0} privileges
                        </span>
                      {u.accountLocked ? (
                        <span title="Account Locked" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-100 border border-red-300">
                          <Lock className="h-3 w-3 text-red-600" />
                        </span>
                      ) : u.status.toLowerCase() === 'active' ? (
                        <span title="Active" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-100 border border-green-300">
                          <UserCheck className="h-3 w-3 text-green-600" />
                        </span>
                      ) : (
                        <span title="Inactive" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-100 border border-gray-300">
                          <UserX className="h-3 w-3 text-gray-600" />
                        </span>
                      )}
                      {passwordResetRequests.has(u.id.toString()) && (
                        <span title="Password Reset Requested" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-100 border border-yellow-300 animate-pulse">
                          <Key className="h-3 w-3 text-yellow-600" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600">{u.email}</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span>Status: <span className="font-semibold capitalize">{u.status}</span></span>
                      <span>Created: {u.createdAt ? format(u.createdAt, 'MMM dd, yyyy') : '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] mt-1">
                      <span className="font-medium text-blue-600">Last Login:</span>
                      {u.lastLogin ? (
                        <div className="flex flex-col">
                          <span className="text-blue-800 font-semibold">
                            {format(u.lastLogin, 'MMM dd, yyyy')} at {format(u.lastLogin, 'HH:mm:ss')}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {Math.floor((Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Never logged in</span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button
                        className="p-0.5 rounded bg-gray-200 hover:bg-gray-300 text-[10px]"
                        title="Edit User"
                        onClick={() => {
                          setEditUserModal({ open: true, user: u });
                          setEditUserData({ name: u.name, email: u.email, status: u.status, gender: u.gender || '', age: String(u.age || ''), residence: u.residence || '' });
                        }}
                        disabled={isLoading}
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 rounded bg-gray-200 hover:bg-gray-300 text-[10px]"
                        title="Reset Password"
                        onClick={() => setResetPasswordModal({ open: true, user: u })}
                        disabled={isLoading}
                      >
                        <Key className="h-3 w-3" />
                      </button>

                      {passwordResetRequests.has(u.id.toString()) && (
                      <button
                          className="p-0.5 rounded bg-yellow-200 hover:bg-yellow-300 text-[10px]"
                          title="Clear Password Reset Request"
                          onClick={() => clearPasswordResetRequest(u.id.toString())}
                          disabled={isLoading}
                        >
                          <Check className="h-3 w-3 text-yellow-600" />
                      </button>
                      )}

                      <button
                        className="p-0.5 rounded bg-gray-200 hover:bg-gray-300 text-[10px]"
                        title="Generate Password Reset Link"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/users/${u.id}/generate-reset-link`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              }
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              alert(`Password reset link generated for ${u.email}:\n\n${data.resetLink}\n\nCopy this link and send it to the user.`);
                              
                          addNotification({
                            userId: u.id,
                            type: 'message',
                                title: 'Password Reset Link Generated',
                                message: `A password reset link was generated for ${u.name} (${u.email}).`,
                            date: new Date(),
                            read: false
                          });
                            } else {
                              alert('Failed to generate reset link');
                            }
                          } catch (error) {
                            console.error('Error generating reset link:', error);
                            alert('Failed to generate reset link');
                          }
                        }}
                        disabled={isLoading}
                      >
                        <Mail className="h-3 w-3" />
                      </button>
                      {u.accountLocked ? (
                        <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full border">
                          LOCKED
                        </span>
                      ) : u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now() ? (
                        <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full border font-bold">
                          ⏰ {formatCountdown(lockCountdowns[u.id] || 0)}
                        </span>
                      ) : (u.passwordAttempts || 0) > 0 ? (
                        <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full border">
                          {u.passwordAttempts}/6 attempts
                        </span>
                      ) : null}
                      
                      {/* Temporary Password Button for Locked Users - Prominent Display */}
                      {(u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) && 
                       (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERUSER') && (
                        <button
                          className="px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[9px] font-bold shadow-md hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                          title="🔐 Reset Password for Locked User"
                          onClick={() => setResetPasswordModal({ open: true, user: u })}
                          disabled={isLoading}
                        >
                          🔓 RESET PASSWORD
                        </button>
                      )}
                      <button
                        className={`p-0.5 rounded text-[10px] transition-colors ${
                          u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())
                            ? 'bg-emerald-200 hover:bg-emerald-300' 
                            : 'bg-amber-200 hover:bg-amber-300'
                        }`}
                        title={
                          u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())
                            ? 'Unlock Account' 
                            : 'Lock Account'
                        }
                        onClick={() => {
                          if (u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) {
                            handleSimpleUnlock(u.id);
                          } else {
                            setLockScheduleModal({ open: true, user: u });
                          }
                        }}
                        disabled={isLoading}
                      >
                        {u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now()) ? (
                          <Unlock className="h-4 w-4 text-blue-400 font-bold" />
                        ) : (
                          <Lock className="h-4 w-4 text-blue-600 font-bold" />
                        )}
                      </button>
                                              <button
                          className="p-0.5 rounded bg-rose-200 hover:bg-rose-300 text-[10px]"
                          title="Delete User"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3 text-rose-700" />
                        </button>
                        {(u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) && (
                          <button
                            className="p-0.5 rounded bg-green-200 hover:bg-green-300 text-[10px]"
                            title="Request Unlock"
                            onClick={() => setUnlockRequestModal({ open: true, user: u })}
                            disabled={isLoading}
                          >
                            <Mail className="h-3 w-3 text-green-600" />
                          </button>
                        )}
                        {/* Admin only: Reset password */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERUSER') && (
                          <button
                            className="p-0.5 rounded bg-orange-200 hover:bg-orange-300 text-[10px] border border-orange-300"
                            title="Reset Password"
                            onClick={() => setResetPasswordModal({ open: true, user: u })}
                            disabled={isLoading}
                          >
                            🔐
                          </button>
                        )}
                        
                        {/* Special reset password button for locked users */}
                        {(u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())) && 
                         (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERUSER') && (
                          <button
                            className="p-0.5 rounded bg-purple-200 hover:bg-purple-300 text-[10px] border border-purple-300 font-bold"
                            title="Reset Password for Locked User"
                            onClick={() => setResetPasswordModal({ open: true, user: u })}
                            disabled={isLoading}
                          >
                            🔓
                          </button>
                        )}
                      <button
                        className="p-0.5 rounded bg-blue-100 hover:bg-blue-200 text-[10px] transition-all duration-200 hover:scale-110"
                        title="View & Edit Privileges"
                          onClick={() => openPrivilegeModal(u)}
                        disabled={isLoading}
                      >
                        <Shield className="h-3 w-3 text-blue-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-blue-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Add {addUserRole.charAt(0).toUpperCase() + addUserRole.slice(1).replace('-', ' ')} User</h2>
            
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await handleAddUser({ ...newUser, role: addUserRole });
                setShowAddUserModal(false);
                setNewUser({ name: '', email: '', status: 'active', gender: '', age: '', residence: '' });
                } catch (error) {
                  console.error('Error adding user:', error);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                <input type="text" className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input type="email" className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                <select className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.status} onChange={e => setNewUser(u => ({ ...u, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Gender</label>
                <select className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.gender} onChange={e => setNewUser(u => ({ ...u, gender: e.target.value }))}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Age</label>
                <input type="number" className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.age} onChange={e => setNewUser(u => ({ ...u, age: e.target.value }))} required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
                <select
                  className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                  value={addUserRole} 
                  onChange={e => setAddUserRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                  <option value="TEACHER">Teacher (Teaching Access)</option>
                  <option value="USER">User (Basic Access)</option>
                  <option value="SECRETARY">Secretary (Admissions & Fees)</option>
                  <option value="CFO">CFO (Financial Oversight)</option>
                  <option value="OPM">Operations Manager (OPM)</option>
                  <option value="HR">HR (Staff Management)</option>
                  <option value="SPONSOR">Sponsor (Sponsorship Access)</option>
                  <option value="PARENT">Parent (Student & Financial Access)</option>
                  <option value="NURSE">Nurse (Clinic Records Access)</option>
                  <option value="SUPERUSER">Super User (Extended Access)</option>
                  <option value="SUPER_TEACHER">Super Teacher (Teaching Access)</option>
                  <option value="ACCOUNTANT">Accountant (Full Financial Access)</option>
                  <option value="SPONSORSHIP_COORDINATOR">Sponsorship Coordinator</option>
                  <option value="SPONSORSHIPS_OVERSEER">Sponsorships Overseer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Residence</label>
                <input type="text" className="w-full rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" value={newUser.residence} onChange={e => setNewUser(u => ({ ...u, residence: e.target.value }))} required />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105" onClick={() => setShowAddUserModal(false)} disabled={isLoading}>Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 hover:scale-105 shadow-lg" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUserModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await handleUpdateUser(editUserModal.user.id, editUserData);
                setEditUserModal({ open: false, user: null });
                } catch (error) {
                  console.error('Error updating user:', error);
                }
              }}
              className="space-y-4"
            >
                    <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.name} onChange={e => setEditUserData(d => ({ ...d, name: e.target.value }))} required />
                    </div>
                    <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.email} onChange={e => setEditUserData(d => ({ ...d, email: e.target.value }))} required />
                    </div>
                    <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.status} onChange={e => setEditUserData(d => ({ ...d, status: e.target.value }))}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.gender} onChange={e => setEditUserData(d => ({ ...d, gender: e.target.value }))} required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input type="number" className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.age} onChange={e => setEditUserData(d => ({ ...d, age: e.target.value }))} required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Residence</label>
                <input type="text" className="w-full rounded border-gray-300 px-2 py-1" value={editUserData.residence} onChange={e => setEditUserData(d => ({ ...d, residence: e.target.value }))} required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setEditUserModal({ open: false, user: null })} disabled={isLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
                    </div>
                      </div>
                    )}
                    
      {resetPassModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await handlePasswordReset(resetPassModal.user.id);
                setResetPassModal({ open: false, user: null });
                setResetPasswordValue('');
                } catch (error) {
                  console.error('Error resetting password:', error);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    className="w-full rounded border-gray-300 px-2 py-1 pr-10"
                    value={resetPasswordValue}
                    onChange={e => setResetPasswordValue(e.target.value)}
                    required
                    minLength={6}
                  />
                      <button
                        type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowResetPassword(v => !v)}
                      >
                    {showResetPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setResetPassModal({ open: false, user: null })} disabled={isLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset'}
                </button>
                    </div>
                  </form>
          </div>
        </div>
      )}

      {unlockModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Unlock Account</h2>
            <p className="text-sm text-gray-600 mb-4">
              Set a new password for {unlockModal.user?.name} to unlock their account.
            </p>
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await handleUnlockUser(unlockModal.user?.id!);
                } catch (error) {
                  console.error('Error unlocking account:', error);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                    <input
                    type="password"
                    className="w-full rounded border-gray-300 px-2 py-1 pr-10"
                    value={unlockPassword}
                    onChange={e => setUnlockPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    onClick={() => setShowResetPassword(v => !v)}
                  >
                    {showResetPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setUnlockModal({ open: false, user: null });
                    setUnlockPassword('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Unlocking...' : 'Unlock Account'}
                </button>
              </div>
            </form>
                    </div>
                    </div>
      )}

      {lockScheduleModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div 
            className="bg-gradient-to-br from-purple-950 to-navy-900 rounded-xl p-8 shadow-2xl w-full max-w-md border-6 border-purple-500 select-none"
            style={{
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              position: 'absolute',
              userSelect: 'none',
              zIndex: 1000,
              left: '50%',
              top: '50%',
              marginLeft: '-200px',
              marginTop: '-150px',
              pointerEvents: 'auto'
            }}
          >
            <h2
              className="text-xl font-bold mb-4 text-white cursor-grab"
              onMouseDown={handleMouseDown}
            >
              Schedule Account Lock
            </h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                let until: Date | undefined = undefined;
                if (lockDuration === '15m') until = new Date(Date.now() + 15 * 60 * 1000);
                if (lockDuration === '30m') until = new Date(Date.now() + 30 * 60 * 1000);
                if (lockDuration === '1h') until = new Date(Date.now() + 60 * 60 * 1000);
                if (lockDuration === '1d') until = new Date(Date.now() + 24 * 60 * 60 * 1000);
                if (lockDuration === 'custom') {
                  if (customLockDate) {
                    until = new Date(customLockDate);
                  } else {
                    until = new Date(Date.now() + customMinutes * 60 * 1000);
                  }
                }
                  
                  await handleLockUser(lockScheduleModal.user?.id!, until);
                setLockScheduleModal({ open: false, user: null });
                setCustomLockDate('');
                } catch (error) {
                  console.error('Error scheduling lock:', error);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Lock Duration</label>
                <select
                  className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                  value={lockDuration}
                  onChange={e => setLockDuration(e.target.value as any)}
                >
                  <option value="15m" className="bg-purple-950 text-white">15 minutes</option>
                  <option value="30m" className="bg-purple-950 text-white">30 minutes</option>
                  <option value="1h" className="bg-purple-950 text-white">1 hour</option>
                  <option value="1d" className="bg-purple-950 text-white">1 day</option>
                  <option value="custom" className="bg-purple-950 text-white">Custom</option>
                </select>
              </div>
              {lockDuration === 'custom' && (
                <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1 text-white">Custom Lock Duration (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(parseInt(e.target.value) || 30)}
                      placeholder="30"
                    />
                    <p className="text-xs text-purple-200 mt-1">Enter minutes (1-10080, max 7 days)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Or Custom Lock Until (Date/Time)</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                    value={customLockDate}
                    onChange={e => setCustomLockDate(e.target.value)}
                  />
                    <p className="text-xs text-purple-200 mt-1">Leave empty to use minutes above</p>
                  </div>
                    </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-400" onClick={() => setLockScheduleModal({ open: false, user: null })} disabled={isLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-purple-700 text-white hover:bg-purple-800 border-3 border-purple-300" disabled={isLoading}>
                  {isLoading ? 'Locking...' : 'Lock'}
                </button>
                  </div>
            </form>
          </div>
        </div>
      )}

      {bulkLockModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div 
            className="bg-gradient-to-br from-purple-950 to-navy-900 rounded-xl p-8 shadow-2xl w-full max-w-md border-6 border-purple-500 select-none"
            style={{
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              position: 'absolute',
              userSelect: 'none',
              zIndex: 1000,
              left: '50%',
              top: '50%',
              marginLeft: '-200px',
              marginTop: '-150px',
              pointerEvents: 'auto'
            }}
          >
            <h2
              className="text-xl font-bold mb-4 text-white cursor-grab"
              onMouseDown={handleMouseDown}
            >
              Bulk Lock {bulkLockModal.role} Users
            </h2>
            <p className="text-sm text-purple-200 mb-4">
              Lock all users with {bulkLockModal.role} role. This will affect {getUsersByRole(bulkLockModal.role).length} users.
            </p>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setIsLoading(true);
                try {
                  let until: Date | undefined = undefined;
                  if (lockDuration === '15m') until = new Date(Date.now() + 15 * 60 * 1000);
                  if (lockDuration === '30m') until = new Date(Date.now() + 30 * 60 * 1000);
                  if (lockDuration === '1h') until = new Date(Date.now() + 60 * 60 * 1000);
                  if (lockDuration === '1d') until = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  if (lockDuration === 'custom') {
                    if (customLockDate) {
                      until = new Date(customLockDate);
                    } else {
                      until = new Date(Date.now() + customMinutes * 60 * 1000);
                    }
                  }
                  await handleBulkLock(bulkLockModal.role, until);
                  setBulkLockModal({ open: false, role: '' });
                  setCustomLockDate('');
                } catch (error) {
                  alert('Failed to lock users. Please try again.');
                  console.error('Error bulk locking users:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Lock Duration</label>
      <select
                  className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                  value={lockDuration}
                  onChange={e => setLockDuration(e.target.value as any)}
                >
                  <option value="15m" className="bg-purple-950 text-white">15 minutes</option>
                  <option value="30m" className="bg-purple-950 text-white">30 minutes</option>
        <option value="1h" className="bg-purple-950 text-white">1 hour</option>
        <option value="1d" className="bg-purple-950 text-white">1 day</option>
        <option value="custom" className="bg-purple-950 text-white">Custom</option>
      </select>
              </div>
              {lockDuration === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Custom Lock Duration (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(parseInt(e.target.value) || 30)}
                      placeholder="30"
                    />
                    <p className="text-xs text-purple-200 mt-1">Enter minutes (1-10080, max 7 days)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Or Custom Lock Until (Date/Time)</label>
        <input
          type="datetime-local"
                      className="w-full rounded border-purple-300 bg-purple-950 text-white px-2 py-1 border-2"
                      value={customLockDate}
                      onChange={e => setCustomLockDate(e.target.value)}
                    />
                    <p className="text-xs text-purple-200 mt-1">Leave empty to use minutes above</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-400" onClick={() => setBulkLockModal({ open: false, role: '' })} disabled={isLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-purple-700 text-white hover:bg-purple-800 border-3 border-purple-300" disabled={isLoading}>
                  {isLoading ? 'Locking...' : 'Lock All Users'}
      </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {privilegeModal.open && privilegeModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-purple-200">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Edit Privileges for {privilegeModal.user.name}
                  </h2>
                  <p className="text-sm text-gray-600">Manage user permissions and access rights</p>
                </div>
              </div>
              <button
                onClick={() => setPrivilegeModal({ open: false, user: null, searchTerm: '' })}
                className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            {/* Stats Bar */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {Object.values(privState).filter(v => v).length}
                    </div>
                    <div className="text-xs text-blue-600">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      {ALL_PRIVILEGES.length}
                    </div>
                    <div className="text-xs text-purple-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-700">
                      {privilegeModal.user.role}
                    </div>
                    <div className="text-xs text-indigo-600">Role</div>
                  </div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.values(privState).filter(v => v).length / ALL_PRIVILEGES.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search privileges..."
                  value={privilegeModal.searchTerm || ''}
                  onChange={(e) => setPrivilegeModal(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              <button 
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md" 
                onClick={grantAllPrivileges} 
                disabled={isLoading}
              >
                <CheckCircle className="h-3 w-3 inline mr-1" />
                Grant All
              </button>
              <button 
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md" 
                onClick={assignDefaultPrivileges} 
                disabled={isLoading}
              >
                <Shield className="h-3 w-3 inline mr-1" />
                Assign Default
              </button>
              <button 
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md" 
                onClick={removeAllPrivileges} 
                disabled={isLoading}
              >
                <X className="h-3 w-3 inline mr-1" />
                Remove All
              </button>
              <button 
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md ml-auto" 
                onClick={savePrivileges} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 inline mr-1" />
                    Save
                  </>
                )}
              </button>
            </div>
            
            {/* Privileges Grid */}
            <div className="bg-white rounded-xl p-4 mb-6 max-h-96 overflow-y-auto border border-gray-200 shadow-inner">
              <div className="grid grid-cols-1 gap-3">
                {ALL_PRIVILEGES
                  .filter(priv => 
                    !privilegeModal.searchTerm || privilegeModal.searchTerm === '' || 
                    priv.toLowerCase().includes(privilegeModal.searchTerm.toLowerCase()) ||
                    formatPrivilegeName(priv).toLowerCase().includes(privilegeModal.searchTerm.toLowerCase())
                  )
                  .map(priv => (
                  <label 
                    key={priv} 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      privState[priv] 
                        ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={!!privState[priv]}
                        onChange={() => togglePrivilege(priv)}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        privState[priv] 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {privState[priv] && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <span className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                      privState[priv] ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {formatPrivilegeName(priv)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white rounded-b-xl -mx-6 -mb-6 px-6 pb-6">
              <button 
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105" 
                onClick={() => setPrivilegeModal({ open: false, user: null, searchTerm: '' })} 
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-medium transition-all duration-200 hover:scale-105 shadow-lg text-lg" 
                onClick={savePrivileges} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 inline mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Request Modal */}
      {unlockRequestModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md border-2 border-purple-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Request Account Unlock
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Request administrators to unlock your account: <strong>{unlockRequestModal.user?.name}</strong>
            </p>
            <form
              onSubmit={async e => {
                e.preventDefault();
                await handleUnlockRequest();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Reason for Unlock Request</label>
                <textarea
                  className="w-full rounded border-gray-300 px-3 py-2 border-2 focus:border-purple-500 focus:outline-none"
                  value={unlockRequestData.reason}
                  onChange={e => setUnlockRequestData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you need your account unlocked..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Contact Information</label>
                <input
                  type="text"
                  className="w-full rounded border-gray-300 px-3 py-2 border-2 focus:border-purple-500 focus:outline-none"
                  value={unlockRequestData.contactInfo}
                  onChange={e => setUnlockRequestData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="Phone number or alternative email"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white" 
                  onClick={() => setUnlockRequestModal({ open: false, user: null })}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-purple-700 text-white hover:bg-purple-800" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
      </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI-Generated Reset Password Modal */}
      {resetPasswordModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-blue-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Reset Password
                  </h2>
                  <p className="text-xs text-gray-600">
                    For: <strong>{resetPasswordModal.user?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResetPasswordModal({ open: false, user: null });
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowNewPassword(false);
                  setDeliveryMethod('manual');
                  setDeliveryContact('');
                }}
                className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <form
              onSubmit={async e => {
                e.preventDefault();
                await handleResetPassword();
              }}
              className="space-y-4"
            >
              {/* Password Generation Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                <label className="block text-sm font-medium mb-2 text-green-800">🔐 Password Generation</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    disabled={isGeneratingPassword}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    {isGeneratingPassword ? '🔄 Generating...' : '🔐 Generate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 text-sm transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    {showNewPassword ? '🙈 Hide' : '👁️ Show'}
                  </button>
                </div>
                <p className="text-xs text-green-700">
                  💡 Secure passwords include uppercase, lowercase, numbers, and symbols
                </p>
              </div>

              {/* Password Fields */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full rounded-lg border-gray-300 px-3 py-2 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-mono text-sm"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password or generate one"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Password must be at least 6 characters long
                </p>
              </div>
                  
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full rounded-lg border-gray-300 px-3 py-2 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-mono text-sm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    ❌ Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    ✅ Passwords match
                  </p>
                )}
              </div>

              {/* Delivery Method Section */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium mb-2 text-purple-800">📤 Delivery Method (Optional)</label>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="manual"
                        checked={deliveryMethod === 'manual'}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'manual' | 'whatsapp' | 'email')}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Manual (No delivery)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="whatsapp"
                        checked={deliveryMethod === 'whatsapp'}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'manual' | 'whatsapp' | 'email')}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">📱 WhatsApp</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="email"
                        checked={deliveryMethod === 'email'}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'manual' | 'whatsapp' | 'email')}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">📧 Email</span>
                    </label>
                  </div>
                  
                  {(deliveryMethod === 'whatsapp' || deliveryMethod === 'email') && (
                    <div>
                      <input
                        type={deliveryMethod === 'whatsapp' ? 'tel' : 'email'}
                        className="w-full rounded-lg border-gray-300 px-3 py-2 border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        value={deliveryContact}
                        onChange={e => setDeliveryContact(e.target.value)}
                        placeholder={deliveryMethod === 'whatsapp' ? 'Enter WhatsApp number (e.g., +1234567890)' : 'Enter email address'}
                        required
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        {deliveryMethod === 'whatsapp' 
                          ? '💡 Include country code (e.g., +1 for US, +44 for UK)'
                          : '💡 Password will be sent to this email address'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
                  
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105" 
                  onClick={() => {
                    setResetPasswordModal({ open: false, user: null });
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowNewPassword(false);
                    setDeliveryMethod('manual');
                    setDeliveryContact('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 hover:scale-105 shadow-lg" 
                  disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6 || (deliveryMethod !== 'manual' && !deliveryContact)}
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI-Generated Delete Confirmation Modal */}
      {deleteConfirmModal.open && deleteConfirmModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-6 max-w-md w-full border border-red-200 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Confirm User Deletion
                </h3>
                <p className="text-sm text-gray-600">Permanent action - cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                <p className="text-red-700 text-sm">
                  User <strong>{deleteConfirmModal.user.name}</strong> ({deleteConfirmModal.user.email}) will be permanently removed from the system.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> All user data, privileges, and access will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({ open: false, user: null })}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {isLoading ? '🔄 Deleting...' : '🗑️ Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI-Generated Security Notification */}
      <SecurityNotification
        isOpen={securityNotification.isOpen}
        onClose={() => setSecurityNotification({ isOpen: false, type: 'security-tip', title: '', message: '' })}
        type={securityNotification.type}
        title={securityNotification.title}
        message={securityNotification.message}
        actionText={securityNotification.actionText}
        onAction={securityNotification.onAction}
      />
    </div>
  );
};

export default UserManagement;
