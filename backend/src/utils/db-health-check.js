const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function healthCheck() {
  try {
    console.log('🏥 Starting Database Health Check...\n');
    
    // Check all tables exist and have proper counts
    const tables = [
      { name: 'User', model: prisma.user },
      { name: 'Student', model: prisma.student },
      { name: 'Settings', model: prisma.settings },
      { name: 'BillingType', model: prisma.billingType },
      { name: 'FeeStructure', model: prisma.feeStructure },
      { name: 'Teacher', model: prisma.teacher },
      { name: 'Class', model: prisma.class },
      { name: 'Attendance', model: prisma.attendance },
      { name: 'Payment', model: prisma.payment },
      { name: 'FinancialRecord', model: prisma.financialRecord },
      { name: 'Message', model: prisma.message },
      { name: 'Notification', model: prisma.notification },
      { name: 'Resource', model: prisma.resource },
      { name: 'Sponsorship', model: prisma.sponsorship },
      { name: 'WeeklyReport', model: prisma.weeklyReport },
      { name: 'ClinicRecord', model: prisma.clinicRecord },
      { name: 'TimeTable', model: prisma.timeTable },
      { name: 'DroppedAccessNumber', model: prisma.droppedAccessNumber },
      { name: 'AcademicRecord', model: prisma.academicRecord },
      { name: 'StudentPhoto', model: prisma.studentPhoto },
      { name: 'ConductNote', model: prisma.conductNote },
      { name: 'ResourceFile', model: prisma.resourceFile },
      { name: 'StudentDocument', model: prisma.studentDocument },
      { name: 'TeacherResource', model: prisma.teacherResource },
      { name: 'InteractionAnalytics', model: prisma.interactionAnalytics },
      { name: 'UserPrivilege', model: prisma.userPrivilege }
    ];
    
    let allHealthy = true;
    
    for (const table of tables) {
      try {
        const count = await table.model.count();
        const status = count >= 0 ? '✅' : '❌';
        console.log(`${status} ${table.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${table.name}: Error - ${error.message}`);
        allHealthy = false;
      }
    }
    
    console.log('\n📊 Database Connection Test:');
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database connection: OK');
    } catch (error) {
      console.log('❌ Database connection: FAILED');
      console.log('Error:', error.message);
      allHealthy = false;
    }
    
    console.log('\n🔍 Settings Persistence Test:');
    try {
      const settings = await prisma.settings.findFirst();
      if (settings) {
        console.log('✅ Settings table: Has data');
        console.log(`   - Current Year: ${settings.currentYear}`);
        console.log(`   - Current Term: ${settings.currentTerm}`);
        if (settings.securitySettings) {
          try {
            const parsed = JSON.parse(settings.securitySettings);
            console.log(`   - School Name: ${parsed.schoolName || 'Not set'}`);
            console.log(`   - School Email: ${parsed.schoolEmail || 'Not set'}`);
          } catch (parseError) {
            console.log('   - ⚠️ Settings JSON parsing: Failed');
          }
        }
      } else {
        console.log('❌ Settings table: Empty (this could cause settings to disappear)');
        allHealthy = false;
      }
    } catch (error) {
      console.log('❌ Settings table: Error accessing');
      allHealthy = false;
    }
    
    console.log('\n🎯 Summary:');
    if (allHealthy) {
      console.log('✅ Database is healthy and ready for production!');
    } else {
      console.log('❌ Database has issues that need attention.');
    }
    
    return allHealthy;
    
  } catch (error) {
    console.error('💥 Critical database error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  healthCheck().catch(console.error);
}

module.exports = { healthCheck };
