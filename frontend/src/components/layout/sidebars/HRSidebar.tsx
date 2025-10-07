import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, FileText, Settings, ClipboardList, UserPlus, MessageCircle, DollarSign } from 'lucide-react';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';

interface HRSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const HRSidebar: React.FC<HRSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();

  const navItems = [
    { path: '/hr/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/hr/staff', icon: Users, label: 'Staff' },
    { path: '/hr/forms', icon: FileText, label: 'Forms' },
    { path: '/hr/policy', icon: FileText, label: 'HR Policy' },
    { path: '/hr/customise', icon: Settings, label: 'Customise' },
    { path: '/pay-staff', icon: DollarSign, label: 'Pay Staff' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-pink-50 to-rose-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-rose-300`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-rose-600 to-pink-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-rose-800">Access Restricted</h2>
                <p className="text-xs text-rose-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-pink-50 to-rose-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-rose-200`}>
      <div className="p-4 pt-6 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 bg-gradient-to-br from-rose-600 to-pink-700 rounded-xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 opacity-80 spin-fast"></span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">HR Portal</h2>
                <p className="text-xs text-rose-600 font-medium">Human Resources</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200 shadow-sm">
            <div className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-rose-600">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
      <nav className="mt-6 pb-6 flex-1 overflow-y-auto">
        <div className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg mb-1 group relative transition-colors transition-transform duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:rotate-1 cursor-pointer hover:ring-2 hover:ring-rose-200 hover:bg-white ` +
              (isActive ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-400' : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-900')
            }>
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 transition-transform duration-300 transform ${isActive ? 'text-rose-600' : 'text-gray-600'} group-hover:-rotate-6`} />
                  {!isCollapsed && <span className="ml-3 group-hover:text-gray-900 transition-colors">{item.label}</span>}
                  {isActive && !isCollapsed && (
                    <span className="arrow-dots-circle-container arrow-dots-spinner-rotate" style={{ display: 'inline-block', position: 'relative', width: '18px', height: '18px', marginLeft: '8px', verticalAlign: 'middle' }}>
                      <span className="arrow-dot-circle arrow-dot1-circle"></span>
                      <span className="arrow-dot-circle arrow-dot2-circle"></span>
                      <span className="arrow-dot-circle arrow-dot3-circle"></span>
                      <span className="arrow-dot-circle arrow-dot4-circle"></span>
                      <span className="arrow-dot-circle arrow-dot5-circle"></span>
                    </span>
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

export default HRSidebar;


