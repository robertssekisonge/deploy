import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { validateAgainstDuplicates, checkDuplicateWhileTyping, formatDuplicateMessage, DuplicateValidationResult } from '../../utils/duplicatePreventionValidation';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import Toast from '../common/Toast';
import PhoneInput from '../common/PhoneInput';
import { defaultCountry } from '../../data/countryCodes';
import AdmissionLetter from './AdmissionLetter';
import { User, CreditCard, MapPin, Heart, GraduationCap } from 'lucide-react';
import { filterFeeItemsByResidence } from '../../utils/feeCalculation';

interface StudentFormProps {
  studentId?: string;
  onClose: () => void;
  initialData?: Partial<Student>;
  onSubmit?: (studentData: any) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ studentId, onClose, initialData, onSubmit }) => {
  const { students, addStudent, updateStudent, classes, getAvailableAccessNumbers, fetchStudents, getAdmissionNumberForDroppedAccess } = useData();
  const { user: _user } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    nin: '',
    ninError: '',
    lin: '',
    linError: '',
    dateOfBirth: '', // Add date of birth field
    age: '',
    gender: '', // Add gender field
    phone: '',
    phoneCountryCode: defaultCountry.code,
    email: '', // Add student email
    village: '', // Add village field
    medicalProblems: '', // Add medical problems field
    individualFee: '', // Add individual fee field
    class: '',
    stream: '',
    residenceType: '' as '' | 'Day' | 'Boarding',
    needsSponsorship: false,
    sponsorshipStory: '',
    familyPhoto: '',
    passportPhoto: '', // Add child likeness photo field
    photo: '', // Add profile photo field
    parent: {
      name: '',
      nin: '',
      ninError: '',
      phone: '',
      phoneError: '',
      phoneCountryCode: defaultCountry.code, // Add country code for parent phone
      email: '',
      address: '',
      occupation: ''
    },
    secondParent: {
      name: '',
      nin: '',
      ninError: '',
      phone: '',
      phoneError: '',
      phoneCountryCode: defaultCountry.code,
      email: '',
      address: '',
      occupation: ''
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

  const [selectedAccessNumber, setSelectedAccessNumber] = useState<string>('');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [wasDroppedNumberChosen, setWasDroppedNumberChosen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const   [showAdmissionLetter, setShowAdmissionLetter] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateValidationResult | null>(null);
  const [isValidatingDuplicates, setIsValidatingDuplicates] = useState(false);

  // Real-time duplicate checking
  const checkForDuplicates = async (fieldName: string, value: string) => {
    if (!value || value.length < 2) {
      setDuplicateWarning(null);
      return;
    }

    if (fieldName === 'name' && value.length > 2) {
      setIsValidatingDuplicates(true);
      
      // Debounced checking
      const timeout = setTimeout(async () => {
        // If we're updating, exclude the current student from checks
        let studentsToCheck = students || [];
        if (studentId) {
          studentsToCheck = studentsToCheck.filter(s => s.id !== studentId);
        }
        
        const result = await validateAgainstDuplicates(
          { [fieldName]: value, class: formData.class },
          studentsToCheck,
          { checkRecent: true, strictMode: false }
        );

        setDuplicateWarning(result);
        setIsValidatingDuplicates(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  };

  // Enhanced duplicate check before submission
  const performComprehensiveDuplicateCheck = async () => {
    setIsValidatingDuplicates(true);
    
    try {
      // If we're updating an existing student, exclude them from duplicate checks
      let studentsToCheck = students || [];
      if (studentId) {
        studentsToCheck = studentsToCheck.filter(s => s.id !== studentId);
        console.log(`🔍 Duplicate check for UPDATE mode - excluding student ID: ${studentId}`);
      } else {
        console.log('🆕 Duplicate check for NEW student mode');
      }
      
      const result = await validateAgainstDuplicates(
        formData,
        studentsToCheck,
        { checkRecent: true, strictMode: true }
      );

      setDuplicateWarning(result);
      
      if (result.isDuplicate && result.severity === 'error') {
        setIsValidatingDuplicates(false);
        return false; // Prevent submission
      }
      
      setIsValidatingDuplicates(false);
      return true; // Allow submission
    } catch (error) {
      console.error('Error in duplicate validation:', error);
      setIsValidatingDuplicates(false);
      return true; // Allow submission on error
    }
  };

  // Function to fetch fee structure for a class
  const fetchClassFeeStructure = async (className: string) => {
    if (!className) return 0;
    
    try {
      console.log('🔍 Fetching fee structure for class:', className);
      
      // Use billing types API directly since fee-structures endpoint might not exist
      const response = await fetch((await import('../../utils/api')).buildApiUrl('settings/billing-types'));
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.value) ? data.value : (Array.isArray(data) ? data : []);
        
        // Filter by class name (case insensitive) - handle class streams like "Senior 3 - A"
        const classBillingTypes = list.filter((b: any) => {
          const billingClassName = String(b.className || '').toLowerCase();
          const studentClassName = String(className).toLowerCase();
          
          // Extract base class name (remove stream info like "- A", "- B", etc.)
          const baseClassName = studentClassName.split(' - ')[0].trim();
          
          return billingClassName === baseClassName || billingClassName === studentClassName;
        });
        
        console.log('📊 Found billing types for', className, ':', classBillingTypes);
        
        // Get current settings for term/year filtering
        const settingsResponse = await fetch((await import('../../utils/api')).buildApiUrl('settings'));
        let currentYear = new Date().getFullYear();
        let currentTerm = 'Term 3'; // Default to Term 3 since that's what's in the database
        
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          currentYear = settings.currentYear || currentYear;
          currentTerm = settings.currentTerm || currentTerm;
        }
        
        console.log('📅 Current settings:', currentYear, currentTerm);
        
        // Filter by current term/year
        const currentTermTypes = classBillingTypes.filter((bt: any) => 
          String(bt.year) === String(currentYear) && 
          String(bt.term || '').toLowerCase() === String(currentTerm).toLowerCase()
        );
        
        console.log('🎯 Current term billing types:', currentTermTypes);
        
        // If no current term data, use latest available
        let typesToUse = currentTermTypes;
        if (typesToUse.length === 0) {
          console.log('⚠️ No current term data, using latest available');
          const termOrder = ['term 3', 'term 2', 'term 1'];
          typesToUse = [...classBillingTypes].sort((a, b) => {
            const ya = Number(a.year || 0); 
            const yb = Number(b.year || 0);
            if (ya !== yb) return yb - ya;
            const ia = termOrder.indexOf(String(a.term || '').toLowerCase());
            const ib = termOrder.indexOf(String(b.term || '').toLowerCase());
            return ib - ia;
          });
        }
        
        // Convert to fee items format
        const items = typesToUse.map((f: any) => ({ 
          feeName: f.name, 
          name: f.name,
          amount: Number(f.amount || 0) 
        }));
        
        // Apply residenceType filter if selected
        if (formData.residenceType) {
          const { total: filteredTotal } = filterFeeItemsByResidence(items, formData.residenceType as 'Day' | 'Boarding');
          console.log('💰 Filtered total for', formData.residenceType, ':', filteredTotal);
          return filteredTotal;
        }
        
        const total = items.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
        console.log('💰 Total fee for', className, ':', total);
        return total;
      }
    } catch (error) {
      console.error('❌ Error fetching fee structure:', error);
    }
    
    return 0;
  };
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>>([]);

  // Removed unused NIN/LIN options to satisfy linter

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        setFormData(prev => ({
          ...prev,
          name: student.name,
          nin: student.nin || '',
          lin: student.lin || '',
          dateOfBirth: student.dateOfBirth || '',
          age: (student.age ?? '').toString(),
          gender: student.gender || '',
          phone: (student as any).phone || '',
          phoneCountryCode: (student as any).phoneCountryCode || defaultCountry.code,
          email: student.email || '',
          village: student.village || '',
          medicalProblems: student.medicalProblems || '',
          individualFee: (student.individualFee as any) || '',
          class: student.class,
          stream: student.stream,
          residenceType: (student as any).residenceType || '',
          needsSponsorship: student.admittedBy === 'overseer' ? true : (student.needsSponsorship || false),
          sponsorshipStory: (student as any).sponsorshipStory || '',
          familyPhoto: student.familyPhoto || '',
          passportPhoto: student.passportPhoto || '', // Add child likeness photo
          photo: student.photo || '', // Add profile photo
          parent: {
          name: (student as any).parentName || student.parent?.name || '',
          nin: (student as any).parentNin || student.parent?.nin || '',
          ninError: '',
          phone: (student as any).parentPhone || student.parent?.phone || '',
          phoneError: '',
          phoneCountryCode: (student as any).parentPhoneCountryCode || student.parent?.phoneCountryCode || defaultCountry.code,
          email: (student as any).parentEmail || student.parent?.email || '',
          address: (student as any).parentAddress || student.parent?.address || '',
          occupation: (student as any).parentOccupation || student.parent?.occupation || ''
          },
          secondParent: {
            name: student.secondParent?.name || '',
            nin: student.secondParent?.nin || '',
            phone: student.secondParent?.phone || '',
            phoneCountryCode: student.secondParent?.phoneCountryCode || defaultCountry.code,
            email: student.secondParent?.email || '',
            address: student.secondParent?.address || '',
            occupation: student.secondParent?.occupation || '',
            ninError: '',
            phoneError: ''
          }
        }));
        // Reset photo files for existing student (we don't have the actual files)
        setPhotoFiles({
          photo: null,
          familyPhoto: null,
          passportPhoto: null
        });
      }
    } else if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || '',
        nin: initialData.nin || '',
        lin: initialData.lin || '',
        dateOfBirth: initialData.dateOfBirth || '',
        age: (initialData.age as any) ? (initialData.age as any).toString() : '',
        gender: initialData.gender || '',
        phone: (initialData as any).phone || '',
        phoneCountryCode: (initialData as any).phoneCountryCode || defaultCountry.code,
        email: initialData.email || '',
        class: initialData.class || '',
        stream: initialData.stream || '',
        residenceType: (initialData as any).residenceType || '',
        needsSponsorship: initialData.needsSponsorship || false,
        sponsorshipStory: (initialData as any).sponsorshipStory || '',
        familyPhoto: initialData.familyPhoto || '',
        passportPhoto: initialData.passportPhoto || '', // Add child likeness photo
        photo: initialData.photo || '', // Add profile photo
        parent: {
          name: initialData.parent?.name || '',
          nin: initialData.parent?.nin || '',
          ninError: '',
          phone: initialData.parent?.phone || '',
          phoneError: '',
          phoneCountryCode: initialData.parent?.phoneCountryCode || defaultCountry.code,
          email: initialData.parent?.email || '',
          address: initialData.parent?.address || '',
          occupation: initialData.parent?.occupation || ''
        },
        secondParent: {
          ...prev.secondParent,
          phoneError: prev.secondParent.phoneError || ''
        }
      }));
      // Reset photo files for new student
      setPhotoFiles({
        photo: null,
        familyPhoto: null,
        passportPhoto: null
      });
    }
  }, [studentId, students, initialData]);

  // Calculate Initial Fee when editing existing student (re-calculate fee based on current values)
  useEffect(() => {
    if (studentId && formData.class && formData.residenceType) {
      const updateFeeFromAPI = async () => {
        console.log('🔄 Calculating fee for existing student:', formData.class, formData.residenceType);
        const totalFee = await fetchClassFeeStructure(formData.class);
        console.log('💰 Calculated fee:', totalFee);
        setFormData(prev => ({
          ...prev,
          individualFee: totalFee.toString()
        }));
      };
      updateFeeFromAPI();
    }
  }, [studentId, formData.class, formData.residenceType]); // Include formData dependencies

  // Calculate Individual Fee when class or residence type changes using API data
  useEffect(() => {
    if (formData.class && formData.residenceType) {
      const updateFeeFromAPI = async () => {
        console.log('🔄 Calculating fee for class/residence change:', formData.class, formData.residenceType);
        const totalFee = await fetchClassFeeStructure(formData.class);
        console.log('💰 Calculated fee:', totalFee);
        setFormData(prev => ({
          ...prev,
          individualFee: totalFee.toString()
        }));
      };
      updateFeeFromAPI();
    }
  }, [formData.class, formData.residenceType]);

  // Get available access numbers when class or stream changes
  const availableAccessNumbers = formData.class && formData.stream 
    ? getAvailableAccessNumbers(formData.class, formData.stream)
    : [];

  // Get available dropped access numbers for modal
  const droppedAccessNumbers = availableAccessNumbers;
  if (formData.class && formData.stream) {
    console.log('DEBUG: Dropped access numbers for', formData.class, formData.stream, droppedAccessNumbers);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // COMPREHENSIVE DUPLICATE CHECK: Multiple layers of validation
    const canProceedWithSubmission = await performComprehensiveDuplicateCheck();
    
    if (!canProceedWithSubmission) {
      const message = duplicateWarning ? formatDuplicateMessage(duplicateWarning) : 'Duplicate student detected';
      showError('Duplicate Student Detected', message);
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Form already submitting, ignoring duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🚀 Starting form submission...');
      console.log('📝 Form data:', formData);
      
      // Validate required fields
      if (!formData.name || !formData.class || !formData.stream) {
        console.log('❌ Validation failed:');
        console.log('   - Name:', formData.name);
        console.log('   - Class:', formData.class);
        console.log('   - Stream:', formData.stream);
        showError('Validation Error', 'Please fill in all required fields: Name, Class, and Stream');
        return;
      }
    
    console.log('🔍 Validating NIN fields...');
    // Validate NIN length (14 characters) if provided
    if (formData.nin && formData.nin.length !== 14) {
      console.log('❌ Student NIN validation failed:', formData.nin.length, 'characters');
      showError('Validation Error', 'NIN must be exactly 14 characters long');
      return;
    }

    // Validate parent NIN length (14 characters) if provided
    if (formData.parent.nin && formData.parent.nin.length !== 14) {
      console.log('❌ Parent NIN validation failed:', formData.parent.nin.length, 'characters');
      showError('Validation Error', 'Parent NIN must be exactly 14 characters long');
      return;
    }

    console.log('🔍 Validating phone fields...');
    // Validate phone numbers if provided
    if (formData.phone && formData.phone.replace(/\D/g, '').length < 9) {
      console.log('❌ Student phone validation failed:', formData.phone.replace(/\D/g, '').length, 'digits');
      showError('Validation Error', 'Student phone number must be at least 9 digits');
      return;
    }

    if (formData.parent.phone && formData.parent.phone.replace(/\D/g, '').length < 9) {
      console.log('❌ Parent phone validation failed:', formData.parent.phone.replace(/\D/g, '').length, 'digits');
      showError('Validation Error', 'Parent phone number must be at least 9 digits');
      return;
    }
    
    // Validate age
    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 100) {
      showError('Validation Error', 'Please enter a valid age');
      return;
    }
    
    // If Auto is chosen, clear selectedAccessNumber so addStudent will auto-assign the next available (non-dropped) number
    const accessNumberToUse = wasDroppedNumberChosen ? selectedAccessNumber : '';
    
    // Handle photos - make them optional for now
    let photoUrl = formData.photo || '';
    let familyPhotoUrl = formData.familyPhoto || '';
    let passportPhotoUrl = formData.passportPhoto || '';
    
    // Try to upload photos if provided, but don't block student creation if it fails
    if (photoFiles.photo) {
      try {
        photoUrl = await uploadPhoto(photoFiles.photo, 'photo');
        addToast('success', 'Photo Uploaded', 'Profile photo uploaded successfully!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addToast('warning', 'Photo Upload Warning', `Profile photo upload failed: ${errorMessage}. Student will be saved without the new photo.`);
        // Keep existing photo URL if available
        photoUrl = formData.photo || '';
      }
    }
    
    if (photoFiles.familyPhoto) {
      try {
        familyPhotoUrl = await uploadPhoto(photoFiles.familyPhoto, 'familyPhoto');
        addToast('success', 'Photo Uploaded', 'Family photo uploaded successfully!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addToast('warning', 'Photo Upload Warning', `Family photo upload failed: ${errorMessage}. Student will be saved without the new photo.`);
        // Keep existing photo URL if available
        familyPhotoUrl = formData.familyPhoto || '';
      }
    }
    
    if (photoFiles.passportPhoto) {
      try {
        passportPhotoUrl = await uploadPhoto(photoFiles.passportPhoto, 'passportPhoto');
        addToast('success', 'Photo Uploaded', 'Child likeness photo uploaded successfully!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addToast('warning', 'Photo Upload Warning', `Child likeness photo upload failed: ${errorMessage}. Student will be saved without the new photo.`);
        // Keep existing photo URL if available
        passportPhotoUrl = formData.passportPhoto || '';
      }
    }
    
    const studentData = {
      name: formData.name,
      nin: formData.nin || '',
      lin: formData.lin || '',
      dateOfBirth: formData.dateOfBirth || '',
      age: parseInt(formData.age) || 0,
      gender: formData.gender || '',
      phone: formData.phone || '',
      phoneCountryCode: formData.phoneCountryCode,
      email: formData.email || '',
      class: formData.class,
      stream: formData.stream,
      ...(formData.residenceType ? { residenceType: formData.residenceType as 'Day' | 'Boarding' } : {}),
      needsSponsorship: formData.needsSponsorship,
      sponsorshipStatus: (() => {
        // If this is an existing student who was admitted by overseer, set to sponsored
        if (studentId) {
          const existingStudent = students.find(s => s.id === studentId);
          if (existingStudent?.admittedBy === 'overseer') {
            return 'sponsored' as const;
          }
          // If existing student is getting sponsorship added for the first time, set to eligibility-check
          if (existingStudent && !existingStudent.needsSponsorship && formData.needsSponsorship) {
            return 'eligibility-check' as const;
          }
          // If existing student already has sponsorship, keep their current status
          if (existingStudent && existingStudent.needsSponsorship) {
            return existingStudent.sponsorshipStatus || 'eligibility-check';
          }
        }
        // For new students with sponsorship needs, set to eligibility-check
        // This ensures they appear in Box 1 (Overseer Eligibility Check)
        return formData.needsSponsorship ? 'eligibility-check' as const : 'none' as const;
      })(),
      sponsorshipStory: formData.sponsorshipStory || '',
      familyPhoto: familyPhotoUrl || '',
      passportPhoto: passportPhotoUrl || '',
      photo: photoUrl || '', // Add profile photo
      parent: {
        ...formData.parent,
        phoneCountryCode: formData.parent.phoneCountryCode
      },
      secondParent: formData.secondParent,
      village: formData.village,
      medicalProblems: formData.medicalProblems,
      ...(formData.individualFee ? { individualFee: parseFloat(formData.individualFee) } : {}),
      // Only send accessNumber if using a dropped number
      ...(wasDroppedNumberChosen && selectedAccessNumber ? { accessNumber: selectedAccessNumber } : {}),
      wasDroppedNumberChosen,
      status: 'active' as const, // Always set status for new student
    };

    if (onSubmit) {
      onSubmit(studentData);
      showSuccess('Student Saved!', 'Student information saved successfully!');
    } else if (studentId) {
      // Check if this is an overseer-admitted student being admitted by admin
      const existingStudent = students.find(s => s.id === studentId);
      if (existingStudent?.admittedBy === 'overseer') {
        // Update with admin admission status
        const adminAdmissionData: Partial<Student> = {
          ...studentData,
          admittedBy: 'admin',
          status: 'active'
        };
        await updateStudent(studentId, adminAdmissionData);
        
        // Refresh the students list to show updated data immediately
        await fetchStudents();
        
        showSuccess('Student Admitted!', 'Student has been successfully admitted to the school!');
        
        // Show admission letter for newly admitted students
        if (existingStudent?.admittedBy === 'overseer') {
          setCreatedStudent({ ...existingStudent, ...adminAdmissionData } as Student);
          setShowAdmissionLetter(true);
        } else {
          // Close the form immediately after successful update
          onClose();
        }
      } else {
        // Check if sponsorship is being added to an existing student
        const isAddingSponsorship = existingStudent && !existingStudent.needsSponsorship && formData.needsSponsorship;
        
        await updateStudent(studentId, studentData);
        
        // Refresh the students list to show updated data immediately
        await fetchStudents();
        
        if (isAddingSponsorship) {
          showData('Sponsorship Added!', 'Student has been added to the sponsorship program and will appear in the overseer\'s eligibility check!');
        } else {
          showSuccess('Student Updated!', 'Student information updated successfully!');
        }
        
        // Close the form immediately after successful update
        onClose();
      }
    } else {
      console.log('🚀 Creating new student...');
      console.log('📝 Student data to send:', studentData);
      
      try {
        // Add the student first
        console.log('🚀 Calling addStudent with data:', studentData);
        await addStudent(studentData as any);
        console.log('✅ addStudent completed successfully');
        
        // Refresh the students list to show the new student immediately
        await fetchStudents();
        
        showSuccess('Student Created!', 'New student created successfully!');
        
        // If student needs sponsorship, they will automatically appear in overseer's eligibility check
        // The student data already has sponsorshipStatus: 'pending' and needsSponsorship: true
        if (formData.needsSponsorship) {
          showData('Sponsorship Request!', 'Student has been marked for sponsorship. They will appear in the overseer\'s eligibility check section.');
        }
        
        console.log('✅ Student creation completed successfully');
        
        // Show admission letter for new students (forms will be available in Forms management)
        // Wait a moment for the students list to refresh, then find the new student
        setTimeout(async () => {
          console.log('🔄 Refreshing students list to find new student...');
          await fetchStudents(); // Refresh the students list
          
          // Get the updated students list from context
          const updatedStudents = await fetch((await import('../../utils/api')).buildApiUrl('students')).then(res => res.json());
          console.log('📋 Updated students list:', updatedStudents);
          
          const newStudent = updatedStudents.find((s: any) => 
            s.name === formData.name && s.class === formData.class
          );
          
          console.log('🔍 Looking for student:', { name: formData.name, class: formData.class });
          console.log('✅ Found new student:', newStudent);
          
          if (newStudent) {
            setCreatedStudent(newStudent);
            setShowAdmissionLetter(true);
            console.log('📄 Admission letter modal opened - forms also available in Forms Management');
          } else {
            console.log('❌ Could not find newly created student in list');
            console.log('📋 Available students:', updatedStudents.map((s: any) => ({ name: s.name, class: s.class })));
            onClose();
          }
        }, 1000); // Increased delay to 1 second
      } catch (error: any) {
        console.error('❌ Error in addStudent:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Show specific error message based on the error
        let errorMessage = 'Failed to create student. Please try again.';
        if (error instanceof Error) {
          if (error.message.includes('Duplicate entry') || error.message.includes('already exists')) {
            errorMessage = error.message.replace('Backend error: 400 - ', '');
          } else if (error.message.includes('Backend error: 400')) {
            errorMessage = 'Please check all required fields and try again.';
          } else if (error.message.includes('Backend error: 500')) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your connection.';
          }
        }
        
        showError('Student Creation Failed', errorMessage);
        return; // Don't close the form if there's an error
      }
    }
    } catch (error: any) {
      console.error('❌ Form submission error:', error);
      addToast('error', 'Submission Error', `Failed to save student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Real-time duplicate checking for name field
    if (name === 'name') {
      checkForDuplicates('name', value);
    }
    
    if (name.startsWith('parent.')) {
      const parentField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        parent: {
          ...prev.parent,
          [parentField]: value
        }
      }));
    } else if (name.startsWith('secondParent.')) {
      const parentField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        secondParent: {
          ...prev.secondParent,
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
      
      // The useEffect above will handle fee calculation automatically
      // when class or residenceType changes, so we don't need to do it here
    }
  };

  // Add this handler for textarea
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      // Store the actual file object
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

      const response = await fetch(`/api/photos/${endpoint}/new`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.photoUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Photo upload failed');
    }
  };

  const selectedClass = classes.find(c => c.name === formData.class);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
      {/* Student Type Selection - Compact AI Design */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 rounded-xl border border-purple-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="needsSponsorship"
              name="needsSponsorship"
              checked={formData.needsSponsorship}
              onChange={handleChange}
              className="w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="needsSponsorship" className="text-sm font-semibold text-purple-800">
              Needs Sponsorship Support
            </label>
          </div>
        </div>
        {formData.needsSponsorship && (
          <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Student will appear in overseer's eligibility check
            </p>
          </div>
        )}
      </div>

      {/* Profile Photo - Compact Design */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-xl border border-blue-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-blue-800">Profile Photo *</h3>
        </div>
        <div className="flex items-center space-x-4">
          {formData.photo && (
            <div className="flex items-center space-x-2">
              <img src={formData.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-sm" />
              <button
                type="button"
                onClick={() => handleRemovePhoto('photo')}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
              className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
          )}
        </div>
        <p className="text-xs text-blue-600 mt-1">Student's profile photo (will appear in circle)</p>
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
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">Official child likeness photo</p>
            </div>
          </div>
        </div>
      )}



      {/* Duplicate Warning Display */}
      {duplicateWarning && duplicateWarning.isDuplicate && (
        <div className={`rounded-lg p-4 mb-4 border-2 ${
          duplicateWarning.severity === 'error' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${duplicateWarning.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
              {isValidatingDuplicates ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                duplicateWarning.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {duplicateWarning.severity === 'error' ? 'Duplicate Student Detected' : 'Potential Duplicate'}
              </h3>
              <div className={`mt-2 text-sm ${
                duplicateWarning.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                <p>{duplicateWarning.message}</p>
                {duplicateWarning.suggestion && (
                  <p className="mt-2 font-medium">{duplicateWarning.suggestion}</p>
                )}
                {duplicateWarning.existingStudents && duplicateWarning.existingStudents.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Existing student(s):</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {duplicateWarning.existingStudents.map((student, index) => (
                        <li key={index}>
                          {student.name} ({student.accessNumber}, {student.class})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => {
                const dob = e.target.value;
                setFormData(prev => ({ ...prev, dateOfBirth: dob }));
                
                // Calculate age automatically
                if (dob) {
                  const today = new Date();
                  const birthDate = new Date(dob);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  
                  setFormData(prev => ({ ...prev, age: age.toString() }));
                } else {
                  setFormData(prev => ({ ...prev, age: '' }));
                }
              }}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age (Auto-calculated)
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              readOnly
              className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed placeholder-gray-400"
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </div>

      {/* Identification Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-green-600" />
          Identification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIN (14 characters)
            </label>
            <input
              type="text"
              name="nin"
              value={formData.nin}
              onChange={handleChange}
              onBlur={(e) => {
                const nin = e.target.value;
                if (nin && nin.length !== 14) {
                  setFormData(prev => ({ ...prev, ninError: 'NIN must be exactly 14 characters' }));
                } else {
                  setFormData(prev => ({ ...prev, ninError: '' }));
                }
              }}
              maxLength={14}
              placeholder="Enter 14-character NIN"
              className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400 ${
                formData.ninError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
              }`}
            />
            {formData.ninError && (
              <div className="mt-1 text-sm text-red-600">
                {formData.ninError}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LIN (14 characters)
            </label>
            <input
              type="text"
              name="lin"
              value={formData.lin}
              onChange={handleChange}
              onBlur={(e) => {
                const lin = e.target.value;
                if (lin && lin.length !== 14) {
                  setFormData(prev => ({ ...prev, linError: 'LIN must be exactly 14 characters' }));
                } else {
                  setFormData(prev => ({ ...prev, linError: '' }));
                }
              }}
              maxLength={14}
              placeholder="Enter 14-character LIN"
              className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400 ${
                formData.linError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
              }`}
            />
            {formData.linError && (
              <div className="mt-1 text-sm text-red-600">
                {formData.linError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact & Location Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-purple-600" />
          Contact & Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Village <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="village"
              value={formData.village}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter village name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter student email"
            />
          </div>
        </div>
      </div>

      {/* Health & Financial Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-orange-600" />
          Health & Financial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Problems
            </label>
            <textarea
              name="medicalProblems"
              value={formData.medicalProblems}
              onChange={handleTextAreaChange}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter any medical problems or conditions (if none, write 'None')"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Individual Fee (UGX)
            </label>
            <input
              type="number"
              name="individualFee"
              value={formData.individualFee}
              readOnly
              min="0"
              className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed placeholder-gray-400"
              placeholder="Auto-calculated from class and section"
            />
          </div>
        </div>
      </div>

      {/* Academic Information Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              name="class"
              value={formData.class}
              onChange={async (e) => {
                const selectedClass = e.target.value;
                setFormData(prev => ({ ...prev, class: selectedClass }));
                
                // Auto-fill individual fee based on class selection
                if (selectedClass) {
                  const totalFee = await fetchClassFeeStructure(selectedClass);
                  setFormData(prev => ({ ...prev, individualFee: totalFee.toString() }));
                } else {
                  setFormData(prev => ({ ...prev, individualFee: '' }));
                }
              }}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stream <span className="text-red-500">*</span>
            </label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
            >
              <option value="">Select Stream</option>
              {selectedClass?.streams.map(stream => (
                <option key={stream.id} value={stream.name}>{stream.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section (Day or Boarding) <span className="text-red-500">*</span>
            </label>
            <select
              name="residenceType"
              value={formData.residenceType}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
            >
              <option value="">Select Section</option>
              <option value="Day">Day</option>
              <option value="Boarding">Boarding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Button to show dropped access numbers modal */}
      {formData.class && formData.stream && droppedAccessNumbers.length > 0 && !studentId && (
        <div className="flex flex-col items-end">
          <button
            type="button"
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors min-w-[120px]"
            style={{ maxWidth: '160px' }}
            onClick={() => setShowAccessModal(true)}
          >
            Choose from Dropped Access Numbers
          </button>
          {/* Debug output for dropped numbers */}
          <div className="text-xs text-gray-500 mt-1">Dropped for this stream: [{droppedAccessNumbers.join(', ')}]</div>
          </div>
      )}

      {/* Modal for dropped access numbers */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Select Dropped Access Number</h2>
            <div className="space-y-2 mb-6">
              {droppedAccessNumbers.map((num, idx) => {
                const admissionId = getAdmissionNumberForDroppedAccess(num);
                return (
                  <div key={num} className="flex items-center justify-between border-b py-2">
                    <div className="flex flex-col">
                      <span className="font-mono text-blue-700">{num}</span>
                      {admissionId && (
                        <span className="text-xs text-gray-500">Admission: {admissionId}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => {
                        setSelectedAccessNumber(num);
                        setShowAccessModal(false);
                        // Mark that a dropped number was chosen
                        setWasDroppedNumberChosen(true);
                      }}
                    >
                      Use This
                    </button>
                  </div>
                );
              })}
              </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => setShowAccessModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={() => {
                  setSelectedAccessNumber(''); // Let system auto-assign
                  setShowAccessModal(false);
                  // Mark that auto was chosen
                  setWasDroppedNumberChosen(false);
                }}
              >
                Auto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Number Information */}
      {/* Access number selection and display removed for new admissions. */}
      {/* If you want to add a pop-up for dropped numbers, implement it separately after class/stream selection. */}



      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">First Parent/Guardian Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Name
            </label>
            <input
              type="text"
              name="parent.name"
              value={formData.parent.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent NIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="parent.nin"
              value={formData.parent.nin}
              onChange={handleChange}
              onBlur={(e) => {
                const nin = e.target.value;
                if (nin && nin.length !== 14) {
                  setFormData(prev => ({
                    ...prev,
                    parent: { ...prev.parent, ninError: 'Parent NIN must be exactly 14 characters long' }
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    parent: { ...prev.parent, ninError: '' }
                  }));
                }
              }}
              maxLength={14}
              required
              className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800 ${
                formData.parent.ninError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
              }`}
            />
            {formData.parent.ninError && (
              <div className="mt-1 text-sm text-red-600">
                {formData.parent.ninError}
              </div>
            )}
          </div>
          
          <div>
            <PhoneInput
              value={formData.parent.phone}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                parent: { ...prev.parent, phone: value } 
              }))}
              onBlur={(value) => {
                if (value && value.length < 9) {
                  setFormData(prev => ({ 
                    ...prev, 
                    parent: { ...prev.parent, phoneError: 'Phone number must be at least 9 digits' } 
                  }));
                } else {
                  setFormData(prev => ({ 
                    ...prev, 
                    parent: { ...prev.parent, phoneError: '' } 
                  }));
                }
              }}
              countryCode={formData.parent.phoneCountryCode}
              onCountryChange={(countryCode) => handlePhoneCountryChange(countryCode, true)}
              placeholder="Enter parent phone number"
              label="Parent Phone Number"
              required={true}
              error={formData.parent.phoneError}
            />
            {formData.parent.phoneError && (
              <div className="mt-1 text-sm text-red-600">
                {formData.parent.phoneError}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="parent.email"
              value={formData.parent.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="parent.address"
              value={formData.parent.address}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation
            </label>
            <input
              type="text"
              name="parent.occupation"
              value={formData.parent.occupation}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Second Parent/Guardian Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Second Parent/Guardian Information (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Parent Name
            </label>
            <input
              type="text"
              name="secondParent.name"
              value={formData.secondParent?.name || ''}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Parent NIN
            </label>
            <input
              type="text"
              name="secondParent.nin"
              value={formData.secondParent?.nin || ''}
              onChange={handleChange}
              maxLength={14}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <PhoneInput
              value={formData.secondParent?.phone || ''}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                secondParent: { ...(prev.secondParent || {} as any), phone: value } 
              }))}
              countryCode={formData.secondParent?.phoneCountryCode || defaultCountry.code}
              onCountryChange={(countryCode) => setFormData(prev => ({
                ...prev,
                secondParent: {
                  ...(prev.secondParent || {} as any),
                  phoneCountryCode: countryCode
                }
              }))}
              placeholder="Enter second parent phone number"
              label="Second Parent Phone Number"
              error={formData.secondParent?.phoneError}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Parent Email
            </label>
            <input
              type="email"
              name="secondParent.email"
              value={formData.secondParent?.email || ''}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Parent Address
            </label>
            <input
              type="text"
              name="secondParent.address"
              value={formData.secondParent?.address || ''}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Parent Occupation
            </label>
            <input
              type="text"
              name="secondParent.occupation"
              value={formData.secondParent?.occupation || ''}
              onChange={handleChange}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-100 text-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : (studentId ? 'Update' : 'Add')} Student
        </button>
      </div>
    </form>
    
    {/* Toast Notifications */}
    <div>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={removeToast}
        />
      ))}
    </div>

    {/* Admission Letter Modal */}
    {showAdmissionLetter && createdStudent && (
      <AdmissionLetter
        student={createdStudent}
        onClose={() => {
          setShowAdmissionLetter(false);
          setCreatedStudent(null);
          onClose();
        }}
      />
    )}
  </>
);
};

export default StudentForm;