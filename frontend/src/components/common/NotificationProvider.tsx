import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AINotification, { AINotificationProps } from './AINotification';

interface NotificationContextType {
  showNotification: (notification: Omit<AINotificationProps, 'id' | 'onClose'>) => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  showRefresh: (title: string, message: string, duration?: number) => void;
  showSystem: (title: string, message: string, duration?: number) => void;
  // Back-compat for older calls across the app that expect a single-message API
  showAINotification: (message: string, duration?: number) => void;
  showData: (title: string, message: string, duration?: number) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AINotificationProps[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<AINotificationProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: AINotificationProps = {
      ...notification,
      id,
      onClose: removeNotification
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, [removeNotification]);

  const showSuccess = useCallback((title: string, message: string, duration = 5000) => {
    showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, duration = 7000) => {
    showNotification({ type: 'error', title, message, duration });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, duration = 6000) => {
    showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, duration = 5000) => {
    showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  const showRefresh = useCallback((title: string, message: string, duration = 4000) => {
    showNotification({ type: 'refresh', title, message, duration });
  }, [showNotification]);

  const showSystem = useCallback((title: string, message: string, duration = 5000) => {
    showNotification({ type: 'system', title, message, duration });
  }, [showNotification]);

  const showData = useCallback((title: string, message: string, duration = 4000) => {
    showNotification({ type: 'data', title, message, duration });
  }, [showNotification]);

  // Simple alias used by various components: accepts only a message and optional duration
  // It renders as an info-style notification with the message as the body
  const showAINotification = useCallback((message: string, duration = 3000) => {
    showNotification({ type: 'info', title: '', message, duration });
  }, [showNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showRefresh,
    showSystem,
    showAINotification,
    showData,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Render notifications */}
      <div className="fixed top-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {notifications.map(notification => (
            <AINotification key={notification.id} {...notification} />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

