export interface UserPrivilege {
  privilege: string; // e.g., "edit_attendance", "view_financial"
  expiresAt?: Date; // Optional expiry for the privilege
}

export const ALL_PRIVILEGES = [
  // === STUDENT MANAGEMENT ===
  "view_students",
  "add_student",
  "edit_student",
  "delete_student",
  "export_students",
  "flag_student",
  "unflag_student",
  "re_admit_student",
  "view_student_details",
  "edit_student_conduct",
  "clear_students",
  "delete_students_by_class",
  "admit_from_overseer",
  "manage_assigned_students",

  // === TEACHER MANAGEMENT ===
  "view_teachers",
  "add_teacher",
  "edit_teacher",
  "delete_teacher",
  "assign_teacher_classes",
  "view_teacher_analytics",

  // === USER MANAGEMENT ===
  "view_users",
  "add_user",
  "edit_user",
  "delete_user",
  "lock_user",
  "unlock_user",
  "reset_user_password",
  "generate_temp_password",
  "assign_privileges",
  "remove_privileges",
  "export_users",

  // === PARENT MANAGEMENT ===
  "assign_parent_students",
  "view_parent_analytics",

  // === CLASS & STREAM MANAGEMENT ===
  "view_classes",
  "add_class",
  "edit_class",
  "delete_class",
  "manage_class_students",
  "view_class_analytics",
  "view_streams",
  "add_stream",
  "edit_stream",
  "delete_stream",

  // === ATTENDANCE MANAGEMENT ===
  "view_attendance",
  "mark_attendance",
  "edit_attendance",
  "delete_attendance",
  "export_attendance",
  "view_attendance_analytics",
  "bulk_attendance",
  "view_attendance_analysis",

  // === FINANCIAL MANAGEMENT ===
  "view_financial",
  "add_financial_record",
  "edit_financial_record",
  "delete_financial_record",
  "export_financial",
  "view_financial_analytics",

  // === HR / STAFF MANAGEMENT ===
  "view_staff",
  "add_staff",
  "edit_staff",
  "delete_staff",
  "upload_staff_cv",
  "upload_staff_passport",

  // === CFO FINANCIAL MANAGEMENT ===
  "view_cfo_dashboard",
  "record_school_funding",
  "view_school_funding",
  "edit_school_funding",
  "delete_school_funding",
  "record_foundation_funding",
  "view_foundation_funding",
  "edit_foundation_funding",
  "delete_foundation_funding",
  "record_farm_income",
  "view_farm_income",
  "edit_farm_income",
  "delete_farm_income",
  "record_clinic_income",
  "view_clinic_income",
  "edit_clinic_income",
  "delete_clinic_income",
  "record_expenditure",
  "view_expenditure",
  "edit_expenditure",
  "delete_expenditure",
  "allocate_funds",
  "view_fund_allocation",
  "edit_fund_allocation",
  "delete_fund_allocation",
  "generate_financial_statement",
  "view_financial_statements",
  "export_financial_statements",
  "view_fund_sources",
  "manage_fund_sources",
  "export_financial_data",
  "view_financial_reports",

  // === SPONSORSHIP MANAGEMENT ===
  "view_sponsorships",
  "manage_sponsorships",
  "approve_sponsorship",
  "assign_sponsorship",
  "reject_sponsorship",
  "view_sponsorship_analytics",
  "sponsor_student",
  "view_sponsor_details",

  // === REPORT MANAGEMENT ===
  "view_reports",
  "generate_report",
  "view_report_cards",
  "generate_report_cards",
  "export_reports",
  "schedule_reports",
  "view_report_analytics",

  // === WEEKLY REPORTS ===
  "view_weekly_reports",
  "submit_reports",
  "approve_weekly_reports",
  "review_weekly_reports",
  "export_weekly_reports",

  // === PAYMENT MANAGEMENT ===
  "view_payments",
  "process_payment",
  "refund_payment",
  "export_payments",
  "view_payment_analytics",
  "manage_payment_methods",

  // === MESSAGING SYSTEM ===
  "view_messages",
  "send_message",
  "delete_message",
  "reply_message",
  "mark_message_read",
  "export_messages",
  
  // === INDIVIDUAL MESSAGING PRIVILEGES ===
  "message_admin",
  "message_teacher", 
  "message_super_teacher",
  "message_parent",
  "message_nurse",
  "message_sponsor",
  "message_sponsorships_overseer",
  "message_sponsorship_coordinator",
  "message_superuser",

  // === NOTIFICATION SYSTEM ===
  "view_notifications",
  "send_notification",
  "delete_notification",

  // === ANALYTICS ===
  "view_analytics",
  "export_analytics",
  "view_dashboard_analytics",
  "view_user_analytics",
  "view_system_analytics",

  // === TIMETABLE MANAGEMENT ===
  "view_timetables",
  "add_timetable",
  "edit_timetable",
  "delete_timetable",
  "manage_timetable_conflicts",
  "export_timetable",
  "view_teacher_schedule",
  "assign_teacher_schedule",
  "manage_schedule_conflicts",

  // === CLINIC MANAGEMENT ===
  "view_clinic_records",
  "add_clinic_record",
  "edit_clinic_record",
  "delete_clinic_record",
  "export_clinic_records",
  "notify_clinic_visits",
  "view_clinic_analytics",

  // === RESOURCE MANAGEMENT ===
  "view_resources",
  "add_resource",
  "edit_resource",
  "delete_resource",
  "upload_resource",
  "download_resource",
  "export_resources",

  // === PHOTO MANAGEMENT ===
  "view_photos",
  "add_photo",
  "edit_photo",
  "delete_photo",
  "upload_photo",
  "download_photo",
  "organize_photos",

  // === MARKS MANAGEMENT ===
  "add_student_marks",
  "edit_student_marks",
  "view_student_marks",
  "export_student_marks",

  // === SETTINGS MANAGEMENT ===
  "view_settings",
  "edit_settings",
  "change_password",
  "update_profile",
  "view_user_preferences",
  "export_settings",

  // === ADVANCED SETTINGS ===
  "view_advanced_settings",
  "edit_advanced_settings",
  "system_backup",
  "system_restore",
  "system_maintenance",
  "view_system_logs",
  "system_configuration",
  "view_system_info",

  // === ADMIN PANEL ===
  "admin_panel"
] as const;

export type PrivilegeName = typeof ALL_PRIVILEGES[number];

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'TEACHER' | 'USER' | 'SUPERUSER' | 'PARENT' | 'NURSE' | 'SUPER_TEACHER' | 'SECRETARY' | 'ACCOUNTANT' | 'SPONSOR' | 'SPONSORSHIPS_OVERSEER' | 'SPONSORSHIP_COORDINATOR' | 'HR';
  status: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
  photo?: string;
  cv?: string;
  assignedStream?: string; // For teachers
  assignedStreams?: string[]; // For super teachers (multiple streams)
  assignedClasses?: TeacherAssignment[]; // For teachers with multiple assignments
  studentId?: string; // For parents
  studentIds?: string[]; // For parents with multiple children
  privileges?: UserPrivilege[]; // New field for granular, time-limited privileges
  password?: string;
  gender?: string; // Add gender property for teacher stats
  age?: number | string;
  residence?: string;
  lockedUntil?: Date; // Optional: scheduled lock expiry
  passwordAttempts?: number; // Number of failed password attempts
  lastPasswordAttempt?: Date; // Last failed password attempt
  accountLocked?: boolean; // Whether account is locked due to failed attempts
  lockReason?: string; // Reason for account lock
}

export interface TeacherAssignment {
  id: string;
  classId: string;
  streamId: string;
  className: string;
  streamName: string;
  subjects: string[];
  isMainTeacher: boolean;
}

export interface Student {
  id: string;
  name: string;
  nin?: string;
  lin?: string;
  accessNumber: string; // Format: AC001, BB001, CA001, DB001, etc.
  admissionId: string; // Unique admission ID for each student
  age: number;
  dateOfBirth?: string;
  gender: string; // Add gender property
  class: string;
  stream: string;
  // Day/Boarding selection for secondary schools in Uganda
  residenceType?: 'Day' | 'Boarding';
  phone?: string;
  phoneCountryCode?: string;
  email?: string;
  photo?: string;
  familyPhoto?: string;
  passportPhoto?: string; // Add this line for passport photo
  parent: Parent;
  academicRecords: AcademicRecord[];
  financialRecords: FinancialRecord[];
  attendanceRecords: AttendanceRecord[];
  totalFees: number;
  paidAmount: number;
  balance: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'active' | 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted'; // Student status for flagging
  flagComment?: string; // Optional comment for flagging reason
  conductNotes?: ConductNote[]; // School conduct notes
  // Student fields
  classCompletion?: string; // What class did the student end in if they went to school
  careerAspiration?: string; // What do they aspire to become (dropdown)
  // Personal Information Fields
  address?: string;
  hobbies?: string;
  dreams?: string;
  aspirations?: string;
  medicalCondition?: string;
  village?: string;
  medicalProblems?: string;
  individualFee?: number;
  secondParent?: Parent;
  // Parent Information Fields
  parentAge?: number;
  parentFamilySize?: number;
  parentRelationship?: string;
  // Admission tracking
  admittedBy?: 'admin' | 'overseer';
  // Sponsorship Information
  sponsorshipStatus?: 'none' | 'eligibility-check' | 'eligible' | 'available-for-sponsors' | 'under-sponsorship-review' | 'pending' | 'awaiting' | 'coordinator-approved' | 'sponsored' | 'rejected';
  needsSponsorship?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConductNote {
  id: string;
  date: Date;
  author: string;
  content: string;
  type: 'positive' | 'negative' | 'neutral' | 'achievement' | 'behavior';
}

export interface Parent {
  name: string;
  nin: string;
  ninType?: 'NIN' | 'LIN';
  phone: string;
  phoneCountryCode?: string;
  email: string;
  address: string;
  occupation: string;
}

export interface AcademicRecord {
  id: string;
  term: string;
  year: number;
  subjects: SubjectGrade[];
  totalMarks: number;
  percentage: number;
  grade: string;
  position: number;
  remarks: string;
  teacherComments: string;
  headTeacherComments: string;
  autoComments: 'excellent' | 'very-good' | 'good' | 'can-do-better' | 'more-effort';
}

export interface SubjectGrade {
  subject: string;
  marks: number;
  grade: string;
}

export interface FinancialRecord {
  id: string;
  studentId: string;
  type: 'fee' | 'payment';
  billingType: string;
  billingAmount: number;
  amount: number;
  description: string;
  date: Date;
  paymentDate?: Date;
  paymentTime?: string;
  paymentMethod?: 'mobile-money' | 'bank-transfer' | 'cash' | 'momo' | 'airtel-money' | 'visa' | 'mastercard';
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  receiptNumber?: string;
  balance: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date;
  time: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  teacherId: string;
  teacherName: string;
  remarks?: string;
  notificationSent: boolean;
}



export interface Class {
  id: string;
  name: string;
  streams: Stream[];
  subjects: string[];
  level: string;
}

export interface Stream {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  subjects: string[];
  studentCount?: number;
}

export interface MessageLegacy {
  id: string;
  from: string;
  to: string;
  fromRole: string;
  toRole: string;
  subject: string;
  content: string;
  date: Date;
  read: boolean;
  studentId?: string;
  type: 'general' | 'clinic' | 'attendance' | 'payment';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isPinned?: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  type: string;
  url: string; // data URL or remote URL
  size: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'attendance' | 'payment' | 'message' | 'clinic';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  studentId?: string;
}

export interface ClinicRecord {
  id: string;
  studentId: string;
  accessNumber: string;
  studentName: string;
  className: string;
  streamName: string;
  date: string; // Changed from visitDate: Date to date: string
  visitTime: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medication?: string;
  cost: number;
  nurseId: string;
  nurseName: string;
  followUpRequired: boolean;
  followUpDate?: string; // Changed from Date to string
  parentNotified: boolean;
  status: 'active' | 'resolved' | 'follow-up';
  notes?: string;
}

export interface ReportCard {
  studentId: string;
  term: string;
  year: number;
  studentName: string;
  className: string;
  stream: string;
  subjects: SubjectGrade[];
  totalMarks: number;
  percentage: number;
  grade: string;
  position: number;
  remarks: string;
  teacherComments: string;
  headTeacherComments: string;
  autoComments: string;
  generatedAt: Date;
}

export interface Settings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite?: string;
  schoolMotto?: string;
  schoolBadge?: string;
  // Additional school information
  schoolPOBox?: string;
  schoolDistrict?: string;
  schoolRegion?: string;
  schoolCountry?: string;
  schoolFounded?: string;
  schoolRegistrationNumber?: string;
  schoolLicenseNumber?: string;
  schoolTaxNumber?: string;
  // Printable, admin-editable documents
  bankDetailsHtml?: string;
  rulesRegulationsHtml?: string;
  principalName?: string;
  principalPhone?: string;
  principalEmail?: string;
  deputyPrincipalName?: string;
  deputyPrincipalPhone?: string;
  deputyPrincipalEmail?: string;
  currentTerm: string;
  currentYear: number;
  feesStructure: {
    [className: string]: number;
  };
  paymentMethods: string[];
  gradeSystem: {
    [grade: string]: { min: number; max: number; comment: string };
  };
  overdueSettings?: {
    gracePeriod: number;
    lateFeePercentage: number;
    notificationDays: string;
  };
}

export interface TimeTable {
  id: string;
  classId: string;
  streamId: string;
  className: string;
  streamName: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  duration: number; // in minutes
  room?: string;
}

export interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  assignedStreams: string[];
  weeklySchedule: TimeTable[];
  currentClass?: TimeTable;
  nextClass?: TimeTable;
}

export interface Analytics {
  totalStudents: number;
  totalRevenue: number;
  attendanceRate: number;
  paymentRate: number;
  classDistribution: { [className: string]: number };
  streamDistribution: { [streamName: string]: number };
  monthlyPayments: { month: string; amount: number }[];
  attendanceTrends: { date: string; present: number; absent: number }[];
}

export interface WeeklyReport {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  weekStart: Date;
  weekEnd: Date;
  reportType: 'user' | 'student' | 'class' | 'general';
  content: string;
  achievements?: string;
  challenges?: string;
  nextWeekGoals?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'deleted';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  comments?: string;
  attachments?: MessageAttachment[];
}

export interface BillingType {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'termly' | 'yearly' | 'one-time';
  description?: string;
  classId?: string;
  className?: string;
  year: string;
  term: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  billingTypeId: string;
  billingTypeName: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  classIds: string[];
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  title: string;
  content: string;
  messageType: 'general' | 'announcement' | 'personal' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  attachments?: MessageAttachment[];
}

export interface Sponsorship {
  id: string;
  studentId: number;
  studentName: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  sponsorPhone: string;
  sponsorCountry: string;
  sponsorCity: string;
  sponsorRelationship: 'individual' | 'organization' | 'family';
  amount: number;
  duration: number;
  sponsorshipStartDate: string;
  description: string;
  paymentSchedule: 'monthly' | 'quarterly' | 'yearly';
  preferredContactMethod: 'email' | 'phone' | 'both';
  status: 'pending' | 'pending-admin-approval' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  relationship: 'individual' | 'organization' | 'family';
  totalSponsored: number;
  activeSponsorships: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserPrivilege {
  id: string;
  userId: string;
  privilege: string;
  assignedAt: Date;
  expiresAt?: Date;
  assignedBy: string;
  isActive: boolean;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  lastChecked: Date;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}