const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateWeeklyReports() {
  try {
    console.log('🚀 Activating weekly reports for all users...');

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log(`📊 Found ${users.length} active users`);

    // Create a sample weekly report for each user to demonstrate the system
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    let createdReports = 0;

    for (const user of users) {
      // Check if user already has a report for this week
      const existingReport = await prisma.weeklyReport.findFirst({
        where: {
          userId: user.id.toString(),
          weekStart: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      });

      if (!existingReport) {
        // Create a sample weekly report
        const sampleReport = {
          userId: user.id.toString(),
          userName: user.name,
          userRole: user.role,
          weekStart: weekStart,
          weekEnd: weekEnd,
          reportType: user.role === 'ADMIN' || user.role === 'SUPERUSER' ? 'admin' : 'user',
          content: `Sample weekly report for ${user.name}. This is an automatically generated report to demonstrate the weekly reporting system.`,
          achievements: JSON.stringify([
            'Completed assigned tasks',
            'Attended all scheduled meetings',
            'Maintained good communication with team'
          ]),
          challenges: JSON.stringify([
            'Balancing multiple responsibilities',
            'Meeting tight deadlines'
          ]),
          nextWeekGoals: JSON.stringify([
            'Improve time management',
            'Complete pending projects',
            'Enhance collaboration with team members'
          ]),
          status: 'submitted',
          submittedAt: new Date()
        };

        await prisma.weeklyReport.create({
          data: sampleReport
        });

        createdReports++;
        console.log(`✅ Created sample report for ${user.name} (${user.role})`);
      } else {
        console.log(`⏭️  Skipped ${user.name} - already has a report for this week`);
      }
    }

    console.log(`\n🎉 Weekly reports activation completed!`);
    console.log(`📈 Created ${createdReports} new sample reports`);
    console.log(`👥 Total users in system: ${users.length}`);
    console.log(`📅 Week range: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);

    // Create notifications for admins about the weekly reporting system
    const admins = users.filter(user => user.role === 'ADMIN' || user.role === 'SUPERUSER');
    
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Weekly Reports System Activated',
          message: `The weekly reporting system has been activated for all users. ${createdReports} sample reports have been created to demonstrate the system.`,
          type: 'SYSTEM',
          read: false
        }
      });
    }

    console.log(`🔔 Created notifications for ${admins.length} admin users`);

  } catch (error) {
    console.error('❌ Error activating weekly reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the activation
activateWeeklyReports(); 