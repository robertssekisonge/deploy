import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Temporary fix - using direct import
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import '../src/scripts/ensureStaffTables';
import './services/duplicateMonitoring'; // Start duplicate monitoring service
import '../src/scripts/ensureSettingsTable';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const SUPER_ADMIN_EMAIL = 'systemsreset@school.com';
const SUPER_ADMIN_NAME = 'System Super Admin';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
} else {
  console.log(`📁 Using existing uploads directory: ${uploadsDir}`);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for photo uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// List available photos (for debugging)
app.get('/api/photos/list', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ photos: [], message: 'Uploads directory does not exist' });
    }
    
    const files = fs.readdirSync(uploadsDir);
    const photos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    res.json({ 
      photos, 
      count: photos.length,
      uploadsDir: uploadsDir.replace(__dirname, ''),
      message: 'Available photos listed successfully'
    });
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

// Serve profile and family photos
app.get('/photos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const photoPath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(photoPath)) {
      console.log(`Photo not found: ${filename}`);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Determine MIME type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Set headers for better performance and caching
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    
    // Log successful photo serving
    console.log(`Serving photo: ${filename} (${mimeType})`);
    
    res.sendFile(photoPath);
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    database: 'checking...'
  });
});

// Simple health check without database
app.get('/api/health/simple', (req, res) => {
  res.json({ 
    message: 'Server is running (simple check)!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Photo system health check
app.get('/api/photos/health', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const uploadsExists = fs.existsSync(uploadsDir);
    const uploadsWritable = uploadsExists ? fs.accessSync(uploadsDir, fs.constants.W_OK) === undefined : false;
    
    // Count photos
    let photoCount = 0;
    if (uploadsExists) {
      try {
        const files = fs.readdirSync(uploadsDir);
        photoCount = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        }).length;
      } catch (readError) {
        console.error('Error reading uploads directory:', readError);
      }
    }
    
    res.json({ 
      message: 'Photo system health check',
      timestamp: new Date().toISOString(),
      uploadsDirectory: {
        exists: uploadsExists,
        writable: uploadsWritable,
        path: uploadsDir.replace(__dirname, ''),
        photoCount
      },
      photoEndpoints: {
        profile: '/api/photos/profile/:userId',
        family: '/api/photos/family/:studentId',
        passport: '/api/photos/passport/:studentId',
        studentProfile: '/api/photos/student-profile/:studentId',
        student: '/api/photos/student/:studentId',
        moveTemp: '/api/photos/move-temp/:studentId',
        list: '/api/photos/list',
        serve: '/photos/:filename'
      }
    });
  } catch (error) {
    console.error('Error in photo health check:', error);
    res.status(500).json({ error: 'Photo system health check failed', details: error });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error });
  }
});

// Manual Super Admin privilege assignment endpoint
app.post('/api/admin/assign-super-admin-privileges', async (req, res) => {
  try {
    const superAdmin = await prisma.user.findUnique({ 
      where: { email: SUPER_ADMIN_EMAIL } 
    });
    
    if (!superAdmin) {
      return res.status(404).json({ error: 'Super Admin not found' });
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

    // Clear existing privileges first
    await prisma.userPrivilege.deleteMany({
      where: { userId: superAdmin.id }
    });

    // Assign all privileges
    for (const priv of allPrivileges) {
      await prisma.userPrivilege.create({ 
        data: { 
          userId: superAdmin.id, 
          privilege: priv 
        } 
      });
    }

    const assignedPrivs = await prisma.userPrivilege.findMany({
      where: { userId: superAdmin.id }
    });

    res.json({
      success: true,
      message: `Assigned ${assignedPrivs.length} privileges to Super Admin`,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role
      },
      privilegesCount: assignedPrivs.length
    });
  } catch (error) {
    console.error('Error assigning Super Admin privileges:', error);
    res.status(500).json({ error: 'Failed to assign privileges', details: error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`🎓 Students API: http://localhost:${PORT}/api/students`);
  console.log(`👨‍🏫 Teachers API: http://localhost:${PORT}/api/teachers`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  console.log(`📸 Photo serving: http://localhost:${PORT}/photos/{filename}`);
  console.log(`📤 Photo uploads: http://localhost:${PORT}/api/photos/*`);
  console.log(`📸 Photo system health: http://localhost:${PORT}/api/photos/health`);
  console.log(`📸 Available photos: http://localhost:${PORT}/api/photos/list`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
}); 

// Ensure permanent Super Admin exists with full privileges on startup
(async function ensurePermanentSuperAdmin() {
  try {
    console.log('🔧 Starting Super Admin setup...');
    
    const passwordPlain = 'passwordissafe2025';
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    // Upsert super admin user
    const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
    let superAdmin = existing;
    
    if (existing) {
      console.log(`👤 Found existing Super Admin: ${existing.name}`);
      superAdmin = await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: {
          name: SUPER_ADMIN_NAME,
          role: 'ADMIN',
          status: 'ACTIVE',
          accountLocked: false,
          lockReason: null,
          passwordAttempts: 0,
          lastPasswordAttempt: null,
          // Keep firstTimeLogin true to force password change until the user changes it
          firstTimeLogin: true,
          password: passwordHash
        }
      });
      console.log(`✅ Updated Super Admin: ${superAdmin.name}`);
    } else {
      console.log('👤 Creating new Super Admin...');
      superAdmin = await prisma.user.create({
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
      console.log(`✅ Created Super Admin: ${superAdmin.name}`);
    }

    // Comprehensive privilege union (admin + others) incl. admin_panel
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

    console.log(`🔑 Assigning ${allPrivileges.length} privileges to Super Admin...`);

    // Clear existing privileges first to ensure clean state
    await prisma.userPrivilege.deleteMany({
      where: { userId: superAdmin.id }
    });
    console.log('🗑️ Cleared existing privileges');

    // Assign all privileges to Super Admin
    for (const priv of allPrivileges) {
      await prisma.userPrivilege.create({ 
        data: { 
          userId: superAdmin.id, 
          privilege: priv 
        } 
      });
    }

    // Verify privileges were assigned
    const assignedPrivs = await prisma.userPrivilege.findMany({
      where: { userId: superAdmin.id }
    });

    console.log(`✅ Super Admin setup complete!`);
    console.log(`👤 User: ${superAdmin.name} (${superAdmin.email})`);
    console.log(`🔑 Assigned ${assignedPrivs.length} privileges`);
    console.log(`🔐 Password: ${passwordPlain} (must be changed on first login)`);

    // Initialize settings if none exist
    console.log('🔧 Checking settings initialization...');
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
      console.log('📋 No settings found, initializing default settings...');
      const defaultSettings = {
        id: 1,
        currentYear: '2025',
        currentTerm: 'Term 1',
        securitySettings: JSON.stringify({
          schoolName: 'St. Mary\'s Secondary School',
          schoolAddress: 'P.O. Box 1234, Kampala, Uganda',
          schoolPhone: '+256 700 123 456',
          schoolEmail: 'info@stmarys.ac.ug',
          schoolMotto: 'Excellence Through Knowledge',
          mottoSize: 14,
          mottoColor: '#475569',
          nextTermBegins: '2025-02-01'

        })
      };
      
      await prisma.settings.create({ data: defaultSettings });
      console.log('✅ Default settings initialized successfully');
    } else {
      console.log('✅ Settings already exist, no initialization needed');
    }
    console.log(`🛡️ Role: ${superAdmin.role}, Status: ${superAdmin.status}`);
    
  } catch (e: any) {
    console.error('❌ Failed to ensure Super Admin:', e);
    if (e.stack) {
      console.error('Stack trace:', e.stack);
    }
  }
})();