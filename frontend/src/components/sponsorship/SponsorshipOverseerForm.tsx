import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, MapPin, Briefcase, GraduationCap, Target, Camera, FileText, CheckCircle, X, Users, Building } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';
import { defaultCountry } from '../../data/countryCodes';

interface SponsorshipOverseerFormProps {
  onClose: () => void;
  student?: any;
  isEditing?: boolean;
}

const CAREER_ASPIRATIONS = [
  'Doctor',
  'Engineer',
  'Teacher',
  'Lawyer',
  'Business Owner',
  'Nurse',
  'Accountant',
  'Architect',
  'Scientist',
  'Artist',
  'Musician',
  'Writer',
  'Journalist',
  'Pilot',
  'Police Officer',
  'Firefighter',
  'Veterinarian',
  'Dentist',
  'Pharmacist',
  'Other'
];

const SponsorshipOverseerForm: React.FC<SponsorshipOverseerFormProps> = ({ 
  onClose, 
  student, 
  isEditing = false 
}) => {
  const { addStudent, updateStudent, classes } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: student?.name || '',
    nin: student?.nin || '',
    ninType: student?.ninType || 'NIN',
    age: student?.age || '',
    gender: student?.gender || '',
    phone: student?.phone || '',
    phoneCountryCode: student?.phoneCountryCode || defaultCountry.code,
    email: student?.email || '',
    class: student?.class || '',
    stream: student?.stream || '',
    needsSponsorship: student?.needsSponsorship !== false,
    sponsorshipStory: student?.sponsorshipStory || '',
    familyPhoto: student?.familyPhoto || '',
    passportPhoto: student?.passportPhoto || '',
    photo: student?.photo || '',
    parent: {
      name: student?.parent?.name || '',
      nin: student?.parent?.nin || '',
      phone: student?.parent?.phone || '',
      phoneCountryCode: student?.parent?.phoneCountryCode || defaultCountry.code,
      email: student?.parent?.email || '',
      address: student?.parent?.address || 'Kampala, Uganda',
      occupation: student?.parent?.occupation || ''
    }
  });

  const [photoFiles, setPhotoFiles] = useState<{
    photo: File | null;
    familyPhoto: File | null;
    passportPhoto: File | null;
  }>({
    photo: null,
    familyPhoto: null,
    passportPhoto: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitCooldown, setSubmitCooldown] = useState(false);

  // NIN/LIN type options
  const ninTypeOptions = [
    { value: 'NIN', label: 'NIN' },
    { value: 'LIN', label: 'LIN' }
  ];

  const selectedClass = classes.find(c => c.name === formData.class);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) newErrors.name = 'Student name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.class) newErrors.class = 'Class is required';
    if (!formData.stream) newErrors.stream = 'Stream is required';
    if (!formData.nin) newErrors.nin = 'NIN is required';
    if (formData.nin && formData.nin.length !== 14) newErrors.nin = 'NIN must be exactly 14 characters';
    if (!formData.parent.name.trim()) newErrors.parentName = 'Parent name is required';
    if (!formData.parent.phone.trim()) newErrors.parentPhone = 'Parent phone is required';
    if (!formData.parent.nin.trim()) newErrors.parentNIN = 'Parent NIN is required';
    if (!formData.parent.address.trim()) newErrors.parentAddress = 'Parent address is required';
    if (!formData.parent.occupation.trim()) newErrors.parentOccupation = 'Parent occupation is required';
    if (formData.needsSponsorship && !formData.sponsorshipStory.trim()) newErrors.sponsorshipStory = 'Sponsorship story is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // CRITICAL: Prevent double submission
    if (loading || submitCooldown) {
      console.log('🚫 SUBMIT BLOCKED: Form already submitting or in cooldown');
      return;
    }
    
    // Start cooldown period
    setSubmitCooldown(true);
    setLoading(true);
    
    // Reset cooldown after 5 seconds
    setTimeout(() => {
      setSubmitCooldown(false);
    }, 5000);
    
    try {
      const studentData = {
        ...formData,
        id: student?.id || `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nin: formData.nin,
        ninType: formData.ninType,
        admissionId: student?.admissionId || `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accessNumber: `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        academicRecords: [],
        financialRecords: [],
        attendanceRecords: [],
        totalFees: 0,
        paidAmount: 0,
        balance: 0,
        paymentStatus: 'unpaid' as const,
        status: 'active' as const,
        age: parseInt(formData.age) || 0,
        sponsorshipStatus: formData.needsSponsorship ? 'pending' as const : 'none' as const,
        parent: {
          name: formData.parent.name,
          nin: formData.parent.nin,
          phone: formData.parent.phone,
          phoneCountryCode: formData.parent.phoneCountryCode,
          email: formData.parent.email || '',
          address: formData.parent.address,
          occupation: formData.parent.occupation
        }
      };

      if (isEditing && student) {
        await updateStudent(student.id, studentData);
      } else {
        await addStudent(studentData);
        

      }
      
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
      setErrors({ submit: 'Failed to save student information' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('parent.')) {
      const parentField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        parent: {
          ...prev.parent,
          [parentField]: value
        }
      }));
    } else if (name === 'needsSponsorship') {
      setFormData(prev => ({
        ...prev,
        needsSponsorship: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle country code changes for phone numbers
  const handlePhoneCountryChange = (countryCode: string, isParent: boolean = false) => {
    if (isParent) {
      setFormData(prev => ({
        ...prev,
        parent: {
          ...prev.parent,
          phoneCountryCode: countryCode
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        phoneCountryCode: countryCode
      }));
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setPhotoFiles(prev => ({ ...prev, [name]: file }));
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, [name]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (photoType: 'photo' | 'familyPhoto' | 'passportPhoto') => {
    setPhotoFiles(prev => ({ ...prev, [photoType]: null }));
    setFormData(prev => ({ ...prev, [photoType]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            {isEditing ? 'Edit Student Information' : 'Add New Student for Sponsorship'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Type Selection */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Student Type</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="needsSponsorship"
                name="needsSponsorship"
                checked={formData.needsSponsorship}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="needsSponsorship" className="text-sm font-medium text-gray-700">
                This student needs sponsorship support
              </label>
            </div>
            {formData.needsSponsorship && (
              <p className="text-sm text-purple-600 mt-2">
                This student will be visible to sponsors and their application will be pending approval.
              </p>
            )}
                  </div>
                  
          {/* Profile Photo - Required for ALL students */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Photo</h3>
            <div className="grid grid-cols-1 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo *</label>
                {formData.photo && (
                  <div className="flex items-center space-x-2">
                    <img src={formData.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 mb-2" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto('photo')}
                      className="px-1.5 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {!formData.photo && (
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                      required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                )}
                <p className="text-xs text-gray-500 mt-1">Student's profile photo (will appear in circle)</p>
              </div>
            </div>
                  </div>
                  
          {/* Additional Photos - Only for sponsored students */}
          {formData.needsSponsorship && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Additional Sponsorship Photos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Family Photo */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Photo *</label>
                  {formData.familyPhoto && (
                    <div className="flex items-center space-x-2">
                      <img src={formData.familyPhoto} alt="Family" className="w-40 h-32 rounded-lg object-cover border-2 border-green-400 mb-2" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('familyPhoto')}
                        className="px-1.5 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!formData.familyPhoto && (
                    <input
                      type="file"
                      name="familyPhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Photo with family for context</p>
                  </div>
                  
                {/* Child Likeness Photo */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child Likeness Photo *</label>
                  {formData.passportPhoto && (
                    <div className="flex items-center space-x-2">
                      <img src={formData.passportPhoto} alt="Child Likeness" className="w-40 h-32 rounded-lg object-cover border-2 border-blue-400 mb-2" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('passportPhoto')}
                        className="px-1.5 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Remove
                      </button>
                  </div>
                  )}
                  {!formData.passportPhoto && (
                    <input
                      type="file"
                      name="passportPhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Official child likeness photo</p>
                </div>
              </div>
            </div>
          )}

          {/* Student Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter student's full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.age ? 'border-red-500' : ''
                  }`}
                  placeholder="Age"
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.gender ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIN Type *</label>
                <select
                  name="ninType"
                  value={formData.ninType}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {ninTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIN (14 characters) *</label>
                <input
                  type="text"
                  name="nin"
                  value={formData.nin}
                  onChange={handleChange}
                  maxLength={14}
                  minLength={14}
                  placeholder="Enter 14-character NIN"
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.nin ? 'border-red-500' : ''
                  }`}
                />
                {errors.nin && <p className="text-red-500 text-xs mt-1">{errors.nin}</p>}
                {formData.nin && formData.nin.length !== 14 && (
                  <p className="text-red-500 text-xs mt-1">NIN must be exactly 14 characters</p>
                )}
                  </div>
                  
                  <div>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  countryCode={formData.phoneCountryCode}
                  onCountryChange={(countryCode) => handlePhoneCountryChange(countryCode, false)}
                  placeholder="Enter student phone number"
                  label="Student Phone Number"
                />
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                <input
                      type="email"
                  name="email"
                      value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter student email"
                    />
                  </div>
                </div>
              </div>

          {/* Educational Background Section */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Educational Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                    errors.class ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
                {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream *</label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                    errors.stream ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select Stream</option>
                  <option value="None">None</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  {selectedClass?.streams?.map(stream => (
                    <option key={stream.id} value={stream.name}>{stream.name}</option>
                  )) || []}
                </select>
                {errors.stream && <p className="text-red-500 text-xs mt-1">{errors.stream}</p>}
              </div>
                  </div>
                  </div>
                  
          {/* Sponsorship Story Section - Only for sponsored students */}
          {formData.needsSponsorship && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sponsorship Story
              </h3>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tell Your Story *</label>
                <textarea
                  name="sponsorshipStory"
                  value={formData.sponsorshipStory}
                  onChange={handleTextAreaChange}
                  rows={6}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    errors.sponsorshipStory ? 'border-red-500' : ''
                  }`}
                  placeholder="Tell us about your background, why you need sponsorship, your dreams, challenges, and how this sponsorship would help you..."
                />
                {errors.sponsorshipStory && <p className="text-red-500 text-xs mt-1">{errors.sponsorshipStory}</p>}
                <p className="text-xs text-gray-500 mt-1">Share your story to help sponsors understand your situation and goals.</p>
              </div>
            </div>
          )}

          {/* Parent Information Section */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parent/Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                <input
                  type="text"
                  name="parent.name"
                  value={formData.parent.name}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.parentName ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter parent/guardian name"
                />
                {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName}</p>}
                  </div>
                  
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent NIN *</label>
                <input
                  type="text"
                  name="parent.nin"
                  value={formData.parent.nin}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.parentNIN ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter parent NIN"
                />
                {errors.parentNIN && <p className="text-red-500 text-xs mt-1">{errors.parentNIN}</p>}
              </div>
                
                <div>
                <PhoneInput
                  value={formData.parent.phone}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    parent: { ...prev.parent, phone: value } 
                  }))}
                  countryCode={formData.parent.phoneCountryCode}
                  onCountryChange={(countryCode) => handlePhoneCountryChange(countryCode, true)}
                  placeholder="Enter phone number"
                  label="Parent Phone *"
                  required={true}
                  error={errors.parentPhone}
                />
              </div>

                        <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  name="parent.email"
                  value={formData.parent.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter email address (optional)"
                            />
                          </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Occupation *</label>
                <input
                  type="text"
                  name="parent.occupation"
                  value={formData.parent.occupation}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.parentOccupation ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter occupation"
                />
                {errors.parentOccupation && <p className="text-red-500 text-xs mt-1">{errors.parentOccupation}</p>}
                  </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Address *</label>
                <input
                  type="text"
                  name="parent.address"
                  value={formData.parent.address}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.parentAddress ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter full address"
                />
                {errors.parentAddress && <p className="text-red-500 text-xs mt-1">{errors.parentAddress}</p>}
                  </div>
                </div>
              </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
                  type="submit"
              disabled={loading || submitCooldown}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
              {loading ? (
                    <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                    </>
                  ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{isEditing ? 'Save Changes' : 'Add Student'}</span>
                </>
                  )}
            </button>
              </div>
            </form>
      </div>
    </div>
  );
};

export default SponsorshipOverseerForm; 