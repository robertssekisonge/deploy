import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import MessageButton from '../../common/MessageButton';
import {
  Home,
  Users,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderOpen
} from 'lucide-react';

interface SecretarySidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SecretarySidebar: React.FC<SecretarySidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  // Secretary/Accountant scope: Admissions + Fee Balances (+ Weekly Reports view), plus Dashboard/Messages/Settings
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Admissions' },
    { path: '/forms', icon: FolderOpen, label: 'Forms' },
    { path: '/financial-management', icon: DollarSign, label: 'Fee Balances' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports' },
    { path: '/messages', icon: null, label: 'Messages' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-fuchsia-50 to-violet-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-fuchsia-200`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-fuchsia-600 to-violet-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-fuchsia-800">Access Restricted</h2>
                <p className="text-xs text-fuchsia-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-fuchsia-50 to-violet-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-fuchsia-200`}
    >
      <div className="p-4 pt-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-fuchsia-600 to-violet-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-fuchsia-900">Secretary Panel</h2>
                <p className="text-xs text-fuchsia-700">Admissions & Balances</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-fuchsia-700 hover:text-fuchsia-900 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav className="mt-3 pb-4 flex-1 overflow-y-auto">
        <div className="px-2">
          {navItems.map((item) => {
            if (item.path === '/messages') {
              return (
                <MessageButton
                  key={item.path}
                  isCollapsed={isCollapsed}
                  className="mb-1"
                />
              );
            }
            const Icon = (item.icon || Home) as any;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-1.5' : 'px-2.5'} py-2.5 text-xs font-medium rounded-md transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer min-h-[40px] ` +
                  (isActive
                    ? 'bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-300 shadow-sm'
                    : 'text-slate-700 bg-white/70 hover:bg-white hover:text-slate-900 hover:shadow-sm')
                }
              >
                {({ isActive }) => (
                  <>
                    {isCollapsed ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-2.5" />
                        <span>{item.label}</span>
                        {isActive && (
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

export default SecretarySidebar;





