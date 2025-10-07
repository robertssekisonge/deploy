import React from 'react';
import { X, Users, Award, BookOpen, Activity } from 'lucide-react';

interface SimpleModalProps {
  student: any;
  onClose: () => void;
}

const SimpleModal: React.FC<SimpleModalProps> = ({ student, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-gradient-to-br from-white/95 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 relative"
        onClick={(e) => e.stopPropagation()}
      >
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
              onClick={handleClose}
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
            onClick={handleClose}
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

export default SimpleModal;
