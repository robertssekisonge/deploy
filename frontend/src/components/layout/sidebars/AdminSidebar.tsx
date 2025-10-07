import React, { useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import MessageButton from '../../common/MessageButton';
import { 
  Home, 
  Users, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Heart, 
  Settings, 
  GraduationCap,
  BarChart3,
  Calendar,
  MessageSquare,
  Stethoscope,
  Clock,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  
  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes dot-pulse {
        0%, 100% { 
          opacity: 0.2; 
          transform: scale(0.8); 
        }
        50% { 
          opacity: 1; 
          transform: scale(1.2); 
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  // Memoize navigation items to prevent recreation on every render
  const adminNavItems = useMemo(() => [
    { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'text-blue-600' },
    { path: '/users', icon: Users, label: 'User Management', color: 'text-green-600' },
    { path: '/teachers', icon: Users, label: 'Teacher Management', color: 'text-emerald-600' },
    { path: '/parents', icon: Users, label: 'Parent Management', color: 'text-teal-600' },
    { path: '/students', icon: Users, label: 'Students', color: 'text-purple-600' },
    { path: '/classes', icon: GraduationCap, label: 'Classes & Streams', color: 'text-indigo-600' },
    { path: '/attendance', icon: Calendar, label: 'Attendance', color: 'text-orange-600' },
    { path: '/financial-management', icon: DollarSign, label: 'Financial Management', color: 'text-green-600' },
    { path: '/reports', icon: FileText, label: 'Report Cards', color: 'text-red-600' },
    { path: '/admin-sponsorship-approval', icon: Heart, label: 'Admin Approvals', color: 'text-rose-600' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', color: 'text-cyan-600' },
    { path: '/timetable', icon: Clock, label: 'School Timetable', color: 'text-slate-600' },
    { path: '/clinic', icon: Stethoscope, label: 'Clinic Records', color: 'text-lime-600' },
    { path: '/class-resources', icon: BookOpen, label: 'Class Resources', color: 'text-amber-600' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports', color: 'text-sky-600' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-zinc-600' },
    { path: '/system-settings', icon: Database, label: 'System Settings', color: 'text-red-600' }
  ], []);

  // Memoize the collapse handler to prevent unnecessary re-renders
  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Memoize the className function to prevent recreation on every render
  const getNavLinkClassName = useCallback((isCollapsed: boolean) => {
    return ({ isActive }: { isActive: boolean }) => {
      const baseClasses = `flex items-center ${isCollapsed ? 'justify-center px-1.5' : 'px-2.5'} py-2.5 text-xs font-medium rounded-md transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer min-h-[40px]`;
      const activeClasses = isActive ? 'bg-white text-gray-800 shadow-lg ring-1 ring-gray-200' : 'text-gray-700 bg-white/70 hover:bg-white hover:text-gray-900 hover:shadow-sm';
      return `${baseClasses} ${activeClasses}`;
    };
  }, []);

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
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-green-50 to-green-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-green-300`}>
      {/* Collapse Toggle */}
      <button
        onClick={handleCollapseToggle}
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
          <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md flex items-center justify-center shadow-lg">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-bold text-gray-800">EduSystem</h2>
              <p className="text-xs text-gray-600">Admin Panel</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-3 pb-4 flex-1 overflow-y-auto">
        <div className="px-2">
          {adminNavItems.map((item) => {
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
                className={getNavLinkClassName(isCollapsed)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`${isActive ? 'h-6 w-6 text-white font-bold' : 'h-5 w-5'} ${!isActive ? item.color : ''}`} style={isActive ? { 
                      fontWeight: 'bold', 
                      filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))',
                      strokeWidth: '2.5'
                    } : {}} />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <span className="loading-spinner" style={{ 
                        display: 'inline-block', 
                        position: 'relative', 
                        width: '24px', 
                        height: '24px', 
                        marginLeft: '8px', 
                        verticalAlign: 'middle'
                      }}>
                        {Array.from({ length: 6 }, (_, i) => {
                          const angle = (i * 60) - 90; // 60 degrees per dot (360/6)
                          const x = 12 + 10 * Math.cos(angle * Math.PI / 180);
                          const y = 12 + 10 * Math.sin(angle * Math.PI / 180);
                          
                          // Unique bright colors for each dot
                          const colors = [
                            '#ff0000', // Red
                            '#ff8000', // Orange
                            '#ffff00', // Yellow
                            '#00ff00', // Green
                            '#0080ff', // Light Blue
                            '#8000ff'  // Purple
                          ];
                          
                          return (
                            <span
                              key={i}
                              className="spinner-dot"
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: colors[i],
                                borderRadius: '50%',
                                position: 'absolute',
                                left: `${x}px`,
                                top: `${y}px`,
                                opacity: 0.2,
                                boxShadow: `0 0 3px ${colors[i]}80`,
                                animation: `dot-pulse 2s ease-in-out infinite ${i * 0.3}s`
                              }}
                            />
                          );
                        })}
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

export default AdminSidebar;