import React, { createContext, useContext, useState, ReactNode } from 'react';
import AINotification from '../components/common/AINotification';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useAINotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useAINotification must be used within an AINotificationProvider');
  }
  return context;
};

interface AINotificationProviderProps {
  children: ReactNode;
}

export const AINotificationProvider: React.FC<AINotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showSuccess = (message: string, duration?: number) => {
    addNotification(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    addNotification(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    addNotification(message, 'info', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    addNotification(message, 'warning', duration);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
      
      {/* Render all notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map((notification) => (
          <AINotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
