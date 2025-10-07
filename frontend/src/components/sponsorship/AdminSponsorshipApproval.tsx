import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { CheckCircle, Eye, User, GraduationCap, Hash, DollarSign, Calendar, AlertCircle, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import StudentDetailsWindow from './StudentDetailsWindow';

const AdminSponsorshipApproval: React.FC = () => {
  const { sponsorships, students, updateSponsorship, updateStudent, forceRefresh } = useData();
  const { user } = useAuth();
  const { showSuccess, showError, clearAllNotifications } = useNotification();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setSelectedStudentDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter sponsorships that need final admin approval (from overseer)
  const pendingAdminApproval = sponsorships.filter(s => 
    s.status === 'coordinator-approved'
  );

  // Filter approved sponsorships for history tracking
  const approvedSponsorships = sponsorships.filter(s => 
    s.status === 'sponsored' || s.status === 'active'
  );

  // Debug: Log data for verification
  console.log('🔍 Admin Approvals - All sponsorships:', sponsorships.map(s => ({
    id: s.id,
    status: s.status,
    studentId: s.studentId,
    sponsorName: s.sponsorName,
    amount: s.amount
  })));
  
  console.log('🔍 Admin Approvals - All students:', students.map(s => ({
    id: s.id,
    name: s.name,
    sponsorshipStatus: s.sponsorshipStatus
  })));
  
  console.log('🔍 Admin Approvals - Pending admin approval:', pendingAdminApproval.length);
  console.log('🔍 Admin Approvals - Looking for Ssekisonge:', students.filter(s => s.name.toLowerCase().includes('ssekisonge')));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
      showSuccess('Data Refreshed', 'Sponsorship data has been updated successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError('Refresh Failed', 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApproveSponsorship = async (sponsorship: any) => {
    setLoading(true);
    try {
      console.log('🎯 Admin approving sponsorship:', sponsorship.id);
      
      // Update sponsorship status to sponsored
      console.log('🔄 Updating sponsorship status to sponsored...');
      await updateSponsorship(sponsorship.id.toString(), {
        status: 'sponsored'
      });
      console.log('✅ Sponsorship status updated to sponsored');

      // Find the student
      const student = students.find(s => s.id === sponsorship.studentId);
      if (student) {
        console.log('👤 Student found:', student.name, 'admittedBy:', student.admittedBy);
        
        // Update student status to sponsored (moves from Box 5 to Box 6/7)
        // ALL students follow the same sequence - no special handling needed
        await updateStudent(sponsorship.studentId.toString(), {
          sponsorshipStatus: 'sponsored',
          admittedBy: 'admin' // All approved students are now admin-admitted
        });
        
        console.log('✅ Student status updated to sponsored - will move to Box 6/7');
      }

      // Clear any existing notifications
      clearAllNotifications();
      
      // Show success notification
      showSuccess(
        '🎉 SPONSORSHIP APPROVED!',
        `✅ Sponsorship has been officially approved!\n\n📦 Student will move to the appropriate sponsored box\n\n👨‍👩‍👧‍👦 Sponsor will be notified of the approval`
      );

      // Refresh data to show changes
      console.log('🔄 Refreshing data to show changes...');
      await forceRefresh();
      console.log('✅ Data refreshed - sponsorship should now appear in history');
      
    } catch (error) {
      console.error('❌ Error approving sponsorship:', error);
      showError('Approval Failed', 'Failed to approve sponsorship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSponsorship = async (sponsorship: any) => {
    setLoading(true);
    try {
      console.log('❌ Admin rejecting sponsorship:', sponsorship.id);
      
      // Update sponsorship status to rejected
      await updateSponsorship(sponsorship.id.toString(), {
        status: 'rejected'
      });

      // Update student status back to available-for-sponsors
      await updateStudent(sponsorship.studentId.toString(), {
        sponsorshipStatus: 'available-for-sponsors'
      });

      // Show rejection notification
      showSuccess('Sponsorship Rejected', 'Sponsorship has been rejected and student is back in the available pool.');

      // Refresh data
      await forceRefresh();
      
    } catch (error) {
      console.error('❌ Error rejecting sponsorship:', error);
      showError('Rejection Failed', 'Failed to reject sponsorship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sponsorship: any) => {
    // Use the same robust lookup logic as in the card rendering
    let student = students.find(s => s.id === sponsorship.studentId);
    if (!student) {
      // Try string comparison
      student = students.find(s => String(s.id) === String(sponsorship.studentId));
    }
    if (!student) {
      // Try number comparison
      student = students.find(s => Number(s.id) === Number(sponsorship.studentId));
    }
    
    if (student) {
      setSelectedStudent(student);
      setSelectedStudentDetails(true);
    } else {
      console.error('❌ Student not found for sponsorship:', sponsorship.id);
    }
  };

  // Removed early return to always show the full page with history section

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 min-h-screen">
      {/* AI-Generated Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 shadow-2xl border border-blue-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🎯 Final Admin Approval Required
              </h1>
              <p className="text-blue-100 text-lg mt-2">
                Sponsorships approved by coordinator that need final admin approval
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">{pendingAdminApproval.length} Pending Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white font-semibold">{approvedSponsorships.length} Approved</span>
              </div>
            </div>
            
            {/* AI Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Refresh sponsorship data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingAdminApproval.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Approved</p>
              <p className="text-2xl font-bold text-green-900">{approvedSponsorships.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Success Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {sponsorships.length > 0 ? Math.round((approvedSponsorships.length / sponsorships.length) * 100) : 0}%
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          Pending Approvals ({pendingAdminApproval.length})
        </h2>
        
        {pendingAdminApproval.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAdminApproval.map((sponsorship) => {
          // Try multiple ways to find the student (handle type mismatches)
          let student = students.find(s => s.id === sponsorship.studentId);
          if (!student) {
            // Try string comparison
            student = students.find(s => String(s.id) === String(sponsorship.studentId));
          }
          if (!student) {
            // Try number comparison
            student = students.find(s => Number(s.id) === Number(sponsorship.studentId));
          }
          
          // If still not found, try to find by sponsorship context
          if (!student) {
            console.log('🔍 Student not found by ID, trying to find by context...');
            // This is a fallback - we'll show the sponsorship data anyway
          }
          
          // Student lookup successful - card will render with correct data
          
          // Always render the card, even if student data is missing

          return (
            <div key={sponsorship.id} className="bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {/* Student Info */}
              <div className="text-center mb-4">
                {student?.photo ? (
                  <img 
                    src={student.photo} 
                    alt={student.name || 'Student'}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-yellow-300 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{student?.name || 'Student Not Found'}</h3>
                <p className="text-gray-600 mb-1 text-sm">
                  <GraduationCap className="w-3 h-3 inline mr-1" />
                  Senior 1 - {student?.stream || 'None'}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  <Hash className="w-3 h-3 inline mr-1" />
                  Access: {student?.accessNumber?.startsWith('None-') ? 'None' : (student?.accessNumber || 'Unknown')}
                </p>
                <p className="text-xs text-red-600 mb-2">
                  Sponsorship ID: {sponsorship.id}
                </p>
              </div>

              {/* Sponsorship Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Sponsor:</span>
                  <span className="font-semibold text-gray-900">{sponsorship.sponsorName}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600">
                    <DollarSign className="w-3 h-3 inline mr-1" />
                    UGX {sponsorship.amount?.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{sponsorship.duration} months</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Admitted By:</span>
                  <span className={`font-semibold ${student?.admittedBy === 'admin' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {student?.admittedBy === 'admin' ? 'Admin' : (student?.admittedBy === 'overseer' ? 'Overseer' : 'Unknown')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(sponsorship)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <Eye className="w-3 h-3" />
                  Review
                </button>
                
                <button
                  onClick={() => handleRejectSponsorship(sponsorship)}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105 shadow-md disabled:opacity-50"
                >
                  <ThumbsDown className="w-3 h-3" />
                  Reject
                </button>
                
                <button
                  onClick={() => handleApproveSponsorship(sponsorship)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105 shadow-md disabled:opacity-50"
                >
                  <ThumbsUp className="w-3 h-3" />
                  Approve
                </button>
              </div>
            </div>
          );
        })}
          </div>
        )}
      </div>

      {/* Approval History Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Approval History ({approvedSponsorships.length})
        </h2>
        
        {approvedSponsorships.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Approvals Yet</h3>
            <p className="text-gray-500">Approved sponsorships will appear here for tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedSponsorships.map((sponsorship) => {
              // Try multiple ways to find the student (handle type mismatches)
              let student = students.find(s => s.id === sponsorship.studentId);
              if (!student) {
                // Try string comparison
                student = students.find(s => String(s.id) === String(sponsorship.studentId));
              }
              if (!student) {
                // Try number comparison
                student = students.find(s => Number(s.id) === Number(sponsorship.studentId));
              }
              
              // Always render the card, even if student data is missing

              return (
                <div key={sponsorship.id} className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                  {/* Student Info */}
                  <div className="text-center mb-4">
                    {student?.photo ? (
                      <img 
                        src={student.photo}
                        alt={student?.name || 'Student'}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-green-300 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{student?.name || 'Student Not Found'}</h3>
                    <p className="text-gray-600 mb-1 text-sm">
                      <GraduationCap className="w-3 h-3 inline mr-1" />
                      {student?.class || 'Unknown'} - {student?.stream || 'None'}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      <Hash className="w-3 h-3 inline mr-1" />
                      Access: {student?.accessNumber?.startsWith('None-') ? 'None' : (student?.accessNumber || 'Unknown')}
                    </p>
                  </div>

                  {/* Sponsorship Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Sponsor:</span>
                      <span className="font-semibold text-gray-900">{sponsorship.sponsorName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-green-600">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        UGX {sponsorship.amount?.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">{sponsorship.duration} months</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Admitted By:</span>
                      <span className={`font-semibold ${student?.admittedBy === 'admin' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {student?.admittedBy === 'admin' ? 'Admin' : (student?.admittedBy === 'overseer' ? 'Overseer' : 'Unknown')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        {sponsorship.status === 'sponsored' ? 'Sponsored' : 'Active'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-semibold text-gray-700">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(sponsorship.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(sponsorship)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105 shadow-md"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                    
                    <div className="flex-1 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 border border-green-200">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <StudentDetailsWindow
          student={selectedStudent}
          onClose={() => setSelectedStudentDetails(false)}
        />
      )}
    </div>
  );
};

export default AdminSponsorshipApproval;