import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import MessageButton from '../../common/MessageButton';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Clock,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PenTool
} from 'lucide-react';

interface UserSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  const userNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'My Students' },
    { path: '/teacher-marks', icon: PenTool, label: 'Enter Marks' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/reports', icon: FileText, label: 'Report Cards' },
    { path: '/teacher-scheduling', icon: Clock, label: 'My Scheduling' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/class-resources', icon: BookOpen, label: 'Resources' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Show restricted access if user has no privileges
  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-red-50 to-red-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-red-300`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-red-600 to-red-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-red-800">Access Restricted</h2>
                <p className="text-xs text-red-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center text-red-600">
            <p className="text-xs">Contact administrator</p>
            <p className="text-xs">to get access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg transition-all duration-300 relative h-full flex flex-col border-r border-slate-200`}>
      {/* Collapse Toggle */}
              <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow z-30"
        >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <div className="p-4 pt-6 flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-md flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-bold text-slate-800">EduSystem</h2>
              <p className="text-xs text-slate-500">Teacher Portal</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-3 pb-4 flex-1 overflow-y-auto">
        <div className="px-2">
          {userNavItems.map((item) => {
            // Use enhanced message button for messages
            if (item.path === '/messages') {
              return (
                <MessageButton
                  key={item.path}
                  isCollapsed={isCollapsed}
                  className="mb-1"
                />
              );
            }
            
            // Regular navigation items
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-1.5' : 'px-2.5'} py-2.5 text-xs font-medium rounded-md transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer min-h-[40px] ` +
                                    (isActive
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300 shadow-sm'
                      : 'text-slate-600 bg-white/70 hover:bg-white hover:text-slate-800 hover:shadow-sm')
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <span className="arrow-dots-circle-container arrow-dots-spinner-rotate" style={{ display: 'inline-block', position: 'relative', width: '18px', height: '18px', marginLeft: '8px', verticalAlign: 'middle' }}>
                        <span className="arrow-dot-circle arrow-dot1-circle"></span>
                        <span className="arrow-dot-circle arrow-dot2-circle"></span>
                        <span className="arrow-dot-circle arrow-dot3-circle"></span>
                        <span className="arrow-dot-circle arrow-dot4-circle"></span>
                        <span className="arrow-dot-circle arrow-dot5-circle"></span>
                      </span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default UserSidebar;
