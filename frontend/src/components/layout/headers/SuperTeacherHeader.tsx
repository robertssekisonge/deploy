import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useData } from '../../../contexts/DataContext';
import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperTeacherHeader: React.FC = () => {
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
  const latestMessages = userMessages
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
    } else if (notification.type === 'attendance') {
      navigate('/attendance');
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.type === 'clinic') {
      navigate('/clinic');
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
            Super Teacher Portal - School Management System
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
              <div className="p-4 border-b font-semibold text-gray-900">Super Teacher Notifications & Messages</div>
              <ul className="max-h-80 overflow-y-auto">
                {/* Notifications Section */}
                <li className="px-4 py-2 text-xs text-purple-700 font-bold bg-purple-50">Notifications</li>
                {unreadNotificationCount === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</li>
                ) : (
                  latestNotifications.map(notification => (
                    <li key={notification.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <div 
                        className="flex items-start space-x-3"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}

                {/* Messages Section */}
                <li className="px-4 py-2 text-xs text-blue-700 font-bold bg-blue-50">Messages</li>
                {unreadMessageCount === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500 text-center">No new messages</li>
                ) : (
                  latestMessages.map(message => (
                    <li key={message.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <div 
                        className="flex items-start space-x-3"
                        onClick={() => handleNotificationClick(message)}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${message.read ? 'bg-gray-300' : 'bg-green-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{message.subject}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{message.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            From: {message.fromRole} • {new Date(message.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}

                {/* View All Links */}
                <li className="px-4 py-2 border-t border-gray-200">
                  <div className="flex space-x-2 text-xs">
                    <button
                      onClick={() => { navigate('/notifications'); setShowDropdown(false); }}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View All Notifications
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => { navigate('/messages'); setShowDropdown(false); }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Messages
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout(navigate)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default SuperTeacherHeader;
