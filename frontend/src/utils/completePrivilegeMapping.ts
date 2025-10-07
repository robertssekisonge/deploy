import { PrivilegeName } from '../types';

// Complete privilege mapping for every sidebar button and its functionality
export const COMPLETE_SIDEBAR_PRIVILEGES: Record<string, {
  viewPrivilege: PrivilegeName;
  actionPrivileges: PrivilegeName[];
  description: string;
}> = {
  // Dashboard
  'dashboard': {
    viewPrivilege: 'view_students',
    actionPrivileges: ['view_students'],
    description: 'Main dashboard with overview'
  },

  // Student Management
  'students': {
    viewPrivilege: 'view_students',
    actionPrivileges: [
      'view_students', 'add_student', 'edit_student', 'delete_student',
      'export_students', 'flag_student', 'unflag_student', 're_admit_student',
      'view_student_details', 'edit_student_conduct', 'clear_students',
      'delete_students_by_class', 'admit_from_overseer'
    ],
    description: 'Student list with add, edit, delete, flag, export, and management features'
  },

  // Financial Records
  'financial': {
    viewPrivilege: 'view_financial',
    actionPrivileges: [
      'view_financial', 'add_financial_record', 'edit_financial_record', 
      'delete_financial_record', 'export_financial', 'view_financial_analytics'
    ],
    description: 'Financial records with add, edit, delete, and analytics'
  },

  // Sponsorship Management
  'sponsorships': {
    viewPrivilege: 'view_sponsorships',
    actionPrivileges: [
      'view_sponsorships', 'manage_sponsorships', 'approve_sponsorship', 
      'assign_sponsorship', 'reject_sponsorship', 'view_sponsorship_analytics'
    ],
    description: 'Sponsorship management with approval and assignment features'
  },

  // Available for Sponsors
  'available-for-sponsors': {
    viewPrivilege: 'view_sponsorships',
    actionPrivileges: [
      'view_sponsorships', 'sponsor_student', 'view_sponsor_details'
    ],
    description: 'View and sponsor available students'
  },

  // My Sponsored Children
  'my-sponsored-children': {
    viewPrivilege: 'view_sponsorships',
    actionPrivileges: [
      'view_sponsorships', 'view_students', 'view_financial', 'view_payments'
    ],
    description: 'View sponsored children and their information'
  },

  // Admin Sponsorship Approval
  'admin-sponsorship-approval': {
    viewPrivilege: 'manage_sponsorships',
    actionPrivileges: [
      'manage_sponsorships', 'approve_sponsorship', 'reject_sponsorship',
      'view_sponsorships', 'view_students'
    ],
    description: 'Admin approval of sponsorship requests'
  },

  // Enroll from Overseer
  'enroll-from-overseer': {
    viewPrivilege: 'manage_sponsorships',
    actionPrivileges: [
      'manage_sponsorships', 'add_student', 'edit_student', 'view_sponsorships'
    ],
    description: 'Enroll students from overseer recommendations'
  },

  // Sponsor Pending
  'sponsor-pending': {
    viewPrivilege: 'view_sponsorships',
    actionPrivileges: [
      'view_sponsorships', 'approve_sponsorship', 'reject_sponsorship'
    ],
    description: 'View and manage pending sponsorship requests'
  },

  // User Management
  'users': {
    viewPrivilege: 'view_users',
    actionPrivileges: [
      'view_users', 'add_user', 'edit_user', 'delete_user', 'lock_user', 
      'unlock_user', 'reset_user_password', 'generate_temp_password',
      'assign_privileges', 'remove_privileges', 'export_users'
    ],
    description: 'User management with full CRUD operations and privilege management'
  },

  // Attendance
  'attendance': {
    viewPrivilege: 'view_attendance',
    actionPrivileges: [
      'view_attendance', 'mark_attendance', 'edit_attendance', 'delete_attendance',
      'export_attendance', 'view_attendance_analytics', 'bulk_attendance'
    ],
    description: 'Attendance tracking with marking, editing, and analytics'
  },

  // Messages
  'messages': {
    viewPrivilege: 'view_messages',
    actionPrivileges: [
      'view_messages', 'send_message', 'delete_message', 'reply_message',
      'mark_message_read', 'export_messages'
    ],
    description: 'Messaging system with send, receive, and management features'
  },

  // Classes
  'classes': {
    viewPrivilege: 'view_classes',
    actionPrivileges: [
      'view_classes', 'add_class', 'edit_class', 'delete_class',
      'manage_class_students', 'view_class_analytics'
    ],
    description: 'Class management with CRUD operations'
  },

  // Analytics
  'analytics': {
    viewPrivilege: 'view_analytics',
    actionPrivileges: [
      'view_analytics', 'export_analytics', 'view_dashboard_analytics',
      'view_user_analytics', 'view_system_analytics'
    ],
    description: 'Analytics dashboard with various reports and exports'
  },

  // Timetable
  'timetable': {
    viewPrivilege: 'view_timetables',
    actionPrivileges: [
      'view_timetables', 'add_timetable', 'edit_timetable', 'delete_timetable',
      'manage_timetable_conflicts', 'export_timetable'
    ],
    description: 'Timetable management with scheduling features'
  },

  // Teachers
  'teachers': {
    viewPrivilege: 'view_teachers',
    actionPrivileges: [
      'view_teachers', 'add_teacher', 'edit_teacher', 'delete_teacher',
      'assign_teacher_classes', 'view_teacher_analytics'
    ],
    description: 'Teacher management with assignment features'
  },

  // Parents
  'parents': {
    viewPrivilege: 'view_users', // Parents are managed through users
    actionPrivileges: [
      'view_users', 'add_user', 'edit_user', 'delete_user',
      'assign_parent_students', 'view_parent_analytics'
    ],
    description: 'Parent management through user system'
  },

  // Clinic
  'clinic': {
    viewPrivilege: 'view_clinic_records',
    actionPrivileges: [
      'view_clinic_records', 'add_clinic_record', 'edit_clinic_record', 
      'delete_clinic_record', 'export_clinic_records', 'notify_clinic_visits',
      'view_clinic_analytics'
    ],
    description: 'Clinic records management with health tracking'
  },

  // Class Resources
  'class-resources': {
    viewPrivilege: 'view_resources',
    actionPrivileges: [
      'view_resources', 'add_resource', 'edit_resource', 'delete_resource',
      'upload_resource', 'download_resource', 'export_resources'
    ],
    description: 'Class resources management with file operations'
  },

  // Advanced Settings
  'advanced-settings': {
    viewPrivilege: 'view_advanced_settings',
    actionPrivileges: [
      'view_advanced_settings', 'edit_advanced_settings', 'system_backup',
      'system_restore', 'system_maintenance', 'view_system_logs'
    ],
    description: 'Advanced system settings and maintenance'
  },

  // Teacher Scheduling
  'teacher-scheduling': {
    viewPrivilege: 'view_timetables',
    actionPrivileges: [
      'view_timetables', 'edit_timetable', 'assign_teacher_schedule',
      'view_teacher_schedule', 'manage_schedule_conflicts'
    ],
    description: 'Teacher-specific scheduling management'
  },

  // Weekly Reports
  'weekly-reports': {
    viewPrivilege: 'view_weekly_reports',
    actionPrivileges: [
      'view_weekly_reports', 'submit_reports', 'approve_weekly_reports',
      'review_weekly_reports', 'export_weekly_reports'
    ],
    description: 'Weekly reports submission and management'
  },

  // Photos
  'photos': {
    viewPrivilege: 'view_photos',
    actionPrivileges: [
      'view_photos', 'add_photo', 'edit_photo', 'delete_photo',
      'upload_photo', 'download_photo', 'organize_photos'
    ],
    description: 'Photo management with upload and organization'
  },

  // Teacher Marks Entry
  'teacher-marks': {
    viewPrivilege: 'view_students',
    actionPrivileges: [
      'view_students', 'edit_student', 'add_student_marks', 'edit_student_marks',
      'view_student_marks', 'export_student_marks'
    ],
    description: 'Teacher marks entry and management'
  },

  // Settings
  'settings': {
    viewPrivilege: 'view_settings',
    actionPrivileges: [
      'view_settings', 'edit_settings', 'change_password', 'update_profile',
      'view_user_preferences', 'export_settings'
    ],
    description: 'User settings and preferences'
  },

  // System Settings
  'system-settings': {
    viewPrivilege: 'view_settings',
    actionPrivileges: [
      'view_settings', 'edit_settings', 'system_configuration',
      'view_system_info', 'system_maintenance'
    ],
    description: 'System-wide settings and configuration'
  },

  // Payments
  'payments': {
    viewPrivilege: 'view_payments',
    actionPrivileges: [
      'view_payments', 'process_payment', 'refund_payment', 'export_payments',
      'view_payment_analytics', 'manage_payment_methods'
    ],
    description: 'Payment processing and management'
  },

  // Reports
  'reports': {
    viewPrivilege: 'view_reports',
    actionPrivileges: [
      'view_reports', 'generate_report', 'view_report_cards', 'generate_report_cards',
      'export_reports', 'schedule_reports', 'view_report_analytics'
    ],
    description: 'Report generation and management'
  }
};

// Get all privileges needed for a specific sidebar button
export const getSidebarButtonPrivileges = (buttonKey: string): PrivilegeName[] => {
  const button = COMPLETE_SIDEBAR_PRIVILEGES[buttonKey];
  if (!button) return [];
  
  return [button.viewPrivilege, ...button.actionPrivileges];
};

// Get view privilege for a sidebar button
export const getSidebarViewPrivilege = (buttonKey: string): PrivilegeName | null => {
  const button = COMPLETE_SIDEBAR_PRIVILEGES[buttonKey];
  return button ? button.viewPrivilege : null;
};

// Get action privileges for a sidebar button
export const getSidebarActionPrivileges = (buttonKey: string): PrivilegeName[] => {
  const button = COMPLETE_SIDEBAR_PRIVILEGES[buttonKey];
  return button ? button.actionPrivileges : [];
};