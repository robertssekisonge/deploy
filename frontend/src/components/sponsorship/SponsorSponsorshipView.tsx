import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Heart, Eye, User, GraduationCap, Hash } from 'lucide-react';
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

const SponsorSponsorshipView: React.FC = () => {
  const { students, addSponsorship } = useData();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
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

  // Filter students available for sponsors
  const availableStudents = students.filter(s => 
    s.sponsorshipStatus === 'available-for-sponsors' && s.needsSponsorship
  );

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleRequestSponsorship = (student: any) => {
    setSelectedStudentForSponsorship(student);
    setShowSponsorshipForm(true);
  };

  const handleSubmitSponsorship = async (formData: any) => {
    if (!user || !selectedStudentForSponsorship) return;
    
    setLoading(true);
    try {
      const sponsorshipData = {
        studentId: selectedStudentForSponsorship.id,
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
        description: formData.description || '',
        paymentSchedule: formData.paymentSchedule || 'monthly'
      };

      await addSponsorship(sponsorshipData);
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
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Children Needing Sponsorships</h1>
        </div>
        <p className="text-gray-600 text-lg">
          These children have been approved by the overseer and are waiting for your sponsorship support
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableStudents.map((student) => (
          <div key={student.id} className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative">
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
              {/* Top Profile Section with Purple-Pink Gradient */}
              <div className="h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
                    <User className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>

              {/* Child Information Section */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1">
                  {student.name}
                </h3>
                <p className="text-sm text-purple-600 mb-2 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {student.class} - Stream {student.stream}
                </p>
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Access: {student.accessNumber?.startsWith('None-') ? 'None' : student.accessNumber}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Age: {student.age} years
                </p>
                
                {student.sponsorshipStory && (
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                    {student.sponsorshipStory}
                  </p>
                )}

                {/* Action Buttons Section */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(student)}
                    className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg relative"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="relative z-10">View Details</span>
                    {/* Live emoji that looks left and right */}
                    <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xl sm:text-2xl looking-emoji">
                      😀
                    </span>
                  </button>
                  <button
                    onClick={() => handleRequestSponsorship(student)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg relative group/sponsor"
                  >
                    <Heart className="w-3 h-3" />
                    <span className="relative z-10">Sponsor This Child</span>
                    {/* Animated emoji hover effects - positioned around the button */}
                    <span className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce">
                      ❤️
                    </span>
                    <span className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse">
                      💝
                    </span>
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce" style={{animationDelay: '0.1s'}}>
                      💖
                    </span>
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse" style={{animationDelay: '0.2s'}}>
                      😊
                    </span>
                    <span className="absolute left-5 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce" style={{animationDelay: '0.3s'}}>
                      🌟
                    </span>
                    <span className="absolute right-5 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse" style={{animationDelay: '0.4s'}}>
                      ✨
                    </span>
                    <span className="absolute left-7 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce" style={{animationDelay: '0.5s'}}>
                      🎉
                    </span>
                    <span className="absolute right-7 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse" style={{animationDelay: '0.6s'}}>
                      🥰
                    </span>
                    <span className="absolute left-9 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-bounce" style={{animationDelay: '0.7s'}}>
                      💕
                    </span>
                    <span className="absolute right-9 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/sponsor:opacity-100 transition-all duration-300 text-sm animate-pulse" style={{animationDelay: '0.8s'}}>
                      🎊
                    </span>
                  </button>
                </div>
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
    organization: '',
    country: 'Uganda',
    amount: '',
    duration: '12',
    paymentSchedule: 'monthly',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Request to Sponsor {student.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Schedule</label>
              <select
                value={formData.paymentSchedule}
                onChange={(e) => setFormData({...formData, paymentSchedule: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Share a message with the child..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SponsorSponsorshipView;
