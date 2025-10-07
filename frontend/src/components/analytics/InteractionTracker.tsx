import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface InteractionRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  component: string;
  targetId?: string;
  targetName?: string;
  timestamp: Date;
  metadata: Record<string, any>;
  sessionId: string;
}

interface InteractionTrackerContextType {
  trackInteraction: (action: string, component: string, metadata?: Record<string, any>, targetId?: string, targetName?: string) => void;
  trackPayment: (studentId: string, studentName: string, amount: number, method: string) => void;
  trackAttendance: (studentId: string, studentName: string, status: string, date: string) => void;
  trackStudentAction: (action: string, studentId: string, studentName: string, metadata?: Record<string, any>) => void;
  trackPageView: (page: string, metadata?: Record<string, any>) => void;
  getInteractionHistory: () => InteractionRecord[];
  getAnalyticsData: () => any;
}

const InteractionTrackerContext = createContext<InteractionTrackerContextType | undefined>(undefined);

export const InteractionTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Generate session ID for tracking user sessions
  const sessionId = React.useMemo(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const trackInteraction = useCallback((
    action: string, 
    component: string, 
    metadata: Record<string, any> = {}, 
    targetId?: string, 
    targetName?: string
  ) => {
    try {
      const interaction: InteractionRecord = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user?.id?.toString() || 'anonymous',
        userName: user?.name || 'Anonymous User',
        userRole: user?.role || 'unknown',
        action,
        component,
        targetId,
        targetName,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        },
        sessionId
      };

      console.log('📊 Interaction tracked:', interaction);

      // Store in localStorage for persistence
      const existingInteractions = JSON.parse(localStorage.getItem('interactionHistory') || '[]');
      existingInteractions.push(interaction);
      
      // Keep only last 1000 interactions to prevent storage bloat
      if (existingInteractions.length > 1000) {
        existingInteractions.splice(0, existingInteractions.length - 1000);
      }
      
      localStorage.setItem('interactionHistory', JSON.stringify(existingInteractions));

      // Send to backend analytics (if available)
      sendToBackendAnalytics(interaction);

    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  }, [user, sessionId]);

  const trackPayment = useCallback((studentId: string, studentName: string, amount: number, method: string) => {
    trackInteraction(
      'payment_processed',
      'PaymentSystem',
      {
        paymentAmount: amount,
        paymentMethod: method,
        studentClass: 'unknown', // Will be filled by calling component
        studentStream: 'unknown'
      },
      studentId,
      studentName
    );
  }, [trackInteraction]);

  const trackAttendance = useCallback((studentId: string, studentName: string, status: string, date: string) => {
    trackInteraction(
      'attendance_marked',
      'AttendanceSystem',
      {
        attendanceStatus: status,
        attendanceDate: date,
        studentClass: 'unknown',
        studentStream: 'unknown'
      },
      studentId,
      studentName
    );
  }, [trackInteraction]);

  const trackStudentAction = useCallback((action: string, studentId: string, studentName: string, metadata: Record<string, any> = {}) => {
    trackInteraction(
      action,
      'StudentManagement',
      {
        ...metadata,
        studentClass: 'unknown',
        studentStream: 'unknown'
      },
      studentId,
      studentName
    );
  }, [trackInteraction]);

  const trackPageView = useCallback((page: string, metadata: Record<string, any> = {}) => {
    trackInteraction(
      'page_view',
      'Navigation',
      {
        ...metadata,
        pageTitle: document.title,
        pageUrl: window.location.href
      }
    );
  }, [trackInteraction]);

  const getInteractionHistory = useCallback((): InteractionRecord[] => {
    try {
      return JSON.parse(localStorage.getItem('interactionHistory') || '[]');
    } catch (error) {
      console.error('❌ Error getting interaction history:', error);
      return [];
    }
  }, []);

  const getAnalyticsData = useCallback(() => {
    const interactions = getInteractionHistory();
    
    // Calculate analytics metrics
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
        analytics.paymentAnalytics.totalAmount += interaction.metadata.paymentAmount || 0;
        const method = interaction.metadata.paymentMethod;
        analytics.paymentAnalytics.paymentMethods[method] = (analytics.paymentAnalytics.paymentMethods[method] || 0) + 1;
      }
      
      // Attendance analytics
      if (interaction.action === 'attendance_marked') {
        analytics.attendanceAnalytics.totalAttendanceMarked++;
        const status = interaction.metadata.attendanceStatus;
        analytics.attendanceAnalytics.attendanceByStatus[status] = (analytics.attendanceAnalytics.attendanceByStatus[status] || 0) + 1;
        const date = interaction.metadata.attendanceDate;
        analytics.attendanceAnalytics.attendanceByDate[date] = (analytics.attendanceAnalytics.attendanceByDate[date] || 0) + 1;
      }
    });

    // Calculate averages
    if (analytics.paymentAnalytics.totalPayments > 0) {
      analytics.paymentAnalytics.averagePayment = analytics.paymentAnalytics.totalAmount / analytics.paymentAnalytics.totalPayments;
    }

    return analytics;
  }, [getInteractionHistory]);

  const sendToBackendAnalytics = async (interaction: InteractionRecord) => {
    try {
      // Send to backend analytics endpoint (if available)
      await fetch('http://localhost:5000/api/analytics/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interaction)
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the main functionality
      console.debug('Analytics backend not available:', error);
    }
  };

  const value: InteractionTrackerContextType = {
    trackInteraction,
    trackPayment,
    trackAttendance,
    trackStudentAction,
    trackPageView,
    getInteractionHistory,
    getAnalyticsData
  };

  return (
    <InteractionTrackerContext.Provider value={value}>
      {children}
    </InteractionTrackerContext.Provider>
  );
};

export const useInteractionTracker = (): InteractionTrackerContextType => {
  const context = useContext(InteractionTrackerContext);
  if (!context) {
    throw new Error('useInteractionTracker must be used within an InteractionTrackerProvider');
  }
  return context;
};

export default InteractionTrackerProvider;
