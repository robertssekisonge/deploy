import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useData } from '../../../contexts/DataContext';
import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../common/ThemeToggle';

const AdminHeader: React.FC = () => {
  const { user, logout, users } = useAuth();
  const { notifications, messages, updateNotification } = useData();
  const [showDropdown, setShowDropdown] = useState(false);
  const [backendMessages, setBackendMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load messages from backend for admin
  useEffect(() => {
    const loadBackendMessages = async () => {
      if (!user || user.role?.toLowerCase() !== 'admin') return;
      
      setLoadingMessages(true);
      try {
        const response = await fetch(`http://localhost:5000/api/messages/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Admin loaded messages from backend:', data);
          setBackendMessages(data);
        }
      } catch (error) {
        console.error('Error loading admin messages from backend:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadBackendMessages();
  }, [user]);

  // Get unread notifications for the current user
  const userNotifications = notifications.filter(n => n.userId === user?.id);
  const unreadNotifications = userNotifications.filter(n => !n.read);
  const unreadNotificationCount = unreadNotifications.length;
  const latestNotifications = userNotifications
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get unread messages for the current user (combine local and backend)
  const allUserMessages = [...messages, ...backendMessages];
  const userMessages = allUserMessages.filter(m => m.to === user?.id || m.receiverId === user?.id);
  const unreadMessages = userMessages.filter(m => !m.read);
  const unreadMessageCount = unreadMessages.length;
  const latestMessages = unreadMessages
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
    .slice(0, 5);

  // Total unread count
  const unreadCount = unreadNotificationCount + unreadMessageCount;

  // Detect locked accounts (for admin only)
  const lockedAccounts = (users || []).filter(u => u.accountLocked || (u.lockedUntil && new Date(u.lockedUntil) > new Date()));
  const lockedAccountsCount = lockedAccounts.length;

  // Add locked accounts notifications for admin
  const lockedAccountNotifications = lockedAccountsCount > 0
    ? lockedAccounts.map(acc => ({
        id: `locked-${acc.id}`,
        title: `Account Locked: ${acc.name}`,
        message: `${acc.email} — Reason: ${acc.lockReason || 'Temporarily locked'}${acc.lockedUntil ? ` (until ${new Date(acc.lockedUntil).toLocaleString()})` : ''}`,
        date: new Date(),
        read: false,
        type: 'locked',
      }))
    : [];

  // Merge with latestNotifications
  const allNotifications = [...lockedAccountNotifications, ...latestNotifications];
  const allUnreadCount = allNotifications.length + unreadMessageCount;

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
    } else if (notification.type === 'payment') {
      navigate('/payments');
    } else if (notification.type === 'clinic') {
      navigate('/clinic');
    } else if (notification.type === 'sponsorship') {
      navigate('/sponsorships');
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
            Admin Dashboard - School Management System
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle size="md" />
          
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 relative"
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-label="Show notifications"
            >
              <Bell className="h-5 w-5" />
              {allUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {allUnreadCount}
                </span>
              )}
            </button>
            
            {/* AI-Generated Animated Dropdown */}
            <div
              ref={dropdownRef}
              className={`absolute right-0 mt-2 w-80 bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-2xl z-50 transition-all duration-300 origin-top-right backdrop-blur-sm
                ${showDropdown ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
              style={{ minWidth: '20rem' }}
            >
              <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold text-lg">
                Admin Notifications & Messages
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {/* Locked Accounts Section */}
                {lockedAccountsCount > 0 && (
                  <>
                    <li className="px-4 py-2 text-xs text-red-700 font-bold bg-gradient-to-r from-red-100 to-pink-100 border-l-4 border-red-500 rounded-r-lg mx-2 my-1">
                      🔒 Locked Accounts ({lockedAccountsCount})
                    </li>
                    {lockedAccountNotifications.map((n) => (
                      <li
                        key={n.id}
                        className="px-4 py-3 border-b border-red-200 last:border-b-0 bg-gradient-to-r from-red-50 to-pink-50 transition-all duration-200 group cursor-pointer hover:from-red-100 hover:to-pink-100 hover:shadow-md mx-2 my-1 rounded-lg"
                      >
                        <div className="font-medium text-red-800 flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          {n.title}
                        </div>
                        <div className="text-sm text-red-700 mt-1">{n.message}</div>
                        <div className="text-xs text-red-500 mt-2 font-medium">{new Date(n.date).toLocaleString()}</div>
                      </li>
                    ))}
                  </>
                )}
                
                {/* Notifications Section */}
                <li className="px-4 py-2 text-xs text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-500 rounded-r-lg mx-2 my-1">
                  🔔 Notifications
                </li>
                {latestNotifications.length === 0 ? (
                  <li className="p-4 text-gray-500 text-center bg-gradient-to-r from-gray-50 to-blue-50 mx-2 my-1 rounded-lg">
                    <div className="text-gray-400 text-sm">✨ No notifications</div>
                  </li>
                ) : (
                  latestNotifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 border-b border-purple-200 last:border-b-0 transition-all duration-200 group cursor-pointer hover:shadow-md mx-2 my-1 rounded-lg ${
                        n.read 
                          ? 'bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-purple-50' 
                          : 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100'
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>}
                        <span className={n.read ? 'text-gray-700' : 'text-purple-800 font-semibold'}>{n.title}</span>
                      </div>
                      <div className={`text-sm mt-1 ${n.read ? 'text-gray-600' : 'text-purple-700'}`}>{n.message}</div>
                      <div className={`text-xs mt-2 font-medium ${n.read ? 'text-gray-400' : 'text-purple-500'}`}>
                        {new Date(n.date).toLocaleString()}
                      </div>
                    </li>
                  ))
                )}
                
                {/* Messages Section */}
                <li className="px-4 py-2 text-xs text-blue-700 font-bold bg-gradient-to-r from-blue-100 to-cyan-100 border-l-4 border-blue-500 rounded-r-lg mx-2 my-1 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    💬 Unread Messages
                  </span>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs bg-gradient-to-r from-blue-200 to-cyan-200 hover:from-blue-300 hover:to-cyan-300 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Refresh messages"
                  >
                    🔄
                  </button>
                </li>
                {loadingMessages ? (
                  <li className="p-4 text-gray-500 text-center bg-gradient-to-r from-gray-50 to-blue-50 mx-2 my-1 rounded-lg">
                    <div className="text-gray-400 text-sm">⏳ Loading messages...</div>
                  </li>
                ) : latestMessages.length === 0 ? (
                  <li className="p-4 text-gray-500 text-center bg-gradient-to-r from-gray-50 to-blue-50 mx-2 my-1 rounded-lg">
                    <div className="text-gray-400 text-sm">📭 No unread messages</div>
                  </li>
                ) : (
                  latestMessages.map((m) => (
                    <li key={m.id} className="px-4 py-3 border-b border-blue-200 last:border-b-0 bg-gradient-to-r from-blue-50 to-cyan-50 transition-all duration-200 group hover:from-blue-100 hover:to-cyan-100 hover:shadow-md mx-2 my-1 rounded-lg">
                      <div className="font-medium text-blue-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        {m.subject || m.title}
                        {m.fromRole && <span className="text-xs text-blue-600 ml-2 bg-blue-100 px-2 py-0.5 rounded-full">({m.fromRole})</span>}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">{m.content}</div>
                      <div className="text-xs text-blue-500 mt-2 font-medium">
                        {new Date(m.date || m.createdAt).toLocaleString()}
                      </div>
                      {m.from && <div className="text-xs text-blue-600 mt-1 bg-blue-100 px-2 py-1 rounded-lg">From: {m.from}</div>}
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
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
            
            <button
              onClick={() => logout(navigate)}
              className="p-2 text-gray-400 hover:text-red-500 transition-all duration-200 hover:scale-110"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
