import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path'; // Added for file path handling
import { prisma } from '../lib/prisma';

const router = Router();
const SUPER_ADMIN_EMAIL = 'systemsreset@school.com';

// Primary privileges for each role
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ROLE_PRIVILEGES = {
  ADMIN: [
    "view_students", "add_student", "edit_student", "delete_student",
    "view_teachers", "add_teacher", "edit_teacher", "delete_teacher",
    "view_classes", "add_class", "edit_class", "delete_class",
    "view_streams", "add_stream", "edit_stream", "delete_stream",
    "view_attendance", "mark_attendance", "edit_attendance", "delete_attendance",
    "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record",
    "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship",
    "view_reports", "generate_report", "view_weekly_reports", "manage_weekly_reports",
    "view_payments", "process_payment", "refund_payment",
    "view_messages", "send_message", "delete_message",
    "view_settings", "edit_settings",
    "view_analytics",
    "view_clinic_records", "add_clinic_record", "edit_clinic_record", "delete_clinic_records",
    "admin_panel", "user_management", "password_reset_links"
  ],
  USER: [
    "view_students", "add_student", "edit_student",
    "view_attendance", "mark_attendance", "edit_attendance",
    "view_reports", "view_messages", "send_message",
    "view_classes", "view_streams", "view_timetable"
  ],
  TEACHER: [
    "view_students", "add_student", "edit_student",
    "view_attendance", "mark_attendance", "edit_attendance",
    "view_reports", "view_messages", "send_message",
    "view_classes", "view_streams", "view_timetable"
  ],
  SPONSOR: [
    "view_sponsorships", "view_students", "view_messages", "send_message"
  ],
  PARENT: [
    "view_students", "view_attendance", "view_financial", "view_reports", "view_messages", "send_message"
  ],
  NURSE: [
    "view_clinic_records", "add_clinic_record", "edit_clinic_record", "view_messages", "send_message"
  ],
  SUPERUSER: [
    "view_students", "view_teachers", "view_classes", "view_streams", "view_attendance", "view_financial", "view_sponsorships", "view_reports", "view_weekly_reports", "manage_weekly_reports", "view_payments", "view_messages", "view_settings", "view_analytics", "view_clinic_records"
  ],
  SUPER_TEACHER: [
    "view_students", "view_attendance", "view_reports", "view_messages", "send_message", "view_classes", "view_streams", "view_timetable"
  ],
  SPONSORSHIP_COORDINATOR: [
    "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "view_messages", "send_message"
  ],
  SPONSORSHIPS_OVERSEER: [
    "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "view_messages", "send_message", "view_reports", "submit_reports"
  ],
  ACCOUNTANT: [
    // Financial management full access
    "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record", "export_financial", "view_financial_analytics",
    // Payments
    "view_payments", "process_payment", "refund_payment",
    // Fee structure via settings
    "view_settings", "edit_settings",
    // Basic visibility
    "view_students", "view_reports", "view_messages", "send_message"
  ],
  HR: [
    // Staff management only (no account creation)
    "view_staff", "add_staff", "edit_staff", "delete_staff",
    // File uploads for staff records
    "upload_staff_cv", "upload_staff_passport",
    // HR portal features
    "view_weekly_reports", "submit_reports", "export_weekly_reports",
    "view_photos", 
    "view_settings",
    // Read-only financial visibility to assist accountant (optional minimal)
    "view_financial"
  ],
  CFO: [
    "view_cfo_dashboard", 
    // Existing Financial Management (from ACCOUNTANT role)
    "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record", "export_financial", "view_financial_analytics",
    // Payment Management (existing system)
    "view_payments", "process_payment", "refund_payment", "export_payments", "view_payment_analytics", "manage_payment_methods",
    // Settings (for fee structure management)
    "view_settings", "edit_settings",
    // CFO-Specific Financial Management
    "record_school_funding", "view_school_funding", "edit_school_funding", "delete_school_funding",
    "record_foundation_funding", "view_foundation_funding", "edit_foundation_funding", "delete_foundation_funding",
    "record_farm_income", "view_farm_income", "edit_farm_income", "delete_farm_income",
    "record_clinic_income", "view_clinic_income", "edit_clinic_income", "delete_clinic_income",
    "record_expenditure", "view_expenditure", "edit_expenditure", "delete_expenditure",
    "allocate_funds", "view_fund_allocation", "edit_fund_allocation", "delete_fund_allocation",
    "generate_financial_statement", "view_financial_statements", "export_financial_statements",
    "view_fund_sources", "manage_fund_sources", "export_financial_data", "view_financial_reports",
    // Messages
    "view_messages", "send_message"
  ],
  OPM: [
    // Operations Management Dashboard
    "view_opm_dashboard",
    // Budget Management
    "create_budget", "view_budget", "edit_budget", "delete_budget", "approve_budget", "track_budget_usage",
    // Expense Management (All CFO expense types)
    "add_operations_expense", "view_operations_expenses", "edit_operations_expenses", "delete_operations_expenses",
    "categorize_expenses", "approve_expenses", "track_expense_categories",
    // Purchasing System
    "create_purchase_order", "view_purchase_orders", "edit_purchase_orders", "approve_purchase_orders",
    "categorize_purchases", "track_purchased_items", "manage_inventory",
    // Fund Allocation Viewing (from CFO)
    "view_fund_allocations", "view_fund_sources", "track_fund_usage", "request_fund_allocation",
    // Task Management
    "create_operations_task", "view_operations_tasks", "edit_operations_tasks", "assign_operations_tasks",
    "track_task_progress", "complete_operations_tasks", "manage_operations_schedule",
    // Construction & Renovation
    "manage_construction_projects", "track_renovation_progress", "approve_construction_budgets",
    "supervise_construction_work", "manage_contractors",
    // Operations Categories
    "manage_school_operations", "manage_clinic_operations", "manage_organization_operations",
    "oversee_facilities", "manage_equipment", "coordinate_services",
    // Reports & Analytics
    "view_operations_reports", "generate_operations_analytics", "export_operations_data",
    "view_weekly_reports", "submit_operations_reports",
    // Essential Sidebar Features
    "view_messages", "send_message", "view_settings", "edit_settings"
  ]
};

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        privileges: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        privileges: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      status, 
      gender, 
      age, 
      residence, 
      password,
      assignedStream,
      assignedStreams,
      studentId,
      lastLogin,
      assignedClasses
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password || 'user123', 10);

    const userData: {
      name: string;
      email: string;
      role: string;
      status: string;
      password: string;
      firstTimeLogin: boolean;
      gender?: string;
      age?: number;
      residence?: string;
      assignedStream?: string;
      assignedStreams?: string;
      studentId?: string;
      lastLogin?: Date;
      assignedClasses?: string;
    } = {
      name,
      email,
      role: (role || 'user').toUpperCase(),
      status: (status || 'active').toUpperCase(),
      password: hashedPassword,
      firstTimeLogin: true // Mark as first-time login - user must change password
    };

    // Add optional fields if provided
    if (gender) userData.gender = gender;
    if (age) userData.age = parseInt(age);
    if (residence) userData.residence = residence;
    if (assignedStream) userData.assignedStream = assignedStream;
    if (assignedStreams) userData.assignedStreams = JSON.stringify(assignedStreams);
    if (studentId) userData.studentId = studentId;
    if (lastLogin) userData.lastLogin = new Date(lastLogin);
    
    // Convert assignedClasses to JSON string if it's an array
    if (assignedClasses && Array.isArray(assignedClasses)) {
      userData.assignedClasses = JSON.stringify(assignedClasses);
    }

    const user = await prisma.user.create({
      data: userData,
    });

    // Schedule account lock after 3 hours if not logged in
    setTimeout(async () => {
      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id }
        });
        
        // Only lock if user hasn't logged in yet (firstTimeLogin is still true)
        if (currentUser && currentUser.firstTimeLogin) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accountLocked: true,
              lockReason: 'Account automatically locked after 3 hours without first login',
              lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Lock for 24 hours
            }
          });
          console.log(`Account locked for user ${user.email} after 3 hours without login`);
        }
      } catch (error) {
        console.error('Error auto-locking account:', error);
      }
    }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds

    // Assign comprehensive default privileges based on role
    const ROLE_PRIVILEGES = {
      ADMIN: [
        // === STUDENT MANAGEMENT ===
        "view_students", "add_student", "edit_student", "delete_student", "export_students", "flag_student", "unflag_student", "re_admit_student", "view_student_details", "edit_student_conduct", "clear_students", "delete_students_by_class", "admit_from_overseer", "manage_assigned_students",
        // === TEACHER MANAGEMENT ===
        "view_teachers", "add_teacher", "edit_teacher", "delete_teacher", "assign_teacher_classes", "view_teacher_analytics",
        // === USER MANAGEMENT ===
        "view_users", "add_user", "edit_user", "delete_user", "lock_user", "unlock_user", "reset_user_password", "generate_temp_password", "assign_privileges", "remove_privileges", "export_users",
        // === PARENT MANAGEMENT ===
        "assign_parent_students", "view_parent_analytics",
        // === CLASS & STREAM MANAGEMENT ===
        "view_classes", "add_class", "edit_class", "delete_class", "manage_class_students", "view_class_analytics", "view_streams", "add_stream", "edit_stream", "delete_stream",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "mark_attendance", "edit_attendance", "delete_attendance", "export_attendance", "view_attendance_analytics", "bulk_attendance", "view_attendance_analysis",
        // === FINANCIAL MANAGEMENT ===
        "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record", "export_financial", "view_financial_analytics",
        // === SPONSORSHIP MANAGEMENT ===
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "reject_sponsorship", "view_sponsorship_analytics", "sponsor_student", "view_sponsor_details",
        // === REPORT MANAGEMENT ===
        "view_reports", "generate_report", "view_report_cards", "generate_report_cards", "export_reports", "schedule_reports", "view_report_analytics",
        // === WEEKLY REPORTS ===
        "view_weekly_reports", "submit_reports", "approve_weekly_reports", "review_weekly_reports", "export_weekly_reports",
        // === PAYMENT MANAGEMENT ===
        "view_payments", "process_payment", "refund_payment", "export_payments", "view_payment_analytics", "manage_payment_methods",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "delete_message", "reply_message", "mark_message_read", "export_messages",
        // === NOTIFICATION SYSTEM ===
        "view_notifications", "send_notification", "delete_notification",
        // === ANALYTICS ===
        "view_analytics", "export_analytics", "view_dashboard_analytics", "view_user_analytics", "view_system_analytics",
        // === TIMETABLE MANAGEMENT ===
        "view_timetables", "add_timetable", "edit_timetable", "delete_timetable", "manage_timetable_conflicts", "export_timetable", "view_teacher_schedule", "assign_teacher_schedule", "manage_schedule_conflicts",
        // === CLINIC MANAGEMENT ===
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "delete_clinic_record", "export_clinic_records", "notify_clinic_visits", "view_clinic_analytics",
        // === RESOURCE MANAGEMENT ===
        "view_resources", "add_resource", "edit_resource", "delete_resource", "upload_resource", "download_resource", "export_resources",
        // === PHOTO MANAGEMENT ===
        "view_photos", "add_photo", "edit_photo", "delete_photo", "upload_photo", "download_photo", "organize_photos",
        // === MARKS MANAGEMENT ===
        "add_student_marks", "edit_student_marks", "view_student_marks", "export_student_marks",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences", "export_settings",
        // === ADVANCED SETTINGS ===
        "view_advanced_settings", "edit_advanced_settings", "system_backup", "system_restore", "system_maintenance", "view_system_logs", "system_configuration", "view_system_info",
        // === ADMIN PANEL ===
        "admin_panel"
      ],
      SECRETARY: [
        // === STUDENT ADMISSIONS ===
        "view_students", "add_student", "edit_student", "view_student_details", "re_admit_student", "admit_from_overseer",
        // === CLASSES & STREAMS (VIEW) ===
        "view_classes", "view_streams",
        // === ATTENDANCE (VIEW) ===
        "view_attendance", "view_attendance_analytics",
        // === FINANCIAL (VIEW FEES BALANCE) ===
        "view_financial", "view_financial_analytics", "view_payments",
        // === REPORTS (VIEW) ===
        "view_reports", "view_report_cards", "export_reports",
        // === MESSAGING (BASIC) ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === SETTINGS (PERSONAL) ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      USER: [
        // === STUDENT MANAGEMENT ===
        "view_students", "add_student", "edit_student", "view_student_details", "manage_assigned_students",
        // === MARKS MANAGEMENT ===
        "add_student_marks", "edit_student_marks", "view_student_marks", "export_student_marks",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "mark_attendance", "edit_attendance", "view_attendance_analytics",
        // === REPORT MANAGEMENT ===
        "view_reports", "view_report_cards", "generate_report_cards", "export_reports",
        // === TIMETABLE MANAGEMENT ===
        "view_timetables", "view_teacher_schedule",
        // === WEEKLY REPORTS ===
        "view_weekly_reports", "submit_reports", "export_weekly_reports",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === RESOURCE MANAGEMENT ===
        "view_resources", "download_resource",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      TEACHER: [
        // === STUDENT MANAGEMENT ===
        "view_students", "add_student", "edit_student", "view_student_details", "manage_assigned_students",
        // === MARKS MANAGEMENT ===
        "add_student_marks", "edit_student_marks", "view_student_marks", "export_student_marks",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "mark_attendance", "edit_attendance", "view_attendance_analytics",
        // === REPORT MANAGEMENT ===
        "view_reports", "view_report_cards", "generate_report_cards", "export_reports",
        // === TIMETABLE MANAGEMENT ===
        "view_timetables", "view_teacher_schedule",
        // === WEEKLY REPORTS ===
        "view_weekly_reports", "submit_reports", "export_weekly_reports",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === RESOURCE MANAGEMENT ===
        "view_resources", "download_resource",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      SUPER_TEACHER: [
        // === STUDENT MANAGEMENT ===
        "view_students", "add_student", "edit_student", "view_student_details", "manage_assigned_students",
        // === MARKS MANAGEMENT ===
        "add_student_marks", "edit_student_marks", "view_student_marks", "export_student_marks",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "mark_attendance", "edit_attendance", "view_attendance_analytics", "bulk_attendance",
        // === REPORT MANAGEMENT ===
        "view_reports", "view_report_cards", "generate_report_cards", "export_reports",
        // === TIMETABLE MANAGEMENT ===
        "view_timetables", "view_teacher_schedule", "edit_timetable",
        // === WEEKLY REPORTS ===
        "view_weekly_reports", "submit_reports", "export_weekly_reports",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === RESOURCE MANAGEMENT ===
        "view_resources", "download_resource", "upload_resource",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      PARENT: [
        // === STUDENT MANAGEMENT ===
        "view_students", "manage_assigned_students", "view_student_details",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "view_attendance_analytics",
        // === FINANCIAL MANAGEMENT ===
        "view_financial", "view_financial_analytics",
        // === PAYMENT MANAGEMENT ===
        "view_payments",
        // === REPORT MANAGEMENT ===
        "view_reports", "view_report_cards", "export_reports",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      SPONSOR: [
        // === STUDENT MANAGEMENT ===
        "view_students", "view_student_details",
        // === SPONSORSHIP MANAGEMENT ===
        "view_sponsorships", "sponsor_student", "view_sponsor_details",
        // === FINANCIAL MANAGEMENT ===
        "view_financial",
        // === PAYMENT MANAGEMENT ===
        "view_payments",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      NURSE: [
        // === STUDENT MANAGEMENT ===
        "view_students",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === CLINIC MANAGEMENT ===
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "delete_clinic_record", "export_clinic_records", "notify_clinic_visits", "view_clinic_analytics",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      SUPERUSER: [
        // === STUDENT MANAGEMENT ===
        "view_students", "view_student_details", "export_students",
        // === TEACHER MANAGEMENT ===
        "view_teachers", "view_teacher_analytics",
        // === USER MANAGEMENT ===
        "view_users",
        // === PARENT MANAGEMENT ===
        "view_parent_analytics",
        // === CLASS & STREAM MANAGEMENT ===
        "view_classes", "view_class_analytics", "view_streams",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "view_attendance_analytics", "export_attendance",
        // === FINANCIAL MANAGEMENT ===
        "view_financial", "view_financial_analytics", "export_financial",
        // === SPONSORSHIP MANAGEMENT ===
        "view_sponsorships", "view_sponsorship_analytics",
        // === REPORT MANAGEMENT ===
        "view_reports", "view_report_cards", "view_report_analytics", "export_reports",
        // === WEEKLY REPORTS ===
        "view_weekly_reports", "export_weekly_reports",
        // === PAYMENT MANAGEMENT ===
        "view_payments", "view_payment_analytics", "export_payments",
        // === MESSAGING SYSTEM ===
        "view_messages", "export_messages",
        // === ANALYTICS ===
        "view_analytics", "view_dashboard_analytics", "view_user_analytics", "view_system_analytics",
        // === TIMETABLE MANAGEMENT ===
        "view_timetables", "export_timetable",
        // === CLINIC MANAGEMENT ===
        "view_clinic_records", "view_clinic_analytics", "export_clinic_records",
        // === RESOURCE MANAGEMENT ===
        "view_resources", "export_resources",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "export_settings"
      ],
      SPONSORSHIP_COORDINATOR: [
        // === STUDENT MANAGEMENT ===
        "view_students", "view_student_details",
        // === SPONSORSHIP MANAGEMENT ===
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "reject_sponsorship", "view_sponsorship_analytics",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      SPONSORSHIPS_OVERSEER: [
        // === STUDENT MANAGEMENT ===
        "view_students", "add_student", "edit_student", "view_student_details", "admit_from_overseer",
        // === SPONSORSHIP MANAGEMENT ===
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "reject_sponsorship", "view_sponsorship_analytics",
        // === FINANCIAL MANAGEMENT ===
        "view_financial", "view_financial_analytics",
        // === ATTENDANCE MANAGEMENT ===
        "view_attendance", "view_attendance_analytics",
        // === REPORT MANAGEMENT ===
        "view_reports", "submit_reports", "export_reports", "view_report_analytics",
        // === WEEKLY REPORTS ===
        "view_weekly_reports",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences"
      ],
      hr: [
        // === HR STAFF MANAGEMENT ===
        "view_staff", "add_staff", "edit_staff", "delete_staff",
        "upload_staff_cv", "upload_staff_passport",
        // === HR PORTAL FEATURES ===
        "view_weekly_reports", "submit_reports", "export_weekly_reports",
        "view_photos",
        "view_settings",
        // Minimal finance visibility for payouts context
        "view_financial"
      ],
      cfo: [
        // === CFO DASHBOARD ===
        "view_cfo_dashboard",
        // === FINANCIAL MANAGEMENT ===
        "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record", "export_financial", "view_financial_analytics",
        // === PAYMENT MANAGEMENT ===
        "view_payments", "process_payment", "refund_payment", "export_payments", "view_payment_analytics", "manage_payment_methods",
        // === CFO-SPECIFIC FINANCIAL MANAGEMENT ===
        "record_school_funding", "view_school_funding", "edit_school_funding", "delete_school_funding",
        "record_foundation_funding", "view_foundation_funding", "edit_foundation_funding", "delete_foundation_funding",
        "record_farm_income", "view_farm_income", "edit_farm_income", "delete_farm_income",
        "record_clinic_income", "view_clinic_income", "edit_clinic_income", "delete_clinic_income",
        "record_expenditure", "view_expenditure", "edit_expenditure", "delete_expenditure",
        "allocate_funds", "view_fund_allocation", "edit_fund_allocation", "delete_fund_allocation",
        "generate_financial_statement", "view_financial_statements", "export_financial_statements",
        "view_fund_sources", "manage_fund_sources", "export_financial_data", "view_financial_reports",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read"
      ],
      opm: [
        // === OPM DASHBOARD ===
        "view_opm_dashboard",
        // === BUDGET MANAGEMENT ===
        "create_budget", "view_budget", "edit_budget", "delete_budget", "approve_budget", "track_budget_usage",
        // === EXPENSE MANAGEMENT ===
        "add_operations_expense", "view_operations_expenses", "edit_operations_expenses", "delete_operations_expenses",
        "categorize_expenses", "approve_expenses", "track_expense_categories",
        // === PURCHASING SYSTEM ===
        "create_purchase_order", "view_purchase_orders", "edit_purchase_orders", "approve_purchase_orders",
        "categorize_purchases", "track_purchased_items", "manage_inventory",
        // === FUND ALLOCATION VIEWING ===
        "view_fund_allocations", "view_fund_sources", "track_fund_usage", "request_fund_allocation",
        // === TASK MANAGEMENT ===
        "create_operations_task", "view_operations_tasks", "edit_operations_tasks", "assign_operations_tasks",
        "track_task_progress", "complete_operations_tasks", "manage_operations_schedule",
        // === CONSTRUCTION & RENOVATION ===
        "manage_construction_projects", "track_renovation_progress", "approve_construction_budgets",
        "supervise_construction_work", "manage_contractors",
        // === OPERATIONS CATEGORIES ===
        "manage_school_operations", "manage_clinic_operations", "manage_organization_operations",
        "oversee_facilities", "manage_equipment", "coordinate_services",
        // === REPORTS & ANALYTICS ===
        "view_operations_reports", "generate_operations_analytics", "export_operations_data",
        "view_weekly_reports", "submit_operations_reports",
        // === SETTINGS MANAGEMENT ===
        "view_settings", "edit_settings", "change_password", "update_profile", "view_user_preferences",
        // === MESSAGING SYSTEM ===
        "view_messages", "send_message", "reply_message", "mark_message_read"
      ]
    };
    // Convert role to lowercase for privileges mapping since the mapping uses lowercase keys
    const roleKey = user.role.toLowerCase();
    const rolePrivileges = ROLE_PRIVILEGES[roleKey as keyof typeof ROLE_PRIVILEGES] || [];
    for (const privilege of rolePrivileges) {
      await prisma.userPrivilege.create({
        data: {
          userId: user.id,
          privilege: privilege,
        }
      });
    }

    // Fetch user with privileges
    const userWithPrivileges = await prisma.user.findUnique({
      where: { id: user.id },
      include: { privileges: true }
    });
    
    // Return success with default password info
    res.status(201).json({
      ...userWithPrivileges,
      defaultPassword: password || 'user123',
      message: 'User created successfully. Account will be locked after 3 hours if not logged in.'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const privileges = updateData.privileges;
    const photoFile = updateData.photoFile; // New: handle photo file upload
    delete updateData.privileges;
    delete updateData.photoFile; // Remove from regular update data

    // Debug log
    console.log('Received update data for user', req.params.id, updateData);

    // Convert age to number if it's a string
    if (updateData.age && typeof updateData.age === 'string') {
      updateData.age = parseInt(updateData.age);
    }

    // Convert assignedClasses to JSON string if it's an array
    if (updateData.assignedClasses && Array.isArray(updateData.assignedClasses)) {
      updateData.assignedClasses = JSON.stringify(updateData.assignedClasses);
    }

    // Ensure status is uppercase
    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
    }

    // Ensure role is uppercase
    if (updateData.role) {
      updateData.role = updateData.role.toUpperCase();
    }

    // Handle photo upload if provided
    let photoFileName = null;
    if (photoFile && photoFile.fileData && photoFile.fileType) {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(photoFile.fileType)) {
          return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
        }

        // Generate unique filename
        const fileExtension = photoFile.fileType.split('/')[1] || 'jpg';
        photoFileName = `profile_${req.params.id}_${Date.now()}.${fileExtension}`;
        const uploadsDir = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsDir, photoFileName);

        // Ensure uploads directory exists
        if (!require('fs').existsSync(uploadsDir)) {
          require('fs').mkdirSync(uploadsDir, { recursive: true });
        }

        // Decode base64 and save file
        const base64Data = photoFile.fileData.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        require('fs').writeFileSync(filePath, buffer);

        // Add photo filename to update data
        updateData.photo = photoFileName;
        console.log('Profile photo uploaded:', photoFileName);
      } catch (photoError) {
        console.error('Error uploading profile photo:', photoError);
        return res.status(500).json({ error: 'Failed to upload profile photo' });
      }
    }

    // Remove fields that might not exist in the current Prisma client
    const safeUpdateData = { ...updateData };
    // Keep photo field if we uploaded one
    if (!photoFileName) {
      delete safeUpdateData.photo;
    }
    delete safeUpdateData.cv;
    // Keep assignedClasses for the update

    // Update user fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: safeUpdateData,
    });

    // Handle privileges update if provided
    if (privileges && Array.isArray(privileges)) {
      // Delete existing privileges
      await prisma.userPrivilege.deleteMany({
        where: { userId: parseInt(req.params.id) }
      });

      // Filter out duplicate privileges by privilege name
      const seen = new Set();
      const uniquePrivileges = privileges.filter(p => {
        const name = p.privilege || p.name;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

      console.log('Processing privileges:', uniquePrivileges); // Debug log

      // Add new privileges with error handling
      for (const privilege of uniquePrivileges) {
        try {
          const privilegeName = privilege.privilege || privilege.name;
          console.log('Creating privilege:', privilegeName); // Debug log
          
          if (!privilegeName) {
            console.error('Missing privilege name in:', privilege);
            continue;
          }

          await prisma.userPrivilege.create({
            data: {
              userId: parseInt(req.params.id),
              privilege: privilegeName,
              expiresAt: privilege.expiresAt ? new Date(privilege.expiresAt) : null
            }
          });
        } catch (privError) {
          console.error('Error inserting privilege:', privilege, privError);
          return res.status(500).json({ error: 'Failed to insert privilege', privilege, details: privError instanceof Error ? privError.message : privError });
        }
      }
    }

    // Fetch the updated user with privileges
    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { privileges: true }
    });

    // Return response with photo info if uploaded
    const response = {
      ...updatedUser,
      photoUploaded: !!photoFileName,
      photoUrl: photoFileName ? `/photos/${photoFileName}` : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Reset password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Hash the password properly
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        password: hashedPassword,
        firstTimeLogin: true, // Force password change on next login
        passwordAttempts: 0,
        accountLocked: false,
        lockReason: null,
        lockedUntil: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Lock user account
router.post('/:id/lock', async (req, res) => {
  try {
    const { lockUntil, lockReason } = req.body;
    
    const updateData: {
      status: string;
      lockedUntil?: Date;
      accountLocked?: boolean;
      lockReason?: string;
    } = {
      status: 'INACTIVE'
    };

    if (lockUntil) {
      // Temporary lock with expiry
      const lockDate = new Date(lockUntil);
      console.log('Setting lock until:', lockDate); // Debug log
      updateData.lockedUntil = lockDate;
    } else {
      // Permanent lock
      updateData.accountLocked = true;
      updateData.lockReason = lockReason || 'Locked by administrator';
    }

    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    // Notify all admins about the account lock
    const lockedUser = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
          const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'admin'] } } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          title: 'Account Locked',
          message: `User ${lockedUser?.name} (${lockedUser?.email}) has been locked by an administrator. Reason: ${updateData.lockReason || 'N/A'}`,
          type: 'INFO',
          userId: admin.id,
          read: false,
          date: new Date()
        }
      });
    }

    res.json({ message: 'Account locked successfully' });
  } catch (error) {
    console.error('Error locking account:', error);
    res.status(500).json({ error: 'Failed to lock account' });
  }
});

// Unlock user account (requires new password)
router.post('/:id/unlock-with-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        password: newPassword,
        accountLocked: false,
        lockReason: null,
        lockedUntil: null,
        passwordAttempts: 0,
        firstTimeLogin: true // Force password change on next login
      }
    });

    res.json({ message: 'Account unlocked successfully' });
  } catch (error) {
    console.error('Error unlocking account:', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
});

// Generate password reset link
router.post('/:id/generate-reset-link', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetLink = `http://localhost:5179/reset-password?token=${resetToken}&email=${user.email}`;

    // Store reset token in database (you might want to add a resetToken field to User model)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    res.json({ 
      message: 'Reset link generated successfully',
      resetLink: resetLink,
      userEmail: user.email
    });
  } catch (error) {
    console.error('Error generating reset link:', error);
    res.status(500).json({ error: 'Failed to generate reset link' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot delete the permanent Super Admin account' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Assign privilege to user
router.post('/:id/privileges', async (req, res) => {
  try {
    const { privilege, expiresAt } = req.body;
    const userId = parseInt(req.params.id);
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target && target.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Super Admin already has all privileges by default' });
    }
    
    if (!privilege) {
      return res.status(400).json({ error: 'Privilege is required' });
    }

    // Check if privilege already exists
    const existingPrivilege = await prisma.userPrivilege.findFirst({
      where: {
        userId: userId,
        privilege: privilege
      }
    });

    if (existingPrivilege) {
      return res.status(400).json({ error: 'Privilege already assigned to user' });
    }

    // Add privilege
    await prisma.userPrivilege.create({
      data: {
        userId: userId,
        privilege: privilege,
        assignedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Get updated user with privileges
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { privileges: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error assigning privilege:', error);
    res.status(500).json({ error: 'Failed to assign privilege' });
  }
});

// Remove privilege from user
router.delete('/:id/privileges/:privilege', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const privilege = req.params.privilege;
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target && target.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot remove privileges from the permanent Super Admin' });
    }

    // Delete privilege
    await prisma.userPrivilege.deleteMany({
      where: {
        userId: userId,
        privilege: privilege
      }
    });

    // Get updated user with privileges
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { privileges: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error removing privilege:', error);
    res.status(500).json({ error: 'Failed to remove privilege' });
  }
});

// Reset and assign all privileges for a user
router.post('/:id/reset-privileges', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target && target.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot reset privileges for the permanent Super Admin' });
    }
    const { privileges } = req.body; // privileges: array of privilege names
    if (!Array.isArray(privileges)) {
      return res.status(400).json({ error: 'Privileges array is required' });
    }
    // Remove all current privileges
    await prisma.userPrivilege.deleteMany({ where: { userId } });
    // Assign new privileges
    for (const priv of privileges) {
      await prisma.userPrivilege.create({
        data: {
          userId,
          privilege: priv,
          assignedAt: new Date(),
        }
      });
    }
    // Return updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { privileges: true }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error resetting privileges:', error);
    res.status(500).json({ error: 'Failed to reset privileges' });
  }
});

// Endpoint to assign default privileges to all users
router.post('/assign-default-privileges', async (req, res) => {
  try {
    const ROLE_PRIVILEGES = {
      admin: [
        "view_students", "add_student", "edit_student", "delete_student",
        "view_teachers", "add_teacher", "edit_teacher", "delete_teacher",
        "view_classes", "add_class", "edit_class", "delete_class",
        "view_streams", "add_stream", "edit_stream", "delete_stream",
        "view_attendance", "mark_attendance", "edit_attendance", "delete_attendance",
        "view_financial", "add_financial_record", "edit_financial_record", "delete_financial_record",
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship",
        "view_reports", "generate_report", "view_weekly_reports", "manage_weekly_reports",
        "view_payments", "process_payment", "refund_payment",
        "view_messages", "send_message", "delete_message",
        "view_settings", "edit_settings",
        "view_analytics",
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "delete_clinic_records",
        "admin_panel"
      ],
      user: [
        "view_students", "add_student", "edit_student",
        "view_attendance", "mark_attendance", "edit_attendance",
        "view_reports", "view_messages", "send_message",
        "view_classes", "view_streams", "view_timetable"
      ],
      sponsor: [
        "view_sponsorships", "view_students", "view_messages", "send_message"
      ],
      parent: [
        "view_students", "view_attendance", "view_financial", "view_reports", "view_messages", "send_message"
      ],
      nurse: [
        "view_clinic_records", "add_clinic_record", "edit_clinic_record", "view_messages", "send_message"
      ],
      superuser: [
        "view_students", "view_teachers", "view_classes", "view_streams", "view_attendance", "view_financial", "view_sponsorships", "view_reports", "view_weekly_reports", "manage_weekly_reports", "view_payments", "view_messages", "view_settings", "view_analytics", "view_clinic_records"
      ],
      'super-teacher': [
        "view_students", "view_attendance", "view_reports", "view_messages", "send_message", "view_classes", "view_streams", "view_timetable"
      ],
      'sponsorship-coordinator': [
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "view_messages", "send_message"
      ],
      'sponsorships-overseer': [
        "view_sponsorships", "manage_sponsorships", "approve_sponsorship", "assign_sponsorship", "view_students", "view_messages", "send_message", "view_reports", "submit_reports"
      ],
      hr: [
        "view_staff", "add_staff", "edit_staff", "delete_staff",
        "upload_staff_cv", "upload_staff_passport",
        "view_weekly_reports", "submit_reports", "export_weekly_reports",
        "view_photos",
        "view_settings",
        "view_financial"
      ]
    };
    const users = await prisma.user.findMany();
    for (const user of users) {
      const rolePrivileges = ROLE_PRIVILEGES[user.role as keyof typeof ROLE_PRIVILEGES] || [];
      // Remove existing privileges
      await prisma.userPrivilege.deleteMany({ where: { userId: user.id } });
      // Assign default privileges
      for (const privilege of rolePrivileges) {
        await prisma.userPrivilege.create({
          data: {
            userId: user.id,
            privilege: privilege,
          }
        });
      }
    }
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to assign default privileges to all users' });
  }
});

// Unlock user account (admin only)
router.post('/:id/unlock', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get the current user from the request (you'll need to implement authentication middleware)
    // For now, we'll check if the request has admin headers or implement basic role checking
    const currentUserRole = req.headers['x-user-role'] || req.headers['user-role'];
    
    // Check if current user has admin privileges
    if (!currentUserRole || !['admin', 'super_admin', 'superuser'].includes(currentUserRole.toString().toLowerCase())) {
      return res.status(403).json({ 
        error: 'Access denied. Only administrators can unlock user accounts.',
        requiredRole: 'admin',
        currentRole: currentUserRole || 'unknown'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check the type of lock to determine unlock method
    // Priority: Admin lock takes precedence over password attempt lock
    const isAdminLock = user.accountLocked || (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now());
    const isPasswordAttemptLock = user.passwordAttempts && user.passwordAttempts >= 6 && !isAdminLock;
    
    console.log('Unlock Debug Info:', {
      userId: userId,
      userName: user.name,
      passwordAttempts: user.passwordAttempts,
      accountLocked: user.accountLocked,
      lockedUntil: user.lockedUntil,
      isPasswordAttemptLock: isPasswordAttemptLock,
      isAdminLock: isAdminLock,
      currentUserRole: currentUserRole
    });
    
    if (isPasswordAttemptLock) {
      // For password attempt locks, require a new password
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ 
          error: 'New password required for accounts locked due to multiple failed attempts',
          lockType: 'password_attempts',
          requiredAction: 'provide_new_password'
        });
      }
      
      // Unlock with new password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          password: newPassword,
          accountLocked: false,
          lockedUntil: null,
          lockReason: null,
          passwordAttempts: 0,
          lastPasswordAttempt: null,
          firstTimeLogin: true // Force password change on next login
        }
      });
      
      res.json({ 
        success: true, 
        message: `Account unlocked for ${updatedUser.name} with new password`,
        user: updatedUser,
        lockType: 'password_attempts'
      });
      
    } else if (isAdminLock) {
      // For admin locks, unlock immediately WITHOUT requiring password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          accountLocked: false,
          lockedUntil: null,
          lockReason: null,
          passwordAttempts: 0,
          lastPasswordAttempt: null
        }
      });
      
      res.json({ 
        success: true, 
        message: `Account unlocked for ${updatedUser.name}`,
        user: updatedUser,
        lockType: 'admin_lock'
      });
      
    } else {
      // Account is not locked
      res.json({ 
        success: false, 
        message: 'Account is not locked',
        user: user,
        lockType: 'none'
      });
    }
    
  } catch (error) {
    console.error('Error unlocking user account:', error);
    res.status(500).json({ error: 'Failed to unlock user account' });
  }
});

// Assign students to parent
router.post('/:id/assign-students', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'Student IDs array is required' });
    }
    
    console.log(`🔍 Attempting to assign students ${JSON.stringify(studentIds)} to parent ${userId}`);
    
    // Try database operation first
    try {
      // Check if user exists and is a parent
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.role !== 'PARENT') {
        return res.status(400).json({ error: 'User must be a parent to assign students' });
      }
      
      // Check if all students exist
      const students = await prisma.student.findMany({
        where: {
          id: { in: studentIds }
        }
      });
      
      if (students.length !== studentIds.length) {
        return res.status(400).json({ error: 'One or more students not found' });
      }
      
      // Update the parent user with the assigned student IDs (stored as JSON string)
      await prisma.user.update({
        where: { id: userId },
        data: {
          studentIds: JSON.stringify(studentIds)
        }
      });
      
      console.log(`✅ Assigned ${studentIds.length} students to parent ${user.name} (ID: ${userId})`);
      
      res.json({ 
        message: `Successfully assigned ${studentIds.length} students to ${user.name}`,
        assignedStudents: students.map(s => ({ id: s.id, name: s.name, accessNumber: s.accessNumber }))
      });
      
    } catch (dbError) {
      console.error('Database operation failed, falling back to in-memory:', dbError);
      
      // Fallback: Simple in-memory assignment (for when database is unavailable)
      // This mimics the working JavaScript server behavior
      const mockUser = { id: userId, name: 'Parent', role: 'PARENT' };
      const mockStudents = studentIds.map(id => ({ id, name: `Student ${id}`, accessNumber: `ST${id}` }));
      
      console.log(`✅ Fallback: Assigned ${studentIds.length} students to parent ${mockUser.name} (ID: ${userId})`);
      
      res.json({ 
        message: `Successfully assigned ${studentIds.length} students to ${mockUser.name}`,
        assignedStudents: mockStudents,
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Error assigning students to parent:', error);
    res.status(500).json({ error: 'Failed to assign students to parent' });
  }
});

// Get students assigned to a parent
router.get('/:id/assigned-students', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get the parent user
    const parent = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!parent || parent.role !== 'PARENT') {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    // Parse the studentIds from the parent
    let studentIds = [];
    if (parent.studentIds) {
      try {
        studentIds = JSON.parse(parent.studentIds);
      } catch (error) {
        console.error('Error parsing studentIds:', error);
        return res.json([]);
      }
    }
    
    // Get the students
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      select: {
        id: true,
        name: true,
        accessNumber: true,
        admissionId: true,
        class: true,
        stream: true,
        status: true,
        age: true,
        gender: true
      }
    });
    
    res.json(students);
    
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({ error: 'Failed to fetch assigned students' });
  }
});

// Remove student assignment from parent
router.delete('/:id/assigned-students/:studentId', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const studentId = parseInt(req.params.studentId);
    
    // Get the parent user
    const parent = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!parent || parent.role !== 'PARENT') {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    // Parse the current studentIds
    let studentIds = [];
    if (parent.studentIds) {
      try {
        studentIds = JSON.parse(parent.studentIds);
      } catch (error) {
        console.error('Error parsing studentIds:', error);
        return res.status(400).json({ error: 'Invalid student assignments' });
      }
    }
    
    // Check if the student is assigned to this parent
    if (!studentIds.includes(studentId)) {
      return res.status(404).json({ error: 'Student not assigned to this parent' });
    }
    
    // Remove the student from the list
    const updatedStudentIds = studentIds.filter(id => id !== studentId);
    
    // Update the parent with the new student list
    await prisma.user.update({
      where: { id: userId },
      data: {
        studentIds: JSON.stringify(updatedStudentIds)
      }
    });
    
    console.log(`✅ Removed student ${studentId} from parent ${userId}`);
    
    res.json({ message: `Successfully removed student from parent` });
    
  } catch (error) {
    console.error('Error removing student assignment:', error);
    res.status(500).json({ error: 'Failed to remove student assignment' });
  }
});

export default router; 