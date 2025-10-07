
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../common/NotificationProvider';
import { useAINotification } from '../../contexts/AINotificationContext';
import { useRestrictedAccess } from '../../hooks/useRestrictedAccess';
import RestrictedAccess from '../common/RestrictedAccess';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Calendar, 
  X, 
  Eye, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Heart,
  BookOpen,
  Clock,
  Award,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import StudentReportCard from '../reports/StudentReportCard';
import SimpleModal from './SimpleModal';
import PaymentModal from './PaymentModal';

// Colorful and vibrant chart component
const PaymentChart = memo(({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <defs>
          <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6"/>
            <stop offset="50%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#06B6D4"/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280" 
          fontSize={12}
          fontWeight="600"
          tick={{ fill: '#4B5563' }}
        />
        <YAxis 
          stroke="#6B7280" 
          fontSize={12}
          fontWeight="600"
          tick={{ fill: '#4B5563' }}
          tickFormatter={(value) => `${(value / 1000)}K`}
        />
        <Tooltip 
          contentStyle={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'Payment Amount']}
          labelStyle={{ 
            color: '#374151', 
            fontWeight: '600',
            fontSize: '14px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="url(#lineGradient)" 
          strokeWidth={4}
          dot={{ 
            fill: '#8B5CF6', 
            stroke: '#FFFFFF', 
            strokeWidth: 3, 
            r: 8,
            filter: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3))'
          }}
          activeDot={{ 
            r: 12, 
            stroke: '#8B5CF6', 
            strokeWidth: 3,
            fill: '#FFFFFF',
            filter: 'drop-shadow(0 6px 12px rgba(139, 92, 246, 0.4))'
          }}
          fill="url(#paymentGradient)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

const AttendanceChart = memo(({ data }: { data: any[] }) => (
  <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
    <RechartsPieChart width={360} height={240}>
      <Pie
        data={data}
        cx={180}
        cy={120}
        innerRadius={60}
        outerRadius={100}
        paddingAngle={5}
        dataKey="value"
        isAnimationActive={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      />
    </RechartsPieChart>
  </div>
));

const ParentDashboard: React.FC = React.memo(() => {
  const { user, refreshCurrentUser, isLoggingOut } = useAuth();
  const { students, attendanceRecords, financialRecords, billingTypes, forceRefresh, settings, fetchStudents, fetchAttendanceRecords, fetchBillingTypes, fetchFinancialRecords } = useData();
  const { showSuccess, showError } = useNotification();
  const { showInfo: showAINotification } = useAINotification();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 ParentDashboard: Manual refresh triggered...');
      await Promise.all([
        fetchStudents(),
        fetchAttendanceRecords(),
        fetchBillingTypes(),
        fetchFinancialRecords()
      ]);
      showSuccess('🔄 Dashboard Refreshed!', 'All data has been updated successfully!', 3000);
    } catch (error) {
      console.error('❌ ParentDashboard: Error refreshing data:', error);
      showError('Refresh Failed', 'Failed to refresh dashboard data. Please try again.', 4000);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStudents, fetchAttendanceRecords, fetchBillingTypes, fetchFinancialRecords, showSuccess, showError]);

  // Load all data immediately when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 ParentDashboard: Loading data immediately...');
        setIsFetchingPaymentSummaries(true);
        
        // Load all basic data first
        await Promise.all([
          fetchStudents(),
          fetchAttendanceRecords(),
          fetchBillingTypes(),
          fetchFinancialRecords()
        ]);
        
        console.log('✅ ParentDashboard: Basic data loaded successfully');
      } catch (error) {
        console.error('❌ ParentDashboard: Error loading data:', error);
        showError('Data Loading Failed', 'Failed to load dashboard data. Please refresh the page.', 4000);
      } finally {
        setIsFetchingPaymentSummaries(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchStudents, fetchAttendanceRecords, fetchBillingTypes, fetchFinancialRecords, showError]);

  // Generate printable report card HTML
  const generatePrintableReportCard = (student: any, settings: any) => {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-info { display: flex; align-items: center; }
          .school-logo { width: 60px; height: 60px; border-radius: 50%; background: #6d28d9; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-right: 15px; }
          .school-name { font-size: 18px; font-weight: bold; }
          .school-details { font-size: 12px; color: #666; }
          .report-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .info-section h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .info-label { font-weight: bold; }
          .attendance-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .attendance-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .marks-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .marks-table th, .marks-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .marks-table th { background-color: #f5f5f5; font-weight: bold; }
          .summary-row { background-color: #f9f9f9; font-weight: bold; }
          .comments-section { margin: 20px 0; }
          .comment-box { border: 1px solid #ddd; padding: 10px; margin: 10px 0; min-height: 60px; }
          .signature-line { border-bottom: 1px solid #333; width: 200px; margin: 10px 0; }
          .promotion-status { background-color: #dc2626; color: white; padding: 10px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-info">
            <div class="school-logo">${settings?.schoolName?.charAt(0) || 'S'}</div>
            <div>
              <div class="school-name">${settings?.schoolName || 'SCHOOL NAME'}</div>
              <div class="school-details">${settings?.schoolAddress || 'School Address'}</div>
              <div class="school-details">Email: ${settings?.schoolEmail || 'Email Address'}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px;">Date: ${currentDate}</div>
          </div>
        </div>

        <div class="report-title">2025 Term 1 REPORT SHEET</div>

        <div class="student-info">
          <div class="info-section">
            <h3>STUDENT'S PERSONAL DATA</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${student.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date of Birth:</span>
              <span>${student.dateOfBirth || 'CF112233445566'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sex:</span>
              <span>${student.gender || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Class:</span>
              <span>${student.class}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Stream:</span>
              <span>${student.stream || 'A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Access Number:</span>
              <span>${student.accessNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Parent:</span>
              <span>${student.parentName || ''}</span>
            </div>
          </div>

          <div class="attendance-section">
            <h3>ATTENDANCE</h3>
            <div class="attendance-row">
              <span>No. of Times School Opened:</span>
              <span>0</span>
            </div>
            <div class="attendance-row">
              <span>No. of Times Present:</span>
              <span>0</span>
            </div>
            <div class="attendance-row">
              <span>No. of Times Absent:</span>
              <span>0</span>
            </div>
          </div>
        </div>

        <table class="marks-table">
          <thead>
            <tr>
              <th>SUBJECT</th>
              <th>MARKS</th>
              <th>GRADE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="3" style="text-align: center; padding: 20px; color: #666;">No marks recorded yet</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td>Total Marks:</td>
              <td></td>
              <td></td>
            </tr>
            <tr class="summary-row">
              <td>Percentage:</td>
              <td>%</td>
              <td></td>
            </tr>
            <tr class="summary-row">
              <td>Grade:</td>
              <td></td>
              <td></td>
            </tr>
            <tr class="summary-row">
              <td>Position:</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="comments-section">
          <h3>Class Teacher's Comments:</h3>
          <div class="comment-box">Student shows good potential. Continue working hard.</div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <div>
              <div>Sign.: <span class="signature-line"></span></div>
            </div>
            <div>Date: ${currentDate}</div>
          </div>

          <h3>HeadTeacher's Comments:</h3>
          <div class="comment-box">Keep up the good work.</div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <div>
              <div>Sign.: <span class="signature-line"></span></div>
            </div>
            <div>Date: ${currentDate}</div>
          </div>
        </div>

        <div class="promotion-status">Promotion Status: PROMOTED</div>

        <div class="footer">
          <p><strong>${settings?.schoolName || 'SCHOOL NAME'}</strong></p>
          <p>${settings?.schoolAddress || ''}${settings?.schoolPOBox ? ` | ${settings.schoolPOBox}` : ''}${settings?.schoolDistrict ? ` | ${settings.schoolDistrict}` : ''}${settings?.schoolRegion ? ` | ${settings.schoolRegion}` : ''}${settings?.schoolCountry ? ` | ${settings.schoolCountry}` : ''}</p>
          <p>${settings?.schoolPhone || ''}${settings?.schoolPhone && settings?.schoolEmail ? ' | ' : ''}${settings?.schoolEmail || ''}${settings?.schoolWebsite ? ` | ${settings.schoolWebsite}` : ''}</p>
          ${settings?.schoolRegistrationNumber ? `<p>Registration: ${settings.schoolRegistrationNumber}</p>` : ''}
          ${settings?.schoolLicenseNumber ? `<p>License: ${settings.schoolLicenseNumber}</p>` : ''}
          ${settings?.schoolTaxNumber ? `<p>${settings.schoolTaxNumber}</p>` : ''}
          <p><em>${settings?.schoolMotto || ''}</em></p>
        </div>
      </body>
      </html>
    `;
  };
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { shouldShowRestrictedAccess } = useRestrictedAccess();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [attendancePeriod, setAttendancePeriod] = useState<'week' | '2weeks' | 'month'>('week');
  const [paymentSummaries, setPaymentSummaries] = useState<Record<string, any>>({});
  const [lastAttendanceCount, setLastAttendanceCount] = useState(0);
  const [isFetchingPaymentSummaries, setIsFetchingPaymentSummaries] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Check if user can see sponsorship status
  const canSeeSponsorshipStatus = (userRole: string) => {
    return ['ADMIN', 'SUPERUSER', 'SPONSORSHIPS_OVERSEER', 'sponsorships-overseer', 'SPONSORSHIP-OVERSEER', 'SPONSORSHIPS-OVERSEER'].includes(userRole);
  };
  
  useEffect(() => {
    if (user?.role === 'PARENT' && !isLoggingOut) {
      refreshCurrentUser().catch(error => {
        console.error('Failed to refresh parent user data:', error);
      });
    }
  }, [user?.id, refreshCurrentUser, isLoggingOut]);

  // Auto-refresh attendance data when new records are added
  useEffect(() => {
    if (user?.role === 'PARENT' && !isLoggingOut) {
      const interval = setInterval(() => {
        // Refresh attendance data every 30 seconds to catch new records
        forceRefresh().catch(error => {
          console.error('Failed to refresh attendance data:', error);
        });
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user?.role, forceRefresh, isLoggingOut]);

  // Detect new attendance records and show notification
  useEffect(() => {
    if (attendanceRecords && attendanceRecords.length > lastAttendanceCount && lastAttendanceCount > 0) {
      const newRecordsCount = attendanceRecords.length - lastAttendanceCount;
      showAINotification(`📊 ${newRecordsCount} new attendance record(s) added!`, 3000);
    }
    setLastAttendanceCount(attendanceRecords?.length || 0);
  }, [attendanceRecords, lastAttendanceCount, showAINotification]);

  // (moved below getMyChildren to avoid TDZ crash)

  // Auto-refresh payment data every 60 seconds to show real-time admin updates (reduced frequency)
  useEffect(() => {
    if (user?.role === 'PARENT' && !isLoggingOut) {
      const interval = setInterval(() => {
        refreshCurrentUser().catch(error => {
          console.error('Failed to refresh payment data:', error);
        });
      }, 60000); // Refresh every 60 seconds (reduced from 30 seconds)
      
      return () => clearInterval(interval);
    }
  }, [user?.role, refreshCurrentUser, isLoggingOut]);
  
  const getMyChildren = useMemo(() => {
    if (!user || !students) return [];

    // 1) Try studentIds on the user (normalize to string array)
    try {
      let assignedIds: string[] = [];
      if (user.studentIds) {
        const raw = typeof user.studentIds === 'string' ? JSON.parse(user.studentIds) : user.studentIds;
        if (Array.isArray(raw)) {
          assignedIds = raw.map((id: any) => id?.toString());
        }
      }

      // 2) If none, try localStorage fallback saved by admin assignment UI
      if ((!assignedIds || assignedIds.length === 0) && user.id) {
        try {
          const stored = localStorage.getItem('parentAssignments');
          if (stored) {
            const map = JSON.parse(stored) as Record<string, string[]>;
            const fallbackIds = map[user.id] || [];
            assignedIds = fallbackIds.map((id: any) => id?.toString());
          }
        } catch (_e) {}
      }

      if (assignedIds && assignedIds.length > 0) {
        const assignedStudents = students.filter(student => assignedIds.includes(student.id?.toString()));
        if (assignedStudents.length > 0) return assignedStudents;
      }
    } catch (error) {
      console.error('Error resolving assigned students for parent:', error);
    }

    // 3) Legacy fallback by matching parent email on student object
    const fallbackStudents = students.filter(student => student.parent?.email === user?.email);
    return fallbackStudents;
  }, [user, students]);

  // Fetch live payment summaries so amounts match Admin view (placed after getMyChildren)
  useEffect(() => {
    const controller = new AbortController();
    const fetchSummary = async (studentId: string | number) => {
      try {
        const res = await fetch((await import('../../utils/api')).buildApiUrl(`payments/student/${studentId}/summary`), { signal: controller.signal });
        if (!res.ok) return null;
        const summary = await res.json();
        return { studentId: String(studentId), summary };
      } catch (_e) {
        return null;
      }
    };
    
    const fetchAllSummaries = async () => {
      if (Array.isArray(getMyChildren) && getMyChildren.length > 0) {
        setIsFetchingPaymentSummaries(true);
        try {
          const results = await Promise.all(getMyChildren.map((child: any) => child?.id && fetchSummary(child.id)));
          
          // Only update state if we have valid results and they're different from current state
          const validResults = results.filter(result => result !== null);
          if (validResults.length > 0) {
            setPaymentSummaries(prev => {
              let hasChanges = false;
              const newSummaries = { ...prev };
              
              validResults.forEach(({ studentId, summary }) => {
                const currentSummary = prev[studentId];
                if (!currentSummary || 
                    currentSummary.totalFeesRequired !== summary.totalFeesRequired ||
                    currentSummary.totalPaid !== summary.totalPaid ||
                    currentSummary.balance !== summary.balance) {
                  newSummaries[studentId] = summary;
                  hasChanges = true;
                }
              });
              
              return hasChanges ? newSummaries : prev;
            });
          }
          
          setHasLoadedOnce(true); // Mark that we've loaded data once
        } catch (_e) {}
        setIsFetchingPaymentSummaries(false);
      } else {
        setIsFetchingPaymentSummaries(false);
        setHasLoadedOnce(true);
      }
    };
    
    // Only fetch if we haven't loaded once or if children list changed
    if (!hasLoadedOnce || (Array.isArray(getMyChildren) && getMyChildren.length > 0)) {
      fetchAllSummaries();
    }
    
    return () => controller.abort();
  }, [getMyChildren, user?.id, hasLoadedOnce]);

  // Simple total balance calculation - no flickering
  const totalBalance = useMemo(() => {
    // Show loading only if we're actively fetching and haven't loaded once
    if (isFetchingPaymentSummaries && !hasLoadedOnce) {
      return null; // Keep showing loading until we have data
    }
    
    // If we have no children, show 0 immediately
    if (!getMyChildren || getMyChildren.length === 0) {
      return 0;
    }
    
    // Calculate balance only if we have payment summaries
    let sum = 0;
    let hasAnyData = false;
    
    getMyChildren.forEach((c: any) => {
      const s = paymentSummaries[String(c.id)];
      if (s && s.balance !== undefined && s.balance !== null) {
        sum += Number(s.balance || 0);
        hasAnyData = true;
      }
    });
    
    // If we have children but no payment data yet, show loading
    if (!hasAnyData && hasLoadedOnce) {
      return 0; // Show 0 if we've loaded but have no payment data
    }
    
    return sum;
  }, [paymentSummaries, getMyChildren, isFetchingPaymentSummaries, hasLoadedOnce]);
  
  const getMyChildrenAttendance = useMemo(() => {
    return (attendanceRecords || []).filter(record => 
      getMyChildren.some(child => String(child.id) === String(record.studentId))
    );
  }, [attendanceRecords, getMyChildren]);
  
  const getAttendanceForPeriod = useMemo(() => {
    return (studentId: string) => {
      const now = new Date();
      let startDate = new Date();
      
      switch (attendancePeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case '2weeks':
          startDate.setDate(now.getDate() - 14);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      return (attendanceRecords || []).filter(record => 
        String(record.studentId) === String(studentId) && 
        new Date(record.date) >= startDate
      );
    };
  }, [attendanceRecords, attendancePeriod]);

  // Function to get all attendance records for a specific child (for reports)
  const getChildAttendanceRecords = useMemo(() => {
    return (studentId: string) => {
      return (attendanceRecords || []).filter(record => 
        record.studentId === studentId
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
  }, [attendanceRecords]);

  // Stable payment data - simplified to prevent flickering
  const paymentData = useMemo(() => {
    // For now, use static sample data to verify chart works
    const sampleData = [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 }
    ];
    
    console.log('📈 Using sample payment data:', sampleData);
    return sampleData;
  }, []); // Empty dependency array for stability

  const attendanceData = getMyChildrenAttendance;
  const presentCountForRate = useMemo(() => {
    return attendanceData.filter(r => r.status === 'present').length;
  }, [attendanceData]);
  
  const attendancePieData = useMemo(() => {
    const presentCount = attendanceData.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.filter(r => r.status === 'absent').length;
    const lateCount = attendanceData.filter(r => r.status === 'late').length;
    
    return [
      { name: 'Present', value: presentCount, color: '#10B981' },
      { name: 'Absent', value: absentCount, color: '#EF4444' },
      { name: 'Late', value: lateCount, color: '#F59E0B' }
    ];
  }, [attendanceData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':

        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">My Children</p>
                    <p className="text-3xl font-black text-gray-900">{getMyChildren.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-black text-gray-900">
                      {attendanceData.length > 0 
                        ? Math.round((presentCountForRate / attendanceData.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-pink-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Total Balance</p>
                    {totalBalance === null ? (
                      <p className="text-3xl font-black text-gray-400">Loading...</p>
                    ) : (
                      <p className="text-3xl font-black text-gray-900">UGX {Number(totalBalance || 0).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Line Chart */}
              <div className="bg-gradient-to-br from-white/95 via-purple-50/40 to-blue-50/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/30 p-6 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Payment History</h3>
                    <p className="text-sm text-gray-600 font-medium">Monthly payment trends</p>
                  </div>
                </div>
                <div className="h-64 bg-gradient-to-br from-purple-50/20 to-blue-50/20 rounded-xl p-4 border border-purple-100/50">
                  <PaymentChart data={paymentData} />
                </div>
              </div>

              {/* Attendance Pie Chart */}
              <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Attendance Overview</h3>
                  <button
                    onClick={() => {
                      forceRefresh();
                      showAINotification('📊 Attendance data refreshed!', 2000);
                    }}
                    className="ml-auto px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="h-64">
                  <AttendanceChart data={attendancePieData} />
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  {attendancePieData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'children':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Children</h2>
                  <p className="text-gray-600 font-medium">Manage and view your children's information</p>
                </div>
              </div>
            </div>
            
            {getMyChildren.length === 0 ? (
              <div className="bg-gradient-to-br from-white/90 via-gray-50/30 to-blue-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-12 text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">No Children Assigned</h3>
                <p className="text-gray-600 font-medium">Contact the school administration to get your children assigned to your account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getMyChildren.map((child) => (
                  <div key={child.id} className="bg-gradient-to-br from-white/95 via-blue-50/20 to-purple-50/20 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 group">
                    {/* Child Avatar and Basic Info */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-black text-xl">
                          {child.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-gray-900 mb-1">{child.name}</h4>
                        <p className="text-sm font-medium text-gray-600">{child.class} - {child.stream}</p>
                      </div>
                    </div>
                    
                    {/* Child Details */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Access Number:</span>
                          <span className="font-black text-gray-900">{child.accessNumber}</span>
                      </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50">
                      {canSeeSponsorshipStatus(user?.role || '') && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Status:</span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          child.sponsorshipStatus === 'sponsored' 
                              ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300' 
                              : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300'
                        }`}>
                          {child.sponsorshipStatus === 'sponsored' ? 'Sponsored' : 'Private'}
                        </span>
                      </div>
                      )}
                    </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          console.log('Details button clicked for student:', child.name);
                          setSelectedStudent(child);
                          setShowStudentDetails(true);
                          console.log('Modal state set to show');
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(child);
                          setShowPaymentDetails(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Payment</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Daily Attendance</h2>
                  <p className="text-gray-600 mt-1">Track your child's daily school attendance</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setAttendancePeriod('week')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      attendancePeriod === 'week' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setAttendancePeriod('2weeks')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      attendancePeriod === '2weeks' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    Last 2 Weeks
                  </button>
                  <button
                    onClick={() => setAttendancePeriod('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      attendancePeriod === 'month' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    Last Month
                  </button>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Period</p>
                      <p className="text-lg font-bold text-blue-800">
                        {attendancePeriod === 'week' ? 'This Week' : 
                         attendancePeriod === '2weeks' ? 'Last 2 Weeks' : 'Last Month'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Days</p>
                      <p className="text-lg font-bold text-green-800">
                        {getMyChildren.reduce((total, child) => {
                          const periodAttendance = getAttendanceForPeriod(child.id);
                          return total + periodAttendance.length;
                        }, 0)}
                        </p>
                      </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Children</p>
                      <p className="text-lg font-bold text-purple-800">{getMyChildren.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {getMyChildren.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Assigned</h3>
                <p className="text-gray-600">Contact the school administration to get your children assigned to your account.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {getMyChildren.map((child) => (
                  <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {child.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                                             <div>
                         <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                         <p className="text-sm text-gray-600">{child.class} - {child.stream}</p>
            </div>
          </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700">
                        {attendancePeriod === 'week' ? 'Last Week' : 
                         attendancePeriod === '2weeks' ? 'Last 2 Weeks' : 'Last Month'} Attendance
                      </h4>
                      
                      {(() => {
                        const periodAttendance = getAttendanceForPeriod(child.id);
                        const presentCount = periodAttendance.filter(r => r.status === 'present').length;
                        const absentCount = periodAttendance.filter(r => r.status === 'absent').length;
                        const lateCount = periodAttendance.filter(r => r.status === 'late').length;
                        const totalDays = periodAttendance.length;
                        
                        if (totalDays === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
                              <Calendar className="h-12 w-12 mx-auto mb-4" />
                              <p>No attendance records found for this period</p>
          </div>
        );
                        }
      
        return (
                          <>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                              <h5 className="text-sm font-semibold text-blue-800 mb-3 text-center">Daily Attendance Calendar</h5>
                              <div className="grid grid-cols-7 gap-3">
                                {periodAttendance.slice(-7).map((record, index) => (
                                  <div key={record.id} className="text-center">
                                    <div className="text-xs font-medium text-blue-700 mb-2">
                                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200 ${
                                      record.status === 'present' 
                                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-200' 
                                        : record.status === 'late'
                                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200'
                                          : 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-200'
                                    }`}>
                                      {record.status === 'present' ? '✓' : record.status === 'late' ? '⏰' : '✗'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2 font-medium">
                                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3 text-center">Attendance Summary</h5>
                              <div className="grid grid-cols-4 gap-6">
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                  </div>
                                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                                  <p className="text-sm text-gray-600 font-medium">Present Days</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Clock className="h-6 w-6 text-white" />
                                  </div>
                                  <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
                                  <p className="text-sm text-gray-600 font-medium">Late Days</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Calendar className="h-6 w-6 text-white" />
                                  </div>
                                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                                  <p className="text-sm text-gray-600 font-medium">Absent Days</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Users className="h-6 w-6 text-white" />
                                  </div>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0}%
                                  </p>
                                  <p className="text-sm text-gray-600 font-medium">Attendance Rate</p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-updating every 30 seconds</span>
              </div>
            </div>
            
            {getMyChildren.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Assigned</h3>
                <p className="text-gray-600">Contact the school administration to get your children assigned to your account.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {getMyChildren.map((child) => {
                  const summary = paymentSummaries[String(child.id)];
                  // Always use paymentBreakdown from backend as it's already filtered by residence type
                  let originalFees = (summary?.paymentBreakdown && summary.paymentBreakdown.length > 0)
                    ? (summary.paymentBreakdown || []).map((it: any) => ({ name: it.billingType, amount: Number(it.required || 0), frequency: it.frequency, term: it.term, year: it.year }))
                    : (billingTypes || []).filter((bt: any) => bt.className === child.class).map((bt: any) => ({ name: bt.name, amount: Number(bt.amount || 0), frequency: bt.frequency, term: bt.term, year: bt.year }));
                  // No hardcoded fallbacks - use only database data
                  if (!originalFees || originalFees.length === 0) {
                    console.log('⚠️ No fee structure found in database for class:', child.class);
                    originalFees = [];
                  }
                  const computedRequired = originalFees.reduce((s: number, it: any) => s + Number(it.amount || 0), 0);
                  const totalRequired = (Number(summary?.totalFeesRequired) > 0) ? Number(summary?.totalFeesRequired) : computedRequired;
                  const paidAmount = Number(summary?.totalPaid || 0);
                  // Always compute balance from required - paid to avoid stale backend values
                  const balance = Math.max(0, totalRequired - paidAmount);
                  const normalize = (name: string) => (name || '').toString().trim().toLowerCase();
                  const paidByType: Record<string, number> = {};
                  try {
                    const recs = (summary?.financialRecords || summary?.records || []) as any[];
                    recs.forEach(r => {
                      const key = normalize(r.billingType || r.type || '');
                      if (!key) return;
                      paidByType[key] = (paidByType[key] || 0) + Number(r.amount || 0);
                    });
                  } catch (_e) {}
                  
                  return (
                    <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {child.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-600">{child.class} - {child.stream}</p>
                          <p className="text-xs text-gray-500">Access: {child.accessNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Original Fees Panel */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-4">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <h4 className="text-lg font-semibold text-purple-800">Original Fees</h4>
                          </div>
                          <div className="space-y-3">
                            {(originalFees || []).map((fee: any) => (
                              <div key={`${fee.name}-${fee.amount}`} className="bg-white rounded-lg p-3 border border-purple-100">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-purple-800">{fee.name}</p>
                                    <p className="text-xs text-purple-600">{fee.frequency} • {fee.term} {fee.year}</p>
                                  </div>
                                  <span className="font-bold text-purple-800">UGX {Number(fee.amount || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                            
                            <div className="border-t border-purple-200 pt-3">
                              <div className="flex justify-between">
                                <span className="font-bold text-purple-800">Total Required:</span>
                                <span className="font-bold text-purple-800">UGX {Number(totalRequired || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Already Paid Panel */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center space-x-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h4 className="text-lg font-semibold text-green-800">Already Paid</h4>
                          </div>
                          <div className="space-y-3">
                            {paidAmount === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-green-700 text-lg">No payments made yet</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Show detailed payment breakdown for each fee type */}
                                {originalFees.map((fee: any) => {
                                  const feeName = fee.name;
                                  const required = Number(fee.amount || 0);
                                  const paid = Number(paidByType[normalize(feeName)] || 0);
                                  const isPaid = paid > 0;
                                  const isFullyPaid = paid >= required;
                                  
                                  return (
                                    <div key={feeName} className="bg-white rounded-lg p-3 border border-green-100">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-green-800">{feeName}</p>
                                          <p className="text-xs text-green-600">
                                            {isPaid ? (
                                              isFullyPaid ? 'Fully Paid' : `UGX ${paid.toLocaleString()} of ${required.toLocaleString()}`
                                            ) : 'Not paid'}
                                          </p>
                                        </div>
                                        <span className="font-bold text-green-800">UGX {paid.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {/* Show additional payments if total paid exceeds sum of individual fees */}
                                {(() => {
                                  const individualPaidTotal = originalFees.reduce((sum: number, fee: any) => {
                                    return sum + Number(paidByType[normalize(fee.name)] || 0);
                                  }, 0);
                                  const additionalPaid = paidAmount - individualPaidTotal;
                                  
                                  if (additionalPaid > 0) {
                                    return (
                                      <div className="bg-white rounded-lg p-3 border border-green-100">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium text-green-800">Additional Payment</p>
                                            <p className="text-xs text-green-600">Extra payment received</p>
                                          </div>
                                          <span className="font-bold text-green-800">UGX {additionalPaid.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            
                            <div className="border-t border-green-200 pt-3">
                              <div className="flex justify-between">
                                <span className="font-bold text-green-800">Total Paid:</span>
                                <span className="font-bold text-green-800">UGX {paidAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Balance Remaining Panel (live per-fee remaining) */}
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center space-x-2 mb-4">
                            <DollarSign className="h-5 w-5 text-orange-600" />
                            <h4 className="text-lg font-semibold text-orange-800">Balance Remaining</h4>
                          </div>
                          <div className="space-y-3">
                            {(() => {
                              const findAmount = (type: string) => {
                                const f = originalFees.find((fee: any) => normalize(fee.name) === normalize(type));
                                return Number((f && f.amount) || 0);
                              };
                              // If backend already provides breakdown with remaining, use it directly
                              const adjusted = (summary?.paymentBreakdown && summary.paymentBreakdown.length > 0)
                                ? summary.paymentBreakdown.map((it: any) => ({
                                    billingType: it.billingType,
                                    remaining: Number(it.remaining ?? Math.max(0, Number(it.required || findAmount(it.billingType)) - Number(paidByType[normalize(it.billingType)] || 0)))
                                  }))
                                : originalFees.map((fee: any) => ({
                                    billingType: fee.name,
                                    remaining: Math.max(0, Number(fee.amount || 0) - Number(paidByType[normalize(fee.name)] || 0))
                                  }));
                              return adjusted.map((item: any) => (
                                <div key={item.billingType} className="bg-white rounded-lg p-3 border border-orange-100">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-orange-800">{item.billingType}</p>
                                      <p className="text-xs text-orange-600">UGX {Number(item.remaining || 0).toLocaleString()} Remaining</p>
                                    </div>
                                    <button className={`px-3 py-1 text-white text-xs rounded ${Number(item.remaining) <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`} disabled={Number(item.remaining) <= 0}>
                                      {Number(item.remaining) <= 0 ? 'Paid' : 'Pay'}
                                    </button>
                                  </div>
                                </div>
                              ));
                            })()}
                            
                            <div className="border-t border-orange-200 pt-3">
                              <div className="flex justify-between">
                                <span className="font-bold text-orange-800">Total Remaining:</span>
                                <span className="font-bold text-orange-800">UGX {Number(balance || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                          This is a view-only display. Payments are processed by school administration.
                        </p>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      
      case 'academics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Academic Reports</h2>
            
            {getMyChildren.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Assigned</h3>
                <p className="text-gray-600">Contact the school administration to get your children assigned to your account.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {getMyChildren.map((child) => {
                  const summary = paymentSummaries[String(child.id)] || {};
                  const totalRequired = Number(summary.totalFeesRequired ?? child.totalFees ?? 0);
                  const paidAmount = Number(summary.totalPaid ?? child.paidAmount ?? 0);
                  const balance = Math.max(0, totalRequired - paidAmount);
                  
                  return (
                    <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {child.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-600">{child.class} - {child.stream}</p>
                          <p className="text-xs text-gray-500">Access: {child.accessNumber}</p>
                        </div>
                      </div>
                      
                                             {balance > 0 ? (
                         <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-center">
                           <h4 className="text-2xl font-bold text-red-800 mb-3">ACCESS DENIED</h4>
                           <p className="text-lg text-red-700 mb-4">You have some balance to pay</p>
                           <div className="text-6xl mb-4">😭😭</div>
                         </div>
                       ) : (
                         <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                           <div className="flex items-center space-x-2">
                             <CheckCircle className="h-5 w-5 text-green-600" />
                             <h4 className="text-lg font-semibold text-green-800">Fees Cleared</h4>
                           </div>
                           <p className="text-green-700 mt-2">
                             All fees have been cleared. You can now view your child's report card.
                           </p>
                         </div>
                       )}
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Report Card Access</h4>
                        
                        {balance > 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              Report card access is restricted until outstanding fees are cleared.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-blue-900">Current Term Report</h5>
                                <p className="text-sm text-blue-700">Term 1, 2024</p>
                              </div>
                              <button
                                onClick={() => {
                                  console.log('Opening report card for:', child.name);
                                  setSelectedStudent(child);
                                  setShowReportCard(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <FileText className="h-4 w-4" />
                                <span>View Report Card</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Compose Message</h2>
                  <p className="text-gray-600 mt-1">Send messages to teachers and school administration</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Recipient Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">To:</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select recipient...</option>
                    <option value="nurse">School Nurse</option>
                    <option value="admin">Administrator</option>
                    <option value="teacher">Teacher</option>
                    <option value="super-teacher">Super Teacher</option>
                    <option value="head-teacher">Head Teacher</option>
                    <option value="principal">Principal</option>
                    <option value="accountant">Accountant</option>
                    <option value="librarian">Librarian</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                
                {/* Subject */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Subject:</label>
                  <input 
                    type="text" 
                    placeholder="Enter message subject..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Message Content */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Message:</label>
                  <textarea 
                    rows={6}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                
                {/* Send Button */}
                <div className="flex justify-end">
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <MessageSquare className="h-5 w-5 inline mr-2" />
                    Send Message
                  </button>
                </div>
              </div>
              
              {/* Recent Messages */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">To: Class Teacher</p>
                        <p className="text-sm text-gray-600">Subject: Request for meeting</p>
                        <p className="text-xs text-gray-500">Sent: 2 hours ago</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Sent</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">To: School Administration</p>
                        <p className="text-sm text-gray-600">Subject: Payment inquiry</p>
                        <p className="text-xs text-gray-500">Sent: 1 day ago</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Select a tab to view content</p>
          </div>
        );
    }
  };

  const StudentDetailsModal = ({ student, onClose }: { student: any; onClose: () => void }) => {
    // Simple escape key handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/70 via-gray-900/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
    >
      <div className="bg-gradient-to-br from-white/95 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Users className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
              <h2 className="text-2xl font-black">Student Details</h2>
            </div>
            <div 
              onClick={onClose}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm cursor-pointer"
            >
              <X className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Student Profile */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Users className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">{student.name}</h3>
              <p className="text-gray-600 font-medium">Access Number: {student.accessNumber}</p>
              <div className="flex space-x-2 mt-3">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-full font-medium border border-blue-300">
                  {student.class} - {student.stream}
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-full font-medium border border-green-300">
                  Age {student.age || 'N/A'}
                </span>
                {canSeeSponsorshipStatus(user?.role || '') && (
                  <span className={`px-3 py-1 text-sm rounded-full font-medium border ${
                    student.sponsorshipStatus === 'sponsored' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300' :
                    student.sponsorshipStatus === 'awaiting' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300' :
                    student.sponsorshipStatus === 'pending' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300' :
                    'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300'
                  }`}>
                    {student.sponsorshipStatus === 'sponsored' ? 'Sponsored' : 
                     student.sponsorshipStatus === 'awaiting' ? 'Awaiting' :
                     student.sponsorshipStatus === 'pending' ? 'Pending' : 'Private'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Student Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span>Student Information</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-6 w-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="h-3 w-3 text-white" />
                </div>
                  <span className="text-sm font-bold text-gray-700">Name</span>
                </div>
                <p className="text-gray-900 font-medium">{student.name}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Award className="h-3 w-3 text-white" />
                </div>
                  <span className="text-sm font-bold text-gray-700">Access Number</span>
                </div>
                <p className="text-gray-900 font-medium">{student.accessNumber}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-3 w-3 text-white" />
                </div>
                  <span className="text-sm font-bold text-gray-700">Class</span>
                </div>
                <p className="text-gray-900 font-medium">{student.class}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-6 w-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Activity className="h-3 w-3 text-white" />
                </div>
                  <span className="text-sm font-bold text-gray-700">Stream</span>
                </div>
                <p className="text-gray-900 font-medium">{student.stream}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 backdrop-blur-sm rounded-b-3xl">
          <div 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </div>
        </div>
      </div>
    </div>
  );
  };

  const PaymentDetailsModal = ({ student, onClose }: { student: any; onClose: () => void }) => {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Fetch payment summary for this student
    const fetchSummary = async () => {
      try {
        const response = await fetch((await import('../../utils/api')).buildApiUrl(`payments/student/${student.id}/summary`));
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Parent Dashboard - Payment Summary:', data);
          console.log('🔍 Payment Breakdown Items:', data.paymentBreakdown);
          console.log('🔍 Has Medical Fee:', data.paymentBreakdown?.some(item => item.feeName?.toLowerCase().includes('medical')));
          setSummary(data);
        } else {
          console.error('Failed to fetch payment summary');
        }
      } catch (error) {
        console.error('Error fetching payment summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      if (student?.id) {
        console.log('🔄 Fetching summary for student:', student.id);
        fetchSummary();
      }
    }, [student?.id]);
    
    // Auto-refresh every 30 seconds to get real-time updates
    useEffect(() => {
      const interval = setInterval(() => {
        if (student?.id) {
          fetchSummary();
        }
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }, [student?.id]);
    
    // No hardcoded default fees - use only database data
    const defaultFees = {};
    
    // Use summary data or fallback to defaults
    const originalFees = summary?.paymentBreakdown?.length > 0 ? 
      summary.paymentBreakdown.reduce((acc, item) => {
        acc[item.billingType] = { 
          amount: item.required, 
          type: item.frequency, 
          term: `${item.term} ${item.year}`,
          paid: item.paid,
          remaining: item.remaining
        };
        return acc;
      }, {}) : defaultFees;
    
    // Debug: Log the originalFees object
    console.log('🔍 Original Fees Object:', originalFees);
    console.log('🔍 Original Fees Keys:', Object.keys(originalFees));
    console.log('🔍 Has Medical in Original Fees:', Object.keys(originalFees).some(key => key.toLowerCase().includes('medical')));
    
    const totalRequired = summary?.totalFeesRequired || Object.values(defaultFees).reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = summary?.totalPaid || 0;
    const balance = summary?.balance || (totalRequired - totalPaid);
    
    if (loading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-6 w-6" />
                <h2 className="text-xl font-bold">Payment Details for {student.name}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchSummary}
                  className="flex items-center space-x-2 px-3 py-1 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm">Refresh</span>
                </button>
                <button 
                  type="button"
                  onClick={onClose} 
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Student Info Bar */}
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white text-opacity-80">Student:</span>
                  <span className="ml-2 font-medium">{student.name}</span>
                </div>
                <div>
                  <span className="text-white text-opacity-80">Class:</span>
                  <span className="ml-2 font-medium">{student.class}</span>
                </div>
                <div>
                  <span className="text-white text-opacity-80">Parent:</span>
                  <span className="ml-2 font-medium">{user?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Original Fees Panel */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-800">Original Fees</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(originalFees).map(([feeName, feeData]: [string, any]) => (
                    <div key={feeName} className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-purple-800">{feeName}</p>
                          <p className="text-xs text-purple-600">{feeData.type} • {feeData.term}</p>
                        </div>
                        <span className="font-bold text-purple-800">UGX {feeData.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-purple-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-purple-800">Total Required:</span>
                      <span className="font-bold text-purple-800">UGX {totalRequired.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Already Paid Panel */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Already Paid</h3>
                </div>
                <div className="space-y-3">
                  {totalPaid === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-green-700 text-lg">No payments made yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show detailed payment breakdown for each fee type */}
                      {Object.entries(originalFees).map(([feeName, feeData]: [string, any]) => {
                        const paid = feeData.paid || 0;
                        const required = feeData.amount || 0;
                        const isPaid = paid > 0;
                        const isFullyPaid = paid >= required;
                        
                        return (
                          <div key={feeName} className="bg-white rounded-lg p-3 border border-green-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-green-800">{feeName}</p>
                                <p className="text-xs text-green-600">
                                  {isPaid ? (
                                    isFullyPaid ? 'Fully Paid' : `UGX ${paid.toLocaleString()} of ${required.toLocaleString()}`
                                  ) : 'Not paid'}
                                </p>
                              </div>
                              <span className="font-bold text-green-800">UGX {paid.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show additional payments if total paid exceeds sum of individual fees */}
                      {(() => {
                        const individualPaidTotal = Object.values(originalFees).reduce((sum: number, feeData: any) => sum + (feeData.paid || 0), 0);
                        const additionalPaid = totalPaid - individualPaidTotal;
                        
                        if (additionalPaid > 0) {
                          return (
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-green-800">Additional Payment</p>
                                  <p className="text-xs text-green-600">Extra payment received</p>
                                </div>
                                <span className="font-bold text-green-800">UGX {additionalPaid.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  
                  <div className="border-t border-green-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-green-800">Total Paid:</span>
                      <span className="font-bold text-green-800">UGX {totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Balance Remaining Panel */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Balance Remaining</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(originalFees).map(([feeName, feeData]: [string, any]) => {
                    const paid = feeData.paid || 0;
                    const remaining = feeData.amount - paid;
                    const isPaid = remaining <= 0;
                    
                    return (
                      <div key={feeName} className="bg-white rounded-lg p-3 border border-orange-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-orange-800">{feeName}</p>
                            <p className="text-xs text-orange-600">
                              {isPaid ? 'Paid' : `UGX ${remaining.toLocaleString()} Remaining`}
                            </p>
                          </div>
                          <button 
                            disabled={isPaid}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              isPaid 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Pay'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="border-t border-orange-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-orange-800">Total Remaining:</span>
                      <span className="font-bold text-orange-800">UGX {balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                This is a view-only display. Payments are processed by school administration.
              </p>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => {
                console.log('Payment modal close button clicked, closing modal...');
                onClose();
              }}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show restricted access if user has no privileges
  if (shouldShowRestrictedAccess) {
    return (
      <RestrictedAccess
        title="Parent Dashboard Access Restricted"
        message="You don't have any privileges assigned yet. Please contact an administrator to get access to the parent dashboard."
        details="An administrator needs to assign you specific privileges to view your children's information and manage their accounts."
        severity="warning"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* AI-Generated Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Heart className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Parent Portal
                  </h1>
                  <p className="text-gray-600 font-medium">Welcome back, {user?.name}! Here's your family overview.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* AI Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>

                
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                  <span>Parent Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-2">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'children', label: 'My Children', icon: Users },
                { id: 'attendance', label: 'Attendance', icon: Calendar },
                { id: 'payments', label: 'Payments', icon: DollarSign },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'messages', label: 'Messages', icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => window.history.pushState({}, '', `?tab=${tab.id}`)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
          </div>
          </div>
        </div>

        {/* Main Content */}
        {renderTabContent()}
        
        {showPaymentDetails && selectedStudent && (
          <PaymentModal 
            student={selectedStudent} 
            onClose={() => {
              showAINotification('💰 Payment Modal Closed Successfully!', 2000);
              console.log('PaymentModal onClose called, setting showPaymentDetails to false');
              setShowPaymentDetails(false);
              setSelectedStudent(null);
            }} 
          />
        )}
        
        {/* Report Card Modal */}
        {showReportCard && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Student Report Card</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // Generate and print the report card
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const html = generatePrintableReportCard(selectedStudent, settings);
                          printWindow.document.write(html);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Print Report</span>
                    </button>
                    <button
                      onClick={() => setShowReportCard(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <StudentReportCard 
                  student={selectedStudent}
                  settings={{
                    schoolName: 'SCHOOL NAME',
                    schoolAddress: 'School Address',
                    schoolPhone: 'Phone Number',
                    schoolEmail: 'Email Address',
                    currentTerm: 'Term 1',
                    currentYear: 2025,
                    feesStructure: {},
                    paymentMethods: [],
                    gradeSystem: {}
                  }}
                  term="Term 1"
                  year={2025}
                  comments={{
                    classTeacher: 'Student shows good potential. Continue working hard.',
                    headTeacher: 'Keep up the good work.',
                    promotion: 'PROMOTED',
                    date: new Date().toLocaleDateString()
                  }}
                />
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowReportCard(false)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal - Outside main content */}
      {showStudentDetails && selectedStudent && (
        <SimpleModal 
          student={selectedStudent} 
          onClose={() => {
            showAINotification('🎉 Student Details Modal Closed Successfully!', 2000);
            console.log('StudentDetailsModal onClose called, setting showStudentDetails to false');
            setShowStudentDetails(false);
            setSelectedStudent(null);
          }} 
        />
      )}
    </div>
  );
});

export default ParentDashboard;


