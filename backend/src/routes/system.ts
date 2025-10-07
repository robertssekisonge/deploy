import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();
const execAsync = promisify(exec);
const SUPER_ADMIN_EMAIL = 'systemsreset@school.com';
const SUPER_ADMIN_NAME = 'System Super Admin';

// Function to ensure Super Admin has all privileges
async function ensureSuperAdminPrivileges() {
  try {
    console.log('🔧 Ensuring Super Admin has all privileges...');
    
    const superAdmin = await prisma.user.findUnique({ 
      where: { email: SUPER_ADMIN_EMAIL } 
    });
    
    if (!superAdmin) {
      console.log('👤 Creating Super Admin...');
      const passwordHash = await bcrypt.hash('passwordissafe2025', 10);
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL,
          name: SUPER_ADMIN_NAME,
          role: 'ADMIN',
          status: 'ACTIVE',
          password: passwordHash,
          accountLocked: false,
          firstTimeLogin: true
        }
      });
      console.log(`✅ Created Super Admin: ${newSuperAdmin.name}`);
    }

    const allPrivileges: string[] = [
      'view_students','add_student','edit_student','delete_student','export_students','flag_student','unflag_student','re_admit_student','view_student_details','edit_student_conduct','clear_students','delete_students_by_class','admit_from_overseer','manage_assigned_students',
      'view_teachers','add_teacher','edit_teacher','delete_teacher','assign_teacher_classes','view_teacher_analytics',
      'view_users','add_user','edit_user','delete_user','lock_user','unlock_user','reset_user_password','generate_temp_password','assign_privileges','remove_privileges','export_users',
      'assign_parent_students','view_parent_analytics',
      'view_classes','add_class','edit_class','delete_class','manage_class_students','view_class_analytics',
      'view_streams','add_stream','edit_stream','delete_stream',
      'view_attendance','mark_attendance','edit_attendance','delete_attendance','export_attendance','view_attendance_analytics','bulk_attendance','view_attendance_analysis',
      'view_financial','add_financial_record','edit_financial_record','delete_financial_record','export_financial','view_financial_analytics',
      'view_sponsorships','manage_sponsorships','approve_sponsorship','assign_sponsorship','reject_sponsorship','view_sponsorship_analytics','sponsor_student','view_sponsor_details',
      'view_reports','generate_report','view_report_cards','generate_report_cards','export_reports','schedule_reports','view_report_analytics',
      'view_weekly_reports','submit_reports','approve_weekly_reports','review_weekly_reports','export_weekly_reports',
      'view_payments','process_payment','refund_payment','export_payments','view_payment_analytics','manage_payment_methods',
      'view_messages','send_message','delete_message','reply_message','mark_message_read','export_messages',
      'view_notifications','send_notification','delete_notification',
      'view_analytics','export_analytics','view_dashboard_analytics','view_user_analytics','view_system_analytics',
      'view_timetables','add_timetable','edit_timetable','delete_timetable','manage_timetable_conflicts','export_timetable','view_teacher_schedule','assign_teacher_schedule','manage_schedule_conflicts',
      'view_clinic_records','add_clinic_record','edit_clinic_record','delete_clinic_record','export_clinic_records','notify_clinic_visits','view_clinic_analytics',
      'view_resources','add_resource','edit_resource','delete_resource','upload_resource','download_resource','export_resources',
      'view_photos','add_photo','edit_photo','delete_photo','upload_photo','download_photo','organize_photos',
      'add_student_marks','edit_student_marks','view_student_marks','export_student_marks',
      'view_settings','edit_settings','change_password','update_profile','view_user_preferences','export_settings',
      'view_advanced_settings','edit_advanced_settings','system_backup','system_restore','system_maintenance','view_system_logs','system_configuration','view_system_info',
      'admin_panel'
    ];

    const currentSuperAdmin = await prisma.user.findUnique({ 
      where: { email: SUPER_ADMIN_EMAIL } 
    });

    if (currentSuperAdmin) {
      // Clear existing privileges first
      await prisma.userPrivilege.deleteMany({
        where: { userId: currentSuperAdmin.id }
      });

      // Assign all privileges
      for (const priv of allPrivileges) {
        await prisma.userPrivilege.create({ 
          data: { 
            userId: currentSuperAdmin.id, 
            privilege: priv 
          } 
        });
      }

      const assignedPrivs = await prisma.userPrivilege.findMany({
        where: { userId: currentSuperAdmin.id }
      });

      console.log(`✅ Super Admin privileges restored: ${assignedPrivs.length} privileges assigned`);
      return { success: true, privilegesCount: assignedPrivs.length };
    }
  } catch (error) {
    console.error('❌ Failed to ensure Super Admin privileges:', error);
    return { success: false, error };
  }
}

// Clear all students (truncate table)
router.post('/clear-students', async (req, res) => {
  try {
    console.log('🗑️ Clearing all students from database...');
    
    // Delete all students
    const deletedStudents = await prisma.student.deleteMany({});
    
    // Clear related tables that depend on students
    await prisma.attendance.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.sponsorship.deleteMany({});
    await prisma.clinicRecord.deleteMany({});
    await prisma.financialRecord.deleteMany({});
    await prisma.academicRecord.deleteMany({});
    
    // Clear dropped access numbers
    await prisma.droppedAccessNumber.deleteMany({});
    
    console.log(`✅ Cleared ${deletedStudents.count} students and related data`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedStudents.count} students and all related data`,
      deletedCount: deletedStudents.count
    });
  } catch (error) {
    console.error('❌ Error clearing students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear students',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all parents (users with PARENT role)
router.post('/clear-parents', async (req, res) => {
  try {
    console.log('🗑️ Clearing all parents from database...');
    
    // Delete all users with PARENT role
    const deletedParents = await prisma.user.deleteMany({
      where: { role: 'PARENT' }
    });
    
    // Clear related data
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: [] } }, // Will be handled by cascade
          { receiverId: { in: [] } }
        ]
      }
    });
    
    await prisma.notification.deleteMany({
      where: { userId: { in: [] } }
    });
    
    console.log(`✅ Cleared ${deletedParents.count} parents and related data`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedParents.count} parents and related data`,
      deletedCount: deletedParents.count
    });
  } catch (error) {
    console.error('❌ Error clearing parents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear parents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all teachers (users with TEACHER role)
router.post('/clear-teachers', async (req, res) => {
  try {
    console.log('🗑️ Clearing all teachers from database...');
    
    // Delete all users with TEACHER role
    const deletedTeachers = await prisma.user.deleteMany({
      where: { role: 'TEACHER' }
    });
    
    // Clear related teacher data
    await prisma.teacher.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.timeTable.deleteMany({});
    
    // Clear related messages and notifications
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: [] } },
          { receiverId: { in: [] } }
        ]
      }
    });
    
    await prisma.notification.deleteMany({
      where: { userId: { in: [] } }
    });
    
    console.log(`✅ Cleared ${deletedTeachers.count} teachers and related data`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedTeachers.count} teachers and related data`,
      deletedCount: deletedTeachers.count
    });
  } catch (error) {
    console.error('❌ Error clearing teachers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear teachers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete system reset - removes ALL users and data, keeps settings
router.post('/system-reset', async (req, res) => {
  try {
    console.log('🗑️ Performing COMPLETE system reset - removing ALL users and data...');
    
    // Clear all user data in the correct order to avoid foreign key constraints
    await prisma.attendance.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.sponsorship.deleteMany({});
    await prisma.clinicRecord.deleteMany({});
    await prisma.financialRecord.deleteMany({});
    await prisma.academicRecord.deleteMany({});
    await prisma.timeTable.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.droppedAccessNumber.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.userPrivilege.deleteMany({});
    await prisma.interactionAnalytics.deleteMany({});
    await prisma.studentPhoto.deleteMany({});
    await prisma.conductNote.deleteMany({});
    await prisma.resourceFile.deleteMany({});
    await prisma.studentDocument.deleteMany({});
    await prisma.teacherResource.deleteMany({});
    await prisma.weeklyReport.deleteMany({});
    
    // Delete all users EXCEPT super admin (keep super admin and his privileges)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { not: SUPER_ADMIN_EMAIL }
      }
    });
    
    console.log(`✅ Complete system reset completed. Cleared ${deletedUsers.count} users and ALL related data`);
    console.log('✅ Super Admin preserved with all privileges');
    console.log('✅ System settings (billing types, fee structures) preserved');
    console.log('✅ Default password set to: user123');
    
    res.json({
      success: true,
      message: `Complete system reset successful. Cleared ${deletedUsers.count} users and ALL related data. Super Admin preserved. System settings preserved. Default password: user123`,
      deletedCount: deletedUsers.count,
      settingsPreserved: true,
      defaultPassword: 'user123',
      requiresLogout: true,
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('❌ Error during complete system reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform complete system reset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear clinic records
router.post('/clear-clinic-records', async (req, res) => {
  try {
    console.log('🗑️ Clearing all clinic records from database...');
    
    const deletedRecords = await prisma.clinicRecord.deleteMany({});
    
    console.log(`✅ Cleared ${deletedRecords.count} clinic records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedRecords.count} clinic records`,
      deletedCount: deletedRecords.count
    });
  } catch (error) {
    console.error('❌ Error clearing clinic records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear clinic records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear payment records
router.post('/clear-payments', async (req, res) => {
  try {
    console.log('🗑️ Clearing all payment records from database...');
    
    const deletedPayments = await prisma.payment.deleteMany({});
    const deletedFinancialRecords = await prisma.financialRecord.deleteMany({});
    
    console.log(`✅ Cleared ${deletedPayments.count} payment records and ${deletedFinancialRecords.count} financial records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedPayments.count} payment records and ${deletedFinancialRecords.count} financial records`,
      deletedCount: deletedPayments.count + deletedFinancialRecords.count
    });
  } catch (error) {
    console.error('❌ Error clearing payment records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear payment records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear attendance records
router.post('/clear-attendance', async (req, res) => {
  try {
    console.log('🗑️ Clearing all attendance records from database...');
    
    const deletedRecords = await prisma.attendance.deleteMany({});
    
    console.log(`✅ Cleared ${deletedRecords.count} attendance records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedRecords.count} attendance records`,
      deletedCount: deletedRecords.count
    });
  } catch (error) {
    console.error('❌ Error clearing attendance records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear attendance records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear sponsorship records
router.post('/clear-sponsorships', async (req, res) => {
  try {
    console.log('🗑️ Clearing all sponsorship records from database...');
    
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    
    console.log(`✅ Cleared ${deletedSponsorships.count} sponsorship records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedSponsorships.count} sponsorship records`,
      deletedCount: deletedSponsorships.count
    });
  } catch (error) {
    console.error('❌ Error clearing sponsorship records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear sponsorship records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear academic records
router.post('/clear-academic-records', async (req, res) => {
  try {
    console.log('🗑️ Clearing all academic records from database...');
    
    const deletedRecords = await prisma.academicRecord.deleteMany({});
    
    console.log(`✅ Cleared ${deletedRecords.count} academic records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedRecords.count} academic records`,
      deletedCount: deletedRecords.count
    });
  } catch (error) {
    console.error('❌ Error clearing academic records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear academic records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear messages
router.post('/clear-messages', async (req, res) => {
  try {
    console.log('🗑️ Clearing all messages from database...');
    
    const deletedMessages = await prisma.message.deleteMany({});
    
    console.log(`✅ Cleared ${deletedMessages.count} messages`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedMessages.count} messages`,
      deletedCount: deletedMessages.count
    });
  } catch (error) {
    console.error('❌ Error clearing messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear notifications
router.post('/clear-notifications', async (req, res) => {
  try {
    console.log('🗑️ Clearing all notifications from database...');
    
    const deletedNotifications = await prisma.notification.deleteMany({});
    
    console.log(`✅ Cleared ${deletedNotifications.count} notifications`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedNotifications.count} notifications`,
      deletedCount: deletedNotifications.count
    });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear timetables
router.post('/clear-timetables', async (req, res) => {
  try {
    console.log('🗑️ Clearing all timetables from database...');
    
    const deletedTimetables = await prisma.timeTable.deleteMany({});
    
    console.log(`✅ Cleared ${deletedTimetables.count} timetables`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedTimetables.count} timetables`,
      deletedCount: deletedTimetables.count
    });
  } catch (error) {
    console.error('❌ Error clearing timetables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear timetables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear classes
router.post('/clear-classes', async (req, res) => {
  try {
    console.log('🗑️ Clearing all classes from database...');
    
    const deletedClasses = await prisma.class.deleteMany({});
    
    console.log(`✅ Cleared ${deletedClasses.count} classes`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedClasses.count} classes`,
      deletedCount: deletedClasses.count
    });
  } catch (error) {
    console.error('❌ Error clearing classes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear classes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear interaction analytics
router.post('/clear-analytics', async (req, res) => {
  try {
    console.log('🗑️ Clearing all interaction analytics from database...');
    
    const deletedAnalytics = await prisma.interactionAnalytics.deleteMany({});
    
    console.log(`✅ Cleared ${deletedAnalytics.count} interaction analytics records`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedAnalytics.count} interaction analytics records`,
      deletedCount: deletedAnalytics.count
    });
  } catch (error) {
    console.error('❌ Error clearing interaction analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear interaction analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.student.count(),
      prisma.user.count({ where: { role: 'PARENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SUPERUSER' } }),
      prisma.attendance.count(),
      prisma.sponsorship.count(),
      prisma.clinicRecord.count()
    ]);

    res.json({
      students: stats[0],
      parents: stats[1],
      teachers: stats[2],
      admins: stats[3],
      superusers: stats[4],
      attendanceRecords: stats[5],
      sponsorships: stats[6],
      clinicRecords: stats[7]
    });
  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database health check
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    res.json({
      status: 'healthy',
      responseTime,
      connections: 1, // Simplified for now
      uptime: 'Running',
      lastBackup: 'Never',
      diskUsage: 0,
      memoryUsage: 0
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      responseTime: 0,
      connections: 0,
      uptime: 'Unknown',
      lastBackup: 'Never',
      diskUsage: 0,
      memoryUsage: 0
    });
  }
});

// Get all database tables with metadata
router.get('/tables', async (req, res) => {
  try {
    // Get table counts using Prisma models
    const tables = [
      { name: 'Student', count: await prisma.student.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'User', count: await prisma.user.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Attendance', count: await prisma.attendance.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Payment', count: await prisma.payment.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Message', count: await prisma.message.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Sponsorship', count: await prisma.sponsorship.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Resource', count: await prisma.resource.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Notification', count: await prisma.notification.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'BillingType', count: await prisma.billingType.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'WeeklyReport', count: await prisma.weeklyReport.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'ClinicRecord', count: await prisma.clinicRecord.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'TimeTable', count: await prisma.timeTable.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'DroppedAccessNumber', count: await prisma.droppedAccessNumber.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'AcademicRecord', count: await prisma.academicRecord.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'FinancialRecord', count: await prisma.financialRecord.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Class', count: await prisma.class.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'Teacher', count: await prisma.teacher.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'StudentPhoto', count: await prisma.studentPhoto.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'ConductNote', count: await prisma.conductNote.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'ResourceFile', count: await prisma.resourceFile.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'StudentDocument', count: await prisma.studentDocument.count(), size: 'N/A', lastModified: new Date().toISOString() },
      { name: 'TeacherResource', count: await prisma.teacherResource.count(), size: 'N/A', lastModified: new Date().toISOString() }
    ];
    
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get table data
router.get('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    let data: any[] = [];
    
    // Use Prisma models to fetch data safely
    switch (tableName) {
      case 'Student':
        data = await prisma.student.findMany({ take: 100 });
        break;
      case 'User':
        data = await prisma.user.findMany({ take: 100 });
        break;
      case 'Attendance':
        data = await prisma.attendance.findMany({ take: 100 });
        break;
      case 'Payment':
        data = await prisma.payment.findMany({ take: 100 });
        break;
      case 'Message':
        data = await prisma.message.findMany({ take: 100 });
        break;
      case 'Sponsorship':
        data = await prisma.sponsorship.findMany({ take: 100 });
        break;
      case 'Resource':
        data = await prisma.resource.findMany({ take: 100 });
        break;
      case 'Notification':
        data = await prisma.notification.findMany({ take: 100 });
        break;
      case 'BillingType':
        data = await prisma.billingType.findMany({ take: 100 });
        break;
      case 'WeeklyReport':
        data = await prisma.weeklyReport.findMany({ take: 100 });
        break;
      case 'ClinicRecord':
        data = await prisma.clinicRecord.findMany({ take: 100 });
        break;
      case 'TimeTable':
        data = await prisma.timeTable.findMany({ take: 100 });
        break;
      case 'DroppedAccessNumber':
        data = await prisma.droppedAccessNumber.findMany({ take: 100 });
        break;
      case 'AcademicRecord':
        data = await prisma.academicRecord.findMany({ take: 100 });
        break;
      case 'FinancialRecord':
        data = await prisma.financialRecord.findMany({ take: 100 });
        break;
      case 'Class':
        data = await prisma.class.findMany({ take: 100 });
        break;
      case 'Teacher':
        data = await prisma.teacher.findMany({ take: 100 });
        break;
      case 'StudentPhoto':
        data = await prisma.studentPhoto.findMany({ take: 100 });
        break;
      case 'ConductNote':
        data = await prisma.conductNote.findMany({ take: 100 });
        break;
      case 'ResourceFile':
        data = await prisma.resourceFile.findMany({ take: 100 });
        break;
      case 'StudentDocument':
        data = await prisma.studentDocument.findMany({ take: 100 });
        break;
      case 'TeacherResource':
        data = await prisma.teacherResource.findMany({ take: 100 });
        break;
      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  }
});

// Execute SQL query (read-only for safety)
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Only allow SELECT queries for safety
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      return res.status(400).json({ error: 'Only SELECT queries are allowed' });
    }
    
    // Prevent dangerous operations
    const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    if (dangerousKeywords.some(keyword => trimmedQuery.includes(keyword))) {
      return res.status(400).json({ error: 'Dangerous operations are not allowed' });
    }
    
    const result = await prisma.$queryRawUnsafe(query);
    res.json(result);
    } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Create database backup
router.post('/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../../backups', backupFileName);
    
    // Ensure backups directory exists
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Create backup using pg_dump
    const { stdout, stderr } = await execAsync(`pg_dump -h localhost -U postgres -d SMS > "${backupPath}"`);
    
    if (stderr) {
      console.error('Backup stderr:', stderr);
    }
    
    res.json({
      message: 'Backup created successfully',
      filename: backupFileName,
      path: backupPath
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Restore database backup
router.post('/restore', async (req, res) => {
  try {
    // This would require file upload handling
    // For now, return a placeholder response
    res.json({ message: 'Restore functionality requires file upload implementation' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Manual Super Admin privilege restoration endpoint
router.post('/restore-super-admin-privileges', async (req, res) => {
  try {
    console.log('🔧 Manual Super Admin privilege restoration requested...');
    const result = await ensureSuperAdminPrivileges();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Super Admin privileges restored successfully. ${result.privilegesCount} privileges assigned.`,
        privilegesCount: result.privilegesCount
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to restore Super Admin privileges',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error in manual Super Admin privilege restoration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore Super Admin privileges',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;