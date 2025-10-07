import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  DollarSign, 
  ShoppingCart, 
  ClipboardList, 
  Wrench, 
  Building, 
  MessageSquare, 
  Settings,
  BarChart3,
  FileText,
  Users,
  Calendar,
  Package,
  Truck,
  Hammer
} from 'lucide-react';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import { useData } from '../../../contexts/DataContext';

interface OPMSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const OPMSidebar: React.FC<OPMSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  const { addWeeklyReport, fetchWeeklyReports } = useData();
  const { user } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  const opmNavItems = useMemo(() => [
    { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'text-blue-600' },
    { path: '/opm-budget-management', icon: DollarSign, label: 'Budget Management', color: 'text-green-600' },
    { path: '/opm-expense-management', icon: BarChart3, label: 'Expense Management', color: 'text-red-600' },
    { path: '/opm-purchasing', icon: ShoppingCart, label: 'Purchasing System', color: 'text-purple-600' },
    { path: '/opm-tasks', icon: ClipboardList, label: 'Task Management', color: 'text-orange-600' },
    { path: '/opm-construction', icon: Hammer, label: 'Construction & Renovation', color: 'text-yellow-600' },
    { path: '/opm-facilities', icon: Building, label: 'Facilities Management', color: 'text-indigo-600' },
    { path: '/opm-inventory', icon: Package, label: 'Inventory & Equipment', color: 'text-teal-600' },
    { path: '/opm-contractors', icon: Users, label: 'Contractor Management', color: 'text-pink-600' },
    { path: '/opm-reports', icon: FileText, label: 'Operations Reports', color: 'text-cyan-600' },
    { path: '/opm-schedule', icon: Calendar, label: 'Operations Schedule', color: 'text-lime-600' },
    { path: '/opm-logistics', icon: Truck, label: 'Logistics & Transport', color: 'text-amber-600' },
    { path: '/weekly-reports', icon: ClipboardList, label: 'Weekly Reports', color: 'text-sky-600' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', color: 'text-rose-600' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-zinc-600' }
  ], []);

  // Memoize the collapse handler to prevent unnecessary re-renders
  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Memoize the className function to prevent recreation on every render
  const getNavLinkClassName = useCallback((path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105' 
        : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 hover:shadow-md hover:transform hover:scale-105'
    }`;
  }, [location.pathname]);

  const handleWeeklyReportSubmit = async (reportData: any) => {
    setIsSubmittingReport(true);
    try {
      await addWeeklyReport(reportData);
      setSuccessMessage({
        title: 'Weekly Report Submitted',
        message: 'Your weekly operations report has been submitted successfully!'
      });
      setShowSuccessNotification(true);
      setShowReportModal(false);
      setTimeout(() => setShowSuccessNotification(false), 5000);
    } catch (error) {
      console.error('Error submitting weekly report:', error);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (shouldShowRestrictedAccess) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-orange-50 to-red-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-orange-200`}>
        <div className="p-4 pt-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-orange-600 to-red-700 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🔒</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-orange-800">Access Restricted</h2>
                <p className="text-xs text-orange-600">No privileges assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-orange-50 to-red-100 shadow-2xl transition-all duration-300 relative h-full flex flex-col border-r border-orange-200`}>
      {/* Header */}
      <div className="p-4 pt-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-gradient-to-r from-orange-600 to-red-700 rounded-md flex items-center justify-center shadow-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-orange-800">Operations Manager</h2>
                <p className="text-xs text-orange-600">OPM Portal</p>
              </div>
            )}
          </div>
          <button
            onClick={handleCollapseToggle}
            className="p-1.5 rounded-lg bg-white/50 hover:bg-white/70 transition-colors duration-200"
          >
            <div className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-orange-600">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {opmNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={getNavLinkClassName(item.path)}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-orange-200/50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'O'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-800 truncate">
                {user?.name || 'Operations Manager'}
              </p>
              <p className="text-xs text-orange-600 truncate">OPM</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="absolute bottom-4 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">{successMessage.title}</p>
              <p className="text-xs opacity-90">{successMessage.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OPMSidebar;
