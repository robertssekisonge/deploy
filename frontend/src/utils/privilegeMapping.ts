import { PrivilegeName } from '../types';

// Map each route/feature to its required privileges
export const ROUTE_PRIVILEGES: Record<string, PrivilegeName[]> = {
  // Dashboard routes
  '/dashboard': [], // Allow all logged-in users; specific widgets can guard internally
  // CFO Dashboard route (financial-only access)
  '/cfo/dashboard': ['view_cfo_dashboard'],
  // CFO Feature routes (no student privilege)
  '/cfo/school-funding': ['view_school_funding', 'record_school_funding'],
  '/cfo/foundation-funding': ['view_foundation_funding', 'record_foundation_funding'],
  '/cfo/farm-income': ['view_farm_income', 'record_farm_income'],
  '/cfo/clinic-income': ['view_clinic_income', 'record_clinic_income'],
  '/cfo/expenditures': ['view_expenditure', 'record_expenditure'],
  '/cfo/fund-allocation': ['view_fund_allocation', 'allocate_funds'],
  '/cfo/financial-statements': ['view_financial_statements', 'generate_financial_statement'],
  '/cfo/analytics': ['view_financial_analytics'],
  // Payment Analysis page (for Accountant, Admin, CFO)
  '/payment-analysis': ['view_payments'],
  '/': [], // Root should be accessible once authenticated
  // HR routes
  '/hr/dashboard': ['view_staff'],
  '/hr/staff': ['view_staff'],
  
  // Student Management
  '/students': ['view_students'],
  '/teacher-marks': ['view_students', 'edit_student'],
  
  // Financial Management
  '/financial': ['view_financial'],
  '/payments': ['view_payments'],
  
  // Sponsorship Management
  '/sponsorships': ['view_sponsorships'],
  '/available-for-sponsors': ['view_sponsorships'],
  '/my-sponsored-children': ['view_sponsorships'],
  '/admin-sponsorship-approval': ['manage_sponsorships', 'approve_sponsorship'],
  '/enroll-from-overseer': ['manage_sponsorships'],
  '/sponsor-pending': ['view_sponsorships'],
  
  // User Management
  '/users': ['view_users', 'admin_panel'],
  
  // Attendance
  '/attendance': ['view_attendance'],
  
  // Messaging
  '/messages': ['view_messages'],
  
  // Classes
  '/classes': ['view_classes'],
  
  // Analytics
  '/analytics': ['view_analytics'],
  
  // Timetable
  '/timetable': ['view_timetables'],
  '/teacher-scheduling': ['view_timetables', 'edit_timetable'],
  
  // Teachers
  '/teachers': ['view_teachers'],
  
  // Parents
  '/parents': ['view_users'],
  
  // Clinic
  '/clinic': ['view_clinic_records'],
  
  // Resources
  '/class-resources': ['view_resources'],
  
  // Settings
  '/settings': ['view_settings'],
  '/system-settings': ['view_settings', 'edit_settings'],
  '/advanced-settings': ['view_advanced_settings'],
  
  // Reports
  '/reports': ['view_reports'],
  '/weekly-reports': ['view_weekly_reports'],
  
  // Photos
  '/photos': ['view_photos'],
  
  // Forms Management
  '/forms': ['view_students'],
};

// Map specific actions to their required privileges
export const ACTION_PRIVILEGES: Record<string, PrivilegeName[]> = {
  // Student actions
  'view_students_list': ['view_students'],
  'add_new_student': ['add_student'],
  'edit_student_info': ['edit_student'],
  'delete_student': ['delete_student'],
  'export_students': ['export_students'],
  
  // Teacher actions
  'view_teachers_list': ['view_teachers'],
  'add_new_teacher': ['add_teacher'],
  'edit_teacher_info': ['edit_teacher'],
  'delete_teacher': ['delete_teacher'],
  
  // Class actions
  'view_classes_list': ['view_classes'],
  'add_new_class': ['add_class'],
  'edit_class_info': ['edit_class'],
  'delete_class': ['delete_class'],
  
  // Attendance actions
  'view_attendance_records': ['view_attendance'],
  'mark_attendance': ['mark_attendance'],
  'edit_attendance_record': ['edit_attendance'],
  'delete_attendance_record': ['delete_attendance'],
  
  // Financial actions
  'view_financial_records': ['view_financial'],
  'add_financial_record': ['add_financial_record'],
  'edit_financial_record': ['edit_financial_record'],
  'delete_financial_record': ['delete_financial_record'],
  'export_financial': ['export_financial'],
  
  // Payment actions
  'view_payments': ['view_payments'],
  'process_payment': ['process_payment'],
  'refund_payment': ['refund_payment'],
  'export_payments': ['export_payments'],
  
  // Sponsorship actions
  'view_sponsorships': ['view_sponsorships'],
  'manage_sponsorships': ['manage_sponsorships'],
  'approve_sponsorship': ['approve_sponsorship'],
  'assign_sponsorship': ['assign_sponsorship'],
  
  // Report actions
  'view_reports': ['view_reports'],
  'generate_report': ['generate_report'],
  'view_weekly_reports': ['view_weekly_reports'],
  'manage_weekly_reports': ['manage_weekly_reports'],
  'submit_reports': ['submit_reports'],
  'view_report_cards': ['view_report_cards'],
  'generate_report_cards': ['generate_report_cards'],
  
  // Message actions
  'view_messages': ['view_messages'],
  'send_message': ['send_message'],
  'delete_message': ['delete_message'],
  
  // Notification actions
  'view_notifications': ['view_notifications'],
  'send_notification': ['send_notification'],
  'delete_notification': ['delete_notification'],
  
  // Settings actions
  'view_settings': ['view_settings'],
  'edit_settings': ['edit_settings'],
  'view_advanced_settings': ['view_advanced_settings'],
  'edit_advanced_settings': ['edit_advanced_settings'],
  
  // Analytics actions
  'view_analytics': ['view_analytics'],
  'export_analytics': ['export_analytics'],
  
  // Clinic actions
  'view_clinic_records': ['view_clinic_records'],
  'add_clinic_record': ['add_clinic_record'],
  'edit_clinic_record': ['edit_clinic_record'],
  'delete_clinic_record': ['delete_clinic_record'],
  'export_clinic_records': ['export_clinic_records'],
  'notify_clinic_visits': ['notify_clinic_visits'],
  'view_clinic_analytics': ['view_clinic_analytics'],
  
  // Photo actions
  'view_photos': ['view_photos'],
  'add_photo': ['add_photo'],
  'edit_photo': ['edit_photo'],
  'delete_photo': ['delete_photo'],
  
  // Resource actions
  'view_resources': ['view_resources'],
  'add_resource': ['add_resource'],
  'edit_resource': ['edit_resource'],
  'delete_resource': ['delete_resource'],
  
  // Timetable actions
  'view_timetables': ['view_timetables'],
  'add_timetable': ['add_timetable'],
  'edit_timetable': ['edit_timetable'],
  'delete_timetable': ['delete_timetable'],
  
  // User management actions
  'view_users': ['view_users'],
  'add_user': ['add_user'],
  'edit_user': ['edit_user'],
  'delete_user': ['delete_user'],
  'lock_user': ['lock_user'],
  'unlock_user': ['unlock_user'],
  'reset_user_password': ['reset_user_password'],
  'generate_temp_password': ['generate_temp_password'],
  'manage_assigned_students': ['manage_assigned_students'],
  
  // Admin actions
  'admin_panel': ['admin_panel'],
  'user_management': ['admin_panel', 'view_users'],
};

// Get required privileges for a route
export const getRoutePrivileges = (route: string): PrivilegeName[] => {
  // Exact match
  if (ROUTE_PRIVILEGES[route]) return ROUTE_PRIVILEGES[route];
  // CFO routes start with /cfo/
  if (route.startsWith('/cfo/')) {
    // Map unknown CFO subpaths to financial view privilege
    return ['view_financial_analytics'];
  }
  // HR routes start with /hr/
  if (route.startsWith('/hr/')) {
    // HR portal should be accessible to authenticated users; pages will guard specific actions
    return [];
  }
  // Default to no hard requirement; components can use PrivilegeGuard as needed
  return [];
};

// Get required privileges for an action
export const getActionPrivileges = (action: string): PrivilegeName[] => {
  return ACTION_PRIVILEGES[action] || [];
};

// Check if user has required privileges for a route
export const hasRoutePrivileges = (userPrivileges: PrivilegeName[], route: string): boolean => {
  const requiredPrivileges = getRoutePrivileges(route);
  return requiredPrivileges.some(privilege => userPrivileges.includes(privilege));
};

// Check if user has required privileges for an action
export const hasActionPrivileges = (userPrivileges: PrivilegeName[], action: string): boolean => {
  const requiredPrivileges = getActionPrivileges(action);
  return requiredPrivileges.some(privilege => userPrivileges.includes(privilege));
};
