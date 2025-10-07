import { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface UnreadCounts {
  messages: number;
  notifications: number;
  total: number;
}

export const useUnreadCounts = () => {
  const { messages, notifications } = useData();
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    messages: 0,
    notifications: 0,
    total: 0
  });

  const calculateUnreadCounts = useCallback(() => {
    if (!user?.id) return;

    // Calculate unread messages
    const unreadMessages = messages.filter(m => 
      m.to === user.id && !m.read
    );

    // Calculate unread notifications
    const unreadNotifications = notifications.filter(n => 
      !n.read && n.userId === user.id
    );

    const counts = {
      messages: unreadMessages.length,
      notifications: unreadNotifications.length,
      total: unreadMessages.length + unreadNotifications.length
    };

    setUnreadCounts(counts);
  }, [messages, notifications, user?.id]);

  useEffect(() => {
    calculateUnreadCounts();
  }, [calculateUnreadCounts]);

  return {
    unreadCounts,
    refreshCounts: calculateUnreadCounts
  };
};

export default useUnreadCounts;







