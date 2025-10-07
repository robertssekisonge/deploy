// Comprehensive privilege list extracted from complete system analysis
export const COMPREHENSIVE_PRIVILEGES = [
  // === STUDENT MANAGEMENT ===
  'view_students',
  'add_student',
  'edit_student',
  'delete_student',
  'export_students',
  'flag_student',
  'unflag_student',
  're_admit_student',
  'view_student_details',
  'edit_student_conduct',
  'clear_students',
  'delete_students_by_class',
  'admit_from_overseer',
  'manage_assigned_students',

  // === TEACHER MANAGEMENT ===
  'view_teachers',
  'add_teacher',
  'edit_teacher',
  'delete_teacher',
  'assign_teacher_classes',
  'view_teacher_analytics',

  // === USER MANAGEMENT ===
  'view_users',
  'add_user',
  'edit_user',
  'delete_user',
  'lock_user',
  'unlock_user',
  'reset_user_password',
  'generate_temp_password',
  'assign_privileges',
  'remove_privileges',
  'export_users',

  // === PARENT MANAGEMENT ===
  'assign_parent_students',
  'view_parent_analytics',

  // === CLASS & STREAM MANAGEMENT ===
  'view_classes',
  'add_class',
  'edit_class',
  'delete_class',
  'manage_class_students',
  'view_class_analytics',
  'view_streams',
  'add_stream',
  'edit_stream',
  'delete_stream',

  // === ATTENDANCE MANAGEMENT ===
  'view_attendance',
  'mark_attendance',
  'edit_attendance',
  'delete_attendance',
  'export_attendance',
  'view_attendance_analytics',
  'bulk_attendance',
  'view_attendance_analysis',

  // === FINANCIAL MANAGEMENT ===
  'view_financial',
  'add_financial_record',
  'edit_financial_record',
  'delete_financial_record',
  'export_financial',
  'view_financial_analytics',

  // === SPONSORSHIP MANAGEMENT ===
  'view_sponsorships',
  'manage_sponsorships',
  'approve_sponsorship',
  'assign_sponsorship',
  'reject_sponsorship',
  'view_sponsorship_analytics',
  'sponsor_student',
  'view_sponsor_details',

  // === REPORT MANAGEMENT ===
  'view_reports',
  'generate_report',
  'view_report_cards',
  'generate_report_cards',
  'export_reports',
  'schedule_reports',
  'view_report_analytics',

  // === WEEKLY REPORTS ===
  'view_weekly_reports',
  'submit_reports',
  'approve_weekly_reports',
  'review_weekly_reports',
  'export_weekly_reports',

  // === PAYMENT MANAGEMENT ===
  'view_payments',
  'process_payment',
  'refund_payment',
  'export_payments',
  'view_payment_analytics',
  'manage_payment_methods',

  // === MESSAGING SYSTEM ===
  'view_messages',
  'send_message',
  'delete_message',
  'reply_message',
  'mark_message_read',
  'export_messages',

  // === NOTIFICATION SYSTEM ===
  'view_notifications',
  'send_notification',
  'delete_notification',

  // === ANALYTICS ===
  'view_analytics',
  'export_analytics',
  'view_dashboard_analytics',
  'view_user_analytics',
  'view_system_analytics',

  // === TIMETABLE MANAGEMENT ===
  'view_timetables',
  'add_timetable',
  'edit_timetable',
  'delete_timetable',
  'manage_timetable_conflicts',
  'export_timetable',
  'view_teacher_schedule',
  'assign_teacher_schedule',
  'manage_schedule_conflicts',

  // === CLINIC MANAGEMENT ===
  'view_clinic_records',
  'add_clinic_record',
  'edit_clinic_record',
  'delete_clinic_record',
  'export_clinic_records',
  'notify_clinic_visits',
  'view_clinic_analytics',

  // === RESOURCE MANAGEMENT ===
  'view_resources',
  'add_resource',
  'edit_resource',
  'delete_resource',
  'upload_resource',
  'download_resource',
  'export_resources',

  // === PHOTO MANAGEMENT ===
  'view_photos',
  'add_photo',
  'edit_photo',
  'delete_photo',
  'upload_photo',
  'download_photo',
  'organize_photos',

  // === MARKS MANAGEMENT ===
  'add_student_marks',
  'edit_student_marks',
  'view_student_marks',
  'export_student_marks',

  // === SETTINGS MANAGEMENT ===
  'view_settings',
  'edit_settings',
  'change_password',
  'update_profile',
  'view_user_preferences',
  'export_settings',

  // === ADVANCED SETTINGS ===
  'view_advanced_settings',
  'edit_advanced_settings',
  'system_backup',
  'system_restore',
  'system_maintenance',
  'view_system_logs',
  'system_configuration',
  'view_system_info',

  // === ADMIN PANEL ===
  'admin_panel'
] as const;

export type ComprehensivePrivilegeName = typeof COMPREHENSIVE_PRIVILEGES[number];