import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import MessageButton from '../../common/MessageButton';
import { Home, DollarSign, Settings, ChevronLeft, ChevronRight, ClipboardList, BarChart2, User as UserIcon } from 'lucide-react';

interface AccountantSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AccountantSidebar: React.FC<AccountantSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/financial-management', icon: DollarSign, label: 'Financial Mgmt' },
    { path: '/pay-staff', icon: DollarSign, label: 'Pay Staff' },
    { path: '/payment-analysis', icon: BarChart2, label: 'Payment Analysis' },
    { path: '/account-settings', icon: UserIcon, label: 'Account Settings' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports' },
    { path: '/settings?tab=fees', icon: Settings, label: 'Fee Structures' },
    { path: '/messages', icon: null, label: 'Messages' },
  ];

  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-emerald-50 to-teal-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-emerald-200`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-emerald-800">Access Restricted</h2>
                <p className="text-xs text-emerald-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-emerald-50 to-teal-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-emerald-200`}>
      <div className="p-4 pt-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-emerald-900">Accountant Panel</h2>
                <p className="text-xs text-emerald-700">Finance & Structures</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-emerald-700 hover:text-emerald-900 transition-colors" aria-label="Toggle sidebar">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav className="mt-3 pb-4 flex-1 overflow-y-auto">
        <div className="px-2">
          {navItems.map((item) => {
            if (item.path === '/messages') {
              return <MessageButton key={item.path} isCollapsed={isCollapsed} className="mb-1" />;
            }
            const Icon = (item.icon || BarChart2) as any;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-1.5' : 'px-2.5'} py-2.5 text-xs font-medium rounded-md transition-colors mb-1 group relative hover:shadow-md hover:-translate-y-0.5 cursor-pointer min-h-[40px] ` +
                  (isActive ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 shadow-sm' : 'text-slate-700 bg-white/70 hover:bg-white hover:text-slate-900 hover:shadow-sm')
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

export default AccountantSidebar;


