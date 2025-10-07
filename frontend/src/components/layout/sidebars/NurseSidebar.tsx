import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRestrictedAccess } from '../../../hooks/useRestrictedAccess';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useClinicModal } from '../../../contexts/ClinicModalContext';
import AIWriteReportModal from '../../reports/AIWriteReportModal';
import AISuccessNotification from '../../common/AISuccessNotification';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  FileText
} from 'lucide-react';

interface NurseSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const NurseSidebar: React.FC<NurseSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  const { addWeeklyReport, fetchWeeklyReports } = useData();
  const { user } = useAuth();
  const { openAddRecordModal } = useClinicModal();
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  const nurseNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/clinic', icon: Stethoscope, label: 'Clinic Records' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Removed legacy sidebar add-record logic; unified add flow is on Clinic page

  const handleSubmitReport = async (reportData: any) => {
    if (!user) return;
    setIsSubmittingReport(true);
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      await addWeeklyReport({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        weekStart: start,
        weekEnd: end,
        reportType: 'user',
        content: reportData.content || '',
        achievements: reportData.achievements?.filter((a: string) => a.trim()) || [],
        challenges: reportData.challenges?.filter((c: string) => c.trim()) || [],
        nextWeekGoals: reportData.nextWeekGoals?.filter((g: string) => g.trim()) || [],
        status: 'submitted',
        submittedAt: now,
        attachments: reportData.attachments || [],
        title: reportData.title || 'Weekly Report',
        category: reportData.category || 'general',
        priority: reportData.priority || 'normal'
      });

      // Ensure local state reflects backend
      if (fetchWeeklyReports) {
        await fetchWeeklyReports();
      }

      setShowReportModal(false);

      // Show success notification
      setSuccessMessage({
        title: '🎉 Report Submitted Successfully!',
        message: `Your ${reportData.category} report "${reportData.title}" has been submitted successfully. Great work!`
      });
      setShowSuccessNotification(true);
    } catch (err) {
      console.error('Submit report failed:', err);
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
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
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 relative`}>
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
          <div className="h-10 w-10 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">EduSystem</h2>
              <p className="text-sm text-gray-500">Nurse Portal</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-6 pb-4">
        <div className="px-3">
          {nurseNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-colors mb-1 group relative transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ` +
                (isActive
                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-400'
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

        {/* Add Record Button - INSTANT OPENING */}
        <div className="px-3 mt-2">
          <button
            onClick={() => {
              // Navigate to clinic page first (if not already there)
              if (window.location.pathname !== '/clinic') {
                navigate('/clinic');
              }
              // Open modal instantly
              openAddRecordModal();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 group relative`}
          >
            <Heart className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Add Record</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Add Record
              </div>
            )}
          </button>
        </div>

        {/* Write Report Button - directly under Add Record */}
        <div className="px-3 mt-2">
          <button
            onClick={() => setShowReportModal(true)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 group relative`}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Write Report</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Write Report
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Removed sidebar Add Record modal in favor of unified clinic form */}

      {/* AI-Powered Write Report Modal */}
      <AIWriteReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
        isSubmitting={isSubmittingReport}
        userRole={user?.role}
      />

      {/* AI Success Notification */}
      <AISuccessNotification
        isOpen={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        title={successMessage.title}
        message={successMessage.message}
        type="report"
        duration={5000}
      />
    </div>
  );
};

export default NurseSidebar;