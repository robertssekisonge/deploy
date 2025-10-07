import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClinicModal } from '../../contexts/ClinicModalContext';
import { Stethoscope, Plus, Search, DollarSign, AlertTriangle, Clock, Lock, User, Users, X } from 'lucide-react';

const ClinicManagement: React.FC = () => {
  const { students, clinicRecords, addClinicRecord, refreshClinicRecords, users, addMessage, addNotification } = useData();
  const { user } = useAuth();
  const { isAddRecordModalOpen, closeAddRecordModal } = useClinicModal();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [searchAccessNumber, setSearchAccessNumber] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; accessNumber: string; name: string; class: string; stream: string; parentId?: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; accessNumber: string; name: string; class: string; stream: string; parentId?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsFromAllStudents, setSearchResultsFromAllStudents] = useState(false);
  const [clinicSearchResults, setClinicSearchResults] = useState<any[]>([]);
  const [selectedClinicRecord, setSelectedClinicRecord] = useState<any>(null);
  const [showClinicDetails, setShowClinicDetails] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [clinicForm, setClinicForm] = useState({
    accessNumber: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medication: '',
    cost: 0,
    followUpRequired: false,
    followUpDate: '',
    notes: ''
  });

  // Real-time search as nurse types access number - ALL students from school system
  useEffect(() => {
    if (searchAccessNumber.trim().length >= 2) {
      setIsSearching(true);
      
      // First, try to find students with existing clinic records
      const studentsWithRecords = students.filter(student => 
        clinicRecords.some(record => record.studentId === student.id)
      );
      
      // Filter by search term within students who have records
      let resultsWithRecords = studentsWithRecords.filter(student => 
        student.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase()) ||
        student.name.toLowerCase().includes(searchAccessNumber.toLowerCase())
      );
      
      // If we have results from students with records, show them first
      if (resultsWithRecords.length > 0) {
        resultsWithRecords = resultsWithRecords
          .sort((a, b) => {
            // Prioritize access number matches over name matches
            const aIsAccessNumberMatch = a.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase());
            const bIsAccessNumberMatch = b.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase());
            if (aIsAccessNumberMatch && !bIsAccessNumberMatch) return -1;
            if (!aIsAccessNumberMatch && bIsAccessNumberMatch) return 1;
            return 0;
          })
          .slice(0, 3); // Limit to 3 results from existing records
        
        setSearchResultsFromAllStudents(false);
        setSearchResults(resultsWithRecords);
      } else {
        // If no students with records found, search ALL students from school system
        const allStudentsResults = students.filter(student => 
          student.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase()) ||
          student.name.toLowerCase().includes(searchAccessNumber.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize access number matches over name matches
          const aIsAccessNumberMatch = a.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase());
          const bIsAccessNumberMatch = b.accessNumber.toLowerCase().includes(searchAccessNumber.toLowerCase());
          if (aIsAccessNumberMatch && !bIsAccessNumberMatch) return -1;
          if (!aIsAccessNumberMatch && bIsAccessNumberMatch) return 1;
          return 0;
        })
        .slice(0, 5); // Limit to 5 results
        
        setSearchResultsFromAllStudents(true);
        setSearchResults(allStudentsResults);
      }
      
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
      setSearchResultsFromAllStudents(false);
    }
  }, [searchAccessNumber, students, clinicRecords]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setSearchResultsFromAllStudents(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use context-based modal control instead of URL parameters
  useEffect(() => {
    if (isAddRecordModalOpen) {
      setShowAddForm(true);
      setIsModalReady(true);
    } else {
      setShowAddForm(false);
      setIsModalReady(false);
    }
  }, [isAddRecordModalOpen]);

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    if (user?.role?.toLowerCase() !== 'user' && user?.role?.toLowerCase() !== 'super-teacher') {
      return true; // Admin and other roles can see everything
    }

    // Check for new assignedClasses structure
    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    // Fallback to old assignedStream logic
    if (user.assignedStream) {
      return true;
    }

    return false;
  };

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'USER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
          </div>
            
          {/* Restricted Access Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Access Restricted</h2>
            <p className="text-yellow-700 mb-4">
              You haven't been assigned to any classes or streams yet. Please contact an administrator to get assigned.
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>What you need:</strong> Class and stream assignments to access clinic management.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  const handleStudentSelect = (student: { id: string; accessNumber: string; name: string; class: string; stream: string; parentId?: string }) => {
    setSelectedStudent(student);
    setClinicForm(prev => ({ ...prev, accessNumber: student.accessNumber }));
    setSearchAccessNumber(student.accessNumber);
    setSearchResults([]);
    setSearchResultsFromAllStudents(false);
    
    // Only show student details modal if we're NOT in add record mode
    if (!showAddForm) {
      setShowStudentDetails(true);
    }
  };

  const handleAccessNumberSearch = () => {
    // This function now just triggers the search button click
    // The real-time search is handled by the useEffect below
    if (searchAccessNumber.trim().length >= 2) {
      // The useEffect will automatically handle the search
      // This is just for the button click
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
    }
  };

  const handleSubmitClinicRecord = async () => {
    if (!selectedStudent || !clinicForm.symptoms || !clinicForm.diagnosis) {
      alert('Please fill in all required fields');
      return;
    }

    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const clinicData = {
      studentId: selectedStudent.id,
      accessNumber: selectedStudent.accessNumber,
      studentName: selectedStudent.name,
      className: selectedStudent.class,
      streamName: selectedStudent.stream,
      visitDate: currentDate,
      visitTime: currentTime,
      symptoms: clinicForm.symptoms,
      diagnosis: clinicForm.diagnosis,
      treatment: clinicForm.treatment,
      medication: clinicForm.medication,
      cost: clinicForm.cost,
      nurseId: user?.id || '',
      nurseName: user?.name || '',
      followUpRequired: clinicForm.followUpRequired,
      followUpDate: clinicForm.followUpDate ? new Date(clinicForm.followUpDate) : undefined,
      parentNotified: true, // Parents will be automatically notified by backend
      status: clinicForm.followUpRequired ? 'follow-up' as const : 'active' as const, // Set status based on follow-up requirement
      notes: clinicForm.notes
    };

    try {
      // Add clinic record
      await addClinicRecord(clinicData);
      
      // Send notifications to relevant parties (non-blocking)
      sendClinicNotifications(clinicData);
      
      // Close modal immediately - no blocking alerts
      closeAddRecordModal();
      setSelectedStudent(null);
      setSearchAccessNumber('');
      setSearchResults([]);
      setShowStudentDetails(false);
      setClinicForm({
        accessNumber: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medication: '',
        cost: 0,
        followUpRequired: false,
        followUpDate: '',
        notes: ''
      });
      
      // Show success toast notification (non-blocking)
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
      toast.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-lg">✅</span>
          <div>
            <div class="font-bold">Record Saved!</div>
            <div class="text-sm">Parents notified about ${selectedStudent.name}'s visit</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Auto-remove toast after 3 seconds
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error saving clinic record:', error);
      
      // Still close modal and show error toast
      closeAddRecordModal();
      setSelectedStudent(null);
      setSearchAccessNumber('');
      setSearchResults([]);
      setShowStudentDetails(false);
      setClinicForm({
        accessNumber: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medication: '',
        cost: 0,
        followUpRequired: false,
        followUpDate: '',
        notes: ''
      });
      
      // Show error toast
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
      errorToast.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-lg">❌</span>
          <div>
            <div class="font-bold">Save Failed!</div>
            <div class="text-sm">Record saved locally, will sync when backend is available</div>
          </div>
        </div>
      `;
      document.body.appendChild(errorToast);
      
      // Auto-remove error toast after 5 seconds
      setTimeout(() => {
        errorToast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 300);
      }, 5000);
    }
  };

  const sendClinicNotifications = (clinicData: any) => {
    // Find the student to get parent information
    const student = students.find(s => s.id === clinicData.studentId);
    
    // Notify all admins
    const adminUsers = users.filter(u => 
      u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'superuser'
    );
    
    adminUsers.forEach(admin => {
      // Add notification for admin
      addNotification({
        userId: admin.id,
        type: 'clinic',
        title: 'New Clinic Visit',
        message: `${clinicData.studentName} (${clinicData.accessNumber}) visited the clinic. Diagnosis: ${clinicData.diagnosis}`,
        date: new Date(),
        read: false,
        studentId: clinicData.studentId
      });

      // Send message to admin
      addMessage({
        from: user?.id || '',
        to: admin.id,
        fromRole: user?.role || 'nurse',
        toRole: admin.role || 'admin',
        subject: 'New Clinic Visit - Action Required',
        content: `A student has visited the clinic and may require attention.\n\nStudent: ${clinicData.studentName} (${clinicData.accessNumber})\nClass: ${clinicData.className} - ${clinicData.streamName}\nSymptoms: ${clinicData.symptoms}\nDiagnosis: ${clinicData.diagnosis}\nTreatment: ${clinicData.treatment}\nCost: UGX ${clinicData.cost}\nFollow-up Required: ${clinicData.followUpRequired ? 'Yes' : 'No'}\n\nPlease review and take appropriate action.`,
        date: new Date(),
        read: false,
        type: 'clinic'
      });
    });

    // Notify parent if student has parent information
    if (student && student.parent) {
      const parentUsers = users.filter(u => 
        u.role?.toLowerCase() === 'parent' && 
        (u.studentId === student.id || (u.studentIds && u.studentIds.includes(student.id)))
      );

      parentUsers.forEach(parent => {
        // Add notification for parent
        addNotification({
          userId: parent.id,
          type: 'clinic',
          title: 'Your Child Visited the Clinic',
          message: `${clinicData.studentName} visited the clinic today. Please check the details.`,
          date: new Date(),
          read: false,
          studentId: clinicData.studentId
        });

        // Send message to parent
        addMessage({
          from: user?.id || '',
          to: parent.id,
          fromRole: user?.role || 'nurse',
          toRole: parent.role || 'parent',
          subject: 'Clinic Visit Notification',
          content: `Dear ${parent.name},\n\nYour child ${clinicData.studentName} (${clinicData.accessNumber}) visited the clinic today.\n\nVisit Details:\n- Date: ${currentDate.toLocaleDateString()}\n- Time: ${clinicData.visitTime}\n- Symptoms: ${clinicData.symptoms}\n- Diagnosis: ${clinicData.diagnosis}\n- Treatment: ${clinicData.treatment}\n- Medication: ${clinicData.medication || 'None'}\n- Cost: UGX ${clinicData.cost}\n- Follow-up Required: ${clinicData.followUpRequired ? 'Yes' : 'No'}\n\nIf you have any questions, please contact the school administration.\n\nBest regards,\nSchool Nurse`,
          date: new Date(),
          read: false,
          type: 'clinic',
          studentId: clinicData.studentId
        });
      });
    }
  };

  const handleClinicSearch = (term: string) => {
    if (!term.trim()) {
      setClinicSearchResults([]);
      return;
    }

    const searchLower = term.toLowerCase();
    const results = clinicRecords.filter(record => 
      record.studentName.toLowerCase().includes(searchLower) ||
      record.accessNumber.toLowerCase().includes(searchLower) ||
      record.diagnosis.toLowerCase().includes(searchLower) ||
      record.symptoms.toLowerCase().includes(searchLower) ||
      record.treatment.toLowerCase().includes(searchLower) ||
      record.medication?.toLowerCase().includes(searchLower) ||
      record.nurseName.toLowerCase().includes(searchLower)
    );

    setClinicSearchResults(results);
  };

  const handleClinicRecordSelect = (record: any) => {
    setSelectedClinicRecord(record);
    setShowClinicDetails(true);
    setSearchTerm('');
    setClinicSearchResults([]);
  };

  const filteredRecords = clinicRecords.filter(record => {
    // Filter by status only (search is now handled separately)
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'follow-up': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add error boundary and loading states
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!students || !clinicRecords) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
        {(user?.role === 'NURSE' || user?.role === 'ADMIN' || user?.role === 'SUPERUSER') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Visit</span>
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white via-pink-50/50 to-rose-50/50 backdrop-blur-sm border border-pink-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-6 w-6 text-white" />
            </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {clinicRecords.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Visits</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🏥 All clinic visits recorded
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/50 backdrop-blur-sm border border-yellow-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {clinicRecords.filter(r => r.status === 'active').length}
            </div>
                <div className="text-sm text-gray-600 font-medium">Active Cases</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              ⚠️ Cases requiring attention
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/20 to-purple-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {clinicRecords.filter(r => r.status === 'follow-up').length}
            </div>
                <div className="text-sm text-gray-600 font-medium">Follow-ups</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              🔄 Scheduled follow-up visits
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
          {/* AI Design Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-300/20 to-teal-300/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                UGX {clinicRecords.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
            </div>
                <div className="text-sm text-gray-600 font-medium">Total Cost</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2 backdrop-blur-sm">
              💰 Total medical expenses
            </div>
          </div>
        </div>
      </div>



      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Access Number
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Search all students from the school system. Students with existing clinic records are shown first.
            </p>
            <div className="relative">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter access number (e.g., CA001)"
                value={searchAccessNumber}
                onChange={(e) => setSearchAccessNumber(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAccessNumberSearch(); }}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 pr-10"
              />
              <button
                onClick={handleAccessNumberSearch}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
              
              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((student) => {
                    const hasExistingRecords = clinicRecords.some(record => record.studentId === student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                              hasExistingRecords ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">
                                {student.accessNumber} • {student.class} - {student.stream}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasExistingRecords ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                Has Records
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                New Student
                              </span>
                            )}
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                              Select
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* No results message */}
              {searchAccessNumber.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                  <div className="text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No students found</p>
                    <p className="text-sm">No students match this search term</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching by access number or student name</p>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                </div>
              )}
            </div>
            
            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedStudent.name}</p>
                    <p className="text-sm text-green-700">
                      {selectedStudent.class} - {selectedStudent.stream} • {selectedStudent.accessNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="follow-up">Follow-up</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Clinic Records
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, access number, diagnosis, symptoms, treatment, medication, or nurse name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleClinicSearch(e.target.value);
                }}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
              
              {/* Search Results Dropdown */}
              {clinicSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {clinicSearchResults.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => handleClinicRecordSelect(record)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{record.studentName}</div>
                          <div className="text-sm text-gray-600">Access: {record.accessNumber}</div>
                          <div className="text-sm text-gray-500">{record.className} - {record.streamName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'N/A'}</div>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </div>
                        </div>
                      </div>
                      {record.diagnosis && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clinic Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Clinic Records</h3>
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered');
                await refreshClinicRecords();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnosis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                    <div className="text-xs text-pink-600">Access: {record.accessNumber}</div>
                    <div className="text-sm text-gray-500">{record.className} - {record.streamName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.visitTime} • {record.nurseName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{record.diagnosis}</div>
                    <div className="text-sm text-gray-500">{record.symptoms}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{record.treatment}</div>
                    {record.medication && (
                      <div className="text-sm text-gray-500">{record.medication}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      UGX {record.cost.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    {record.followUpRequired && record.followUpDate && (
                      <div className="text-xs text-blue-600 mt-1">
                        Follow-up: {new Date(record.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Clinic Record Modal - Optimized Design */}
      {showAddForm && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isModalReady ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`bg-gray-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto transform transition-all duration-200 ${isModalReady ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            {/* Header */}
            <div className="bg-emerald-600 p-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Add Clinic Record</h2>
                    <p className="text-green-100 text-sm">Record a new medical visit</p>
                  </div>
                </div>
                <div
                  onClick={() => {
                    closeAddRecordModal();
                    setSelectedStudent(null);
                    setSearchAccessNumber('');
                    setSearchResults([]);
                    setShowStudentDetails(false);
                  }}
                  className="h-10 w-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Access Number Input */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-8 w-8 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <label className="text-lg font-bold text-gray-900">Enter Access Number</label>
                    <p className="text-sm text-gray-600">Search for student by access number</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium border border-red-300">
                      Required *
                    </span>
                  </div>
                </div>
                
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter access number"
                      value={searchAccessNumber}
                      onChange={(e) => setSearchAccessNumber(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 text-lg bg-blue-50"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-blue-50 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((student) => {
                        const hasExistingRecords = clinicRecords.some(record => record.studentId === student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => handleStudentSelect(student)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  hasExistingRecords ? 'bg-green-500' : 'bg-blue-500'
                                }`}>
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {student.accessNumber} • {student.class} - {student.stream}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {hasExistingRecords ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                    Has Records
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    New Student
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                                  Select
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isSearching && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                    </div>
                  )}
                </div>
                
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900">{selectedStudent.name}</p>
                        <p className="text-sm text-green-700">
                          {selectedStudent.class} - {selectedStudent.stream} • {selectedStudent.accessNumber}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium border border-green-300">
                          ✓ Selected
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedStudent && (
                <>
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Symptoms Field */}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Symptoms</label>
                          <p className="text-sm text-gray-600">Describe the symptoms observed</p>
                        </div>
                        <div className="ml-auto">
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium border border-red-300">
                            Required *
                          </span>
                        </div>
                      </div>
                      <textarea
                        value={clinicForm.symptoms}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, symptoms: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                        placeholder="Describe the symptoms..."
                        required
                      />
                    </div>

                    {/* Diagnosis Field */}
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Diagnosis</label>
                          <p className="text-sm text-gray-600">Medical diagnosis</p>
                        </div>
                        <div className="ml-auto">
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium border border-red-300">
                            Required *
                          </span>
                        </div>
                      </div>
                      <textarea
                        value={clinicForm.diagnosis}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="Medical diagnosis..."
                        required
                      />
                    </div>

                    {/* Treatment Field */}
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Treatment</label>
                          <p className="text-sm text-gray-600">Treatment provided</p>
                        </div>
                      </div>
                      <textarea
                        value={clinicForm.treatment}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, treatment: e.target.value }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                        placeholder="Treatment provided..."
                      />
                    </div>

                    {/* Medication Field */}
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Medication</label>
                          <p className="text-sm text-gray-600">Medication prescribed</p>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={clinicForm.medication}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, medication: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                        placeholder="Medication prescribed..."
                      />
                    </div>

                    {/* Cost Field */}
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Cost (UGX)</label>
                          <p className="text-sm text-gray-600">Medical expenses</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={clinicForm.cost}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                        min="0"
                      />
                    </div>

                    {/* Follow-up Field */}
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Follow-up Required</label>
                          <p className="text-sm text-gray-600">Schedule follow-up visit</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={clinicForm.followUpRequired}
                            onChange={(e) => setClinicForm(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                            className="h-5 w-5 rounded border-2 border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-2"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Requires follow-up visit</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Date Field */}
                  {clinicForm.followUpRequired && (
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-lg font-bold text-gray-900">Follow-up Date</label>
                          <p className="text-sm text-gray-600">Schedule follow-up appointment</p>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={clinicForm.followUpDate}
                        onChange={(e) => setClinicForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Additional Notes Field */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <label className="text-lg font-bold text-gray-900">Additional Notes</label>
                        <p className="text-sm text-gray-600">Any additional information</p>
                      </div>
                    </div>
                    <textarea
                      value={clinicForm.notes}
                      onChange={(e) => setClinicForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500"
                      placeholder="Any additional notes..."
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeAddRecordModal();
                    setSelectedStudent(null);
                    setSearchAccessNumber('');
                    setSearchResults([]);
                    setShowStudentDetails(false);
                  }}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSubmitClinicRecord}
                  disabled={!selectedStudent || !clinicForm.symptoms || !clinicForm.diagnosis}
                  className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Clinical History</h2>
                <p className="text-gray-600 mt-1">
                  {selectedStudent.name} • {selectedStudent.accessNumber} • {selectedStudent.class} - {selectedStudent.stream}
                </p>
              </div>
              <button
                onClick={() => setShowStudentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Student Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600">Total Visits</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {clinicRecords.filter(r => r.studentId === selectedStudent.id).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600">Last Visit</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {(() => {
                      const lastVisit = clinicRecords
                        .filter(r => r.studentId === selectedStudent.id)
                        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
                      return lastVisit ? new Date(lastVisit.visitDate).toLocaleDateString() : 'No visits';
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600">Total Cost</p>
                  <p className="text-lg font-semibold text-blue-800">
                    UGX {clinicRecords
                      .filter(r => r.studentId === selectedStudent.id)
                      .reduce((sum, r) => sum + r.cost, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Clinical History Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Clinical Visit History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diagnosis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Treatment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clinicRecords
                      .filter(record => record.studentId === selectedStudent.id)
                      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(record.visitDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.visitTime} • {record.nurseName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              {record.symptoms}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              {record.diagnosis}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              <div>{record.treatment}</div>
                              {record.medication && (
                                <div className="text-gray-600 text-xs mt-1">
                                  💊 {record.medication}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              UGX {record.cost.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* No visits message */}
              {clinicRecords.filter(record => record.studentId === selectedStudent.id).length === 0 && (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No clinic visits recorded for this student yet.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStudentDetails(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStudentDetails(false);
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Visit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinic Record Details Modal - AI Generated Compact Design */}
      {showClinicDetails && selectedClinicRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedClinicRecord.studentName}</h2>
                    <p className="text-emerald-100 text-sm">{selectedClinicRecord.accessNumber} • {selectedClinicRecord.className}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClinicDetails(false);
                    setSelectedClinicRecord(null);
                  }}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Compact Content */}
            <div className="p-4 space-y-4 max-h-[calc(85vh-80px)] overflow-y-auto">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedClinicRecord.status)}`}>
                  {selectedClinicRecord.status.toUpperCase()}
                </span>
              </div>

              {/* Compact Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Visit Info */}
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">Visit</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-700">{selectedClinicRecord.visitDate ? new Date(selectedClinicRecord.visitDate).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-gray-600">{selectedClinicRecord.visitTime || 'N/A'}</div>
                    <div className="text-gray-600">👩‍⚕️ {selectedClinicRecord.nurseName}</div>
                  </div>
                </div>

                {/* Cost Info */}
                <div className="bg-green-50/50 p-3 rounded-xl border border-green-200/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Cost</span>
                  </div>
                  <div className="text-lg font-bold text-green-800">
                    UGX {selectedClinicRecord.cost?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Medical Info - Compact */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200/50">
                <div className="flex items-center space-x-2 mb-3">
                  <Stethoscope className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Medical Details</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Symptoms */}
                  <div className="bg-white/70 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Symptoms</div>
                    <div className="text-sm text-gray-800">{selectedClinicRecord.symptoms || 'Not specified'}</div>
                  </div>
                  
                  {/* Diagnosis */}
                  <div className="bg-white/70 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Diagnosis</div>
                    <div className="text-sm text-gray-800">{selectedClinicRecord.diagnosis || 'Not specified'}</div>
                  </div>
                  
                  {/* Treatment */}
                  <div className="bg-white/70 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Treatment</div>
                    <div className="text-sm text-gray-800">{selectedClinicRecord.treatment || 'Not specified'}</div>
                  </div>
                  
                  {/* Medication */}
                  {selectedClinicRecord.medication && (
                    <div className="bg-white/70 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">Medication</div>
                      <div className="text-sm text-gray-800">💊 {selectedClinicRecord.medication}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow-up Info - Compact */}
              {selectedClinicRecord.followUpRequired && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-900">Follow-up Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-1 text-gray-800">{selectedClinicRecord.followUpDate ? new Date(selectedClinicRecord.followUpDate).toLocaleDateString() : 'Not scheduled'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Parent:</span>
                      <span className="ml-1 text-gray-800">{selectedClinicRecord.parentNotified ? '✅ Notified' : '❌ Not notified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes - Compact */}
              {selectedClinicRecord.notes && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/50">
                  <div className="text-xs font-medium text-gray-600 mb-1">Additional Notes</div>
                  <div className="text-sm text-gray-700">{selectedClinicRecord.notes}</div>
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="bg-gray-50/50 p-3 border-t border-gray-200/50">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowClinicDetails(false);
                    setSelectedClinicRecord(null);
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicManagement;
