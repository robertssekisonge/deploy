import React from 'react';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Settings, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface ParentSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  path: string;
  tab: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const ParentSidebar: React.FC<ParentSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  const location = useLocation();
  
  const parentNavItems: NavItem[] = [
    { path: '/dashboard', tab: null, icon: Home, label: 'Dashboard' },
    { path: '/dashboard', tab: 'children', icon: Users, label: 'My Children' },
    { path: '/dashboard', tab: 'attendance', icon: Calendar, label: 'Child Attendance' },
    { path: '/dashboard', tab: 'financial', icon: DollarSign, label: 'Payment Details' },
    { path: '/dashboard', tab: 'academics', icon: FileText, label: 'Report Cards' },
    { path: '/dashboard', tab: 'messages', icon: MessageSquare, label: 'Messages' },
    { path: '/settings', tab: null, icon: Settings, label: 'Settings' },
  ];

  // Function to check if a nav item is active
  const isNavItemActive = (item: NavItem) => {
    if (item.path === '/settings') {
      return location.pathname === '/settings';
    }
    
    if (item.path === '/dashboard') {
      // Only check dashboard items if we're actually on the dashboard page
      if (location.pathname !== '/dashboard') {
        return false;
      }
      
      if (item.tab === null) {
        // Dashboard (overview) is active when no tab or tab=overview
        const urlParams = new URLSearchParams(location.search);
        const tab = urlParams.get('tab');
        return !tab || tab === 'overview';
      } else {
        // Other tabs are active when their specific tab parameter matches
        const urlParams = new URLSearchParams(location.search);
        const tab = urlParams.get('tab');
        return tab === item.tab;
      }
    }
    
    return false;
  };

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
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg transition-width duration-300 relative h-full flex flex-col border-r border-slate-200`}>
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
          <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">EduSystem</h2>
              <p className="text-sm text-gray-500">Parent Portal</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-6 pb-4 flex-1 overflow-y-auto">
        <div className="px-3">
          {parentNavItems.map((item: NavItem) => {
            // Generate the correct path for each item
            const itemPath = item.tab ? `${item.path}?tab=${item.tab}` : item.path;
            const isActive = isNavItemActive(item);
            
            return (
              <NavLink
                key={itemPath}
                to={itemPath}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-colors mb-1 group relative cursor-pointer ${
                  isActive
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                    : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
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
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ParentSidebar;