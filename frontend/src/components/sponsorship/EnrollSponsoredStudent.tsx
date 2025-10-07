import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, BookOpen, Hash, User, MapPin, Phone, Mail, CheckCircle, X, AlertCircle } from 'lucide-react';

interface EnrollSponsoredStudentProps {
  onClose: () => void;
  student: any;
}

const CLASSES = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Primary 7',
  'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4', 'Secondary 5', 'Secondary 6'
];

const STREAMS = [
  'None',
  'Sciences',
  'Arts',
  'Commercial',
  'Technical',
  'Vocational'
];

const EnrollSponsoredStudent: React.FC<EnrollSponsoredStudentProps> = ({ onClose, student }) => {
  const { updateStudent } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    class: '',
    stream: '',
    accessNumber: '',
    admissionId: '',
    nin: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    allergies: '',
    previousSchool: '',
    transferReason: '',
    academicLevel: '',
    specialNeeds: '',
    transportRequired: false,
    boardingRequired: false,
    uniformSize: '',
    shoeSize: '',
    additionalNotes: '',
    photo: '', // Add profile photo field
    familyPhoto: '', // Add family photo field
    passportPhoto: '' // Add passport photo field
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
  const [generatedAccessNumber, setGeneratedAccessNumber] = useState('');

  useEffect(() => {
    // Generate access number based on class
    if (formData.class) {
      const classPrefix = formData.class.includes('Primary') ? 'P' : 'S';
      const classNumber = formData.class.match(/\d+/)?.[0] || '1';
      const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
      setGeneratedAccessNumber(`${classPrefix}${classNumber}${randomSuffix}`);
    }
  }, [formData.class]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.class) newErrors.class = 'Class is required';
    if (!formData.accessNumber.trim()) newErrors.accessNumber = 'Access number is required';
    if (!formData.admissionId.trim()) newErrors.admissionId = 'Admission ID is required';
    if (!formData.nin.trim()) newErrors.nin = 'NIN is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Upload photos if files were selected
      let photoUrl = formData.photo || student.photo;
      let familyPhotoUrl = formData.familyPhoto || student.familyPhoto;
      let passportPhotoUrl = formData.passportPhoto || student.passportPhoto;
      
      // Try to upload photos, but don't block enrollment if it fails
      if (photoFiles.photo) {
        try {
          photoUrl = await uploadPhoto(photoFiles.photo, 'photo');
        } catch (error) {
          console.warn('Profile photo upload failed, continuing without photo:', error);
          photoUrl = formData.photo || student.photo || '';
        }
      }
      
      if (photoFiles.familyPhoto) {
        try {
          familyPhotoUrl = await uploadPhoto(photoFiles.familyPhoto, 'familyPhoto');
        } catch (error) {
          console.warn('Family photo upload failed, continuing without photo:', error);
          familyPhotoUrl = formData.familyPhoto || student.familyPhoto || '';
        }
      }
      
      if (photoFiles.passportPhoto) {
        try {
          passportPhotoUrl = await uploadPhoto(photoFiles.passportPhoto, 'passportPhoto');
        } catch (error) {
          console.warn('Passport photo upload failed, continuing without photo:', error);
          passportPhotoUrl = formData.passportPhoto || student.passportPhoto || '';
        }
      }

      const updatedStudentData = {
        ...student,
        class: formData.class,
        stream: formData.stream,
        accessNumber: formData.accessNumber,
        admissionId: formData.admissionId,
        nin: formData.nin,
        phone: formData.phone || student.phone,
        email: formData.email || student.email,
        address: formData.address || student.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        medicalConditions: formData.medicalConditions,
        allergies: formData.allergies,
        previousSchool: formData.previousSchool,
        transferReason: formData.transferReason,
        academicLevel: formData.academicLevel,
        specialNeeds: formData.specialNeeds,
        transportRequired: formData.transportRequired,
        boardingRequired: formData.boardingRequired,
        uniformSize: formData.uniformSize,
        shoeSize: formData.shoeSize,
        additionalNotes: formData.additionalNotes,
        photo: photoUrl,
        familyPhoto: familyPhotoUrl,
        passportPhoto: passportPhotoUrl,
        sponsorshipStatus: 'enrolled',
        enrollmentDate: new Date().toISOString(),
        status: 'active'
      };

      await updateStudent(student.id, updatedStudentData);
      onClose();
    } catch (error) {
      console.error('Error enrolling student:', error);
      setErrors({ submit: 'Failed to enroll student' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const useGeneratedAccessNumber = () => {
    setFormData(prev => ({ ...prev, accessNumber: generatedAccessNumber }));
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
    // Clear the photo file and form data
    setPhotoFiles(prev => ({ ...prev, [photoType]: null }));
    setFormData(prev => ({ ...prev, [photoType]: '' }));
  };

  const uploadPhoto = async (file: File, type: 'photo' | 'familyPhoto' | 'passportPhoto'): Promise<string> => {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });

      // Map photo types to endpoints
      let endpoint: string;
      switch (type) {
        case 'photo':
          endpoint = 'student-profile';
          break;
        case 'familyPhoto':
          endpoint = 'family';
          break;
        case 'passportPhoto':
          endpoint = 'passport';
          break;
        default:
          endpoint = 'student-profile';
      }

      const response = await fetch(`/api/photos/${endpoint}/${student?.id || 'new'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64,
          fileType: file.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const result = await response.json();
      return result.photoUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error('Photo upload failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-green-600" />
            Enroll Sponsored Student
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Student Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span> {student.name}
            </div>
            <div>
              <span className="font-medium text-gray-700">Age:</span> {student.age}
            </div>
            <div>
              <span className="font-medium text-gray-700">Gender:</span> {student.gender}
            </div>
            <div>
              <span className="font-medium text-gray-700">Career Aspiration:</span> {student.careerAspiration}
            </div>
            <div>
              <span className="font-medium text-gray-700">Class Completion:</span> {student.classCompletion}
            </div>
            <div>
              <span className="font-medium text-gray-700">Sponsorship Status:</span> 
              <span className="ml-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                {student.sponsorshipStatus}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Academic Enrollment Section */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Enrollment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                    errors.class ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select class</option>
                  {CLASSES.map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
                {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <select
                  value={formData.stream}
                  onChange={(e) => handleInputChange('stream', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Select stream</option>
                  {STREAMS.map(stream => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
                <input
                  type="text"
                  value={formData.academicLevel}
                  onChange={(e) => handleInputChange('academicLevel', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
            </div>
          </div>

          {/* Student Identification Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Student Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.accessNumber}
                    onChange={(e) => handleInputChange('accessNumber', e.target.value)}
                    className={`flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.accessNumber ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., P1ABC, S2XYZ"
                  />
                  {generatedAccessNumber && (
                    <button
                      type="button"
                      onClick={useGeneratedAccessNumber}
                      className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      Use Generated
                    </button>
                  )}
                </div>
                {generatedAccessNumber && (
                  <p className="text-xs text-gray-500 mt-1">Generated: {generatedAccessNumber}</p>
                )}
                {errors.accessNumber && <p className="text-red-500 text-xs mt-1">{errors.accessNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission ID *</label>
                <input
                  type="text"
                  value={formData.admissionId}
                  onChange={(e) => handleInputChange('admissionId', e.target.value)}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.admissionId ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., ADM2024001"
                />
                {errors.admissionId && <p className="text-red-500 text-xs mt-1">{errors.admissionId}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIN *</label>
                <input
                  type="text"
                  value={formData.nin}
                  onChange={(e) => handleInputChange('nin', e.target.value)}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.nin ? 'border-red-500' : ''
                  }`}
                  placeholder="National ID Number"
                />
                {errors.nin && <p className="text-red-500 text-xs mt-1">{errors.nin}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Student phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Student email address"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Current residential address"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Emergency contact person"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Academic Background Section */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Academic Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Name of previous school (if any)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Reason</label>
                <input
                  type="text"
                  value={formData.transferReason}
                  onChange={(e) => handleInputChange('transferReason', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Reason for transfer (if applicable)"
                />
              </div>
            </div>
          </div>

          {/* Health & Special Needs Section */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Health & Special Needs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                <input
                  type="text"
                  value={formData.medicalConditions}
                  onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Any medical conditions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Any allergies"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
                <input
                  type="text"
                  value={formData.specialNeeds}
                  onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Any special needs or accommodations required"
                />
              </div>
            </div>
          </div>

          {/* Additional Services Section */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Additional Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="transportRequired"
                  checked={formData.transportRequired}
                  onChange={(e) => handleInputChange('transportRequired', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="transportRequired" className="text-sm font-medium text-gray-700">
                  Transport Required
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="boardingRequired"
                  checked={formData.boardingRequired}
                  onChange={(e) => handleInputChange('boardingRequired', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="boardingRequired" className="text-sm font-medium text-gray-700">
                  Boarding Required
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uniform Size</label>
                <input
                  type="text"
                  value={formData.uniformSize}
                  onChange={(e) => handleInputChange('uniformSize', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="e.g., Small, Medium, Large"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shoe Size</label>
                <input
                  type="text"
                  value={formData.shoeSize}
                  onChange={(e) => handleInputChange('shoeSize', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="e.g., 5, 6, 7, 8"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                rows={3}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                placeholder="Any additional information or special requirements..."
              />
            </div>
          </div>

          {/* Profile Photo - Required for ALL students */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Photo</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo *</label>
                {formData.photo && (
                  <div className="flex items-center gap-2">
                    <img src={formData.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 mb-2" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto('photo')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  name="photo"
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Student's profile photo (will appear in circle)</p>
              </div>
            </div>
          </div>

          {/* Additional Sponsorship Photos */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Additional Sponsorship Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Family Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Photo *</label>
                {formData.familyPhoto && (
                  <div className="flex items-center gap-2">
                    <img src={formData.familyPhoto} alt="Family" className="w-20 h-20 rounded object-cover border-2 border-blue-400 mb-2" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto('familyPhoto')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  name="familyPhoto"
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Photo with family for context</p>
              </div>

              {/* Passport Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Photo *</label>
                {formData.passportPhoto && (
                  <div className="flex items-center gap-2">
                    <img src={formData.passportPhoto} alt="Passport" className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 mb-2" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto('passportPhoto')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  name="passportPhoto"
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Official passport-style photo</p>
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
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Enroll Student</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollSponsoredStudent; 