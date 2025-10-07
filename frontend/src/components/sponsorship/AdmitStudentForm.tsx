import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { User, Users, Camera, FileText, Heart, X, Loader2, Phone, MapPin, Briefcase } from 'lucide-react';

interface AdmitStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // Add initial data prop
  studentId?: string; // Add student ID for updates
}

const AdmitStudentForm: React.FC<AdmitStudentFormProps> = ({ isOpen, onClose, onSuccess, initialData, studentId }) => {
  const { addStudent, fetchStudents } = useData();
  const { user } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [formData, setFormData] = useState({
    // Student Information
    name: initialData?.name || '',
    age: initialData?.age || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    class: initialData?.class || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    
    // Parent Information
    parentName: initialData?.parentName || '',
    parentJob: initialData?.parentJob || '',
    parentContact: initialData?.parentContact || '',
    parentResidence: initialData?.parentResidence || '',
    
    // Photos and Story
    studentPhoto: null as File | null,
    familyPhoto: null as File | null,
    sponsorshipStory: initialData?.sponsorshipStory || ''
  });

  const handleInputChange = (field: string, value: string | File | null) => {
    // If date of birth is being changed, calculate age automatically
    if (field === 'dateOfBirth' && typeof value === 'string' && value) {
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
    } else {
    setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // DUPLICATE CHECK: Verify if student already exists
    try {
      const existingStudents = await fetch('http://localhost:5000/api/students').then(res => res.json());
      const isDuplicate = existingStudents.some((s: any) => 
        s.name.toLowerCase() === formData.name.toLowerCase() && 
        s.class === formData.class &&
        s.status !== 'dropped'
      );

      if (isDuplicate) {
        console.log(`🚫 DUPLICATE DETECTED: ${formData.name} in ${formData.class}`);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Could not check for duplicates:', error);
    }
    
    // Validate required fields
    if (!formData.name || !formData.dateOfBirth || !formData.class || !formData.gender) {
      showError('Validation Error', 'Please fill in all required fields (Name, Date of Birth, Class, Gender)');
      setLoading(false);
      return;
    }

    try {
      // Create simplified student object for overseer (not in school yet)
      const newStudent = {
        name: formData.name,
        age: parseInt(formData.age),
        class: formData.class, // This is where they stopped studying
        stream: 'None', // They're not currently in school, so stream is None
        gender: formData.gender,
        phone: formData.phone || '',
        dateOfBirth: formData.dateOfBirth,
        address: formData.parentResidence || 'Unknown',
        
        // Parent information (simplified)
        parent: {
          name: formData.parentName || 'Unknown',
          occupation: formData.parentJob || 'Unknown',
          phone: formData.parentContact || '',
          address: formData.parentResidence || 'Unknown',
          age: 30, // Default value
          familySize: 3, // Default value
          relationship: 'Parent', // Default value
          email: '',
          nin: ''
        },
        
        // Photos (will be empty strings for now, can be uploaded later)
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        
        // Sponsorship info - maintain status if enrolling existing sponsored student
        sponsorshipStatus: initialData?.sponsorshipStatus || 'awaiting',
        needsSponsorship: initialData?.sponsorshipStatus === 'sponsored' ? false : true,
        accessNumber: `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique None value for overseer students
        isNotEnrolled: initialData?.sponsorshipStatus === 'sponsored' ? false : true, // Enrolled if sponsored
        sponsorshipStory: formData.sponsorshipStory || `${formData.name} is a ${formData.age}-year-old student who stopped studying in ${formData.class} and needs sponsorship support to return to school.`,
        
        // Financial info
        status: 'active',
        // Fees will be calculated on backend based on class and residence
        totalFees: 0, // Will be set by backend
        paidAmount: 0,
        balance: 0, // Will be set by backend
        paymentStatus: 'unpaid',
        
        // Records
        academicRecords: [],
        financialRecords: [],
        attendanceRecords: [],
        
        // Required fields with defaults
        nin: '',
        admissionId: `None-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique None value for overseer students
        sponsorshipApplications: [],
        maxSponsors: 3,
        
        // Additional fields with defaults
        medicalCondition: formData.medicalCondition || 'None',
        hobbies: formData.hobbies || 'Reading',
        dreams: formData.dreams || 'Graduate',
        aspirations: formData.aspirations || 'Graduate from University',
        // Admission tracking - use initialData if provided, otherwise determine based on user role
        admittedBy: initialData?.admittedBy || (user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'sponsorships-overseer' ? 'overseer' : 'admin')
      };

      console.log('📝 Form data:', formData);
      console.log('📋 Student object being created:', newStudent);
      
      // Direct API call to backend with CORS headers
      console.log('🌐 Sending request to backend...');
      const isUpdate = !!studentId;
      const url = isUpdate ? `http://localhost:5000/api/students/${studentId}` : 'http://localhost:5000/api/students';
      const method = isUpdate ? 'PUT' : 'POST';
      
      console.log(`📡 ${isUpdate ? 'Updating' : 'Creating'} student with ${method} to ${url}`);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(newStudent)
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const savedStudent = await response.json();
      console.log('✅ Student saved successfully:', savedStudent);
      
      // Show success message
      const action = isUpdate ? 'Enrolled' : 'Admitted';
      const message = isUpdate 
        ? `Student "${formData.name}" has been successfully enrolled in the school while maintaining their sponsored status!`
        : `Student "${formData.name}" has been saved to the database and will appear in the Eligibility Check box. Note: This student stopped studying in ${formData.class} and needs sponsorship to return to school.`;
      
      showSuccess(`Student ${action}!`, message);
      
      // Also call the context function to update local state with the saved student
      try {
        await addStudent(savedStudent);
        // Refresh the students list to ensure we have the latest data
        await fetchStudents();
      } catch (contextError) {
        console.log('⚠️ Context update failed, but backend save succeeded:', contextError);
      }
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        dateOfBirth: '',
        class: '',
        gender: '',
        phone: '',
        parentName: '',
        parentJob: '',
        parentContact: '',
                    parentResidence: '',
        studentPhoto: null,
        familyPhoto: null,
        sponsorshipStory: '',
        // Personal Information Fields
        address: '',
        hobbies: '',
        dreams: '',
        aspirations: '',
        medicalCondition: ''
      });

      onSuccess();
      // Don't call onClose() here since onSuccess() handles it
    } catch (error) {
      console.error('Error adding student:', error);
      
      // Show specific error message
      let errorMessage = 'Failed to add student. Please try again.';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
      } else if (error.message.includes('Backend error')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message.includes('Unique constraint failed')) {
        errorMessage = `A student with the name "${formData.name}" already exists in ${formData.class} ${formData.stream || 'class'}. Please use a different name or check existing students.`;
      }
      
      showError('Admission Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white bg-opacity-20 rounded">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold">Admit New Student</h2>
                <p className="text-purple-100 text-xs">Simplified form for overseer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Student Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Age (Auto-calculated)</label>
                <input
                  type="number"
                  value={formData.age}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Date of Birth above"
                  min="1"
                  max="25"
                />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                

              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Class *</label>
                <select
                  required
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Class</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                  <option value="Primary 7">Primary 7</option>
                  <option value="Senior 1">Senior 1</option>
                  <option value="Senior 2">Senior 2</option>
                  <option value="Senior 3">Senior 3</option>
                  <option value="Senior 4">Senior 4</option>
                  <option value="Senior 5">Senior 5</option>
                  <option value="Senior 6">Senior 6</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the class where the student stopped studying</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('phone', value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's phone number (10 digits)"
                />
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit phone number</p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded border border-green-100">
            <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Parent Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Parent's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Job/Occupation *</label>
                <select
                  required
                  value={formData.parentJob}
                  onChange={(e) => handleInputChange('parentJob', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Occupation</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Shopkeeper">Shopkeeper</option>
                  <option value="Driver">Driver</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Mason">Mason</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Tailor">Tailor</option>
                  <option value="Hairdresser">Hairdresser</option>
                  <option value="Chef">Chef</option>
                  <option value="Waiter/Waitress">Waiter/Waitress</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={formData.parentContact}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('parentContact', value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Parent's phone number (10 digits)"
                />
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit phone number</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Residence *</label>
                <input
                  type="text"
                  required
                  value={formData.parentResidence}
                  onChange={(e) => handleInputChange('parentResidence', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Family residence address"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 rounded border border-yellow-100">
            <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photos (Optional)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">Student Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('studentPhoto', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">Family Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('familyPhoto', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-yellow-600">Photos can be added later in Eligibility Check</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Hobbies</label>
                <input
                  type="text"
                  value={formData.hobbies || ''}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's hobbies"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Dreams</label>
                <input
                  type="text"
                  value={formData.dreams || ''}
                  onChange={(e) => handleInputChange('dreams', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's dreams"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Aspirations</label>
                <input
                  type="text"
                  value={formData.aspirations || ''}
                  onChange={(e) => handleInputChange('aspirations', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's career aspirations"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">Medical Condition</label>
                <input
                  type="text"
                  value={formData.medicalCondition || ''}
                  onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any medical conditions (leave blank if none)"
                />
              </div>
            </div>
          </div>

          {/* Sponsorship Story */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sponsorship Story
            </h3>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">Student's Story</label>
              <textarea
                value={formData.sponsorshipStory}
                onChange={(e) => handleInputChange('sponsorshipStory', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell the student's story, why they need sponsorship, their dreams, family situation..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || submitCooldown}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Student...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Add Student
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmitStudentForm;
