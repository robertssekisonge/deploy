import { PrivilegeName } from '../types';
import { getSidebarButtonPrivileges } from './completePrivilegeMapping';

// Default privileges for each role based on their sidebar navigation
export const ROLE_DEFAULT_PRIVILEGES: Record<string, PrivilegeName[]> = {
  // ADMIN - Full access to everything
  ADMIN: [
    // Dashboard
    'view_students',
    // Students - All functionality
    'view_students', 'add_student', 'edit_student', 'delete_student', 'export_students', 'flag_student', 'unflag_student', 're_admit_student', 'view_student_details', 'edit_student_conduct', 'clear_students', 'delete_students_by_class', 'admit_from_overseer',
    // User Management - All functionality
    'view_users', 'add_user', 'edit_user', 'delete_user', 'lock_user', 'unlock_user', 'reset_user_password', 'generate_temp_password', 'assign_privileges', 'remove_privileges', 'export_users',
    // Teacher Management - All functionality
    'view_teachers', 'add_teacher', 'edit_teacher', 'delete_teacher', 'assign_teacher_classes', 'view_teacher_analytics',
    // Parent Management - All functionality
    'view_users', 'add_user', 'edit_user', 'delete_user', 'assign_parent_students', 'view_parent_analytics',
    // Classes & Streams - All functionality
    'view_classes', 'add_class', 'edit_class', 'delete_class', 'manage_class_students', 'view_class_analytics', 'view_streams', 'add_stream', 'edit_stream', 'delete_stream',
    // Attendance - All functionality
    'view_attendance', 'mark_attendance', 'edit_attendance', 'delete_attendance', 'export_attendance', 'view_attendance_analytics', 'bulk_attendance',
    // Financial Records - All functionality
    'view_financial', 'add_financial_record', 'edit_financial_record', 'delete_financial_record', 'export_financial', 'view_financial_analytics',
    // Sponsorship Management - All functionality
    'view_sponsorships', 'manage_sponsorships', 'approve_sponsorship', 'assign_sponsorship', 'reject_sponsorship', 'view_sponsorship_analytics', 'sponsor_student', 'view_sponsor_details',
    // Report Cards - All functionality
    'view_reports', 'generate_report', 'view_report_cards', 'generate_report_cards', 'export_reports', 'schedule_reports', 'view_report_analytics',
    // Payment Analysis - All functionality
    'view_payments', 'process_payment', 'refund_payment', 'export_payments', 'view_payment_analytics', 'manage_payment_methods',
    // Messages - All functionality
    'view_messages', 'send_message', 'delete_message', 'reply_message', 'mark_message_read', 'export_messages',
    // Analytics - All functionality
    'view_analytics', 'export_analytics', 'view_dashboard_analytics', 'view_user_analytics', 'view_system_analytics',
    // School Timetable - All functionality
    'view_timetables', 'add_timetable', 'edit_timetable', 'delete_timetable', 'manage_timetable_conflicts', 'export_timetable',
    // Clinic Records - All functionality
    'view_clinic_records', 'add_clinic_record', 'edit_clinic_record', 'delete_clinic_record', 'export_clinic_records', 'notify_clinic_visits', 'view_clinic_analytics',
    // Class Resources - All functionality
    'view_resources', 'add_resource', 'edit_resource', 'delete_resource', 'upload_resource', 'download_resource', 'export_resources',
    // Weekly Reports - All functionality
    'view_weekly_reports', 'submit_reports', 'approve_weekly_reports', 'review_weekly_reports', 'export_weekly_reports',
    // Advanced Settings - All functionality
    'view_advanced_settings', 'edit_advanced_settings', 'system_backup', 'system_restore', 'system_maintenance', 'view_system_logs',
    // Settings - All functionality
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences', 'export_settings',
    // System Settings - All functionality
    'system_configuration', 'view_system_info',
    // Photos - All functionality
    'view_photos', 'add_photo', 'edit_photo', 'delete_photo', 'upload_photo', 'download_photo', 'organize_photos',
    // Teacher Marks Entry - All functionality
    'add_student_marks', 'edit_student_marks', 'view_student_marks', 'export_student_marks',
    // Admin Panel
    'admin_panel'
  ],
  ACCOUNTANT: [
    // Students (view only)
    'view_students', 'view_student_details',
    // Financial Management - full
    'view_financial', 'add_financial_record', 'edit_financial_record', 'delete_financial_record', 'export_financial', 'view_financial_analytics',
    // Fee structure management
    'view_settings', 'edit_settings',
    // Messages
    'view_messages', 'send_message', 'reply_message', 'mark_message_read'
  ],

  // TEACHER - Access to their assigned classes and students
  TEACHER: [
    // Dashboard
    'view_students',
    // My Students - View and basic edit
    'view_students', 'add_student', 'edit_student', 'view_student_details',
    // Enter Marks - Marks functionality
    'view_students', 'edit_student', 'add_student_marks', 'edit_student_marks', 'view_student_marks', 'export_student_marks',
    // Attendance - Mark and edit attendance
    'view_attendance', 'mark_attendance', 'edit_attendance', 'view_attendance_analytics',
    // Report Cards - View and generate
    'view_reports', 'view_report_cards', 'generate_report_cards', 'export_reports',
    // My Scheduling - View timetable
    'view_timetables', 'view_teacher_schedule',
    // Weekly Reports - Submit reports
    'view_weekly_reports', 'submit_reports', 'export_weekly_reports',
    // Messages - Send and receive
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Resources - View and download
    'view_resources', 'download_resource',
    // Settings - View and edit personal settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // SUPER_TEACHER - Enhanced teacher access
  SUPER_TEACHER: [
    // Dashboard
    'view_students',
    // All My Students - Enhanced access
    'view_students', 'add_student', 'edit_student', 'view_student_details',
    // Enter Marks - Enhanced marks functionality
    'view_students', 'edit_student', 'add_student_marks', 'edit_student_marks', 'view_student_marks', 'export_student_marks',
    // Attendance - Enhanced attendance management
    'view_attendance', 'mark_attendance', 'edit_attendance', 'view_attendance_analytics', 'bulk_attendance',
    // Report Cards - Enhanced report access
    'view_reports', 'view_report_cards', 'generate_report_cards', 'export_reports',
    // My Scheduling - Enhanced timetable access
    'view_timetables', 'view_teacher_schedule', 'edit_timetable',
    // Weekly Reports - Enhanced report submission
    'view_weekly_reports', 'submit_reports', 'export_weekly_reports',
    // Messages - Enhanced messaging
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Resources - Enhanced resource access
    'view_resources', 'download_resource', 'upload_resource',
    // Settings - Enhanced settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // PARENT - Access to their children's information
  PARENT: [
    // Dashboard
    'view_students',
    // My Children - View assigned children
    'view_students', 'manage_assigned_students', 'view_student_details',
    // Child Attendance - View attendance
    'view_attendance', 'view_attendance_analytics',
    // Payment Details - View financial info
    'view_financial', 'view_payments', 'view_financial_analytics',
    // Report Cards - View reports
    'view_reports', 'view_report_cards', 'export_reports',
    // Messages - Send and receive
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Settings - Personal settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // SPONSOR - Access to sponsorship features
  SPONSOR: [
    // Dashboard
    'view_students',
    // Available for Sponsors - View and sponsor
    'view_sponsorships', 'sponsor_student', 'view_sponsor_details',
    // Pending Requests - View pending
    'view_sponsorships',
    // My Sponsored Children - View sponsored children
    'view_sponsorships', 'view_students', 'view_student_details', 'view_financial', 'view_payments',
    // Messages - Send and receive
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Settings - Personal settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // NURSE - Access to clinic and health records
  NURSE: [
    // Dashboard
    'view_students',
    // Messages - Send and receive
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Clinic Records - Full clinic management
    'view_clinic_records', 'add_clinic_record', 'edit_clinic_record', 'delete_clinic_record', 'export_clinic_records', 'notify_clinic_visits', 'view_clinic_analytics',
    // Settings - Personal settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // SUPERUSER - Read-only access to most features
  SUPERUSER: [
    // Dashboard
    'view_students',
    // All major viewing privileges - Read-only access
    'view_students', 'view_teachers', 'view_classes', 'view_streams', 'view_attendance', 'view_financial', 'view_sponsorships', 'view_reports', 'view_payments', 'view_messages', 'view_settings', 'view_analytics', 'view_clinic_records', 'view_timetables', 'view_resources', 'view_weekly_reports', 'view_report_cards',
    // Additional read-only privileges
    'view_student_details', 'view_attendance_analytics', 'view_financial_analytics', 'view_sponsorship_analytics', 'view_report_analytics', 'view_payment_analytics', 'view_clinic_analytics', 'view_teacher_analytics', 'view_class_analytics', 'view_parent_analytics', 'view_dashboard_analytics', 'view_user_analytics', 'view_system_analytics',
    // Export privileges for reports
    'export_students', 'export_attendance', 'export_financial', 'export_reports', 'export_payments', 'export_clinic_records', 'export_weekly_reports', 'export_resources', 'export_timetable', 'export_messages', 'export_settings'
  ],

  // SPONSORSHIP_COORDINATOR - Sponsorship management
  SPONSORSHIP_COORDINATOR: [
    // Dashboard
    'view_students',
    // Sponsorship management - Full sponsorship control
    'view_sponsorships', 'manage_sponsorships', 'approve_sponsorship', 'assign_sponsorship', 'reject_sponsorship', 'view_sponsorship_analytics',
    // Students (for sponsorship purposes) - View student details
    'view_students', 'view_student_details',
    // Messages - Send and receive
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Settings - Personal settings
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],

  // SPONSORSHIPS_OVERSEER - Enhanced sponsorship access
  SPONSORSHIPS_OVERSEER: [
    // === STUDENT MANAGEMENT ===
    'view_students', 'add_student', 'edit_student', 'view_student_details', 'admit_from_overseer',
    // === SPONSORSHIP MANAGEMENT ===
    'view_sponsorships', 'manage_sponsorships', 'approve_sponsorship', 'assign_sponsorship', 'reject_sponsorship', 'view_sponsorship_analytics',
    // === FINANCIAL MANAGEMENT ===
    'view_financial', 'view_financial_analytics',
    // === ATTENDANCE MANAGEMENT ===
    'view_attendance', 'view_attendance_analytics',
    // === REPORT MANAGEMENT ===
    'view_reports', 'submit_reports', 'export_reports', 'view_report_analytics',
    // === WEEKLY REPORTS ===
    'view_weekly_reports',
    // === MESSAGING SYSTEM ===
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // === SETTINGS MANAGEMENT ===
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ]
  ,
  // SECRETARY - Admissions access and fee balance viewing
  SECRETARY: [
    // Dashboard
    'view_students',
    // Admissions: full admit page functionality used by admin
    'view_students', 'add_student', 'edit_student', 'view_student_details', 're_admit_student', 'admit_from_overseer',
    // Classes & Streams (view only, to assist admission placement)
    'view_classes', 'view_streams',
    // Attendance (view only)
    'view_attendance', 'view_attendance_analytics',
    // Financial: check child fees balance (view only)
    'view_financial', 'view_financial_analytics', 'view_payments',
    // Reports (view only)
    'view_reports', 'view_report_cards', 'export_reports',
    // Messages (basic comms)
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Settings (personal)
    'view_settings', 'edit_settings', 'change_password', 'update_profile', 'view_user_preferences'
  ],
  // CFO - Comprehensive Financial Management
  CFO: [
    // Dashboard - Basic access required
    'view_cfo_dashboard',
    // Existing Financial Management (from ACCOUNTANT role)
    'view_financial', 'add_financial_record', 'edit_financial_record', 'delete_financial_record', 'export_financial', 'view_financial_analytics',
    // Payment Management (existing system)
    'view_payments', 'process_payment', 'refund_payment', 'export_payments', 'view_payment_analytics', 'manage_payment_methods',
    // Settings (for fee structure management)
    'view_settings', 'edit_settings',
    // CFO-Specific Financial Management
    'record_school_funding', 'view_school_funding', 'edit_school_funding', 'delete_school_funding',
    'record_foundation_funding', 'view_foundation_funding', 'edit_foundation_funding', 'delete_foundation_funding',
    'record_farm_income', 'view_farm_income', 'edit_farm_income', 'delete_farm_income',
    'record_clinic_income', 'view_clinic_income', 'edit_clinic_income', 'delete_clinic_income',
    'record_expenditure', 'view_expenditure', 'edit_expenditure', 'delete_expenditure',
    'allocate_funds', 'view_fund_allocation', 'edit_fund_allocation', 'delete_fund_allocation',
    'generate_financial_statement', 'view_financial_statements', 'export_financial_statements',
    'view_fund_sources', 'manage_fund_sources', 'export_financial_data', 'view_financial_reports',
    // Messages (basic comms)
    'view_messages', 'send_message', 'reply_message', 'mark_message_read',
    // Settings (personal)
    'change_password', 'update_profile', 'view_user_preferences',
    // Weekly Reports visibility
    'view_weekly_reports', 'export_weekly_reports'
  ]
  ,
  // HR - Manage staff records (no account creation)
  HR: [
    'view_staff', 'add_staff', 'edit_staff', 'delete_staff',
    'upload_staff_cv', 'upload_staff_passport',
    'view_weekly_reports', 'submit_reports', 'export_weekly_reports',
    'view_photos',
    'view_settings',
    'view_financial' // minimal read-only support for payouts context
  ]
};

// Get default privileges for a role
export const getDefaultPrivilegesForRole = (role: string): PrivilegeName[] => {
  return ROLE_DEFAULT_PRIVILEGES[role.toUpperCase()] || [];
};

// Check if a role has access to a specific privilege by default
export const roleHasDefaultPrivilege = (role: string, privilege: PrivilegeName): boolean => {
  const defaultPrivileges = getDefaultPrivilegesForRole(role);
  return defaultPrivileges.includes(privilege);
};
