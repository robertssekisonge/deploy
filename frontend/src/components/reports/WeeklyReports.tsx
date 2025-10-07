import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import AISuccessNotification from '../common/AISuccessNotification';
import AIWriteReportModal from './AIWriteReportModal';
import { FileText, Calendar, User, Info, Users, Sparkles, Wand2, Rocket, Eye, X, CheckCircle, AlertCircle } from 'lucide-react';
import AdminWeeklyReports from './AdminWeeklyReports';

interface WeeklyReport {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  weekStart: Date;
  weekEnd: Date;
  reportType: 'teacher' | 'user' | 'admin';
  content: string;
  achievements: string[];
  challenges: string[];
  nextWeekGoals: string[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
}

const WeeklyReports: React.FC = () => {
  const { user, refreshCurrentUser } = useAuth();
  const { students, addWeeklyReport, fetchWeeklyReports, weeklyReports } = useData();
  const { showSuccess, showError } = useNotification();
  
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  // Simple error boundary
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Weekly Reports</h1>
        <p className="text-gray-600">Please log in to access weekly reports.</p>
      </div>
    );
  }

  // Load existing weekly reports when component mounts
  useEffect(() => {
    fetchWeeklyReports();
  }, [fetchWeeklyReports]);

  // Update local reports when weeklyReports from context changes
  useEffect(() => {
    setReports(weeklyReports);
    setLoading(false);
  }, [weeklyReports]);





  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCurrentUser();
      showSuccess(
        '🔄 Account Data Refreshed!',
        'Your account data has been refreshed! If you were recently assigned to classes, you should now see them.'
      );
    } catch (error) {
      console.error('Error refreshing user data:', error);
      showError(
        '❌ Data Refresh Failed',
        'Failed to refresh your data. Please try logging out and back in.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERUSER';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER';

  // Get current week dates
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };

  const weekDates = getCurrentWeek();

  const handleSubmitReport = async (reportData: any) => {
    setSubmitting(true);
    
    const newReport = {
      id: Date.now().toString(),
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || '',
      weekStart: weekDates.start.toISOString(),
      weekEnd: weekDates.end.toISOString(),
      reportType: isTeacher ? 'teacher' : 'user',
      content: reportData.content || '',
      achievements: reportData.achievements?.filter((a: string) => a.trim()) || [],
      challenges: reportData.challenges?.filter((c: string) => c.trim()) || [],
      nextWeekGoals: reportData.nextWeekGoals?.filter((g: string) => g.trim()) || [],
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      title: reportData.title || 'Weekly Report',
      category: reportData.category || 'general',
      priority: reportData.priority || 'normal',
      attachments: reportData.attachments || []
    };

    try {
      console.log('🚀 Starting report submission...');
      console.log('📝 Report data:', newReport);
      console.log('👤 User info:', { id: user?.id, name: user?.name, role: user?.role });
      
      // Save to backend
      const savedReport = await addWeeklyReport(newReport);
      console.log('✅ Report saved to backend:', savedReport);
      
      // Close modal
      setShowSubmitForm(false);

      // Show success notification
      setSuccessMessage({
        title: '🎉 Report Submitted Successfully!',
        message: `Your ${reportData.category} report "${reportData.title}" has been submitted successfully. Great work!`
      });
      setShowSuccessNotification(true);
      
      // Refresh the reports list to show the new report
      await fetchWeeklyReports();
        
    } catch (error) {
      console.error('❌ Failed to save report:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showError(
        '❌ Report Submission Failed',
        `Failed to save your weekly report: ${error.message}. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addField = (field: 'achievements' | 'challenges' | 'nextWeekGoals') => {
    setCurrentReport(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const updateField = (field: 'achievements' | 'challenges' | 'nextWeekGoals', index: number, value: string) => {
    setCurrentReport(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const removeField = (field: 'achievements' | 'challenges' | 'nextWeekGoals', index: number) => {
    setCurrentReport(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  // If admin, show admin view
  if (isAdmin) {
    return <AdminWeeklyReports />;
  }

  // Always show the main weekly reports interface for teachers and users
  try {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
          <p className="text-gray-600 mt-1">
            Submit your weekly report to keep administrators updated on your progress
          </p>
        </div>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Wand2 className="h-5 w-5" />
          <span className="font-semibold">Write Report</span>
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {/* Current Week Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Current Week</h3>
        </div>
        <p className="text-blue-700">
          {weekDates.start.toLocaleDateString()} - {weekDates.end.toLocaleDateString()}
        </p>
      </div>

        {/* Backend Status Warning */}
        {/* Removed as per edit hint */}

        {/* Teacher Class Assignments Info */}
        {isTeacher && user?.assignedClasses && (() => {
          try {
            const assignedClasses = typeof user.assignedClasses === 'string' 
              ? JSON.parse(user.assignedClasses) 
              : user.assignedClasses;
            
            if (assignedClasses && assignedClasses.length > 0) {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Your Assigned Classes</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignedClasses.map((assignment: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="font-medium text-green-900">
                          {assignment.className} {assignment.streamName}
                        </div>
                        <div className="text-sm text-green-700">
                          {students.filter(s => s.class === assignment.className && s.stream === assignment.streamName).length} students
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          } catch (error) {
            console.error('Error parsing assignedClasses:', error);
          }
          return null;
        })()}

        {/* Assignment Update Notification for Teachers */}
        {isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Weekly Report Submission</h3>
            </div>
            <p className="text-blue-700 mb-4">
              Submit your weekly report to keep administrators updated on your progress and activities.
            </p>
            <div className="flex items-center space-x-4">
              <AIRefreshButton
                onClick={handleRefresh}
                variant="data"
                size="md"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh My Data'}
              </AIRefreshButton>
            </div>
          </div>
        )}

        {/* AI-Powered Write Report Modal */}
        <AIWriteReportModal
          isOpen={showSubmitForm}
          onClose={() => setShowSubmitForm(false)}
          onSubmit={handleSubmitReport}
          isSubmitting={submitting}
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

      {/* My Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Weekly Reports</h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading reports...</p>
            </div>
          ) : (() => {
            // Filter reports based on user role
            let filteredReports = reports;
            if (!isAdmin) {
              // Non-admin users only see their own reports
              filteredReports = reports.filter(report => String(report.userId) === String(user?.id));
            }
            
            if (filteredReports.length === 0) {
              return (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {isAdmin ? 'No weekly reports submitted yet' : 'You haven\'t submitted any weekly reports yet'}
                  </p>
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report, index) => (
                  <div 
                    key={report.id} 
                    className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelectedReport(report)}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{report.userName}</h4>
                          <p className="text-xs text-gray-600">{report.userRole}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    {/* Date Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-gray-600">
                        {report.submittedAt.toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {report.content.length > 100 ? `${report.content.substring(0, 100)}...` : report.content}
                      </p>
                    </div>

                    {/* Attachments Indicator */}
                    {report.attachments && report.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex -space-x-1">
                          {report.attachments.slice(0, 3).map((attachment: any, idx: number) => (
                            <div key={idx} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {report.attachments.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">+{report.attachments.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{report.attachments.length} attachment(s)</span>
                      </div>
                    )}

                    {/* Tap to View */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium group-hover:text-blue-800">
                        Tap to view full report
                      </span>
                      <Eye className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* AI-Generated Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            {/* AI-Generated Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                    📊 Report Details
                  </h3>
                  <p className="text-blue-100 mt-1 text-sm">
                    {selectedReport.userName} • {selectedReport.userRole} • {selectedReport.submittedAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* AI-Generated User Info Card */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xl font-bold text-white">
                        {selectedReport.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">{selectedReport.userName}</h4>
                      <p className="text-blue-700 font-medium">{selectedReport.userRole}</p>
                      <p className="text-sm text-gray-600">
                        📅 Submitted on {selectedReport.submittedAt.toLocaleDateString()} at {selectedReport.submittedAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-md ${
                        selectedReport.status === 'submitted' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                        selectedReport.status === 'reviewed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white' :
                        'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      }`}>
                        ✅ {selectedReport.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI-Generated Report Period */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200/50 rounded-xl p-5 shadow-lg">
                  <h5 className="font-bold text-purple-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                    📅 Report Period
                  </h5>
                  <p className="text-purple-800 font-semibold text-lg">
                    {selectedReport.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {selectedReport.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* AI-Generated Weekly Summary */}
                <div>
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                    📝 Weekly Summary
                  </h5>
                  <div className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/30 border-2 border-gray-200/50 rounded-xl p-5 shadow-md">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedReport.content}</p>
                  </div>
                </div>

                {/* AI-Generated Achievements */}
                {selectedReport.achievements && selectedReport.achievements.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-2 border-green-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-green-900 mb-4 flex items-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      🎯 Achievements ({selectedReport.achievements.length})
                    </h5>
                    <div className="space-y-3">
                      {selectedReport.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                          <p className="text-green-800 font-medium">{achievement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                      
                {/* AI-Generated Challenges */}
                {selectedReport.challenges && selectedReport.challenges.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-orange-900 mb-4 flex items-center">
                      <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                      ⚠️ Challenges ({selectedReport.challenges.length})
                    </h5>
                    <div className="space-y-3">
                      {selectedReport.challenges.map((challenge, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                          <p className="text-orange-800 font-medium">{challenge}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                      
                {/* AI-Generated Next Week Goals */}
                {selectedReport.nextWeekGoals && selectedReport.nextWeekGoals.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-blue-900 mb-4 flex items-center">
                      <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                      🎯 Next Week Goals ({selectedReport.nextWeekGoals.length})
                    </h5>
                    <div className="space-y-3">
                      {selectedReport.nextWeekGoals.map((goal, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                          <p className="text-blue-800 font-medium">{goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-Generated Attachments */}
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-purple-900 mb-4 flex items-center">
                      <FileText className="h-6 w-6 text-purple-600 mr-2" />
                      📎 Attachments ({selectedReport.attachments.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedReport.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="border-2 border-purple-200/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-48 object-contain bg-gray-50"
                          />
                          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50">
                            <p className="text-sm text-purple-800 font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-purple-600 mt-1">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                    </div>
                  </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('Error rendering WeeklyReports component:', error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Weekly Reports</h1>
        <p className="text-gray-600 mb-4">Something went wrong while loading the weekly reports.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
};

export default WeeklyReports; 