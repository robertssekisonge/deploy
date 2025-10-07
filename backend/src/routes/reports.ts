import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all weekly reports grouped by month/date for admin view
router.get('/weekly/admin', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      orderBy: { submittedAt: 'desc' }
    });

    // Group reports by month and week
    const groupedReports = reports.reduce((acc, report) => {
      const date = new Date(report.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const weekKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }
      if (!acc[monthKey][weekKey]) {
        acc[monthKey][weekKey] = [];
      }
      acc[monthKey][weekKey].push(report);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

    // Transform to array format for easier frontend consumption
    const result = Object.entries(groupedReports).map(([month, weeks]) => ({
      month,
      monthName: new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      weeks: Object.entries(weeks).map(([week, reports]) => ({
        week,
        weekStart: new Date(week),
        weekEnd: new Date(new Date(week).getTime() + 6 * 24 * 60 * 60 * 1000),
        reports,
        reportCount: reports.length,
        users: Array.from(new Set(reports.map(r => r.userName)))
      })).sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
    })).sort((a, b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime());

    res.json(result);
  } catch (error) {
    console.error('Error fetching weekly reports for admin:', error);
    res.status(500).json({ error: 'Failed to fetch weekly reports' });
  }
});

// Get all weekly reports
router.get('/weekly', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      orderBy: { submittedAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    res.status(500).json({ error: 'Failed to fetch weekly reports' });
  }
});

// Get weekly reports by user
router.get('/weekly/user/:userId', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      where: { userId: req.params.userId },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user weekly reports:', error);
    res.status(500).json({ error: 'Failed to fetch user weekly reports' });
  }
});

// Get weekly reports by week (for admin view)
router.get('/weekly/week/:weekStart', async (req, res) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const reports = await prisma.weeklyReport.findMany({
      where: {
        submittedAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching weekly reports by week:', error);
    res.status(500).json({ error: 'Failed to fetch weekly reports by week' });
  }
});

// Create new weekly report
router.post('/weekly', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userRole,
      weekStart,
      weekEnd,
      reportType,
      content,
      achievements,
      challenges,
      nextWeekGoals,
      attachments,
      status
    } = req.body;

    console.log('Received report data:', req.body);

    // Validate required fields
    if (!userId || !userName || !content) {
      return res.status(400).json({ error: 'User ID, name, and content are required' });
    }

    const reportData = {
      userId: String(userId), // Ensure userId is a string
      userName: String(userName),
      userRole: String(userRole || 'user'),
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      reportType: String(reportType || 'user'),
      content: String(content),
      achievements: Array.isArray(achievements) ? JSON.stringify(achievements) : null,
      challenges: Array.isArray(challenges) ? JSON.stringify(challenges) : null,
      nextWeekGoals: Array.isArray(nextWeekGoals) ? JSON.stringify(nextWeekGoals) : null,
      attachments: Array.isArray(attachments) ? JSON.stringify(attachments) : null,
      status: String(status || 'submitted'),
      submittedAt: new Date()
    };

    console.log('Processed report data:', reportData);

    const report = await prisma.weeklyReport.create({
      data: reportData
    });

    console.log('Report created successfully:', report);

    // Create notification for admins about new weekly report
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['admin', 'superuser', 'ADMIN', 'SUPERUSER']
          }
        }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Weekly Report Submitted',
            message: `${userName} (${userRole}) has submitted a weekly report for ${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}`,
            type: 'WEEKLY_REPORT',
            read: false
          }
        });
      }
    } catch (notificationError) {
      console.error('Error creating admin notifications:', notificationError);
      // Don't fail the report creation if notifications fail
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating weekly report:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error'
    });
    res.status(500).json({ 
      error: 'Failed to create weekly report', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete weekly report
router.delete('/weekly/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    // Check if report exists
    const existingReport = await prisma.weeklyReport.findUnique({
      where: { id: reportId }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    // Delete the report
    await prisma.weeklyReport.delete({
      where: { id: reportId }
    });

    console.log(`Weekly report with ID ${reportId} deleted successfully`);
    res.status(200).json({ message: 'Weekly report deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting weekly report:', error);
    res.status(500).json({ error: 'Failed to delete weekly report' });
  }
});

// Update weekly report
router.put('/weekly/:id', async (req, res) => {
  try {
    const {
      content,
      achievements,
      challenges,
      nextWeekGoals,
      status
    } = req.body;

    const updateData: any = {};

    if (content) updateData.content = content;
    if (achievements) updateData.achievements = JSON.stringify(achievements);
    if (challenges) updateData.challenges = JSON.stringify(challenges);
    if (nextWeekGoals) updateData.nextWeekGoals = JSON.stringify(nextWeekGoals);
    if (status) updateData.status = status;

    const report = await prisma.weeklyReport.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating weekly report:', error);
    res.status(500).json({ error: 'Failed to update weekly report' });
  }
});

// Get weekly report statistics for admin dashboard
router.get('/weekly/stats', async (req, res) => {
  try {
    const totalReports = await prisma.weeklyReport.count();
    const thisWeekReports = await prisma.weeklyReport.count({
      where: {
        submittedAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    });
    const uniqueUsers = await prisma.weeklyReport.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });

    res.json({
      totalReports,
      thisWeekReports,
      uniqueUsers: uniqueUsers.length,
      averageReportsPerUser: totalReports / (uniqueUsers.length || 1)
    });
  } catch (error) {
    console.error('Error fetching weekly report stats:', error);
    res.status(500).json({ error: 'Failed to fetch weekly report stats' });
  }
});

export default router; 