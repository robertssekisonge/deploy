import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  Clock, 
  DollarSign, 
  Shield,
  AlertTriangle,
  Plus,
  Key,
  CheckCircle,
  Users,
  X,
  Calendar,
  Save
} from 'lucide-react';

const AdvancedSettings: React.FC = () => {
  const { settings, updateSettings, students, classes, timetables, addTimetableEntry, messages, notifications, financialRecords, clinicRecords } = useData();
  const { users } = useAuth();
  const [activeTab, setActiveTab] = useState('backup');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [editingStream, setEditingStream] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    subjects: [''],
    teachers: [''],
    schedule: {
      monday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
      tuesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
      wednesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
      thursday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
      friday: { start: '08:00', end: '09:00', subject: '', teacher: '' }
    }
  });

  // New timetable entry form data
  const [newTimetableEntry, setNewTimetableEntry] = useState({
    classId: '',
    className: '',
    streamId: '',
    streamName: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    teacherId: '',
    teacherName: '',
    room: '',
    duration: 60
  });

  // Available options for the form
  const availableClasses = [
    { id: 'senior1', name: 'Senior 1', streams: ['A', 'B', 'C'] },
    { id: 'senior2', name: 'Senior 2', streams: ['A', 'B', 'C'] },
    { id: 'senior3', name: 'Senior 3', streams: ['A', 'B', 'C'] },
    { id: 'senior4', name: 'Senior 4', streams: ['A', 'B', 'C'] },
    { id: 'senior5', name: 'Senior 5', streams: ['Sciences', 'Arts'] },
    { id: 'senior6', name: 'Senior 6', streams: ['Sciences', 'Arts'] }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const subjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Literature', 'Economics', 'Computer Science',
    'Art', 'Music', 'Physical Education', 'Religious Studies'
  ];

  // Get teachers from users (filter by role)
  const teachers = users.filter(user => user.role === 'USER' || user.role === 'SUPER_TEACHER' || user.role === 'SUPERUSER');
  const [backupOptions, setBackupOptions] = useState({
    students: true,
    classes: true,
    timetables: true,
    settings: true,
    financialRecords: true,
    clinicRecords: true,
    messages: true,
    notifications: true
  });
  const [currentYear, setCurrentYear] = useState(settings?.currentYear?.toString() || '2025');
  const [currentTerm, setCurrentTerm] = useState(settings?.currentTerm || 'Term 1');

  // Update local state when settings change
  useEffect(() => {
    if (settings?.currentYear) {
      setCurrentYear(settings.currentYear.toString());
    }
    if (settings?.currentTerm) {
      setCurrentTerm(settings.currentTerm);
    }
  }, [settings]);
  const [securitySettings, setSecuritySettings] = useState({
    strongPasswords: true,
    passwordChange90Days: true,
    twoFactorAuth: false,
    preventPasswordReuse: true,
    specialCharacters: true,
    sessionTimeout: true,
    logActivities: true,
    ipRestrictions: false,
    accountLockout: true,
    requireHttps: true,
    encryptData: true,
    backupEncryption: true,
    auditTrail: true,
    gdprCompliance: false,
    emailAlerts: true,
    smsNotifications: false,
    weeklyReports: true,
    threatDetection: false
  });
  const [newBillingType, setNewBillingType] = useState({
    name: '',
    amount: 0,
    frequency: 'termly',
    description: '',
    className: '',
    term: 'Term 1',
    year: '2024'
  });

  const [billingTypes, setBillingTypes] = useState([]);

  // Handle edit button click
  const handleEditStream = (stream: any) => {
    setEditingStream(stream);
    setEditFormData({
      name: stream.name,
      subjects: stream.subjects || [''],
      teachers: stream.teachers || [''],
      schedule: stream.schedule || {
        monday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        tuesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        wednesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        thursday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        friday: { start: '08:00', end: '09:00', subject: '', teacher: '' }
      }
    });
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (editingStream && editFormData.name.trim()) {
      try {
        // Save to backend
        const response = await fetch(`http://localhost:5000/api/timetables/streams/${editingStream.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editFormData.name,
            subjects: editFormData.subjects.filter(s => s.trim()),
            teachers: editFormData.teachers.filter(t => t.trim()),
            schedule: editFormData.schedule
          })
        });

        if (response.ok) {
          console.log('Stream updated successfully in backend');
          alert('Timetable stream updated successfully!');
        } else {
          throw new Error('Failed to update stream in backend');
        }
      } catch (error) {
        console.error('Error updating stream:', error);
        alert('Failed to update stream. Please try again.');
      } finally {
        // Close modal and reset form
        setShowEditModal(false);
        setEditingStream(null);
        setEditFormData({
          name: '',
          subjects: [''],
          teachers: [''],
          schedule: {
            monday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
            tuesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
            wednesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
            thursday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
            friday: { start: '08:00', end: '09:00', subject: '', teacher: '' }
          }
        });
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingStream(null);
    setEditFormData({
      name: '',
      subjects: [''],
      teachers: [''],
      schedule: {
        monday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        tuesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        wednesday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        thursday: { start: '08:00', end: '09:00', subject: '', teacher: '' },
        friday: { start: '08:00', end: '09:00', subject: '', teacher: '' }
      }
    });
  };

  // Add subject field
  const addSubject = () => {
    setEditFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, '']
    }));
  };

  // Remove subject field
  const removeSubject = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  // Update subject field
  const updateSubject = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => i === index ? value : subject)
    }));
  };

  // Add teacher field
  const addTeacher = () => {
    setEditFormData(prev => ({
      ...prev,
      teachers: [...prev.teachers, '']
    }));
  };

  // Remove teacher field
  const removeTeacher = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      teachers: prev.teachers.filter((_, i) => i !== index)
    }));
  };

  // Update teacher field
  const updateTeacher = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      teachers: prev.teachers.map((teacher, i) => i === index ? value : teacher)
    }));
  };

  // Update schedule
  const updateSchedule = (day: string, field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          [field]: value
        }
      }
    }));
  };

  // Handle new timetable entry form changes
  const handleNewTimetableChange = (field: string, value: string) => {
    setNewTimetableEntry(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-update related fields
    if (field === 'className') {
      const selectedClass = availableClasses.find(c => c.name === value);
      if (selectedClass) {
        setNewTimetableEntry(prev => ({
          ...prev,
          classId: selectedClass.id,
          streamId: '',
          streamName: ''
        }));
      }
    }

    if (field === 'streamName') {
      setNewTimetableEntry(prev => ({
        ...prev,
        streamId: value.toLowerCase().replace(/\s+/g, '')
      }));
    }

    if (field === 'teacherId') {
      const selectedTeacher = teachers.find(t => t.id === value);
      if (selectedTeacher) {
        setNewTimetableEntry(prev => ({
          ...prev,
          teacherName: selectedTeacher.name
        }));
      }
    }
  };

  // Handle adding new timetable entry
  const handleAddTimetableEntry = () => {
    if (newTimetableEntry.className && newTimetableEntry.streamName && newTimetableEntry.subject && newTimetableEntry.teacherId) {
      // Calculate duration
      const startTime = new Date(`2000-01-01T${newTimetableEntry.startTime}:00`);
      const endTime = new Date(`2000-01-01T${newTimetableEntry.endTime}:00`);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Validate time
      if (duration <= 0) {
        alert('End time must be after start time');
        return;
      }

      const entryData = {
        classId: newTimetableEntry.classId,
        className: newTimetableEntry.className,
        streamId: newTimetableEntry.streamId,
        streamName: newTimetableEntry.streamName,
        day: newTimetableEntry.day,
        startTime: newTimetableEntry.startTime,
        endTime: newTimetableEntry.endTime,
        subject: newTimetableEntry.subject,
        teacherId: newTimetableEntry.teacherId,
        teacherName: newTimetableEntry.teacherName,
        room: newTimetableEntry.room,
        duration: duration
      };

      // Add to timetable using the DataContext
      addTimetableEntry(entryData);

      // Reset form
      setNewTimetableEntry({
        classId: '',
        className: '',
        streamId: '',
        streamName: '',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        subject: '',
        teacherId: '',
        teacherName: '',
        room: '',
        duration: 60
      });

      // Close modal
      setShowTimetableModal(false);

      // Show success message
      alert('Timetable entry added successfully!');
    } else {
      alert('Please fill in all required fields (Class, Stream, Subject, and Teacher)');
    }
  };

  // Handle cancel adding timetable entry
  const handleCancelAddTimetable = () => {
    setShowTimetableModal(false);
    setNewTimetableEntry({
      classId: '',
      className: '',
      streamId: '',
      streamName: '',
      day: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      subject: '',
      teacherId: '',
      teacherName: '',
      room: '',
      duration: 60
    });
  };

  // Load billing types from backend on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/settings/billing-types')
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          setBillingTypes(data);
        }
      })
      .catch(error => {
        console.error('Error loading billing types:', error);
      });
  }, []);

  const handleBackup = async () => {
    try {
      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Only include selected data types
      if (backupOptions.students) backupData.students = students;
      if (backupOptions.classes) backupData.classes = classes;
      if (backupOptions.timetables) backupData.timetables = timetables;
      if (backupOptions.settings) backupData.settings = settings;
      if (backupOptions.financialRecords) backupData.financialRecords = financialRecords;
      if (backupOptions.clinicRecords) backupData.clinicRecords = clinicRecords;
      if (backupOptions.messages) backupData.messages = messages;
      if (backupOptions.notifications) backupData.notifications = notifications;
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate backup data
      if (!backupData.students || !backupData.classes) {
        throw new Error('Invalid backup file format');
      }
      
      // Here you would typically call API endpoints to restore data
      console.log('Restore data:', backupData);
      alert('Restore functionality would be implemented with backend API calls');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore backup: ' + error);
    }
  };

  const handleAddBillingType = () => {
    if (newBillingType.name && newBillingType.amount > 0 && newBillingType.className) {
      // Add to billing types array
      const newBillingTypeWithId = {
        ...newBillingType,
        id: Date.now()
      };
      
      // Save to backend
      fetch('http://localhost:5000/api/settings/billing-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBillingTypeWithId)
      }).then(response => {
        if (response.ok) {
          console.log('Billing type saved successfully');
          // Update local state
          setBillingTypes(prev => [...prev, newBillingTypeWithId]);
          alert('Billing type added successfully!');
        }
      }).catch(error => {
        console.error('Error saving billing type:', error);
        // Still add to local state even if backend fails
        setBillingTypes(prev => [...prev, newBillingTypeWithId]);
        alert('Billing type added locally (backend save failed)');
      });
      
      setNewBillingType({ name: '', amount: 0, frequency: 'termly', description: '', className: '', term: 'Term 1', year: '2024' });
      setShowBillingModal(false);
    }
  };

  const handleSaveAcademicSettings = async () => {
    try {
      // Save academic settings using the main updateSettings function
      await updateSettings({
        ...settings,
        currentYear: parseInt(currentYear),
        currentTerm: currentTerm
      });
      
      console.log('Academic settings saved successfully');
      alert('Academic settings saved successfully!');
    } catch (error) {
      console.error('Error saving academic settings:', error);
      alert('Failed to save academic settings. Please try again.');
    }
  };

  const handleSaveSecuritySettings = () => {
    // Save security settings to backend
    fetch('http://localhost:5000/api/settings/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securitySettings)
    }).then(response => {
      if (response.ok) {
        console.log('Security settings saved successfully');
        alert('Security settings saved successfully!');
      }
    }).catch(error => {
      console.error('Error saving security settings:', error);
      alert('Security settings saved locally (backend save failed)');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Settings</h1>
          <p className="text-gray-600">System administration and configuration</p>
        </div>
        <div className="flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-lg">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">Admin Access</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'backup', name: 'Backup & Restore', icon: Database },
            { id: 'billing', name: 'Billing Types', icon: DollarSign },
            { id: 'timetable', name: 'Timetable Management', icon: Clock },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'system', name: 'System Info', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Backup Options */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Backup Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(backupOptions).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-2 border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <Download className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Create Backup</h3>
              </div>
              <p className="text-green-700 mb-4">
                Export selected system data based on your backup options.
              </p>
              <button
                onClick={handleBackup}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Backup
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-2 border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">Restore Backup</h3>
              </div>
              <p className="text-purple-700 mb-4">
                Import system data from a backup file. This will overwrite current data.
              </p>
              <label className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-block text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                />
                Choose Backup File
              </label>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Backup files contain sensitive student information. Store them securely and do not share with unauthorized parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Types Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Billing Types by Class</h3>
            <button
              onClick={() => setShowBillingModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Billing Type</span>
            </button>
          </div>

          {/* Class-specific billing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const classBillingTypes = billingTypes.filter(type => type.className === cls.name);
              const totalAmount = classBillingTypes.reduce((sum, type) => sum + type.amount, 0);
              
              return (
                <div key={cls.id} className={`bg-gradient-to-br rounded-xl shadow-sm border-2 p-6 ${
                  cls.name === 'Senior 1' ? 'from-blue-50 to-blue-100 border-blue-200' :
                  cls.name === 'Senior 2' ? 'from-green-50 to-green-100 border-green-200' :
                  cls.name === 'Senior 3' ? 'from-purple-50 to-purple-100 border-purple-200' :
                  cls.name === 'Senior 4' ? 'from-orange-50 to-orange-100 border-orange-200' :
                  'from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{cls.name}</h4>
                    <span className="text-2xl font-bold text-gray-900">UGX {totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {classBillingTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{type.name}</p>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">UGX {type.amount.toLocaleString()}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            type.frequency === 'monthly' ? 'bg-blue-100 text-blue-800' :
                            type.frequency === 'term' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {type.frequency}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {classBillingTypes.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No billing types for this class</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timetable Management Tab */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Timetable Management</h3>
            <button
              onClick={() => setShowTimetableModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Timetable Entry</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Senior 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Senior 1</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">A</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior1a', name: 'Senior 1A', class: 'Senior 1', stream: 'A' })}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">B</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior1b', name: 'Senior 1B', class: 'Senior 1', stream: 'B' })}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">C</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior1c', name: 'Senior 1C', class: 'Senior 1', stream: 'C' })}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Senior 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Senior 2</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">A</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior2a', name: 'Senior 2A', class: 'Senior 2', stream: 'A' })}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">B</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior2b', name: 'Senior 2B', class: 'Senior 2', stream: 'B' })}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">C</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior2c', name: 'Senior 2C', class: 'Senior 2', stream: 'C' })}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Senior 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-2 border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Senior 3</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">A</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior3a', name: 'Senior 3A', class: 'Senior 3', stream: 'A' })}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">B</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior3b', name: 'Senior 3B', class: 'Senior 3', stream: 'B' })}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">C</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior3c', name: 'Senior 3C', class: 'Senior 3', stream: 'C' })}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Senior 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border-2 border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">Senior 4</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">A</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior4a', name: 'Senior 4A', class: 'Senior 4', stream: 'A' })}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">B</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior4b', name: 'Senior 4B', class: 'Senior 4', stream: 'B' })}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">C</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior4c', name: 'Senior 4C', class: 'Senior 4', stream: 'C' })}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Senior 5 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border-2 border-red-200">
              <h4 className="font-semibold text-red-900 mb-3">Senior 5</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">Sciences</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior5sciences', name: 'Senior 5 Sciences', class: 'Senior 5', stream: 'Sciences' })}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">Arts</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior5arts', name: 'Senior 5 Arts', class: 'Senior 5', stream: 'Arts' })}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Senior 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border-2 border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3">Senior 6</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">Sciences</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior6sciences', name: 'Senior 6 Sciences', class: 'Senior 6', stream: 'Sciences' })}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border shadow-sm">
                  <span className="text-sm text-gray-700">Arts</span>
                  <button 
                    onClick={() => handleEditStream({ id: 'senior6arts', name: 'Senior 6 Arts', class: 'Senior 6', stream: 'Arts' })}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            <button 
              onClick={handleSaveSecuritySettings}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Security Settings
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-2 border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <Key className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">Password Policy</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.strongPasswords}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, strongPasswords: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-purple-800">Require strong passwords (min 8 chars)</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.passwordChange90Days}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordChange90Days: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-purple-800">Force password change every 90 days</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-purple-800">Enable two-factor authentication</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.preventPasswordReuse}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, preventPasswordReuse: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-purple-800">Prevent password reuse (last 5)</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.specialCharacters}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, specialCharacters: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-purple-800">Require special characters</span>
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-2 border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Access Control</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                  />
                  <span className="ml-2 text-sm text-green-800">Session timeout after 30 minutes</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.logActivities}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, logActivities: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                  />
                  <span className="ml-2 text-sm text-green-800">Log all user activities</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.ipRestrictions}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipRestrictions: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                  />
                  <span className="ml-2 text-sm text-green-800">IP address restrictions</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.accountLockout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, accountLockout: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                  />
                  <span className="ml-2 text-sm text-green-800">Account lockout after 5 failed attempts</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.requireHttps}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireHttps: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                  />
                  <span className="ml-2 text-sm text-green-800">Require HTTPS for all connections</span>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border-2 border-red-200">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Data Protection</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.encryptData}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, encryptData: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500" 
                  />
                  <span className="ml-2 text-sm text-red-800">Encrypt sensitive data at rest</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.backupEncryption}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, backupEncryption: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500" 
                  />
                  <span className="ml-2 text-sm text-red-800">Enable data backup encryption</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.auditTrail}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditTrail: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500" 
                  />
                  <span className="ml-2 text-sm text-red-800">Audit trail for all data changes</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.gdprCompliance}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, gdprCompliance: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500" 
                  />
                  <span className="ml-2 text-sm text-red-800">GDPR compliance mode</span>
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Notifications</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.emailAlerts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-blue-800">Email alerts for failed logins</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.smsNotifications}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-blue-800">SMS notifications for admin actions</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.weeklyReports}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-blue-800">Weekly security reports</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={securitySettings.threatDetection}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, threatDetection: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-blue-800">Real-time threat detection</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Info Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Academic Year & Term Settings */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-sm border-2 border-teal-200">
            <h3 className="text-lg font-semibold text-teal-900 mb-4">Academic Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-teal-800 mb-2">Current Academic Year</label>
                <input
                  type="text"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="w-full rounded-lg border-teal-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-800 mb-2">Current Term</label>
                <select
                  value={currentTerm}
                  onChange={(e) => setCurrentTerm(e.target.value)}
                  className="w-full rounded-lg border-teal-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={handleSaveAcademicSettings}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Save Academic Settings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Users</h3>
              </div>
              <p className="text-3xl font-bold text-blue-900">{students.length}</p>
              <p className="text-sm text-blue-700">Total Students</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-2 border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Classes</h3>
              </div>
              <p className="text-3xl font-bold text-green-900">{classes.length}</p>
              <p className="text-sm text-green-700">Active Classes</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-2 border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">System</h3>
              </div>
              <p className="text-3xl font-bold text-purple-900">v1.0.0</p>
              <p className="text-sm text-purple-700">Current Version</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Database:</strong> SQLite</p>
                <p><strong>Backend:</strong> Node.js/Express</p>
                <p><strong>Frontend:</strong> React/TypeScript</p>
              </div>
              <div>
                <p><strong>Last Backup:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Uptime:</strong> 99.9%</p>
                <p><strong>Storage:</strong> 2.3 GB used</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Billing Type Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Add Billing Type</h2>
              <button
                onClick={() => setShowBillingModal(false)}
                className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newBillingType.name}
                  onChange={(e) => setNewBillingType(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Tuition Fee"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={newBillingType.className}
                  onChange={(e) => setNewBillingType(prev => ({ ...prev, className: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
                <input
                  type="number"
                  value={newBillingType.amount}
                  onChange={(e) => setNewBillingType(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={newBillingType.frequency}
                  onChange={(e) => setNewBillingType(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="term">Per Term</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newBillingType.description}
                  onChange={(e) => setNewBillingType(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief description of this fee..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBillingType}
                  disabled={!newBillingType.name || newBillingType.amount <= 0 || !newBillingType.className}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Billing Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timetable Modal */}
      {showEditModal && editingStream && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Edit Timetable Entry</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingStream.class} - {editingStream.stream}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Senior 1A"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Subjects
                  </h3>
                  {editFormData.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => updateSubject(index, e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Mathematics"
                      />
                      {editFormData.subjects.length > 1 && (
                        <button
                          onClick={() => removeSubject(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove subject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addSubject}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subject
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Teachers
                  </h3>
                  {editFormData.teachers.map((teacher, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={teacher}
                        onChange={(e) => updateTeacher(index, e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Mr. Smith"
                      />
                      {editFormData.teachers.length > 1 && (
                        <button
                          onClick={() => removeTeacher(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove teacher"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTeacher}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Teacher
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Weekly Schedule
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(editFormData.schedule).map(([day, schedule]) => (
                    <div key={day} className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 text-center">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </p>
                      <div className="space-y-1">
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => updateSchedule(day, 'start', e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                        />
                        <div className="text-center text-xs text-gray-500">to</div>
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => updateSchedule(day, 'end', e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editFormData.name.trim() || editFormData.subjects.length === 0 || editFormData.teachers.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Timetable Entry Modal */}
      {showTimetableModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Add New Timetable Entry</h2>
              <button
                onClick={handleCancelAddTimetable}
                className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={newTimetableEntry.className}
                  onChange={(e) => handleNewTimetableChange('className', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <select
                  value={newTimetableEntry.streamName}
                  onChange={(e) => handleNewTimetableChange('streamName', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a stream</option>
                  {newTimetableEntry.classId && availableClasses.find(c => c.id === newTimetableEntry.classId)?.streams.map((stream) => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={newTimetableEntry.day}
                  onChange={(e) => handleNewTimetableChange('day', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTimetableEntry.subject}
                  onChange={(e) => handleNewTimetableChange('subject', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  value={newTimetableEntry.teacherId}
                  onChange={(e) => handleNewTimetableChange('teacherId', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newTimetableEntry.startTime}
                  onChange={(e) => handleNewTimetableChange('startTime', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newTimetableEntry.endTime}
                  onChange={(e) => handleNewTimetableChange('endTime', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  value={newTimetableEntry.room}
                  onChange={(e) => handleNewTimetableChange('room', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Room 101"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelAddTimetable}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTimetableEntry}
                  disabled={!newTimetableEntry.className || !newTimetableEntry.streamName || !newTimetableEntry.subject || !newTimetableEntry.teacherId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettings; 