import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, FileText, ChevronRight, Eye, Clock, X, CheckCircle, AlertCircle, RefreshCw, Trash2, Archive } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';

interface WeeklyReport {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  weekStart: Date;
  weekEnd: Date;
  reportType: 'user' | 'student' | 'class' | 'general';
  content: string;
  achievements?: string;
  challenges?: string;
  nextWeekGoals?: string;
  attachments?: any[];
  status: 'submitted' | 'approved' | 'rejected' | 'deleted';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  comments?: string;
}

// Helper function to parse JSON strings to arrays
const parseJsonArray = (value: string | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};


interface WeekData {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  reports: WeeklyReport[];
  reportCount: number;
  users: string[];
}

interface MonthData {
  month: string;
  monthName: string;
  weeks: WeekData[];
  isArchived?: boolean;
}

const AdminWeeklyReports: React.FC = () => {
  const { user } = useAuth();
  const { weeklyReports, fetchWeeklyReports, deleteWeeklyReport } = useData();
  const { showSuccess, showError } = useNotification();
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWeekDetails, setShowWeekDetails] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle refresh with AI styling and notifications
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchWeeklyReports) {
        await fetchWeeklyReports();
        showSuccess(
          '🔄 Reports Refreshed!',
          'Weekly reports data has been successfully updated from the database.'
        );
      }
    } catch (error) {
      console.error('Error refreshing reports:', error);
      showError(
        '❌ Refresh Failed',
        'Failed to refresh weekly reports. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process weekly reports from context into monthly data
  useEffect(() => {
    if (weeklyReports && weeklyReports.length > 0) {
      setLoading(true);
      setError(null);
      
      try {
        // Group reports by month and week
        const groupedReports = weeklyReports.reduce((acc, report) => {
        const date = new Date(report.submittedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const weekKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {};
        }
        if (!acc[monthKey][weekKey]) {
          acc[monthKey][weekKey] = [];
        }
        acc[monthKey][weekKey].push(report);
        return acc;
      }, {} as Record<string, Record<string, any[]>>);

      // Transform to array format and check if month should be archived
      const result = Object.entries(groupedReports).map(([month, weeks]) => {
        const monthDate = new Date(month + '-01');
        const now = new Date();
        const isArchived = monthDate.getMonth() < now.getMonth() || monthDate.getFullYear() < now.getFullYear();
        
        return {
          month,
          monthName: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          isArchived,
          weeks: Object.entries(weeks).map(([week, reports]) => ({
            week,
            weekStart: new Date(week),
            weekEnd: new Date(new Date(week).getTime() + 6 * 24 * 60 * 60 * 1000),
            reports,
            reportCount: reports.length,
            users: [...new Set(reports.map(r => r.userName))]
          })).sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
                 };
       }).sort((a, b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime());

       setMonthlyData(result);
       setLoading(false);
      } catch (err) {
        console.error('Error processing weekly reports:', err);
        setError('Failed to process weekly reports data');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [weeklyReports]);

  // Fetch weekly reports on component mount
  useEffect(() => {
    if (fetchWeeklyReports) {
      fetchWeeklyReports();
    }
  }, [fetchWeeklyReports]);

  const handleWeekClick = (week: WeekData) => {
    try {
      setSelectedWeek(week);
      setShowWeekDetails(true);
      setError(null);
    } catch (err) {
      console.error('Error handling week click:', err);
      setError('Failed to open week details');
    }
  };

  const handleReportClick = (report: WeeklyReport) => {
    try {
      setSelectedReport(report);
      setShowReportDetails(true);
      setError(null);
    } catch (err) {
      console.error('Error handling report click:', err);
      setError('Failed to open report details');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteWeeklyReport(reportId);
      
      // Close modals
      setDeleteConfirm(null);
      setShowReportDetails(false);
      
      // Show success message
      showSuccess('Report Deleted', 'Weekly report has been successfully deleted.');
    } catch (error) {
      console.error('Error deleting report:', error);
      showError('Delete Failed', 'Failed to delete report. Please try again.');
    }
  };

  const handleArchiveMonth = (monthKey: string) => {
    setMonthlyData(prev => prev.map(month => 
      month.month === monthKey ? { ...month, isArchived: true } : month
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatWeekRange = (start: Date, end: Date) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weekly reports...</p>
        </div>
      </div>
    );
  }

  // Show error if there's one
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Reports</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (fetchWeeklyReports) fetchWeeklyReports();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Weekly Reports Yet</h2>
          <p className="text-gray-600 mb-4">
            Teachers and users haven't submitted any weekly reports yet. Reports will appear here once they are submitted.
          </p>
          <p className="text-sm text-gray-500">
            Weekly reports are automatically saved to the backend and admins are notified when new reports are submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
        
        {/* AI-Generated Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border border-blue-200"
          title="Refresh weekly reports data"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Reports'}</span>
        </button>
      </div>



      {/* AI-Generated Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Reports Card */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-800">Total Reports</p>
                <p className="text-3xl font-bold text-blue-900">
                  {monthlyData.reduce((sum, month) => 
                    sum + month.weeks.reduce((weekSum, week) => weekSum + week.reportCount, 0), 0
                  )}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-800">Active Users</p>
                <p className="text-3xl font-bold text-green-900">
                  {new Set(monthlyData.flatMap(month => 
                    month.weeks.flatMap(week => week.users)
                  )).size}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Total Weeks Card */}
        <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-md">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-purple-800">Total Weeks</p>
                <p className="text-3xl font-bold text-purple-900">
                  {monthlyData.reduce((sum, month) => sum + month.weeks.length, 0)}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* This Month Card */}
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-orange-800">This Month</p>
                <p className="text-3xl font-bold text-orange-900">
                  {monthlyData[0]?.weeks.reduce((sum, week) => sum + week.reportCount, 0) || 0}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Monthly Reports */}
      <div className="space-y-8">
        {monthlyData.map((month) => (
          <div key={month.month} className={`rounded-xl shadow-sm border ${
            month.isArchived 
              ? 'bg-gray-50 border-gray-300 opacity-75' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${
                    month.isArchived ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {month.monthName}
                    {month.isArchived && <span className="ml-2 text-sm text-gray-400">(Archived)</span>}
                  </h2>
                  <p className={`mt-1 ${
                    month.isArchived ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                {month.weeks.length} week{month.weeks.length !== 1 ? 's' : ''} • {' '}
                {month.weeks.reduce((sum, week) => sum + week.reportCount, 0)} total reports
              </p>
                </div>
                
                {!month.isArchived && (
                  <button
                    onClick={() => handleArchiveMonth(month.month)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Archive this month"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {month.weeks.map((week) => (
                  <div
                    key={week.week}
                    onClick={() => handleWeekClick(week)}
                    className={`rounded-lg p-4 cursor-pointer transition-colors border ${
                      month.isArchived
                        ? 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className={`h-4 w-4 ${
                          month.isArchived ? 'text-gray-500' : 'text-blue-600'
                        }`} />
                        <span className={`font-medium ${
                          month.isArchived ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {formatWeekRange(week.weekStart, week.weekEnd)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          month.isArchived ? 'text-gray-400' : 'text-gray-600'
                        }`}>Reports:</span>
                        <span className={`font-semibold ${
                          month.isArchived ? 'text-gray-500' : 'text-blue-600'
                        }`}>{week.reportCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          month.isArchived ? 'text-gray-400' : 'text-gray-600'
                        }`}>Users:</span>
                        <span className={`font-semibold ${
                          month.isArchived ? 'text-gray-500' : 'text-green-600'
                        }`}>{week.users.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className={`text-xs ${
                          month.isArchived ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {week.users.slice(0, 3).join(', ')}
                          {week.users.length > 3 && ` +${week.users.length - 3} more`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI-Generated Week Details Modal */}
      {showWeekDetails && selectedWeek && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            {/* AI-Generated Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                    📅 Weekly Reports - {formatWeekRange(selectedWeek.weekStart, selectedWeek.weekEnd)}
                  </h3>
                  <p className="text-purple-100 mt-1 text-sm">
                    {selectedWeek.reportCount} reports from {selectedWeek.users.length} users
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowWeekDetails(false);
                    setSelectedWeek(null);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedWeek.reports.map((report) => (
                  <div 
                    key={report.id} 
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    onClick={() => handleReportClick(report)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {report.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{report.userName}</h4>
                          <p className="text-sm text-gray-500">{report.userRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'submitted' ? 'bg-green-100 text-green-800' :
                          report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {report.submittedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Content</h5>
                        <p className="text-gray-700 text-sm line-clamp-2">{report.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {report.achievements && (
                            <span>{parseJsonArray(report.achievements).length} achievements</span>
                          )}
                          {report.challenges && (
                            <span>{parseJsonArray(report.challenges).length} challenges</span>
                          )}
                          {report.nextWeekGoals && (
                            <span>{parseJsonArray(report.nextWeekGoals).length} goals</span>
                          )}
                          {report.attachments && report.attachments.length > 0 && (
                            <span className="text-blue-600 font-medium">
                              📎 {report.attachments.length} attachment(s)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">Click to view details</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(selectedReport.id)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-100 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 border border-red-300/30"
                    title="Delete this report"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                    {formatWeekRange(selectedReport.weekStart, selectedReport.weekEnd)}
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
                {selectedReport.achievements && (
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-2 border-green-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-green-900 mb-4 flex items-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      🎯 Achievements ({parseJsonArray(selectedReport.achievements).length})
                    </h5>
                    <div className="space-y-3">
                      {parseJsonArray(selectedReport.achievements).map((achievement, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                          <p className="text-green-800 font-medium">{achievement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                      
                {/* AI-Generated Challenges */}
                {selectedReport.challenges && (
                  <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-orange-900 mb-4 flex items-center">
                      <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                      ⚠️ Challenges ({parseJsonArray(selectedReport.challenges).length})
                    </h5>
                    <div className="space-y-3">
                      {parseJsonArray(selectedReport.challenges).map((challenge, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                          <p className="text-orange-800 font-medium">{challenge}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                      
                {/* AI-Generated Next Week Goals */}
                {selectedReport.nextWeekGoals && (
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-xl p-5 shadow-lg">
                    <h5 className="font-bold text-blue-900 mb-4 flex items-center">
                      <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                      🎯 Next Week Goals ({parseJsonArray(selectedReport.nextWeekGoals).length})
                    </h5>
                    <div className="space-y-3">
                      {parseJsonArray(selectedReport.nextWeekGoals).map((goal, index) => (
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Delete Report</h3>
                  <p className="text-red-100 text-sm">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this weekly report? This will permanently remove it from the system.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeleteReport(deleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Delete Report
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWeeklyReports; 