import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useData } from '../../../contexts/DataContext';
import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OverseerHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, messages, updateNotification } = useData();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get unread notifications for the current user
  const userNotifications = notifications.filter(n => n.userId === user?.id);
  const unreadNotifications = userNotifications.filter(n => !n.read);
  const unreadNotificationCount = unreadNotifications.length;
  const latestNotifications = userNotifications
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get unread messages for the current user
  const userMessages = messages.filter(m => m.to === user?.id);
  const unreadMessages = userMessages.filter(m => !m.read);
  const unreadMessageCount = unreadMessages.length;
  const latestMessages = unreadMessages
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Total unread count
  const unreadCount = unreadNotificationCount + unreadMessageCount;

  // Click outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      updateNotification(notification.id, { read: true });
    }
    // Navigate to relevant page
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.type === 'sponsorship') {
      navigate('/sponsorships');
    } else if (notification.type === 'financial') {
      navigate('/financial');
    } else {
      navigate('/dashboard');
    }
    setShowDropdown(false);
  };

  return (
    <header className="bg-transparent shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Sponsorship Overseer Portal - School Management System
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 relative"
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-label="Show notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Animated Dropdown */}
            <div
              ref={dropdownRef}
              className={`absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transition-all duration-300 origin-top-right
                ${showDropdown ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
              style={{ minWidth: '20rem' }}
            >
              <div className="p-4 border-b font-semibold text-gray-900">Overseer Notifications & Messages</div>
              <ul className="max-h-80 overflow-y-auto">
                {/* Notifications Section */}
                <li className="px-4 py-2 text-xs text-purple-700 font-bold bg-purple-50">Notifications</li>
                {latestNotifications.length === 0 ? (
                  <li className="p-4 text-gray-500 text-center">No notifications</li>
                ) : (
                  latestNotifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 border-b last:border-b-0 ${n.read ? 'bg-white' : 'bg-purple-50'} transition-colors duration-200 group cursor-pointer hover:bg-purple-100`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="font-medium text-gray-800">{n.title}</div>
                      <div className="text-sm text-gray-600">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</div>
                    </li>
                  ))
                )}
                
                {/* Messages Section */}
                <li className="px-4 py-2 text-xs text-blue-700 font-bold bg-blue-50">Unread Messages</li>
                {latestMessages.length === 0 ? (
                  <li className="p-4 text-gray-500 text-center">No unread messages</li>
                ) : (
                  latestMessages.map((m) => (
                    <li key={m.id} className="px-4 py-3 border-b last:border-b-0 bg-blue-50 transition-colors duration-200 group">
                      <div className="font-medium text-gray-800">{m.subject}</div>
                      <div className="text-sm text-gray-600">{m.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(m.date).toLocaleString()}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
            
            <button
              onClick={() => logout(navigate)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default OverseerHeader;
