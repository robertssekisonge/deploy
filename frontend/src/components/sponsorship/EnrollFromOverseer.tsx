import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AdmitStudentForm from './AdmitStudentForm';
import { 
  Users, 
  GraduationCap, 
  Heart, 
  Search, 
  UserPlus,
  ArrowRight,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

const EnrollFromOverseer: React.FC = () => {
  const { students, updateStudent, forceRefresh } = useData();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);

  // Get Box 7 students (Overseer Admitted Sponsored Children)
  const overseerAdmittedStudents = students.filter(s => 
    s.sponsorshipStatus === 'sponsored' && s.admittedBy === 'overseer'
  );

  // Filter students based on search
  const filteredStudents = overseerAdmittedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.accessNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setShowAdmitForm(true);
  };

  const handleEnrollmentSuccess = async () => {
    showSuccess(
      '🎓 Student Enrolled!',
      `${selectedStudent.name} has been successfully enrolled in the school while maintaining their sponsored status!`
    );
    setShowAdmitForm(false);
    setSelectedStudent(null);
    await forceRefresh();
  };

  const handleCloseForm = () => {
    setShowAdmitForm(false);
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-8">
      {/* AI-Generated Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🎓 Enroll from Overseer
              </h1>
              <p className="text-emerald-100 mt-2 text-lg">
                Enroll sponsored students from Box 7 into the school system
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                {overseerAdmittedStudents.length} Students Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Info Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-blue-900 mb-3">📋 Enrollment Process</h3>
            <div className="space-y-2 text-blue-800">
              <p className="font-medium">These students have been sponsored but are not yet enrolled in school.</p>
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-4 mt-4">
                <h4 className="font-bold text-blue-900 mb-2">Process Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Select a student from Box 7 (Overseer Admitted Sponsored Children)</li>
                  <li>Review their existing details (name, age, parent info, etc.)</li>
                  <li>Add class and stream assignment</li>
                  <li>Access number will be automatically generated</li>
                  <li>Student maintains their <strong>sponsored status</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Search Section */}
      <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 border-2 border-green-200/50 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* AI-Generated Search Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🔍 Find Student to Enroll
              </h2>
              <p className="text-green-100 text-sm">Search for sponsored students from Box 7</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, access number, or NIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full rounded-xl border-2 border-green-200/50 shadow-lg focus:border-emerald-500 focus:ring-emerald-500 bg-gradient-to-r from-white to-green-50/30 px-4 py-3 text-gray-800 font-medium transition-all duration-200 hover:shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div 
            key={student.id} 
            className="bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 border-2 border-emerald-200/50 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
            onClick={() => handleStudentSelect(student)}
          >
            {/* AI-Generated Card Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✨</span>
                  <span className="text-lg">🎓</span>
                  <span className="text-lg">✨</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center space-x-2 text-sm font-bold text-white shadow-lg">
                  <span>💚</span>
                  <span>Sponsored</span>
                </span>
              </div>
            </div>

            {/* AI-Generated Card Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{student.name}</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-3 border-2 border-blue-200/50 shadow-md">
                  <span className="mr-2 text-lg">🎂</span>
                  <span className="font-bold text-blue-800">Age: {student.age || 'Not set'}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border-2 border-purple-200/50 shadow-md">
                  <span className="mr-2 text-lg">👤</span>
                  <span className="font-bold text-purple-800">Gender: {student.gender || 'Not set'}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-3 border-2 border-green-200/50 shadow-md">
                  <span className="mr-2 text-lg">📞</span>
                  <span className="font-bold text-green-800">Phone: {student.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-3 border-2 border-orange-200/50 shadow-md">
                  <span className="mr-2 text-lg">🏠</span>
                  <span className="font-bold text-orange-800">Residence: {student.residence || 'Not set'}</span>
                </div>
              </div>

              {/* AI-Generated Action Button */}
              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>🎓 Enroll Student</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-gray-100 to-blue-100 rounded-2xl p-8 max-w-md mx-auto">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'No sponsored students match your search criteria' 
                : 'No sponsored students are available for enrollment from Box 7'
              }
            </p>
          </div>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {showAdmitForm && selectedStudent && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-emerald-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 border-2 border-emerald-200/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            {/* AI-Generated Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                      🎓 Enroll Student
                    </h3>
                    <p className="text-emerald-100 text-sm">
                      Enrolling {selectedStudent.name} • Maintaining sponsored status
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <AdmitStudentForm
                isOpen={true}
                onClose={handleCloseForm}
                onSuccess={handleEnrollmentSuccess}
                studentId={selectedStudent.id.toString()}
                initialData={{
                  name: selectedStudent.name,
                  age: selectedStudent.age,
                  dateOfBirth: selectedStudent.dateOfBirth,
                  gender: selectedStudent.gender,
                  phone: selectedStudent.phone,
                  parentName: selectedStudent.parentName,
                  parentJob: selectedStudent.parentJob,
                  parentContact: selectedStudent.parentContact,
                  parentResidence: selectedStudent.parentResidence,
                  sponsorshipStory: selectedStudent.sponsorshipStory,
                  // Maintain sponsored status
                  sponsorshipStatus: 'sponsored',
                  admittedBy: 'admin' // Admin is enrolling them
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollFromOverseer;
