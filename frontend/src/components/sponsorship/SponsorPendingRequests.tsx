import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, User, X, Clock } from 'lucide-react';

const SponsorPendingRequests: React.FC = () => {
  const { sponsorships, students, updateSponsorship } = useData();
  const { user } = useAuth();
  const [disapprovingId, setDisapprovingId] = useState<string | null>(null);

  // Check if user exists and has the correct role
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p>User not authenticated.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'SPONSOR') {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p>This page is only accessible to sponsors.</p>
          <p className="mt-2 text-sm">Your role: {user.role}</p>
          <p className="text-sm">Required role: SPONSOR</p>
        </div>
      </div>
    );
  }

  // Debug: Log user and sponsorships data
  console.log('🔍 SponsorPendingRequests Debug:');
  console.log('👤 Current user:', { id: user.id, name: user.name, role: user.role });
  console.log('📊 All sponsorships:', sponsorships.map(s => ({
    id: s.id,
    studentId: s.studentId,
    sponsorId: s.sponsorId,
    sponsorName: s.sponsorName,
    status: s.status
  })));

  // Backend sponsorships may not include sponsorId; fall back to matching by sponsorName
  const pendingRequests = sponsorships.filter(s => {
    const isPending = s.status === 'pending' || s.status === 'coordinator-approved';
    
    // Handle both string and number types for user.id and sponsorId
    const userIdStr = user.id?.toString();
    const sponsorIdStr = s.sponsorId?.toString();
    const matchesById = sponsorIdStr && userIdStr ? sponsorIdStr === userIdStr : false;
    const matchesByName = s.sponsorName && user.name ? s.sponsorName.toLowerCase() === user.name.toLowerCase() : false;
    
    console.log(`🔍 Sponsorship ${s.id}:`, {
      isPending,
      matchesById,
      matchesByName,
      sponsorId: s.sponsorId,
      sponsorIdStr,
      userId: user.id,
      userIdStr,
      sponsorName: s.sponsorName,
      userName: user.name
    });
    
    return isPending && (matchesById || matchesByName);
  });

  console.log('✅ Filtered pending requests:', pendingRequests.length);

  const handleDisapprove = async (sponsorshipId: string, studentId: string) => {
    try {
      setDisapprovingId(sponsorshipId);
      
      // Update sponsorship status to rejected
      await updateSponsorship(sponsorshipId, { status: 'rejected' });
      
      // Update student status back to available for sponsorship
      // This will be handled in the updateSponsorship function
      
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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Pending Sponsorship Requests</h1>
      {pendingRequests.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No pending sponsorship requests</p>
          <p className="text-sm text-gray-400">Your sponsorship requests will appear here while waiting for admin approval</p>
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
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Student Details - Compact Layout */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                    <p><strong>Class:</strong> {student?.class} - {student?.stream}</p>
                    <p><strong>Age:</strong> {student?.age} years</p>
                    <p><strong>Access:</strong> {student?.accessNumber?.startsWith('None-') ? 'None' : student?.accessNumber}</p>
                    <p><strong>Sponsor:</strong> {sponsorship.sponsorName}</p>
                    <p><strong>Amount:</strong> UGX {sponsorship.amount?.toLocaleString()}</p>
                    <p><strong>Duration:</strong> {sponsorship.duration} months</p>
                    <p className="col-span-2"><strong>Request Date:</strong> {new Date(sponsorship.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Status Message */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 text-yellow-600 mr-1" />
                      <p className="text-xs text-yellow-800 font-medium">
                        Waiting for Admin Approval
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your sponsorship request is being reviewed by the administration
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDisapprove(sponsorship.id, sponsorship.studentId)}
                      disabled={disapprovingId === sponsorship.id}
                      className={`flex-1 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-xs ${
                        disapprovingId === sponsorship.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {disapprovingId === sponsorship.id ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
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

export default SponsorPendingRequests; 