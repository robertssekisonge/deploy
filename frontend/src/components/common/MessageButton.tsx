import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Bell } from 'lucide-react';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';

interface MessageButtonProps {
  isCollapsed: boolean;
  className?: string;
}

const MessageButton: React.FC<MessageButtonProps> = ({ isCollapsed, className = '' }) => {
  const { unreadCounts } = useUnreadCounts();

  return (
    <NavLink
      to="/messages"
      className={({ isActive }) =>
        `group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 ${
          isActive
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700'
        } ${className}`
      }
    >
      <div className="relative">
        <MessageSquare className="h-6 w-6 transition-all duration-200 group-hover:scale-110" />
        
        {/* Unread Message Counter */}
        {unreadCounts.messages > 0 && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
            {unreadCounts.messages > 99 ? '99+' : unreadCounts.messages}
          </div>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="flex items-center space-x-2">
          <span className="font-medium">Messages</span>
          {unreadCounts.messages > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCounts.messages}
            </div>
          )}
        </div>
      )}
      
      {/* Mobile-style notification indicator */}
      {unreadCounts.messages > 0 && isCollapsed && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </NavLink>
  );
};

export default MessageButton;







