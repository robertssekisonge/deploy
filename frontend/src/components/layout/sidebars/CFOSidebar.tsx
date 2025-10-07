import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  FileText, 
  Settings, 
  MessageSquare,
  Calculator,
  Banknote,
  Building2,
  Wheat,
  Stethoscope,
  Receipt,
  Target
} from 'lucide-react';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';

interface CFOSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const CFOSidebar: React.FC<CFOSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  
  const cfoNavItems = [
    { path: '/cfo/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/payment-analysis', icon: BarChart3, label: 'Payment Analysis' },
    { path: '/weekly-reports', icon: FileText, label: 'Weekly Reports' },
    { path: '/cfo/school-funding', icon: Building2, label: 'School Funding' },
    { path: '/cfo/foundation-funding', icon: Banknote, label: 'Foundation Funding' },
    { path: '/cfo/farm-income', icon: Wheat, label: 'Farm Income' },
    { path: '/cfo/clinic-income', icon: Stethoscope, label: 'Clinic Income' },
    { path: '/cfo/expenditures', icon: Receipt, label: 'Expenditures' },
    { path: '/cfo/financial-statements', icon: FileText, label: 'Financial Statements' },
    { path: '/cfo/analytics', icon: BarChart3, label: 'Financial Analytics' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  // Show restricted access if user has no privileges
  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-purple-50 to-indigo-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-purple-300`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-purple-800">Access Restricted</h2>
                <p className="text-xs text-purple-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center text-purple-600">
            <p className="text-xs">Contact administrator</p>
            <p className="text-xs">to get access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-purple-50 to-indigo-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-purple-200`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Header */}
      <div className="p-4 pt-6 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                  CFO Portal
                </h2>
                <p className="text-xs text-purple-600 font-medium">Financial Management</p>
              </div>
            )}
          </div>
          
          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200 shadow-sm"
          >
            <div className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-600">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
      
      <nav className="mt-6 pb-6 flex-1 overflow-y-auto">
        <div className="px-3 space-y-1">
          {cfoNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:ring-2 hover:ring-purple-200 hover:bg-white ` +
                (isActive
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
                  : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-900')
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${
                    // add friendly colors per section
                    item.label === 'School Funding' ? 'text-purple-600' :
                    item.label === 'Foundation Funding' ? 'text-emerald-600' :
                    item.label === 'Farm Income' ? 'text-orange-500' :
                    item.label === 'Clinic Income' ? 'text-rose-500' :
                    item.label === 'Expenditures' ? 'text-red-500' :
                    item.label === 'Fund Allocation' ? 'text-indigo-600' :
                    item.label === 'Financial Statements' ? 'text-blue-600' :
                    item.label === 'Financial Analytics' ? 'text-teal-600' :
                    item.label === 'Messages' ? 'text-fuchsia-600' :
                    item.label === 'Settings' ? 'text-gray-600' :
                    'text-gray-600'
                  }`} />
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

export default CFOSidebar;
