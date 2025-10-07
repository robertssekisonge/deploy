import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import { 
  Home, 
  Heart, 
  DollarSign, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface OverseerSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const OverseerSidebar: React.FC<OverseerSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  const overseerNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/sponsorships', icon: Heart, label: 'Sponsorships' },
    { path: '/financial', icon: DollarSign, label: 'Financial Records' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/reports', icon: FileText, label: 'Report Cards' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/settings', icon: Settings, label: 'Settings' }
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
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">EduSystem</h2>
              <p className="text-sm text-gray-500">Overseer Portal</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-6 pb-6 flex-1 overflow-y-auto">
        <div className="px-3 space-y-1">
          {overseerNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ` +
                (isActive
                  ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-400'
                  : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-900')
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
          ))}
        </div>
      </nav>
    </div>
  );
};

export default OverseerSidebar;
