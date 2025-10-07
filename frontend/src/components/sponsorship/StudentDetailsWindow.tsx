import React, { useState } from 'react';
import { 
  User, Phone, Mail, MapPin, Briefcase, GraduationCap, Target, 
  Camera, FileText, CheckCircle, X, Users, Building, Heart, 
  Calendar, Award, BookOpen, Home, UserCheck, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface StudentDetailsWindowProps {
  student: any;
  onClose: () => void;
  onEdit?: (studentId: string) => void;
}

const StudentDetailsWindow: React.FC<StudentDetailsWindowProps> = ({ 
  student, 
  onClose, 
  onEdit 
}) => {
  // Function to get display text for sponsorship status
  const getSponsorshipStatusText = (status: string) => {
    console.log('🔍 DEBUG - getSponsorshipStatusText called with status:', status);
    switch (status) {
      case 'awaiting': return 'Awaiting';
      case 'pending': return 'Pending';
      case 'sponsored': return 'Sponsored';
      case 'eligible': return 'Eligible';
      case 'available-for-sponsors': return 'Available';
      case 'coordinator-approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status || 'No status';
    }
  };
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [preview, setPreview] = useState<{ url: string; alt: string } | null>(null);

  // Debug: Log student data to check for caching issues
  console.log('🔍 DEBUG - Student data in StudentDetailsWindow:', {
    id: student.id,
    name: student.name,
    sponsorshipStatus: student.sponsorshipStatus,
    needsSponsorship: student.needsSponsorship,
    admittedBy: student.admittedBy
  });

  const openPreview = (url: string, alt: string) => {
    if (!url) return;
    setPreview({ url, alt });
  };

  const closePreview = () => setPreview(null);

  if (!student) return null;

  const isSponsor = user?.role === 'SPONSOR';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: UserCheck },
    { id: 'family', label: 'Family Details', icon: Users },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'sponsorship', label: 'Sponsorship', icon: Heart },
    { id: 'photos', label: 'Photos', icon: Camera }
  ];

  return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="group bg-gradient-to-br from-gray-50 via-white to-indigo-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transition-transform duration-200 hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)] hover:scale-[1.005]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <User className="h-6 w-6" />
                </div>
                <div>
                <h2 className="text-2xl font-bold">Student Profile</h2>
                <p className="text-purple-100 text-sm">Comprehensive student information</p>
                </div>
              </div>
              <button
                onClick={onClose}
              className="p-3 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
        {/* Tabs (hidden for sponsors – single window layout) */}
        {!isSponsor && (
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Single-window sponsor view */}
          {isSponsor && (
            <div className="space-y-8">
              {/* Hero / Overview Section */}
              <div className="space-y-6">
                <div className="relative rounded-2xl p-6 border border-purple-200 bg-gradient-to-r from-[#A78BFA]/20 via-[#60A5FA]/20 to-[#34D399]/20 transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-purple-200 hover:-translate-y-0.5">
                  {/* soft decorative bubbles */}
                  <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#A78BFA]/30 blur-2xl opacity-30"></div>
                  <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-[#60A5FA]/30 blur-2xl opacity-30"></div>
                  {/* lively emojis */}
                  <div className="pointer-events-none absolute top-2 right-3 flex items-center gap-2">
                    <span className="text-4xl animate-bounce drop-shadow-sm">😀</span>
                    <span className="text-4xl animate-pulse drop-shadow-sm">🤗</span>
                  </div>
                  <div className="flex items-center gap-6">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg transition-transform duration-200 hover:scale-105" />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center ring-4 ring-white shadow-lg transition-transform duration-200 hover:scale-105">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs tracking-wide uppercase text-purple-600 font-semibold mb-1">Meet this amazing child ✨</p>
                      <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{student.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">Access: {student.accessNumber?.startsWith('None-') ? 'None' : (student.accessNumber || 'Not Assigned')}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                          <GraduationCap className="w-4 h-4" />
                          {student.class} - {student.stream}
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          <Calendar className="w-4 h-4" />
                          Age {student.age}
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                          <UserCheck className="w-4 h-4" />
                          {student.gender}
                        </span>
                        {student.needsSponsorship && (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                            student.sponsorshipStatus === 'sponsored' ? 'bg-green-100 text-green-800' : 
                            student.sponsorshipStatus === 'awaiting' ? 'bg-yellow-100 text-yellow-800' :
                            student.sponsorshipStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            <Heart className="w-4 h-4" />
                            {getSponsorshipStatusText(student.sponsorshipStatus)}
                          </span>
                        )}
                      </div>
                      {/* CTA */}
                      <div className="mt-5 flex items-center gap-3">
                        <button className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-semibold shadow-md transition hover:shadow-xl">
                          <Heart className="w-4 h-4" />
                          Sponsor This Child
                          <span className="pointer-events-none absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition duration-300 text-lg select-none">😊</span>
                          <span className="pointer-events-none absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition duration-300 text-lg select-none">🎉</span>
                        </button>
                        <span className="text-sm text-gray-500">Your support creates real impact 💜</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Cards removed to avoid repetition */}

              {/* Personal, Family, Academic, Sponsorship, Photos – stacked */}
              <div className="space-y-6">
                {/* Personal */}
                <div className="bg-gradient-to-br from-indigo-100 via-indigo-50 to-white rounded-xl p-4 border border-indigo-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-purple-200">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">Full Name</div>
                        <div className="font-semibold text-gray-900">{student.name}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-green-200">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500">Date of Birth</div>
                        <div className="font-semibold text-gray-900">{student.dateOfBirth || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-orange-200">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="font-semibold text-gray-900">{student.address || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-purple-200">
                      <UserCheck className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-500">Gender</div>
                        <div className="font-semibold text-gray-900">{student.gender}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Details removed for sponsor view */}

                {/* Academic section removed to avoid repetition with overview chips */}

                {/* Sponsorship Story (only) for sponsor view */}
                {student.sponsorshipStory && (
                  <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-4 border border-purple-200 transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-purple-300 hover:-translate-y-0.5 max-w-3xl mx-auto">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <h5 className="text-base font-semibold text-gray-900">Sponsorship Story</h5>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                      {student.sponsorshipStory}
                    </p>
                  </div>
                )}

                {/* Photos */}
                <div className="rounded-2xl p-5 border border-teal-200 bg-gradient-to-br from-teal-100 via-teal-50 to-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-teal-300 max-w-3xl mx-auto">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div
                      className={`group text-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 hover:ring-1 hover:ring-purple-200 rounded-xl p-1 ${student.photo ? 'cursor-zoom-in' : ''}`}
                      onClick={() => student.photo && openPreview(student.photo, 'Passport Photo')}
                      role={student.photo ? 'button' : undefined}
                      tabIndex={student.photo ? 0 : -1}
                      onKeyDown={(e) => {
                        if (student.photo && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          openPreview(student.photo, 'Passport Photo');
                        }
                      }}
                    >
                      <div className="p-2 bg-orange-100 inline-block rounded-lg mb-2"><Camera className="h-5 w-5 text-orange-600" /></div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Passport Photo</div>
                      {student.photo ? (
                        <img onClick={() => openPreview(student.photo, 'Passport Photo')} src={student.photo} alt="Student" className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-purple-200 hover:scale-105 transition cursor-zoom-in" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto ring-4 ring-purple-200">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`group text-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 hover:ring-1 hover:ring-green-200 rounded-xl p-1 ${student.familyPhoto ? 'cursor-zoom-in' : ''}`}
                      onClick={() => student.familyPhoto && openPreview(student.familyPhoto, 'Family Photo')}
                      role={student.familyPhoto ? 'button' : undefined}
                      tabIndex={student.familyPhoto ? 0 : -1}
                      onKeyDown={(e) => {
                        if (student.familyPhoto && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          openPreview(student.familyPhoto, 'Family Photo');
                        }
                      }}
                    >
                      <div className="p-2 bg-green-100 inline-block rounded-lg mb-2"><Users className="h-5 w-5 text-green-600" /></div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Family Photo</div>
                      {student.familyPhoto ? (
                        <img onClick={() => openPreview(student.familyPhoto, 'Family Photo')} src={student.familyPhoto} alt="Family" className="w-24 h-24 rounded-lg object-cover mx-auto ring-4 ring-green-200 hover:scale-105 transition cursor-zoom-in" />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto ring-4 ring-green-200">
                          <Users className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`group text-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 hover:ring-1 hover:ring-orange-200 rounded-xl p-1 ${student.passportPhoto ? 'cursor-zoom-in' : ''}`}
                      onClick={() => student.passportPhoto && openPreview(student.passportPhoto, 'Child Portrait')}
                      role={student.passportPhoto ? 'button' : undefined}
                      tabIndex={student.passportPhoto ? 0 : -1}
                      onKeyDown={(e) => {
                        if (student.passportPhoto && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          openPreview(student.passportPhoto, 'Child Portrait');
                        }
                      }}
                    >
                      <div className="p-2 bg-blue-100 inline-block rounded-lg mb-2"><User className="h-5 w-5 text-blue-600" /></div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Child Portrait</div>
                      {student.passportPhoto ? (
                        <img onClick={() => openPreview(student.passportPhoto, 'Child Portrait')} src={student.passportPhoto} alt="Passport" className="w-24 h-24 rounded-lg object-cover mx-auto ring-4 ring-orange-200 hover:scale-105 transition cursor-zoom-in" />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto ring-4 ring-orange-200">
                          <Camera className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabbed content shown only for non-sponsor roles */}
          {!isSponsor && (
            <>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
            {/* Profile Header */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-6">
                {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                      />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center ring-4 ring-white shadow-lg">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h3>
                    <p className="text-base text-gray-600 mb-3">Access: {student.accessNumber?.startsWith('None-') ? 'None' : (student.accessNumber || 'Not Assigned')}</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                        <GraduationCap className="w-4 h-4" />
                        {student.class} - {student.stream}
                      </span>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        Age {student.age}
                      </span>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                        <UserCheck className="w-4 h-4" />
                        {student.gender}
                      </span>
                      {student.needsSponsorship && (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                          student.sponsorshipStatus === 'sponsored' ? 'bg-green-100 text-green-800' : 
                          student.sponsorshipStatus === 'awaiting' ? 'bg-yellow-100 text-yellow-800' :
                          student.sponsorshipStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          <Heart className="w-4 h-4" />
                          {getSponsorshipStatusText(student.sponsorshipStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Academic Status</h4>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{student.class}</p>
                  <p className="text-sm text-gray-600">Stream {student.stream}</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Personal Info</h4>
                  </div>
                  <p className="text-xl font-bold text-green-600">{student.age} years</p>
                  <p className="text-sm text-gray-600">{student.gender}</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Sponsorship</h4>
                  </div>
                  <p className="text-xl font-bold text-purple-600">
                    {student.needsSponsorship ? getSponsorshipStatusText(student.sponsorshipStatus) : 'Private'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getSponsorshipStatusText(student.sponsorshipStatus)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Basic Information</h4>
                  </div>
                  <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Full Name</div>
                        <div className="font-semibold text-gray-900">{student.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Date of Birth</div>
                        <div className="font-semibold text-gray-900">{student.dateOfBirth || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-orange-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Address</div>
                        <div className="font-semibold text-gray-900">{student.address || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserCheck className="h-5 w-5 text-purple-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Gender</div>
                        <div className="font-semibold text-gray-900">{student.gender}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Personal Details</h4>
                  </div>
                  <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Hobbies</div>
                        <div className="font-semibold text-gray-900">{student.hobbies || 'Not specified'}</div>
                      </div>
                    </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Target className="h-5 w-5 text-purple-500" />
                          <div>
                        <div className="text-sm text-gray-500 font-medium">Dreams</div>
                        <div className="font-semibold text-gray-900">{student.dreams || 'Not specified'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-500" />
                          <div>
                        <div className="text-sm text-gray-500 font-medium">Aspirations</div>
                        <div className="font-semibold text-gray-900">{student.aspirations || 'Not specified'}</div>
                          </div>
                        </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Medical Condition</div>
                        <div className="font-semibold text-gray-900">{student.medicalCondition || 'None'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family Details Tab */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                      </div>
                  <h4 className="text-base font-semibold text-gray-900">Family Information</h4>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-purple-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Parent/Guardian Name</div>
                        <div className="font-semibold text-gray-900">{student.parentName || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Parent Age</div>
                        <div className="font-semibold text-gray-900">{student.parentAge || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Occupation</div>
                        <div className="font-semibold text-gray-900">{student.parentOccupation || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Family Size</div>
                        <div className="font-semibold text-gray-900">{student.parentFamilySize || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserCheck className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Relationship</div>
                        <div className="font-semibold text-gray-900">{student.parentRelationship || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-500" />
                        <div>
                        <div className="text-sm text-gray-500 font-medium">Phone Number</div>
                        <div className="font-semibold text-gray-900">{student.parentPhone || 'Not specified'}</div>
                      </div>
                    </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <div>
                        <div className="text-sm text-gray-500 font-medium">Email</div>
                        <div className="font-semibold text-gray-900">{student.parentEmail || 'Not specified'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Home className="h-5 w-5 text-orange-500" />
                          <div>
                        <div className="text-sm text-gray-500 font-medium">Family Address</div>
                        <div className="font-semibold text-gray-900">{student.parentAddress || 'Not specified'}</div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Academic Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Class</div>
                        <div className="font-semibold text-gray-900">{student.class}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Stream</div>
                        <div className="font-semibold text-gray-900">{student.stream}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserCheck className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Access Number</div>
                        <div className="font-semibold text-gray-900">{student.accessNumber?.startsWith('None-') ? 'None' : (student.accessNumber || 'Not assigned')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Admission ID</div>
                        <div className="font-semibold text-gray-900">{student.admissionId?.startsWith('None-') ? 'None' : (student.admissionId || 'Not assigned')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Academic Status</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Status</div>
                        <div className="font-semibold text-gray-900">{student.status || 'Active'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Enrolled Since</div>
                        <div className="font-semibold text-gray-900">
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Not specified'}
                      </div>
                      </div>
                    </div>
                </div>
                </div>
                </div>
              </div>
            )}

          {/* Sponsorship Tab */}
          {activeTab === 'sponsorship' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Heart className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Sponsorship Information</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Sponsorship Status</div>
                        <div className="font-semibold text-gray-900">{getSponsorshipStatusText(student.sponsorshipStatus)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Needs Sponsorship</div>
                        <div className="font-semibold text-gray-900">{student.needsSponsorship ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Max Sponsors</div>
                        <div className="font-semibold text-gray-900">{student.maxSponsors || 'Not specified'}</div>
                </div>
              </div>
                  </div>
                </div>

                {student.sponsorshipStory && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <h5 className="text-base font-semibold text-gray-900">Sponsorship Story</h5>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                      {student.sponsorshipStory}
                    </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Student Photo */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Student Photo</h4>
                </div>
                  <div className="text-center">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt="Student"
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-purple-200">
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      {student.photo ? 'Photo uploaded' : 'No photo available'}
                    </p>
                            </div>
                          </div>

                {/* Family Photo */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Family Photo</h4>
                  </div>
                  <div className="text-center">
                    {student.familyPhoto ? (
                      <img
                        src={student.familyPhoto}
                        alt="Family"
                        className="w-24 h-24 rounded-lg object-cover mx-auto border-4 border-green-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center mx-auto border-4 border-green-200">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      {student.familyPhoto ? 'Photo uploaded' : 'No photo available'}
                    </p>
                  </div>
                    </div>

                {/* Passport Photo */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Camera className="h-5 w-5 text-orange-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Passport Photo</h4>
                  </div>
                  <div className="text-center">
                    {student.passportPhoto ? (
                      <img
                        src={student.passportPhoto}
                        alt="Passport"
                        className="w-24 h-24 rounded-lg object-cover mx-auto border-4 border-orange-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center mx-auto border-4 border-orange-200">
                        <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                    <p className="text-xs text-gray-600 mt-2">
                      {student.passportPhoto ? 'Photo uploaded' : 'No photo available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Image Lightbox Preview */}
        {preview && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={closePreview}>
            <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={closePreview} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-2 shadow">
                <X className="w-5 h-5" />
              </button>
              <img src={preview.url} alt={preview.alt} className="w-full max-h-[85vh] object-contain rounded-lg" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            {onEdit && (
                <button
                  onClick={() => {
                    onEdit(student.id);
                    onClose();
                  }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                <User className="w-4 h-4" />
                  Edit Student
                </button>
              )}
              <button
                onClick={onClose}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Close
                  </button>
          </div>
            </div>
          </div>
        </div>
  );
};

export default StudentDetailsWindow;
