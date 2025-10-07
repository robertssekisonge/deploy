import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Heart, Eye, Send, User, GraduationCap, Hash, X, Loader2 } from 'lucide-react';
import StudentDetailsWindow from './StudentDetailsWindow';

// Custom CSS for the looking animation
const lookingAnimation = `
  @keyframes lookLeftRight {
    0%, 100% { transform: translateY(-50%) rotate(0deg); }
    25% { transform: translateY(-50%) rotate(-15deg); }
    75% { transform: translateY(-50%) rotate(15deg); }
  }
  
  .looking-emoji {
    animation: lookLeftRight 2s ease-in-out infinite;
  }
  
  @keyframes hugRequest {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(-5deg); }
    50% { transform: scale(1.2) rotate(0deg); }
    75% { transform: scale(1.1) rotate(5deg); }
  }
  
  .hug-sticker {
    animation: hugRequest 3s ease-in-out infinite;
  }
  
  .hug-sticker-hover {
    animation: hugRequest 1s ease-in-out infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .bounce-sticker {
    animation: bounce 2s ease-in-out infinite;
  }
`;

const AvailableForSponsors: React.FC = () => {
  const { students, sponsorships, addSponsorship, updateStudent } = useData();
  const { user } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showSponsorshipForm, setShowSponsorshipForm] = useState(false);
  const [selectedStudentForSponsorship, setSelectedStudentForSponsorship] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Add the style tag to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = lookingAnimation;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filter students available for sponsors and not already tied to a pending/approved sponsorship
  const blockedStatuses = new Set(['pending', 'coordinator-approved', 'sponsored']);
  const blockedStudentIds = new Set(
    (sponsorships || [])
      .filter(s => s.studentId && blockedStatuses.has(s.status))
      .map(s => s.studentId.toString())
  );
  const availableStudents = students.filter(s => 
    s.sponsorshipStatus === 'available-for-sponsors' &&
    s.needsSponsorship &&
    !blockedStudentIds.has(String(s.id))
  );

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleRequestSponsorship = (student: any) => {
    setSelectedStudentForSponsorship(student);
    setShowSponsorshipForm(true);
  };

  const handleDisapproveStudent = async (student: any) => {
    if (!confirm(`Are you sure you want to disapprove ${student.name}? This will move them back to Box 2 (Eligible).`)) {
      return;
    }
    
    setLoading(true);
    try {
      await updateStudent(student.id, { sponsorshipStatus: 'eligible' });
      showSuccess('Student Disapproved!', `${student.name} has been disapproved and moved back to Box 2 (Eligible).`);
    } catch (error) {
      console.error('Error disapproving student:', error);
      showError('Disapproval Failed', 'Failed to disapprove student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSponsorship = async (formData: any) => {
    if (!user || !selectedStudentForSponsorship) return;
    
    setLoading(true);
    try {
      const sponsorshipData = {
        studentId: parseInt(selectedStudentForSponsorship.id),
        studentName: selectedStudentForSponsorship.name,
        sponsorId: user.id.toString(),
        sponsorName: user.name,
        sponsorEmail: user.email || '',
        sponsorPhone: user.phone || '',
        sponsorOrganization: formData.organization || '',
        sponsorCountry: formData.country || 'Uganda',
        amount: parseFloat(formData.amount),
        duration: parseInt(formData.duration),
        startDate: new Date(),
        endDate: new Date(Date.now() + parseInt(formData.duration) * 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
        description: formData.noteToChild || '',
        paymentSchedule: formData.paymentSchedule || 'monthly'
      };

      console.log('🎯 Submitting sponsorship data:', sponsorshipData);
      
      // Use shared method to persist to backend and update sponsorships state
      await addSponsorship(sponsorshipData);
      
      console.log('✅ Sponsorship submitted successfully');

      // Don't change student status - Box 4 filters by sponsorship status, not student status
      // The student will appear in Box 4 because they have a sponsorship with status 'pending'
      setShowSponsorshipForm(false);
      setSelectedStudentForSponsorship(null);
      showSuccess('Sponsorship Request Submitted!', 'Your sponsorship request has been submitted successfully! It will be reviewed by the sponsorship overseer.');
    } catch (error) {
      console.error('Error submitting sponsorship:', error);
      showError('Submission Failed', 'Failed to submit sponsorship request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8" key={`available-sponsors-${Date.now()}`}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Children Needing Sponsorship</h1>
        </div>
        <p className="text-gray-600 text-lg">
          These children have been approved for sponsorship and are waiting for your support
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableStudents.map((student) => (
          <div 
            key={student.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-10 translate-x-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full translate-y-8 -translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            
            {/* Hug Request Sticker - Landscape Layout */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 group-hover:top-4 group-hover:right-4 transition-all duration-300">
              <div className="bounce-sticker text-sm group-hover:translate-x-2 transition-transform duration-300">
                💕
              </div>
              <div className="hug-sticker group-hover:hug-sticker-hover text-2xl sm:text-3xl group-hover:scale-125 transition-transform duration-300">
                🤗
              </div>
              <div className="bounce-sticker text-sm group-hover:-translate-x-2 transition-transform duration-300" style={{animationDelay: '0.5s'}}>
                💕
              </div>
            </div>
            
            <div className="relative z-10">
              {/* Top Profile Section - Simple Design */}
              <div className="text-center mb-4 p-4">
                <div className="relative mx-auto mb-3">
                  <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-3 border-white shadow-md">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {student.name}
                </h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                    <p className="text-xs font-semibold text-purple-700">
                      <GraduationCap className="w-3 h-3 inline mr-1" />
                      {student.class} - Stream {student.stream}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <Hash className="w-3 h-3 text-purple-500" />
                    <span className="font-medium">Access: {student.accessNumber?.startsWith('None-') ? 'None' : student.accessNumber}</span>
                  </p>
                  <p className="text-xs text-gray-600">Age: {student.age} years</p>
                </div>
                
                {student.sponsorshipStory && (
                  <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-md">
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {student.sponsorshipStory.length > 80
                        ? `${student.sponsorshipStory.substring(0, 80)}...`
                        : student.sponsorshipStory
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Section */}
              <div className="flex gap-2 p-3 pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(student);
                  }}
                  className="flex-1 bg-gradient-to-r from-[#A78BFA] to-[#F472B6] hover:from-[#8B5CF6] hover:to-[#EC4899] text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                  <span className="text-base">🤩</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestSponsorship(student);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md hover:shadow-lg relative group/sponsor"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span className="relative z-10">Sponsor This Child</span>
                  <span className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce">❤️</span>
                  <span className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse">💝</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {availableStudents.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No Children Currently Available</h3>
            <p className="text-gray-400">
              All children in need of sponsorship are currently being processed or have already been sponsored.
            </p>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <StudentDetailsWindow
          student={selectedStudent}
          onClose={() => setShowStudentDetails(false)}
        />
      )}

      {/* Sponsorship Request Form Modal */}
      {showSponsorshipForm && selectedStudentForSponsorship && (
        <SponsorshipRequestForm
          student={selectedStudentForSponsorship}
          onSubmit={handleSubmitSponsorship}
          onClose={() => {
            setShowSponsorshipForm(false);
            setSelectedStudentForSponsorship(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

// Sponsorship Request Form Component
const SponsorshipRequestForm: React.FC<{
  student: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ student, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    country: 'Uganda',
    city: '',
    email: '',
    preferredContact: 'email',
    startDate: '',
    amount: '',
    duration: '12',
    paymentSchedule: 'monthly',
    noteToChild: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50">
      <div className="bg-gradient-to-br from-indigo-200 via-white to-rose-200 rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto border border-indigo-200">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Request to Sponsor {student.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 text-xs">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your full name"
                />
              </div>
              {/* Organization hidden to reduce length */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Contact</label>
                  <select
                    value={formData.preferredContact}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start of Sponsorship</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Amount (UGX)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="50000"
                    min="1000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Schedule</label>
                  <select
                    value={formData.paymentSchedule}
                    onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annually">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note to the Child (Optional)</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={formData.noteToChild}
                    onChange={(e) => setFormData({ ...formData, noteToChild: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="Send a short, kind note"
                  />
                  {(!formData.noteToChild || formData.noteToChild.trim().length === 0) && (
                    <>
                      <span className="pointer-events-none absolute right-2 top-2 text-xl animate-bounce">👋</span>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-6">
                        <span className="text-3xl animate-pulse">😀</span>
                        <span className="text-3xl animate-bounce">❤️‍🔥</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Removed duplicated legacy fields per user request */}

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.amount || !formData.fullName || !formData.email}
                className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvailableForSponsors;

