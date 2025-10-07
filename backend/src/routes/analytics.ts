import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Store interaction analytics
router.post('/interactions', async (req, res) => {
  try {
    const interactionData = req.body;
    console.log('📊 Storing interaction analytics:', interactionData);

    // Create interaction record in database
    const interaction = await prisma.interactionAnalytics.create({
      data: {
        userId: interactionData.userId,
        userName: interactionData.userName,
        userRole: interactionData.userRole,
        action: interactionData.action,
        component: interactionData.component,
        targetId: interactionData.targetId,
        targetName: interactionData.targetName,
        timestamp: new Date(interactionData.timestamp),
        metadata: JSON.stringify(interactionData.metadata),
        sessionId: interactionData.sessionId
      }
    });

    console.log('✅ Interaction analytics stored successfully:', interaction.id);
    res.status(201).json({ success: true, id: interaction.id });
  } catch (error) {
    console.error('❌ Error storing interaction analytics:', error);
    res.status(500).json({ error: 'Failed to store interaction analytics' });
  }
});

// Get analytics summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, userId, action, component } = req.query;
    
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (action) {
      whereClause.action = action;
    }
    
    if (component) {
      whereClause.component = component;
    }

    const interactions = await prisma.interactionAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    // Calculate analytics
    const analytics = {
      totalInteractions: interactions.length,
      uniqueUsers: new Set(interactions.map(i => i.userId)).size,
      actionsByType: {},
      componentsByUsage: {},
      hourlyDistribution: {},
      dailyDistribution: {},
      userActivity: {},
      paymentAnalytics: {
        totalPayments: 0,
        totalAmount: 0,
        paymentMethods: {},
        averagePayment: 0
      },
      attendanceAnalytics: {
        totalAttendanceMarked: 0,
        attendanceByStatus: {},
        attendanceByDate: {}
      }
    };

    // Process interactions
    interactions.forEach(interaction => {
      const metadata = JSON.parse(interaction.metadata || '{}');
      
      // Actions by type
      analytics.actionsByType[interaction.action] = (analytics.actionsByType[interaction.action] || 0) + 1;
      
      // Components by usage
      analytics.componentsByUsage[interaction.component] = (analytics.componentsByUsage[interaction.component] || 0) + 1;
      
      // Hourly distribution
      const hour = interaction.timestamp.getHours();
      analytics.hourlyDistribution[hour] = (analytics.hourlyDistribution[hour] || 0) + 1;
      
      // Daily distribution
      const day = interaction.timestamp.toDateString();
      analytics.dailyDistribution[day] = (analytics.dailyDistribution[day] || 0) + 1;
      
      // User activity
      analytics.userActivity[interaction.userId] = (analytics.userActivity[interaction.userId] || 0) + 1;
      
      // Payment analytics
      if (interaction.action === 'payment_processed') {
        analytics.paymentAnalytics.totalPayments++;
        analytics.paymentAnalytics.totalAmount += metadata.paymentAmount || 0;
        const method = metadata.paymentMethod;
        analytics.paymentAnalytics.paymentMethods[method] = (analytics.paymentAnalytics.paymentMethods[method] || 0) + 1;
      }
      
      // Attendance analytics
      if (interaction.action === 'attendance_marked') {
        analytics.attendanceAnalytics.totalAttendanceMarked++;
        const status = metadata.attendanceStatus;
        analytics.attendanceAnalytics.attendanceByStatus[status] = (analytics.attendanceAnalytics.attendanceByStatus[status] || 0) + 1;
        const date = metadata.attendanceDate;
        analytics.attendanceAnalytics.attendanceByDate[date] = (analytics.attendanceAnalytics.attendanceByDate[date] || 0) + 1;
      }
    });

    // Calculate averages
    if (analytics.paymentAnalytics.totalPayments > 0) {
      analytics.paymentAnalytics.averagePayment = analytics.paymentAnalytics.totalAmount / analytics.paymentAnalytics.totalPayments;
    }

    res.json(analytics);
  } catch (error) {
    console.error('❌ Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// Get payment analytics
router.get('/payments', async (req, res) => {
  try {
    const { startDate, endDate, studentId, paymentMethod } = req.query;
    
    const whereClause: any = {
      action: 'payment_processed'
    };
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (studentId) {
      whereClause.targetId = studentId;
    }

    const paymentInteractions = await prisma.interactionAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    const paymentAnalytics = {
      totalPayments: paymentInteractions.length,
      totalAmount: 0,
      paymentMethods: {},
      dailyPayments: {},
      studentPayments: {},
      averagePayment: 0,
      paymentTrends: []
    };

    paymentInteractions.forEach(interaction => {
      const metadata = JSON.parse(interaction.metadata || '{}');
      const amount = metadata.paymentAmount || 0;
      
      paymentAnalytics.totalAmount += amount;
      
      // Payment methods
      const method = metadata.paymentMethod;
      paymentAnalytics.paymentMethods[method] = (paymentAnalytics.paymentMethods[method] || 0) + 1;
      
      // Daily payments
      const day = interaction.timestamp.toDateString();
      paymentAnalytics.dailyPayments[day] = (paymentAnalytics.dailyPayments[day] || 0) + amount;
      
      // Student payments
      const studentId = interaction.targetId;
      if (studentId) {
        paymentAnalytics.studentPayments[studentId] = (paymentAnalytics.studentPayments[studentId] || 0) + amount;
      }
      
      // Payment trends
      paymentAnalytics.paymentTrends.push({
        date: interaction.timestamp.toISOString().split('T')[0],
        amount: amount,
        method: method,
        studentId: interaction.targetId,
        studentName: interaction.targetName
      });
    });

    if (paymentAnalytics.totalPayments > 0) {
      paymentAnalytics.averagePayment = paymentAnalytics.totalAmount / paymentAnalytics.totalPayments;
    }

    res.json(paymentAnalytics);
  } catch (error) {
    console.error('❌ Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// Get attendance analytics
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate, studentId, status } = req.query;
    
    const whereClause: any = {
      action: 'attendance_marked'
    };
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (studentId) {
      whereClause.targetId = studentId;
    }

    const attendanceInteractions = await prisma.interactionAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    const attendanceAnalytics = {
      totalAttendanceMarked: attendanceInteractions.length,
      attendanceByStatus: {},
      dailyAttendance: {},
      studentAttendance: {},
      attendanceTrends: []
    };

    attendanceInteractions.forEach(interaction => {
      const metadata = JSON.parse(interaction.metadata || '{}');
      const attendanceStatus = metadata.attendanceStatus;
      
      // Attendance by status
      attendanceAnalytics.attendanceByStatus[attendanceStatus] = (attendanceAnalytics.attendanceByStatus[attendanceStatus] || 0) + 1;
      
      // Daily attendance
      const day = interaction.timestamp.toDateString();
      attendanceAnalytics.dailyAttendance[day] = (attendanceAnalytics.dailyAttendance[day] || 0) + 1;
      
      // Student attendance
      const studentId = interaction.targetId;
      if (studentId) {
        if (!attendanceAnalytics.studentAttendance[studentId]) {
          attendanceAnalytics.studentAttendance[studentId] = {};
        }
        attendanceAnalytics.studentAttendance[studentId][attendanceStatus] = 
          (attendanceAnalytics.studentAttendance[studentId][attendanceStatus] || 0) + 1;
      }
      
      // Attendance trends
      attendanceAnalytics.attendanceTrends.push({
        date: interaction.timestamp.toISOString().split('T')[0],
        status: attendanceStatus,
        studentId: interaction.targetId,
        studentName: interaction.targetName
      });
    });

    res.json(attendanceAnalytics);
  } catch (error) {
    console.error('❌ Error fetching attendance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch attendance analytics' });
  }
});

export default router;
