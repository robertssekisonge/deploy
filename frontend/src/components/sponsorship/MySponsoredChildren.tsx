import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Eye, User, GraduationCap, Hash, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import StudentDetailsWindow from './StudentDetailsWindow';

const MySponsoredChildren: React.FC = () => {
  const { sponsorships, students } = useData();
  const { user } = useAuth();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  // ROBUST SPONSOR FILTERING - Multiple strategies to ensure data is always found
  const mySponsorships = sponsorships.filter(s => {
    // Strategy 1: Direct sponsorId matching (handles all data types)
    const sponsorIdMatch = s.sponsorId === user?.id || 
                          s.sponsorId === user?.id?.toString() || 
                          s.sponsorId?.toString() === user?.id?.toString();
    
    // Strategy 2: SponsorName matching (fallback protection)
    const sponsorNameMatch = s.sponsorName === user?.name || 
                           s.sponsorName === user?.username ||
                           s.sponsorName === user?.email?.split('@')[0] ||
                           s.sponsorName?.toLowerCase() === user?.name?.toLowerCase() ||
                           s.sponsorName?.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase();
    
    // Strategy 3: Email-username matching
    const emailUsernameMatch = user?.email && s.sponsorName &&
                              user.email.split('@')[0].toLowerCase() === s.sponsorName.toLowerCase();
    
    // Status filtering (all valid sponsorship states)
    const statusMatch = s.status === 'active' || 
                       s.status === 'sponsored' || 
                       s.status === 'coordinator-approved' || 
                       s.status === 'pending' ||
                       s.status === 'pending-admin-approval';
    
    // Return true if ANY matching strategy succeeds
    return (sponsorIdMatch || sponsorNameMatch || emailUsernameMatch) && statusMatch;
  });
  
  // ROBUST STUDENT LOOKUP - Multiple strategies to find students
  const sponsoredStudents = mySponsorships.map(sponsorship => {
    // Try multiple ways to find the student
    const student = students.find(s => s.id === sponsorship.studentId) ||
                   students.find(s => s.id === sponsorship.studentId?.toString()) ||
                   students.find(s => s.id?.toString() === sponsorship.studentId?.toString()) ||
                   students.find(s => parseInt(s.id) === parseInt(sponsorship.studentId));
    
    return {
      ...sponsorship,
      student
    };
  }).filter(item => item.student); // Only show if student exists

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'sponsored':
        return 'text-green-600 bg-green-100';
      case 'coordinator-approved':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
      case 'pending-admin-approval':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
      case 'sponsored':
        return 'Active';
      case 'coordinator-approved':
        return 'Pending Admin Approval';
      case 'pending':
        return 'Pending Review';
      case 'pending-admin-approval':
        return 'Awaiting Admin';
      default:
        return status;
    }
  };

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateRemainingMonths = (endDate: Date | string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Sponsored Children</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Children you are currently sponsoring or have requested to sponsor
        </p>
      </div>

      {/* SECURITY METRICS DISPLAY */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>🔍 Data Recovery Status:</strong> 
          Filtered {mySponsorships.length} sponsorships for user "{user?.name || user?.email || user?.id}"
          • Found {sponsoredStudents.length} valid students
          • Total sponsorships available: {sponsorships.length}
        </div>
      </div>

      {sponsoredStudents.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Sponsored Children Yet</h3>
          <p className="text-gray-400 mb-4">
            You haven't sponsored any children yet. Browse available children to start making a difference.
          </p>
          {mySponsorships.length > 0 && sponsoredStudents.length === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600 text-sm">
                ⚠️ Found {mySponsorships.length} sponsorships but couldn't locate student records. 
                This may indicate a data synchronization issue.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsoredStudents.map((sponsorship) => {
            const student = sponsorship.student;
            const remainingMonths = calculateRemainingMonths(sponsorship.endDate);
            
            return (
              <div key={sponsorship.id} className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-center mb-3">
                  {student.photo ? (
                    <img 
                      src={student.photo} 
                      alt={student.name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-blue-300 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto mb-2 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{student.name}</h3>
                  <p className="text-gray-600 mb-1 text-sm">
                    <GraduationCap className="w-3 h-3 inline mr-1" />
                    {student.class} - Stream {student.stream}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    <Hash className="w-3 h-3 inline mr-1" />
                    Access: {student.accessNumber?.startsWith('None-') ? 'None' : student.accessNumber}
                  </p>
                  
                  {/* Status Badge */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sponsorship.status)}`}>
                    {getStatusText(sponsorship.status)}
                  </div>
                </div>

                {/* Sponsorship Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Monthly Amount:</span>
                    <span className="font-semibold text-green-600">
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      UGX {sponsorship.amount?.toLocaleString() || 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Duration:</span>
                  
                     <span className="font-semibold">
                       {sponsorship.duration || 'Not specified'} months
                     </span>
                   </div>
                  
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-gray-600">Start Date:</span>
                     <span className="font-semibold">
                       <Calendar className="w-3 h-3 inline mr-1" />
                       {formatDate(sponsorship.startDate)}
                     </span>
                   </div>
                  
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-gray-600">End Date:</span>
                     <span className="font-semibold">
                       <Calendar className="w-3 h-3 inline mr-1" />
                       {formatDate(sponsorship.endDate)}
                     </span>
                   </div>
                  
                   {sponsorship.status === 'active' || sponsorship.status === 'sponsored' ? (
                     <div className="flex items-center justify-between text-xs">
                       <span className="text-gray-600">Remaining:</span>
                       <span className={`font-semibold ${remainingMonths <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                         {remainingMonths <= 3 ? (
                           <AlertCircle className="w-3 h-3 inline mr-1" />
                         ) : (
                           <Clock className="w-3 h-3 inline mr-1" />
                         )}
                         {remainingMonths} months
                       </span>
                     </div>
                   ) : null}
                 </div>

                 {/* Payment Schedule */}
                 <div className="mb-3 p-2 bg-blue-100 rounded-lg border border-blue-200">
                   <p className="text-xs text-blue-800">
                     <strong>Payment Schedule:</strong> {sponsorship.paymentSchedule || 'monthly'}
                   </p>
                 </div>

                 {/* Action Button */}
                 <div className="flex gap-2">
                   <button
                     onClick={() => handleViewDetails(student)}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105 shadow-md"
                   >
                     <Eye className="w-3 h-3" />
                     View Details
                   </button>
                  
                   {sponsorship.status === 'pending-admin-approval' && (
                     <div className="flex-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                       <Clock className="w-4 h-4" />
                       Awaiting Admin
                     </div>
                   )}
                  
                   {sponsorship.status === 'active' || sponsorship.status === 'sponsored' ? (
                     <div className="flex-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 border border-green-200 shadow-sm">
                       <CheckCircle className="w-3 h-3" />
                       Active Sponsorship
                     </div>
                   ) : null}
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
           onClose={() => setShowStudentDetails(false)}
         />
       )}
     </div>
   );
 };

 export default MySponsoredChildren;