import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, User, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const OverseerPendingRequests: React.FC = () => {
  const { sponsorships, students, updateSponsorship } = useData();
  const { user } = useAuth();
  const [disapprovingId, setDisapprovingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Check if user exists and has the correct role
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p>User not authenticated.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'SPONSORSHIPS_OVERSEER') {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p>This page is only accessible to Sponsorships Overseers.</p>
          <p className="mt-2 text-sm">Your role: {user.role}</p>
          <p className="text-sm">Required role: SPONSORSHIPS_OVERSEER</p>
        </div>
      </div>
    );
  }

  // Use only backend data - no localStorage fallback needed
  const pendingRequests = sponsorships.filter(s => s.status === 'pending');

  const handleApprove = async (sponsorshipId: string) => {
    try {
      setApprovingId(sponsorshipId);
      
      // Update sponsorship status to sponsored
      await updateSponsorship(sponsorshipId, { status: 'sponsored' });
      
      // Find the student associated with this sponsorship and update their status
      const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
      if (sponsorship && sponsorship.studentId) {
        const student = students.find(s => s.id === sponsorship.studentId);
        if (student) {
          // Update student's sponsorship status to 'sponsored'
          // This will move them from Box 4 (Pending Requests) to Box 6 (Admin Admitted Sponsored Children)
          await updateStudent(student.id, { sponsorshipStatus: 'sponsored' });
          console.log(`✅ Student ${student.name} status updated to sponsored`);
        }
      }
      
      console.log('✅ Sponsorship approved');
      
      // Show success message briefly
      setTimeout(() => {
        setApprovingId(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Error approving sponsorship:', error);
      setApprovingId(null);
    }
  };

  const handleDisapprove = async (sponsorshipId: string) => {
    try {
      setDisapprovingId(sponsorshipId);
      
      // Update sponsorship status to rejected
      await updateSponsorship(sponsorshipId, { status: 'rejected' });
      
      console.log('✅ Sponsorship disapproved, student returned to available list');
      
      // Show success message briefly
      setTimeout(() => {
        setDisapprovingId(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Error disapproving sponsorship:', error);
      setDisapprovingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Sponsorship Requests</h1>
          <p className="text-gray-600 mt-1">Review and approve/reject sponsorship requests from sponsors</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-500">All sponsorship requests have been processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map(sponsorship => {
            const student = students.find(stu => stu.id === sponsorship.studentId);
            return (
              <div key={sponsorship.id} className="bg-white rounded-xl shadow-lg border border-yellow-200 overflow-hidden group relative">
                {/* Hug Sticker */}
                <div className="absolute top-2 right-2 z-10 transition-all duration-300 group-hover:top-4 group-hover:right-4">
                  <div className="flex items-center space-x-1 text-lg">
                    <span className="animate-bounce">💕</span>
                    <span className="animate-pulse">🤗</span>
                    <span className="animate-bounce">💕</span>
                  </div>
                </div>

                {/* Student Photo */}
                <div className="h-20 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900">{student?.name || sponsorship.studentName}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting for Approval
                      </span>
                    </div>
                  </div>

                  {/* Student Details - Compact Layout */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                    <p><strong>Class:</strong> {student?.class} - {student?.stream}</p>
                    <p><strong>Age:</strong> {student?.age} years</p>
                    <p><strong>Access:</strong> {student?.accessNumber}</p>
                    <p><strong>Sponsor:</strong> {sponsorship.sponsorName}</p>
                    <p><strong>Email:</strong> {sponsorship.sponsorEmail}</p>
                    <p><strong>Phone:</strong> {sponsorship.sponsorPhone}</p>
                    <p><strong>Amount:</strong> UGX {sponsorship.amount?.toLocaleString()}</p>
                    <p><strong>Duration:</strong> {sponsorship.duration} months</p>
                    <p className="col-span-2"><strong>Message:</strong> {sponsorship.message}</p>
                    <p className="col-span-2"><strong>Requested:</strong> {new Date(sponsorship.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(sponsorship.id)}
                      disabled={approvingId === sponsorship.id}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        approvingId === sponsorship.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {approvingId === sponsorship.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDisapprove(sponsorship.id)}
                      disabled={disapprovingId === sponsorship.id}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        disapprovingId === sponsorship.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {disapprovingId === sponsorship.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Disapprove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OverseerPendingRequests;
