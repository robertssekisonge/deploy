import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Heart, User, GraduationCap, Hash, Eye, Plus, CheckCircle, X, Clock, Trash2 } from 'lucide-react';
import StudentDetailsWindow from './StudentDetailsWindow';
import AdmitStudentForm from './AdmitStudentForm';
import EditStudentForm from './EditStudentForm';

const SponsorshipManagement: React.FC = () => {
  const { students, addSponsorship, updateSponsorship, sponsorships, users, fetchStudents, updateStudent, forceRefresh, deleteStudent, deleteOverseerStudent } = useData();
  const { user } = useAuth();
  const { showSuccess, showError, showData, showSystem } = useNotification();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);



  // Fetch students when component loads
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Refresh data every 10 seconds to catch new sponsorship requests
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing sponsorship data...');
      forceRefresh();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [forceRefresh]);

  // Debug: Log students data
  useEffect(() => {
    if (students && students.length > 0) {
      console.log('📚 Students loaded:', students.length);
      const availableForSponsors = students.filter(s => s.sponsorshipStatus === 'available-for-sponsors' && s.needsSponsorship);
      const pendingStudents = students.filter(s => (s.sponsorshipStatus === 'eligibility-check' || s.sponsorshipStatus === 'pending' || s.sponsorshipStatus === 'awaiting') && s.needsSponsorship);
      console.log('🔍 Available for sponsors:', availableForSponsors.length);
      console.log('⏳ Pending students (eligibility-check + pending):', pendingStudents.length);
      console.log('📋 Students with pending status:', students.filter(s => s.sponsorshipStatus === 'pending'));
      console.log('📋 Students with eligibility-check status:', students.filter(s => s.sponsorshipStatus === 'eligibility-check'));
    }
  }, [students]);

  const handleApproveSponsorship = async (sponsorship: any) => {
    setLoading(true);
    try {
      console.log('🔍 Approving sponsorship:', sponsorship);
      console.log('🔍 Sponsorship ID:', sponsorship.id, 'Type:', typeof sponsorship.id);
      
      // Ensure we have a valid ID
      const sponsorshipId = String(sponsorship.id);
      console.log('🔍 Using ID:', sponsorshipId);
      
      // Update sponsorship status to coordinator-approved
      await updateSponsorship(sponsorshipId, {
        status: 'coordinator-approved'
      });
      
      // Update student status to coordinator-approved
      await updateStudent(sponsorship.studentId, { 
        sponsorshipStatus: 'coordinator-approved' 
      });
      
      showSuccess('Sponsorship Approved!', 'Sponsorship approved by coordinator and sent for final admin approval.');
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
      await updateSponsorship(String(sponsorship.id), {
        status: 'rejected'
      });
      showSuccess('Sponsorship Rejected!', 'Sponsorship rejected. The child will be available for other sponsors.');
    } catch (error) {
      console.error('Error rejecting sponsorship:', error);
      showError('Rejection Failed', 'Failed to reject sponsorship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setShowEditForm(true);
  };

  const handleSaveStudent = async (updatedStudent: any) => {
    try {
      await updateStudent(updatedStudent.id, updatedStudent);
      showSuccess('Student Updated!', 'Student information updated successfully!');
      handleRefreshSponsorships();
    } catch (error) {
      console.error('Error updating student:', error);
      showError('Update Failed', 'Failed to update student. Please try again.');
    }
  };

  const handleSponsorStudent = (student: any) => {
    // For now, just show an alert. You can implement sponsorship logic later
    showData('Sponsorship Request', `Sponsorship request for ${student.name} will be implemented soon!`);
  };

  const handleBoxClick = (boxType: string) => {
    setSelectedBox(selectedBox === boxType ? null : boxType);
  };

  const handleRefreshSponsorships = async () => {
    setIsRefreshing(true);
    try {
      // Force re-render of sponsorship data
      console.log('🔄 Refreshing sponsorship data...');
      // Fetch fresh data from backend
      await forceRefresh();
      console.log('✅ Sponsorship data refreshed!');
    } catch (error) {
      console.error('❌ Error refreshing sponsorship data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting overseer-admitted student:', student.name);
      // Use the special overseer delete function for overseer-admitted students
      if (student.admittedBy === 'overseer') {
        await deleteOverseerStudent(student.id);
      } else {
        await deleteStudent(student.id);
      }
      showSuccess('Student Deleted!', `${student.name} has been removed from the system.`);
      handleRefreshSponsorships();
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      showError('Delete Failed', 'Failed to delete student. Please try again.');
    }
  };

  const handleApproveStudent = async (student: any) => {
    try {
      console.log('🎯 Approving student:', student.name, 'Current status:', student.sponsorshipStatus);
      
      if (selectedBox === 'eligibility-check') {
        // Move from eligibility check to eligible
        console.log('📤 Updating student status to eligible...');
        await updateStudent(student.id, { sponsorshipStatus: 'eligible' });
        console.log('✅ Student approved successfully!');
        
        // Force immediate refresh to update the UI
        console.log('🔄 Refreshing data immediately...');
        await fetchStudents();
        
        showSuccess('Student Approved!', `${student.name} has been approved and moved to Eligible status!`);
      } else if (selectedBox === 'eligible') {
        // Move from eligible to available for sponsors
        console.log('📤 Updating student status to available-for-sponsors...');
        await updateStudent(student.id, { sponsorshipStatus: 'available-for-sponsors' });
        console.log('✅ Student made available for sponsors!');
        
        // Force immediate refresh to update the UI
        console.log('🔄 Refreshing data immediately...');
        await fetchStudents();
        
        showData('Student Available!', `${student.name} is now available for sponsors!`);
      }
    } catch (error) {
      console.error('❌ Error approving student:', error);
      showError('Approval Failed', 'Failed to approve student. Please try again.');
    }
  };

  const handleDisapproveStudent = async (student: any) => {
    if (!confirm(`Are you sure you want to disapprove ${student.name}? This will move them back to Box 2 (Eligible).`)) {
      return;
    }
    
    try {
      console.log('🎯 Disapproving student:', student.name);
      await updateStudent(student.id, { sponsorshipStatus: 'eligible' });
      console.log('✅ Student disapproved successfully!');
      
      // Force immediate refresh to update the UI
      await fetchStudents();
      
      showSystem('Student Disapproved!', `${student.name} has been disapproved and moved back to Box 2 (Eligible).`);
    } catch (error) {
      console.error('❌ Error disapproving student:', error);
      showError('Disapproval Failed', 'Failed to disapprove student. Please try again.');
    }
  };

  // Admin view - show only final admin approval requests
  if (user?.role === 'ADMIN' || user?.role === 'admin') {
    const pendingAdminApproval = sponsorships?.filter(s => 
      s.status === 'coordinator-approved' || s.status === 'pending-admin-approval'
    ) || [];

    return (
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6 text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-900">Final Admin Approval Required</h1>
          </div>
          <p className="text-gray-600 text-base">
            Sponsorships approved by coordinator that need final admin approval
          </p>
        </div>

        {pendingAdminApproval.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-md mx-auto">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">No Approvals Required</h3>
              <p className="text-green-700 mb-4">All sponsorship requests have been processed.</p>
              <p className="text-sm text-green-600">New requests will appear here when coordinators approve them.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAdminApproval.map(sponsorship => {
              const student = students?.find(s => s.id === sponsorship.studentId);
              const sponsor = users?.find(u => u.id === sponsorship.sponsorId);
              return (
                <div key={sponsorship.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-yellow-900">{student?.name || 'Unknown Student'}</h4>
                      <p className="text-sm text-yellow-700">{student?.class || 'Unknown'} - {student?.stream || 'Unknown'}</p>
                      <p className="text-xs text-yellow-600">Access: {student?.accessNumber?.startsWith('None-') ? 'None' : (student?.accessNumber || 'Unknown')}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-yellow-700">Sponsor: {sponsor?.name || 'Unknown'}</p>
                    <p className="text-sm text-yellow-700">Amount: UGX {sponsorship.amount?.toLocaleString() || '0'}</p>
                    <p className="text-sm text-yellow-700">Duration: {sponsorship.duration || '0'} months</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </button>
                    <button
                      onClick={() => handleApproveSponsorship(sponsorship)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectSponsorship(sponsorship)}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Student Details Modal */}
        {showStudentDetails && selectedStudent && (
          <StudentDetailsWindow
            student={selectedStudent}
            onClose={() => {
              setShowStudentDetails(false);
              setSelectedStudent(null);
            }}
          />
        )}
      </div>
    );
  }

  // Sponsorship Overseer view - full sponsorship management
  if (user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'sponsorships-overseer' || user?.role === 'SPONSORSHIP-OVERSEER') {
    console.log('🎯 Calculating pending students...');
    console.log('📊 Total students available:', students?.length || 0);
    
    // Box 1: Eligibility Check (include 'eligibility-check', 'pending', and 'awaiting' statuses)
    const pendingStudents = students?.filter(s => 
      (s.sponsorshipStatus === 'eligibility-check' || s.sponsorshipStatus === 'pending' || s.sponsorshipStatus === 'awaiting') && s.needsSponsorship
    ) || [];
    
    console.log('⏳ Pending students count:', pendingStudents.length);
    console.log('⏳ Pending students details:', pendingStudents);
    
    // These boxes are for students that have moved through the flow
    const eligibleStudents = students?.filter(s => 
      s.sponsorshipStatus === 'eligible' && s.needsSponsorship
    ) || [];

    // Box 3: Available for Sponsors -> students who are available AND don't have pending sponsorships
    const blockedStatuses = new Set(['pending', 'coordinator-approved', 'sponsored']);
    const blockedStudentIds = new Set(
      (sponsorships || [])
        .filter(s => s.studentId && blockedStatuses.has(s.status))
        .map(s => s.studentId.toString())
    );
    console.log('🚫 Blocked student IDs (have pending sponsorships):', Array.from(blockedStudentIds));
    
    const availableForSponsorsStudents = students?.filter(s => 
      s.sponsorshipStatus === 'available-for-sponsors' &&
      s.needsSponsorship &&
      !blockedStudentIds.has(String(s.id))
    ) || [];
    console.log('✅ Available for sponsors students (after blocking):', availableForSponsorsStudents.length);

    // Box 4: Pending Requests -> students who have a sponsorship with status 'pending'
    console.log('🔍 All sponsorships:', sponsorships);
    console.log('🔍 Pending sponsorships:', (sponsorships || []).filter(s => s.status === 'pending'));
    console.log('🔍 All students:', students?.map(s => ({ id: s.id, name: s.name, sponsorshipStatus: s.sponsorshipStatus })));
    
    const pendingRequestStudentIds = new Set(
      (sponsorships || [])
        .filter(s => s.status === 'pending' && s.studentId)
        .map(s => s.studentId.toString())
    );
    console.log('🔍 Pending request student IDs:', Array.from(pendingRequestStudentIds));
    console.log('🔍 Student IDs in database:', students?.map(s => String(s.id)));
    
    const pendingRequestsStudents = students?.filter(s => pendingRequestStudentIds.has(String(s.id))) || [];
    console.log('🔍 Pending requests students:', pendingRequestsStudents);

    // Box 5: Admin Approval -> students who have sponsorships with status 'coordinator-approved'
    const coordinatorApprovedSponsorshipIds = new Set(
      (sponsorships || [])
        .filter(s => s.status === 'coordinator-approved' && s.studentId)
        .map(s => s.studentId.toString())
    );
    console.log('🔍 Coordinator approved sponsorship student IDs:', Array.from(coordinatorApprovedSponsorshipIds));
    
    const pendingAdminApprovalStudents = students?.filter(s => 
      coordinatorApprovedSponsorshipIds.has(String(s.id))
    ) || [];
    
    console.log('🔍 DEBUG Box 5 - All sponsorships:', sponsorships);
    console.log('🔍 DEBUG Box 5 - Coordinator approved sponsorships:', (sponsorships || []).filter(s => s.status === 'coordinator-approved'));
    console.log('🔍 DEBUG Box 5 - Coordinator approved student IDs:', Array.from(coordinatorApprovedSponsorshipIds));
    console.log('🔍 DEBUG Box 5 - Pending admin approval students:', pendingAdminApprovalStudents);

    // Box 6: Admin Admitted Sponsored Children (sponsorshipStatus = 'sponsored')
    const adminAdmittedSponsoredStudents = students?.filter(s => 
      s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'admin'
    ) || [];

    // Box 7: Overseer Admitted Sponsored Children (sponsorshipStatus = 'sponsored')
    const overseerAdmittedSponsoredStudents = students?.filter(s => 
      s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'overseer'
    ) || [];

    // Debug: Log box 6 and 7 data
    console.log('📦 DEBUG - Box 6 (Admin Admitted Sponsored):', adminAdmittedSponsoredStudents);
    console.log('📦 DEBUG - Box 7 (Overseer Admitted Sponsored):', overseerAdmittedSponsoredStudents);
    console.log('📦 DEBUG - All sponsored students:', students?.filter(s => s.sponsorshipStatus === 'sponsored'));

  const getStudentsForBox = (boxType: string) => {
    switch (boxType) {
      case 'eligibility-check':
        return pendingStudents;
      case 'eligible':
        return eligibleStudents;
      case 'pending-sponsorship':
        return availableForSponsorsStudents;
      case 'pending-requests':
        return pendingRequestsStudents;
      case 'pending-admin':
        return pendingAdminApprovalStudents;
      case 'admin-sponsored':
        return adminAdmittedSponsoredStudents;
      case 'overseer-sponsored':
        return overseerAdmittedSponsoredStudents;
      default:
        return [];
    }
  };

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sponsorship Management</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshSponsorships}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-md hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center gap-1.5 shadow-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          <button
            onClick={() => setShowAdmitForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Admit Student</span>
          </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
          {/* 1. Eligibility Check */}
          <div 
            className={`bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-purple-300 ${
              selectedBox === 'eligibility-check' ? 'ring-4 ring-purple-300 shadow-xl scale-105 border-purple-400' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('eligibility-check')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">1. Eligibility Check</h3>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 text-2xl font-bold">{pendingStudents.length}</p>
            <p className="text-gray-500 text-sm">Students awaiting review</p>
          </div>
          
          {/* 2. Eligible */}
          <div 
            className={`bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-blue-400 ${
              selectedBox === 'eligible' ? 'ring-4 ring-blue-400 shadow-xl scale-105 border-blue-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('eligible')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-blue-900">2. Eligible</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-blue-700 text-2xl font-bold">{eligibleStudents.length}</p>
            <p className="text-blue-500 text-sm">Students ready for sponsors</p>
          </div>
          
          {/* 3. Available for Sponsors */}
          <div 
            className={`bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-purple-400 ${
              selectedBox === 'pending-sponsorship' ? 'ring-4 ring-purple-400 shadow-xl scale-105 border-purple-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('pending-sponsorship')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-purple-900">3. Available for Sponsors</h3>
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-purple-700 text-2xl font-bold">{availableForSponsorsStudents.length}</p>
            <p className="text-purple-500 text-sm">Students available for sponsorship</p>
          </div>
          
          {/* 4. Pending Requests */}
          <div 
            className={`bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-orange-400 ${
              selectedBox === 'pending-requests' ? 'ring-4 ring-orange-400 shadow-xl scale-105 border-orange-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('pending-requests')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-orange-900">4. Pending Requests</h3>
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-orange-700 text-2xl font-bold">{pendingRequestsStudents.length}</p>
            <p className="text-orange-500 text-sm">Sponsorship requests to review</p>
          </div>
          
          {/* 5. Admin Approval */}
          <div 
            className={`bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-yellow-400 ${
              selectedBox === 'pending-admin' ? 'ring-4 ring-yellow-400 shadow-xl scale-105 border-yellow-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('pending-admin')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-yellow-900">5. Admin Approval</h3>
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-yellow-700 text-2xl font-bold">{pendingAdminApprovalStudents.length}</p>
            <p className="text-yellow-500 text-sm">Awaiting admin approval</p>
          </div>

          {/* 6. Admin Admitted Sponsored Children */}
          <div 
            className={`bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-green-400 ${
              selectedBox === 'admin-sponsored' ? 'ring-4 ring-green-400 shadow-xl scale-105 border-green-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('admin-sponsored')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-green-900">6. Admitted by Admin</h3>
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-green-700 text-2xl font-bold">{adminAdmittedSponsoredStudents.length}</p>
            <p className="text-green-500 text-sm">Admin admitted sponsored</p>
          </div>

          {/* 7. Overseer Admitted Sponsored Children */}
          <div 
            className={`bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:border-teal-400 ${
              selectedBox === 'overseer-sponsored' ? 'ring-4 ring-teal-400 shadow-xl scale-105 border-teal-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleBoxClick('overseer-sponsored')}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-teal-900">7. Admitted by Overseer</h3>
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-teal-700 text-2xl font-bold">{overseerAdmittedSponsoredStudents.length}</p>
            <p className="text-teal-500 text-sm">Overseer admitted sponsored</p>
          </div>
        </div>
        
        {/* Selected Box Content */}
        {selectedBox && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedBox === 'eligibility-check' && 'Students Awaiting Eligibility Review'}
                {selectedBox === 'eligible' && 'Eligible Students'}
                {selectedBox === 'pending-sponsorship' && 'Students Available for Sponsors'}
                {selectedBox === 'pending-requests' && 'Pending Sponsorship Requests'}
                {selectedBox === 'pending-admin' && 'Students Awaiting Admin Approval'}
                {selectedBox === 'admin-sponsored' && 'Admin Admitted Sponsored Children'}
                {selectedBox === 'overseer-sponsored' && 'Overseer Admitted Sponsored Children'}
              </h3>
            </div>
            <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getStudentsForBox(selectedBox).map((student) => (
                <div 
                  key={student.id} 
                  className={`bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl hover:border-purple-400 hover:-translate-y-1 hover:scale-[1.02] transition-transform duration-300 overflow-hidden group relative`}
                  onClick={() => handleViewDetails(student)}
                >
                  {/* Hover glow overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-pink-400/10 via-purple-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
                  <div className={`relative z-10 p-4`}>
                    {selectedBox === 'pending-sponsorship' ? (
                      // Exact sponsor card styling for Box 3
                      <>
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-10 translate-x-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full translate-y-8 -translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        {/* Animated corner emojis */}
                        <div className="absolute top-2 left-2 text-3xl sm:text-4xl select-none pointer-events-none transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-2">
                          <span role="img" aria-label="smile" className="animate-bounce">😊</span>
                        </div>
                        <div className="absolute top-2 right-2 text-3xl sm:text-4xl select-none pointer-events-none transform transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:-translate-y-1 group-hover:-translate-x-2">
                          <span role="img" aria-label="happy-with-hearts" className="animate-pulse">🥰</span>
                        </div>

                        {/* Header avatar */}
                        <div className="text-center mb-4 p-4">
                          <div className="relative mx-auto mb-3">
                            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-3 border-white shadow-md">
                              <User className="w-10 h-10 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Heart className="w-3 h-3 text-white" />
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{student.name}</h3>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <div className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                              <p className="text-xs font-semibold text-purple-700">
                              {student.class} {student.stream ? `- ${student.stream}` : ''}
                            </p>
                            </div>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="text-xs text-gray-600">{student.accessNumber?.startsWith('None-') ? 'Access: None' : (student.accessNumber ? `Access: ${student.accessNumber}` : 'Access: None')}</p>
                            <p className="text-xs text-gray-600">Age: {student.age} years</p>
                        </div>
                        
                          {student.sponsorshipStory && (
                            <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-md">
                              <p className="text-xs text-gray-700 line-clamp-2">
                                {student.sponsorshipStory.length > 80 ? `${student.sponsorshipStory.substring(0, 80)}...` : student.sponsorshipStory}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions (View only for overseer) */}
                        <div className="flex gap-2 p-3 pt-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDisapproveStudent(student)}
                            className="flex-1 bg-gradient-to-r from-[#A78BFA] to-[#F472B6] hover:from-[#8B5CF6] hover:to-[#EC4899] text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md hover:shadow-lg relative group/deny"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Disapprove</span>
                            <span className="text-xl transition-all duration-200 opacity-100 group-hover/deny:opacity-0">😔</span>
                            <span className="text-xl transition-all duration-200 opacity-0 group-hover/deny:opacity-100 absolute right-2 group-hover/deny:scale-125">😭</span>
                          </button>
                        </div>
                      </>
                    ) : selectedBox === 'pending-requests' ? (
                      // Box 4 Design - Pending requests with sponsor details and actions
                      (() => {
                        const sponsorship = (sponsorships || []).find(
                          (s) => String(s.studentId) === String(student.id) && s.status === 'pending'
                        );
                        if (!sponsorship) {
                          return (
                            <div className="text-sm text-gray-500">No pending sponsorship found for this student.</div>
                          );
                        }
                        
                        console.log('🔍 Found sponsorship for student:', student.name, sponsorship);
                        
                        // Ensure we have a numeric ID for the backend
                        const sponsorshipId = typeof sponsorship.id === 'number' ? sponsorship.id : 
                          (sponsorships || []).find(s => 
                            String(s.studentId) === String(student.id) && 
                            s.status === 'pending' && 
                            typeof s.id === 'number'
                          )?.id || sponsorship.id;
                        
                        console.log('🔍 Using sponsorship ID:', sponsorshipId, 'Type:', typeof sponsorshipId);
                        
                        return (
                          <>
                            {/* Header gradient with icon */}
                            <div className="h-20 bg-gradient-to-r from-pink-400 to-purple-400 relative overflow-hidden rounded-md">
                              <div className="absolute inset-0 bg-black/10"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Heart className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              {/* Animated corner emojis */}
                              <div className="absolute top-2 left-2 text-2xl select-none pointer-events-none transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-2">
                                <span role="img" aria-label="hearts" className="animate-bounce">💕</span>
                              </div>
                              <div className="absolute top-2 right-2 text-2xl select-none pointer-events-none transform transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:-translate-y-1 group-hover:-translate-x-2">
                                <span role="img" aria-label="hugging-face" className="animate-pulse">🤗</span>
                              </div>
                              <div className="absolute top-6 left-8 text-xl select-none pointer-events-none transform transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110 group-hover:translate-y-1 group-hover:translate-x-1">
                                <span role="img" aria-label="hearts" className="animate-pulse">💕</span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900">{student.name}</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Waiting for Approval
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                                <p><strong>Class:</strong> {student.class} {student.stream ? `- ${student.stream}` : ' - None'}</p>
                                <p><strong>Age:</strong> {student.age} years</p>
                                <p><strong>Access:</strong> {student.accessNumber?.startsWith('None-') ? 'None' : (student.accessNumber || 'None')}</p>
                                <p><strong>Sponsor:</strong> {sponsorship.sponsorName}</p>
                                <p><strong>Amount:</strong> UGX {sponsorship.amount?.toLocaleString?.() || sponsorship.amount}</p>
                                <p><strong>Duration:</strong> {sponsorship.duration} months</p>
                                <p className="col-span-2"><strong>Requested:</strong> {new Date(sponsorship.createdAt).toLocaleDateString?.() || new Date().toLocaleDateString()}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveSponsorship({...sponsorship, id: sponsorshipId});
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 relative group/approve"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Approve</span>
                                  <span className="text-lg transition-all duration-200 opacity-100 group-hover/approve:opacity-0">✅</span>
                                  <span className="text-lg transition-all duration-200 opacity-0 group-hover/approve:opacity-100 absolute right-2 group-hover/approve:scale-125">🎉</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectSponsorship({...sponsorship, id: sponsorshipId});
                                  }}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 relative group/reject"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Disapprove</span>
                                  <span className="text-lg transition-all duration-200 opacity-100 group-hover/reject:opacity-0">❌</span>
                                  <span className="text-lg transition-all duration-200 opacity-0 group-hover/reject:opacity-100 absolute right-2 group-hover/reject:scale-125">😔</span>
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      // Original design for other boxes
                      <>
                        <div className="flex items-center space-x-3 mb-3">
                          {student.photo ? (
                            <img 
                              src={student.photo} 
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                    <div>
                            <h4 className="font-semibold text-purple-900">{student.name}</h4>
                            <p className="text-sm text-purple-700">
                              {student.class} {student.stream ? `- ${student.stream}` : ''}
                            </p>
                            <p className="text-xs text-purple-600">
                              {student.accessNumber?.startsWith('None-') ? 'Access: None' : (student.accessNumber ? `Access: ${student.accessNumber}` : 'Not enrolled yet')}
                            </p>
                            <p className="text-xs text-purple-600">Age: {student.age} years</p>
                    </div>
                  </div>
                        
                        {/* Sponsorship Story Preview */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {student.sponsorshipStory || 'No sponsorship story available.'}
                          </p>
                  </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {(selectedBox === 'eligibility-check' || selectedBox === 'eligible') ? (
                            <>
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleApproveStudent(student)}
                                className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              {selectedBox === 'eligibility-check' && (
                                <button
                                  onClick={() => handleDeleteStudent(student)}
                                  className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </>
                          ) : selectedBox === 'available-for-sponsors' ? (
                            <>
                              <button
                                onClick={() => handleViewDetails(student)}
                                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleDisapproveStudent(student)}
                                className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Disapprove
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewDetails(student)}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              </div>
              {getStudentsForBox(selectedBox).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No students in this category</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admit Student Form */}
        <AdmitStudentForm
          isOpen={showAdmitForm}
          onClose={() => setShowAdmitForm(false)}
          onSuccess={() => {
            // Close the form immediately
            setShowAdmitForm(false);
            showSuccess('Student Added!', 'Student added successfully!');
            // Refresh data in the background
            handleRefreshSponsorships();
          }}
        />

        {/* Edit Student Form */}
        <EditStudentForm
          student={editingStudent}
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <StudentDetailsWindow
          student={selectedStudent}
          onClose={() => {
            setShowStudentDetails(false);
            setSelectedStudent(null);
          }}
        />
      )}
      </div>
    );
  }

  // For all other users, show a simple message
  return (
    <div className="p-6">
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sponsorship Management</h1>
        <p className="text-gray-600">This section is only available for administrators and sponsorship overseers.</p>
      </div>
    </div>
  );
};

export default SponsorshipManagement;


