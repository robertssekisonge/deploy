import React, { useState, useEffect } from 'react';
import { useNotification } from '../common/NotificationProvider';
import { X, Save, Upload, User, Users, FileText, Camera } from 'lucide-react';

interface EditStudentFormProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({
  student,
  isOpen,
  onClose,
  onSave
}) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    class: '',
    stream: '',
    gender: '',
    accessNumber: '',
    dateOfBirth: '',
    address: '',
    medicalCondition: '',
    hobbies: '',
    dreams: '',
    aspirations: '',
    sponsorshipStory: '',
    parent: {
      name: '',
      age: '',
      occupation: '',
      familySize: '',
      address: '',
      relationship: '',
      phone: '',
      email: '',
      nin: ''
    },
    photo: '',
    familyPhoto: '',
    passportPhoto: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        age: student.age || '',
        class: student.class || '',
        stream: student.stream || '',
        gender: student.gender || '',
        accessNumber: student.accessNumber || '',
        dateOfBirth: student.dateOfBirth || '',
        address: student.address || '',
        medicalCondition: student.medicalCondition || '',
        hobbies: student.hobbies || '',
        dreams: student.dreams || '',
        aspirations: student.aspirations || '',
        sponsorshipStory: student.sponsorshipStory || '',
        parent: {
          name: student.parentName || '',
          age: student.parentAge || '',
          occupation: student.parentOccupation || '',
          familySize: student.parentFamilySize || '',
          address: student.parentAddress || '',
          relationship: student.parentRelationship || '',
          phone: student.parentPhone || '',
          email: student.parentEmail || '',
          nin: student.parentNin || ''
        },
        photo: student.photo || '',
        familyPhoto: student.familyPhoto || '',
        passportPhoto: student.passportPhoto || ''
      });
    }
  }, [student]);

  const handleInputChange = (field: string, value: string) => {
    // Special handling for date of birth - automatically calculate age
    if (field === 'dateOfBirth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        age: age.toString()
      }));
      return;
    }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePhotoUpload = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updatedStudent = {
        ...student,
        ...formData,
        // Flatten parent data to match database schema
        parentName: formData.parent.name,
        parentAge: formData.parent.age ? parseInt(formData.parent.age) : null,
        parentOccupation: formData.parent.occupation,
        parentFamilySize: formData.parent.familySize ? parseInt(formData.parent.familySize) : null,
        parentAddress: formData.parent.address,
        parentRelationship: formData.parent.relationship,
        parentPhone: formData.parent.phone,
        parentEmail: formData.parent.email,
        parentNin: formData.parent.nin,
        // Include dateOfBirth
        dateOfBirth: formData.dateOfBirth
      };
      
      await onSave(updatedStudent);
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
      showError('Save Failed', 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Edit Student: {student?.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'basic', label: 'Basic Info', icon: User },
              { id: 'family', label: 'Family Details', icon: Users },
              { id: 'sponsorship', label: 'Sponsorship Story', icon: FileText },
              { id: 'photos', label: 'Photos', icon: Camera }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={formData.class}
                    onChange={(e) => handleInputChange('class', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="Senior 1">Senior 1</option>
                    <option value="Senior 2">Senior 2</option>
                    <option value="Senior 3">Senior 3</option>
                    <option value="Senior 4">Senior 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                  <select
                    value={formData.stream}
                    onChange={(e) => handleInputChange('stream', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Stream</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Number</label>
                  <input
                    type="text"
                    value={formData.accessNumber}
                    onChange={(e) => handleInputChange('accessNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Condition</label>
                  <input
                    type="text"
                    value={formData.medicalCondition}
                    onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="None"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies</label>
                  <input
                    type="text"
                    value={formData.hobbies}
                    onChange={(e) => handleInputChange('hobbies', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Reading, Football"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dreams</label>
                  <input
                    type="text"
                    value={formData.dreams}
                    onChange={(e) => handleInputChange('dreams', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Become a Doctor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aspirations</label>
                  <input
                    type="text"
                    value={formData.aspirations}
                    onChange={(e) => handleInputChange('aspirations', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Graduate from University"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Family Details Tab */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parent.name}
                    onChange={(e) => handleInputChange('parent.name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Age</label>
                  <input
                    type="number"
                    value={formData.parent.age}
                    onChange={(e) => handleInputChange('parent.age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.parent.occupation}
                    onChange={(e) => handleInputChange('parent.occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Size</label>
                  <input
                    type="number"
                    value={formData.parent.familySize}
                    onChange={(e) => handleInputChange('parent.familySize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select
                    value={formData.parent.relationship}
                    onChange={(e) => handleInputChange('parent.relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.parent.phone}
                    onChange={(e) => handleInputChange('parent.phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.parent.email}
                    onChange={(e) => handleInputChange('parent.email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIN</label>
                  <input
                    type="text"
                    value={formData.parent.nin}
                    onChange={(e) => handleInputChange('parent.nin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Address</label>
                  <input
                    type="text"
                    value={formData.parent.address}
                    onChange={(e) => handleInputChange('parent.address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sponsorship Story Tab */}
          {activeTab === 'sponsorship' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Story</label>
                <textarea
                  value={formData.sponsorshipStory}
                  onChange={(e) => handleInputChange('sponsorshipStory', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Tell the story of this child and why they need sponsorship support..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This story will be shown to potential sponsors. Make it compelling and detailed.
                </p>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Student Photo */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
                  <div className="relative">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Student"
                        className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-purple-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-purple-200">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload('photo', file);
                      }}
                      className="hidden"
                      id="student-photo"
                    />
                    <label
                      htmlFor="student-photo"
                      className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                </div>

                {/* Family Photo */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Family Photo</label>
                  <div className="relative">
                    {formData.familyPhoto ? (
                      <img
                        src={formData.familyPhoto}
                        alt="Family"
                        className="w-32 h-32 rounded-lg object-cover mx-auto border-4 border-purple-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center mx-auto border-4 border-purple-200">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload('familyPhoto', file);
                      }}
                      className="hidden"
                      id="family-photo"
                    />
                    <label
                      htmlFor="family-photo"
                      className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                </div>

                {/* Passport Photo */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passport Photo</label>
                  <div className="relative">
                    {formData.passportPhoto ? (
                      <img
                        src={formData.passportPhoto}
                        alt="Passport"
                        className="w-32 h-32 rounded-lg object-cover mx-auto border-4 border-purple-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center mx-auto border-4 border-purple-200">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload('passportPhoto', file);
                      }}
                      className="hidden"
                      id="passport-photo"
                    />
                    <label
                      htmlFor="passport-photo"
                      className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentForm;

