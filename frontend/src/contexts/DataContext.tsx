import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_GRADE_SYSTEM } from '../utils/grading';
import { 
  Student, 
  FinancialRecord, 
  Sponsorship, 
  Sponsor, 
  Class, 
  Stream, 
  AttendanceRecord, 
  Message, 
  Notification, 
  Setting, 
  TimeTable, 
  ClinicRecord, 
  WeeklyReport,
  Resource
} from '../types';

// Add BillingType interface for permanent storage
interface BillingType {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  description?: string;
  classId?: string;
  className: string;
  year: string;
  term: string;
  createdAt: string;
  updatedAt: string;
}

// Add Resource type
export interface Resource {
  id: string;
  title: string;
  fileUrl: string; // still used for Blob URL at runtime
  fileType: string;
  fileData: string; // base64 encoded file data
  classIds: string[];
  uploadedBy: string;
  uploadedAt: string;
}

interface DataContextType {
  students: Student[];
  financialRecords: FinancialRecord[];
  sponsorships: Sponsorship[];
  sponsors: Sponsor[];
  classes: Class[];
  attendanceRecords: AttendanceRecord[];
  messages: Message[];
  notifications: Notification[];
  settings: Setting;
  timetables: TimeTable[];
  clinicRecords: ClinicRecord[];
  droppedAccessNumbers: string[]; // Track dropped access numbers
  resources: Resource[];
  weeklyReports: WeeklyReport[]; // Add weekly reports
  billingTypes: BillingType[]; // Add billing types for permanent storage
  addResource: (resource: Omit<Resource, 'id' | 'uploadedAt' | 'fileData' | 'fileUrl'>, file: File) => void;
  deleteResource: (id: string) => void;
  fetchResources: () => Promise<void>;
  getResourcesByClass: (classId: string) => Resource[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { wasDroppedNumberChosen?: boolean }) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<any>;
  fetchFinancialRecords: () => Promise<void>;
  addBillingType: (billingType: Omit<BillingType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  updateBillingType: (id: number, billingType: Partial<BillingType>) => Promise<any>;
  deleteBillingType: (id: number) => Promise<any>;
  fetchBillingTypes: () => Promise<void>;
  addSponsorship: (sponsorship: Omit<Sponsorship, 'id'>) => void;
  updateSponsorship: (id: string, sponsorship: Partial<Sponsorship>) => void;
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  addMessage: (message: Omit<Message, 'id'>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  fetchMessagesByUser: (userId: string) => Promise<void>;
  markMessageRead: (messageId: string, read?: boolean) => Promise<void>;
  markAllMessagesRead: (userId: string) => Promise<void>;
  updateSettings: (settings: Partial<Setting>) => void;
  addTimetableEntry: (entry: Omit<TimeTable, 'id'>) => void;
  updateTimetableEntry: (id: string, entry: Partial<TimeTable>) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteTimetableEntry: (id: string) => void;
  addClinicRecord: (record: Omit<ClinicRecord, 'id'>) => void;
  refreshClinicRecords: () => Promise<void>;
  updateClinicRecord: (id: string, record: Partial<ClinicRecord>) => void;
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  addStreamToClass: (classId: string, streamData: Omit<Stream, 'id'>) => void;
  updateStream: (classId: string, streamId: string, updates: Partial<Stream>) => void;
  deleteStream: (classId: string, streamId: string) => void;
  getAvailableAccessNumbers: (className: string, streamName: string) => string[];
  addDroppedAccessNumber: (accessNumber: string) => void;
  removeDroppedAccessNumber: (accessNumber: string) => void;
  clearDroppedAccessNumbers: () => void;
  fetchDroppedAccessNumbers: () => Promise<void>;
  getAdmissionNumberForDroppedAccess: (accessNumber: string) => string | null;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  flagStudent: (id: string, status: 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted', flagComment?: string) => void;
  clearAllStudents: () => void;
  deleteStudentsByClassStream: (className: string, streamName: string) => Promise<void>;
  addWeeklyReport: (report: any) => void;
  deleteWeeklyReport: (reportId: string) => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchEnrolledStudents: () => Promise<void>;
  fetchClinicRecords: () => Promise<void>;
  fetchTimetables: () => Promise<void>;
  loadTimetables: () => Promise<void>;
  fetchAttendanceRecords: (date?: string) => Promise<void>;
  fetchWeeklyReports: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  findStudentByAccessNumber: (accessNumber: string) => Student | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to get initials for class and stream
  function getClassStreamInitials(className: string, streamName: string) {
    // Use first letter of class and stream, or fallback to 'X'
    const classInitial = className?.match(/\b([A-Za-z])/g)?.join('').toUpperCase() || 'X';
    const streamInitial = streamName?.charAt(0).toUpperCase() || 'X';
    return classInitial + streamInitial;
  }

  // Helper to get class code (A for S1, B for S2, C for S3, D for S4)
  function getClassCode(className: string) {
    switch (className) {
      case 'Senior 1': return 'A';
      case 'Senior 2': return 'B';
      case 'Senior 3': return 'C';
      case 'Senior 4': return 'D';
      default: return 'X';
    }
  }

  // Generate access number for a student in a given class/stream
  const generateAccessNumber = (className: string, streamName: string) => {
    const classCode = getClassCode(className);
    const streamCode = streamName?.charAt(0).toUpperCase() || 'X';
    // Only consider students in this class AND stream and status active
    const streamStudents = students.filter(s => s.class === className && s.stream === streamName && s.status === 'active');
    // Get all used numbers in this stream
    const usedNumbers = streamStudents.map(s => {
      const match = s.accessNumber?.match(/\d{2}$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    // Find the highest used number (last admitted)
    const maxUsed = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
    // Get dropped numbers for this stream
    const droppedNumbers = droppedAccessNumbers
      .filter(num => num.startsWith(`${classCode}${streamCode}`))
      .map(num => parseInt(num.slice(-2), 10));
    // The next number is maxUsed if no students, or maxUsed+1 if not reusing dropped
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber) || droppedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    // If there are no students, reuse the last number (if last was deleted)
    if (usedNumbers.length === 0 && maxUsed > 0) {
      nextNumber = maxUsed;
    }
    return `${classCode}${streamCode}${String(nextNumber).padStart(2, '0')}`;
  };

  // Generate admission number for a student
  // Format: A[Year][ClassCode][5-digit school-wide number]
  // Example: A25A00001 (2025, Senior 1, first student in school that year)
  const generateAdmissionId = (className: string, _streamName: string, date?: Date) => {
    const now = date || new Date();
    const year = now.getFullYear().toString().slice(-2); // last two digits
    const classCode = getClassCode(className);
    // Find all students admitted in this year, sorted by createdAt
    const yearStudents = students.filter(s => {
      if (!s.admissionId) return false;
      return s.admissionId.startsWith(`A${year}`);
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    // The next admission number is the count + 1, formatted as 2 digits
    const nextNumber = yearStudents.length + 1;
    return `A${year}${classCode}${String(nextNumber).padStart(2, '0')}`;
  };

  // Cleanup function to reassign access and admission numbers for all students
  function cleanupStudentNumbers(students: Student[]): Student[] {
    // Group students by class and stream for access numbers
    const groupedByClassStream: Record<string, Student[]> = {};
    students.forEach(student => {
      const key = `${student.class}||${student.stream}`;
      if (!groupedByClassStream[key]) groupedByClassStream[key] = [];
      groupedByClassStream[key].push(student);
    });
    // Assign sequential access numbers
    Object.entries(groupedByClassStream).forEach(([key, group]) => {
      const [className, streamName] = key.split('||');
      group
        .filter(s => s.status === 'active')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .forEach((student, idx) => {
          const classCode = getClassCode(className);
          const streamCode = streamName?.charAt(0).toUpperCase() || 'X';
          student.accessNumber = `${classCode}${streamCode}${String(idx + 1).padStart(4, '0')}`;
        });
    });
    // Assign school-wide sequential admission numbers per year
    const groupedByYear: Record<string, Student[]> = {};
    students.forEach(student => {
      const date = student.createdAt || new Date();
      const year = date.getFullYear().toString().slice(-2);
      if (!groupedByYear[year]) groupedByYear[year] = [];
      groupedByYear[year].push(student);
    });
    Object.entries(groupedByYear).forEach(([year, group]) => {
      group
        .filter(s => s.status === 'active')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .forEach((student, idx) => {
          const classCode = getClassCode(student.class);
          student.admissionId = `A${year}${classCode}${String(idx + 1).padStart(5, '0')}`;
        });
    });
    return students;
  }

  const [settings, setSettings] = useState<Setting>({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    currentTerm: 'Term 3',
    currentYear: 2025,
    // Do not hardcode any fee totals; always use fee structures from Settings
    feesStructure: {},
    paymentMethods: ['Mobile Money', 'Bank Transfer', 'Cash', 'MTN MoMo', 'Airtel Money', 'Visa', 'Mastercard'],
    gradeSystem: DEFAULT_GRADE_SYSTEM,
    overdueSettings: {
      gracePeriod: 30,
      lateFeePercentage: 5,
      notificationDays: '7,15,30'
    }
  });

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔄 Loading settings from database...');
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const dbSettings = await response.json();
          console.log('📊 Settings from database:', dbSettings);
          
          // Parse securitySettings JSON if it exists
          let parsedSettings = { ...dbSettings };
          if (dbSettings.securitySettings) {
            try {
              const securityData = JSON.parse(dbSettings.securitySettings);
              parsedSettings = { ...parsedSettings, ...securityData };
            } catch (e) {
              console.warn('Could not parse securitySettings:', e);
            }
          }
          
          setSettings(parsedSettings);
          console.log('✅ Settings loaded from database:', parsedSettings);
        } else {
          console.warn('⚠️ Failed to load settings from database');
        }
      } catch (error) {
        console.error('❌ Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const [classes, setClasses] = useState<Class[]>([
    {
      id: '1',
      name: 'Senior 1',
      streams: [
        { id: 's1a', name: 'A', teacherId: '2', teacherName: 'Teacher User', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's1b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's1c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] }
      ],
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'],
      level: 'Secondary'
    },
    {
      id: '2',
      name: 'Senior 2',
      streams: [
        { id: 's2a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's2b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's2c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] }
      ],
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'],
      level: 'Secondary'
    },
    {
      id: '3',
      name: 'Senior 3',
      streams: [
        { id: 's3a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's3b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's3c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] }
      ],
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'],
      level: 'Secondary'
    },
    {
      id: '4',
      name: 'Senior 4',
      streams: [
        { id: 's4a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's4b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's4c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'] }
      ],
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'],
      level: 'Secondary'
    },
    {
      id: '5',
      name: 'Senior 5',
      streams: [
        { id: 's5sci', name: 'Sciences', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's5arts', name: 'Arts', subjects: ['History', 'Geography', 'Literature', 'Economics'] }
      ],
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature', 'Economics'],
      level: 'Advanced'
    },
    {
      id: '6',
      name: 'Senior 6',
      streams: [
        { id: 's6sci', name: 'Sciences', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'] },
        { id: 's6arts', name: 'Arts', subjects: ['History', 'Geography', 'Literature', 'Economics'] }
      ],
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature', 'Economics'],
      level: 'Advanced'
    }
  ]);

  // Initial students state with cleanup
  const [students, setStudents] = useState<Student[]>(() => cleanupStudentNumbers([
    // Students removed from sponsorship flow - will be added fresh
    // Removed Grace Nakato, John Okello, and Aisha Mbabazi as requested
  ]));
  
  // Cache timestamp for preventing excessive API calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // One-time cleanup to reassign all students' admission numbers for the current year in sequential 2-digit format
  React.useEffect(() => {
    setStudents(prev => {
      const year = new Date().getFullYear().toString().slice(-2);
      // Get all students for this year, sorted by createdAt
      const yearStudents = prev.filter(s => s.admissionId && s.admissionId.startsWith(`A${year}`))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      // Assign new admission numbers in order
      let count = 1;
      const updated = prev.map(s => {
        if (s.admissionId && s.admissionId.startsWith(`A${year}`)) {
          const classCode = getClassCode(s.class);
          const newAdmissionId = `A${year}${classCode}${String(count).padStart(2, '0')}`;
          count++;
          return { ...s, admissionId: newAdmissionId };
        }
        return s;
      });
      return updated;
    });
  }, []);

  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);

  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]); // Cleared for fresh start

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: '1',
      studentId: '1',
      date: new Date(),
      time: '08:00',
      status: 'present',
      teacherId: '2',
      teacherName: 'Teacher User',
      notificationSent: true
    },
    {
      id: '2',
      studentId: '2',
      date: new Date(),
      time: '08:00',
      status: 'present',
      teacherId: '2',
      teacherName: 'Teacher User',
      notificationSent: true
    },
    {
      id: '3',
      studentId: '3',
      date: new Date(),
      time: '08:00',
      status: 'late',
      teacherId: '2',
      teacherName: 'Teacher User',
      remarks: 'Arrived 15 minutes late',
      notificationSent: true
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'parent-1',
      type: 'attendance',
      title: 'Attendance Confirmed',
      message: 'Your child Nakato Grace was marked present today at 08:00 AM',
      date: new Date(),
      read: false,
      studentId: '1'
    }
  ]);

  const [timetables, setTimetables] = useState<TimeTable[]>([]);

  const [clinicRecords, setClinicRecords] = useState<ClinicRecord[]>([]);

  const [droppedAccessNumbers, setDroppedAccessNumbers] = useState<string[]>([]);
  const [droppedAccessRecords, setDroppedAccessRecords] = useState<any[]>([]);

  // Weekly reports state
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
  const [resources, setResources] = useState<Resource[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Resources fetched from backend:', data);
        // Transform the data to match the frontend Resource interface
        const transformedResources = data.map((resource: any) => ({
          id: resource.id.toString(),
          title: resource.title,
          fileType: resource.fileType,
          fileData: resource.fileData, // This is now a filename
          fileUrl: `${API_BASE_URL}/resources/${resource.id}/preview`, // URL to preview the file
          classIds: resource.classIds ? JSON.parse(resource.classIds) : [],
          uploadedBy: resource.uploadedBy,
          uploadedAt: resource.uploadedAt
        }));
        console.log('✅ Transformed resources:', transformedResources);
        setResources(transformedResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const addResource = useCallback(async (resource: Omit<Resource, 'id' | 'uploadedAt' | 'fileData' | 'fileUrl'>, file: File) => {
    try {
      const fileType = file.type;
      const fileData = await fileToBase64(file);
      const payload = {
        ...resource,
        fileType,
        fileData,
        classIds: resource.classIds,
        uploadedBy: resource.uploadedBy,
      };
      const response = await fetch(`${API_BASE_URL}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const newResource = await response.json();
        // Transform the backend response to match frontend format
        const transformedResource: Resource = {
          id: newResource.id.toString(),
          title: newResource.title,
          fileType: newResource.fileType,
          fileData: newResource.fileData, // This is now a filename
          fileUrl: `${API_BASE_URL}/resources/${newResource.id}/download`, // URL to download the file
          classIds: newResource.classIds ? JSON.parse(newResource.classIds) : resource.classIds,
          uploadedBy: newResource.uploadedBy,
          uploadedAt: newResource.uploadedAt
        };
        setResources(prev => [transformedResource, ...prev]);
        console.log('Resource uploaded successfully');
      } else {
        console.error('Failed to upload resource:', response.statusText);
        // Create local resource even if backend fails
        const localResource: Resource = {
          id: uuidv4(),
          title: resource.title,
          fileType,
          fileData,
          fileUrl: URL.createObjectURL(file),
          classIds: resource.classIds,
          uploadedBy: resource.uploadedBy,
          uploadedAt: new Date().toISOString()
        };
        setResources(prev => [localResource, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      // Create local resource even if backend fails
      const localResource: Resource = {
        id: uuidv4(),
        title: resource.title,
        fileType: file.type,
        fileData: await fileToBase64(file),
        fileUrl: URL.createObjectURL(file),
        classIds: resource.classIds,
        uploadedBy: resource.uploadedBy,
        uploadedAt: new Date().toISOString()
      };
      setResources(prev => [localResource, ...prev]);
    }
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  const getResourcesByClass = useCallback((classId: string) => {
    return resources.filter(r => r.classIds.includes(classId));
  }, [resources]);

  // Add a new student, letting the backend handle access number and admission ID generation
  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { wasDroppedNumberChosen?: boolean }) => {
    // If a dropped number was chosen, remove it from droppedAccessNumbers
    if (studentData.wasDroppedNumberChosen && studentData.accessNumber) {
      removeDroppedAccessNumber(studentData.accessNumber);
    }
    
    const newStudent: Student = {
      ...studentData,
      id: uuidv4(), // Temporary ID for local state
      accessNumber: studentData.wasDroppedNumberChosen ? studentData.accessNumber : '', // Use dropped number if chosen, otherwise let backend generate
      admissionId: '', // Clear admission ID - let backend generate new one
      sponsorshipApplications: [],
      maxSponsors: 3,
      status: 'active', // Default to active
      // Use the sponsorship status from the form data
      sponsorshipStatus: studentData.sponsorshipStatus || (studentData.needsSponsorship ? 'eligibility-check' : 'none'),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add flag to indicate if this is a re-admission
      isReAdmission: studentData.isReAdmission || false
    };
    
    // Save to backend
    try {
      console.log('🌐 Sending student data to backend...');
      const response = await fetch(`${API_BASE_URL}/students?_t=${Date.now()}&_r=${Math.random()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(newStudent)
      });
      
      if (response.ok) {
        const savedStudent = await response.json();
        console.log('✅ Student saved successfully to backend:', savedStudent);
        // Don't add to local state here - let the refresh handle it to avoid duplication
        return savedStudent; // Return the saved student
      } else {
        const errorText = await response.text();
        console.error('❌ Backend failed to save student:', response.status, errorText);
        
        // Try to parse JSON error response
        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'Duplicate entry') {
            errorMessage = errorData.details || 'A student with this name, class, and stream already exists.';
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If not JSON, use the raw text
          errorMessage = errorText;
        }
        
        throw new Error(`Backend error: ${response.status} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error saving student to backend:', error);
      // Don't add to local state if backend fails - let the form handle the error
      throw error;
    }
  }, []);

  // Update a student; if class/stream changes, drop old number and assign new ones for the new stream
  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    const currentStudent = students.find(s => s.id === id);
    if (!currentStudent) return;
    
    let newAccessNumber = currentStudent.accessNumber;
    let newAdmissionId = currentStudent.admissionId;
    
    if ((updates.class && updates.class !== currentStudent.class) || (updates.stream && updates.stream !== currentStudent.stream)) {
      const oldAccessNumber = currentStudent.accessNumber;
      // Only add to dropped if not last admitted in stream
      const streamStudents = students.filter(s => s.class === currentStudent.class && s.stream === currentStudent.stream && s.status === 'active');
      const lastAdmitted = streamStudents.reduce((latest, s) => s.createdAt > latest.createdAt ? s : latest, streamStudents[0]);
      if (oldAccessNumber && lastAdmitted && lastAdmitted.id !== currentStudent.id) {
        addDroppedAccessNumber(oldAccessNumber);
      }
      const newClass = updates.class || currentStudent.class;
      const newStream = updates.stream || currentStudent.stream;
      // Only pick from dropped numbers for the new class/stream
      const availableDropped = droppedAccessNumbers.filter(num => num.startsWith(getClassCode(newClass) + (newStream?.charAt(0).toUpperCase() || 'X')));
      if (availableDropped.length > 0) {
        newAccessNumber = availableDropped[0];
        removeDroppedAccessNumber(newAccessNumber);
      } else {
        newAccessNumber = generateAccessNumber(newClass, newStream);
      }
      newAdmissionId = generateAdmissionId(newClass, newStream);
      updates.accessNumber = newAccessNumber;
      updates.admissionId = newAdmissionId;
    }
    
    // Preserve existing photo fields if not explicitly provided in updates
    const preservedUpdates = {
      ...updates,
      // Keep existing photo fields if not being updated
      photo: updates.photo !== undefined ? updates.photo : currentStudent.photo,
      familyPhoto: updates.familyPhoto !== undefined ? updates.familyPhoto : currentStudent.familyPhoto,
      passportPhoto: updates.passportPhoto !== undefined ? updates.passportPhoto : currentStudent.passportPhoto,
      // Keep other important fields that shouldn't be lost
      sponsorshipStory: updates.sponsorshipStory !== undefined ? updates.sponsorshipStory : currentStudent.sponsorshipStory,
      parent: updates.parent || currentStudent.parent
    };
    
    try {
      console.log('🔄 Updating student in backend:', id, preservedUpdates);
      
      // Send update to backend
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preservedUpdates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update student: ${response.statusText}`);
      }
      
      const updatedStudent = await response.json();
      console.log('✅ Student updated in backend:', updatedStudent);
      
      // Update local state with the response from backend
      setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...updatedStudent, updatedAt: new Date() } : student
      ));

      try {
        // Notify other windows/components (e.g., PaymentSystem) to refresh immediately
        window.dispatchEvent(new CustomEvent('student:updated', { detail: { id, updatedStudent } }));
      } catch (_e) {}
      
    } catch (error) {
      console.error('❌ Error updating student:', error);
      throw error;
    }
  }, [students, droppedAccessNumbers, API_BASE_URL]);

  // Delete a student and drop their access number if not last admitted (hard delete)
  const deleteStudent = useCallback(async (id: string) => {
    try {
      console.log('🗑️ DELETE STUDENT: Starting deletion for ID:', id);
      // First, get the student data before deletion
      const student = students.find(s => s.id === id);
      if (!student) {
        console.error('❌ Student not found in local state');
        throw new Error('Student not found');
      }
      
      console.log('🗑️ DELETE STUDENT: Deleting student:', student.name, 'Access:', student.accessNumber);

      // Call the backend API to delete the student
      console.log('🌐 DELETE STUDENT: Calling backend API...');
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('🌐 DELETE STUDENT: Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        if (response.status === 403 && errorData.error === 'Cannot delete overseer-admitted student') {
          throw new Error(`Cannot delete overseer-admitted student: ${errorData.details}`);
        }
        throw new Error(`Backend deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Student deleted from backend:', result);

      // Force immediate UI update by clearing any cached state
      setStudents(prev => prev.filter(s => s.id !== id));
      
      // Refresh data from backend to ensure consistency
      await fetchStudents();
      await fetchDroppedAccessNumbers();
      
      console.log('✅ Data refreshed after deletion');

      return result;
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      throw error;
    }
  }, [students, API_BASE_URL]);

  // Delete overseer-admitted student (for overseer use only)
  const deleteOverseerStudent = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Deleting overseer-admitted student:', id);
      
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        throw new Error(`Backend deletion failed: ${response.status} - ${errorData.error || errorText}`);
      }

      const result = await response.json();
      console.log('✅ Overseer student deleted from backend:', result);
      
      // Refresh data from backend to ensure consistency
      await fetchStudents();
      await fetchDroppedAccessNumbers();
      
      console.log('✅ Data refreshed after overseer deletion');
      
      return result;
    } catch (error) {
      console.error('❌ Error deleting overseer student:', error);
      throw error;
    }
  }, [API_BASE_URL]);

  // Flag a student with a given status and optional comment
  const flagStudent = async (id: string, status: 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted', flagComment?: string) => {
    try {
      console.log('🚩 Flagging student:', id, 'with status:', status);
      
      // Call backend API to update student status
      const response = await fetch(`${API_BASE_URL}/students/${id}/flag`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ 
          status, 
          flagComment, 
          updatedAt: new Date().toISOString() 
        })
      });

      if (!response.ok) {
        throw new Error(`Backend flag failed: ${response.status}`);
      }

      console.log('✅ Student flagged in backend');

      // Update local state immediately
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status, flagComment, updatedAt: new Date() } : s));
      
      // Don't automatically add to dropped list - let backend handle the logic
      // The backend will add to dropped list only if the student is not the highest numbered

      // Refresh data from backend to ensure consistency
      await fetchStudents();
      await fetchDroppedAccessNumbers();
      
      console.log('✅ Student flagged successfully');
      
    } catch (error) {
      console.error('❌ Error flagging student:', error);
      throw error;
    }
  };

  const addFinancialRecord = async (recordData: Omit<FinancialRecord, 'id'>) => {
    try {
      console.log('💳 Creating financial record:', recordData);
      
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/financial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const raw = await response.json();
          // Normalize date fields to Date objects for consumers (dashboards)
          const newRecord: FinancialRecord = {
            ...raw,
            date: raw?.date ? new Date(raw.date) : undefined,
            paymentDate: raw?.paymentDate ? new Date(raw.paymentDate) : undefined
          };
          console.log('✅ Financial record created successfully via backend:', newRecord);
          
          // Add to local state
          setFinancialRecords(prev => [...prev, newRecord]);
          
          // Add notification for overdue payments
          if (recordData.status === 'overdue') {
            const notification: Omit<Notification, 'id'> = {
              userId: 'admin', // Notify all admins
              type: 'payment',
              title: 'Payment Overdue',
              message: `${recordData.studentName} has an overdue payment of UGX ${recordData.amount.toLocaleString()}`,
              date: new Date(),
              read: false,
              link: '/financial'
            };
            addNotification(notification);
          }
          
          return newRecord;
        } else {
          throw new Error(`Backend error: ${response.status}`);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend failed, falling back to local storage:', backendError);
        
        // Fallback to local storage
        const newRecord: FinancialRecord = {
          ...recordData,
          id: uuidv4()
        };
        setFinancialRecords(prev => [...prev, newRecord]);
        
        // Add notification for overdue payments
        if (recordData.status === 'overdue') {
          const notification: Omit<Notification, 'id'> = {
            userId: 'admin', // Notify all admins
            type: 'payment',
            title: 'Payment Overdue',
            message: `${recordData.studentName} has an overdue payment of UGX ${recordData.amount.toLocaleString()}`,
            date: new Date(),
            read: false,
            link: '/financial'
          };
          addNotification(notification);
        }
        
        return newRecord;
      }
    } catch (error) {
      console.error('❌ Error creating financial record:', error);
      throw error;
    }
  };

  // Load all financial records from backend
  const fetchFinancialRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/financial`);
      if (response.ok) {
        const raw: any[] = await response.json();
        const records: FinancialRecord[] = (raw || []).map((r: any) => ({
          ...r,
          date: r?.date ? new Date(r.date) : undefined,
          paymentDate: r?.paymentDate ? new Date(r.paymentDate) : undefined
        }));
        setFinancialRecords(records);
        console.log('✅ Loaded financial records:', records.length);
      } else {
        console.warn('⚠️ Failed to load financial records:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading financial records:', error);
    }
  };

  // Billing Type Management Functions
  const addBillingType = async (billingTypeData: Omit<BillingType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('💰 Creating billing type:', billingTypeData);
      
      const response = await fetch(`${API_BASE_URL}/settings/billing-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingTypeData),
      });

      if (response.ok) {
        const newBillingType: BillingType = await response.json();
        console.log('✅ Billing type created successfully:', newBillingType);
        
        setBillingTypes(prev => [...prev, newBillingType]);
        return newBillingType;
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error creating billing type:', error);
      throw error;
    }
  };

  const updateBillingType = async (id: number, billingTypeData: Partial<BillingType>) => {
    try {
      console.log('💰 Updating billing type:', id, billingTypeData);
      
      const response = await fetch(`${API_BASE_URL}/settings/billing-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingTypeData),
      });

      if (response.ok) {
        const updatedBillingType: BillingType = await response.json();
        console.log('✅ Billing type updated successfully:', updatedBillingType);
        
        setBillingTypes(prev => prev.map(bt => bt.id === id ? updatedBillingType : bt));
        return updatedBillingType;
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error updating billing type:', error);
      throw error;
    }
  };

  const deleteBillingType = async (id: number) => {
    try {
      console.log('💰 Deleting billing type:', id);
      
      const response = await fetch(`${API_BASE_URL}/settings/billing-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Billing type deleted successfully');
        
        setBillingTypes(prev => prev.filter(bt => bt.id !== id));
        return true;
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting billing type:', error);
      throw error;
    }
  };

  const fetchBillingTypes = async () => {
    try {
      // Check if we already have billing types and they're recent (within 30 seconds)
      const lastFetch = localStorage.getItem('billingTypesLastFetch');
      const now = Date.now();
      if (lastFetch && (now - parseInt(lastFetch)) < 30000 && billingTypes.length > 0) {
        console.log('💰 Using cached billing types (fetched within 30 seconds)');
        return;
      }
      
      // Clear any stale cache for debugging
      localStorage.removeItem('billingTypesLastFetch');
      
      console.log('💰 Fetching billing types...');
      
      const response = await fetch(`${API_BASE_URL}/settings/billing-types`);
      
      if (response.ok) {
        const billingTypesData: BillingType[] = await response.json();
        console.log('✅ Billing types fetched successfully:', billingTypesData);
        
        setBillingTypes(billingTypesData);
        localStorage.setItem('billingTypesLastFetch', now.toString());
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching billing types:', error);
      // Don't throw error to prevent app crash
    }
  };

  const addSponsorship = async (sponsorshipData: Omit<Sponsorship, 'id'>) => {
    try {
      console.log('🎉 Creating sponsorship for:', sponsorshipData.studentName);
      
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/sponsorships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sponsorshipData),
        });

        if (response.ok) {
          const newSponsorship: Sponsorship = await response.json();
          console.log('✅ Sponsorship created successfully via backend:', newSponsorship);
          console.log('📊 Current sponsorships before adding:', sponsorships);
          
          // Add to local state
          setSponsorships(prev => {
            const updated = [...prev, newSponsorship];
            console.log('📊 Sponsorships after adding:', updated);
            return updated;
          });
          
          // Update student status to indicate they are under sponsorship review
          // This prevents them from reverting to 'available' after refresh
          await updateStudent(sponsorshipData.studentId.toString(), { 
            sponsorshipStatus: 'under-sponsorship-review' 
          });
          
          // Add notification
          const notification: Omit<Notification, 'id'> = {
            userId: 'admin',
            type: 'sponsorship',
            title: 'New Sponsorship Request',
            message: `${sponsorshipData.sponsorName} wants to sponsor ${sponsorshipData.studentName}. Amount: UGX ${sponsorshipData.amount.toLocaleString()}`,
            date: new Date(),
            read: false,
            link: '/sponsorships'
          };
          addNotification(notification);
          
          return newSponsorship;
        }
      } catch (backendError) {
        console.log('⚠️ Backend not available, using local storage');
      }
      
      // Fallback: Create sponsorship locally
      const newSponsorship: Sponsorship = {
        id: 'sponsorship-' + Date.now(),
        ...sponsorshipData,
        sponsorId: sponsorshipData.sponsorId || 'sponsor-' + Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Sponsorship created successfully (local):', newSponsorship);
      
      // Add to local state
      setSponsorships(prev => [...prev, newSponsorship]);
      
      // Update student status to indicate they are under sponsorship review
      // This prevents them from reverting to 'available' after refresh
      await updateStudent(sponsorshipData.studentId.toString(), { 
        sponsorshipStatus: 'under-sponsorship-review' 
      });
      
      // Add notification
      const notification: Omit<Notification, 'id'> = {
        userId: 'admin',
        type: 'sponsorship',
        title: 'New Sponsorship Request',
        message: `${sponsorshipData.sponsorName} wants to sponsor ${sponsorshipData.studentName}. Amount: UGX ${sponsorshipData.amount.toLocaleString()}`,
        date: new Date(),
        read: false,
        link: '/sponsorships'
      };
      addNotification(notification);
      
      // Sponsorship is now persisted in database only
      
      return newSponsorship;
    } catch (error) {
      console.error('❌ Error creating sponsorship:', error);
      throw error;
    }
  };

  const updateSponsorship = async (id: string, updates: Partial<Sponsorship>) => {
    try {
      console.log('🔄 Updating sponsorship:', id, updates);
      
      // Ensure ID is numeric for backend
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid sponsorship ID: ${id}`);
      }
      
      // Always try backend first - this is the primary method
      // If moving from pending to next step, call dedicated endpoints
      let response: Response;
      if (updates.status === 'coordinator-approved') {
        response = await fetch(`${API_BASE_URL}/sponsorships/${numericId}/approve`, { method: 'POST' });
      } else if (updates.status === 'rejected') {
        response = await fetch(`${API_BASE_URL}/sponsorships/${numericId}/reject`, { method: 'POST' });
      } else if (updates.status === 'sponsored') {
        // Admin-level; still support here in case of overseer escalation
        response = await fetch(`${API_BASE_URL}/sponsorships/${numericId}/approve-sponsored`, { method: 'POST' });
      } else if (updates.status) {
        response = await fetch(`${API_BASE_URL}/sponsorships/${numericId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updates.status }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/sponsorships/${numericId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      }

      if (response.ok) {
        const updatedSponsorship: Sponsorship = await response.json();
        
        // Update local state
        setSponsorships(prev => prev.map(sponsorship =>
          sponsorship.id === id ? updatedSponsorship : sponsorship
        ));
        
        // Handle status changes
        if (updatedSponsorship.status) {
          const sponsorship = sponsorships.find(s => s.id === id);
          if (sponsorship) {
            let newStudentStatus = 'available-for-sponsors';
            
            switch (updatedSponsorship.status) {
              case 'pending':
                newStudentStatus = 'available-for-sponsors';
                break;
              case 'coordinator-approved':
                newStudentStatus = 'pending-admin-approval';
                break;
              case 'sponsored':
                newStudentStatus = 'sponsored';
                break;
              case 'rejected':
                newStudentStatus = 'available-for-sponsors';
                break;
              case 'completed':
                newStudentStatus = 'completed';
                break;
            }
            
            setStudents(prev => prev.map(student =>
              student.id === sponsorship.studentId
                ? { ...student, sponsorshipStatus: newStudentStatus }
                : student
            ));
            
            console.log(`✅ Student ${sponsorship.studentName} status updated to: ${newStudentStatus}`);
          }
        }
        
        console.log('✅ Sponsorship updated successfully via backend:', updatedSponsorship);
        return updatedSponsorship;
      } else {
        // Backend returned an error
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
      
      // Fallback: Update sponsorship locally
      const updatedSponsorship = sponsorships.find(s => s.id === id);
      if (!updatedSponsorship) {
        throw new Error('Sponsorship not found');
      }
      
      const newSponsorship = { ...updatedSponsorship, ...updates, updatedAt: new Date().toISOString() };
      
      // Update local state
      setSponsorships(prev => prev.map(sponsorship =>
        sponsorship.id === id ? newSponsorship : sponsorship
      ));
      
      // Handle status changes
      if (updates.status) {
        let newStudentStatus = 'available-for-sponsors';
        
        switch (updates.status) {
          case 'pending':
            newStudentStatus = 'available-for-sponsors';
            break;
          case 'sponsored':
            newStudentStatus = 'sponsored';
            break;
          case 'rejected':
            newStudentStatus = 'available-for-sponsors';
            break;
          case 'completed':
            newStudentStatus = 'completed';
            break;
        }
        
        setStudents(prev => prev.map(student =>
          student.id === updatedSponsorship.studentId
            ? { ...student, sponsorshipStatus: newStudentStatus }
            : student
        ));
        
        console.log(`✅ Student ${updatedSponsorship.studentName} status updated to: ${newStudentStatus}`);
      }
      
      // Sponsorship is now persisted in database only
      
      console.log('✅ Sponsorship updated successfully (local):', newSponsorship);
      return newSponsorship;
    } catch (error) {
      console.error('❌ Error updating sponsorship:', error);
      throw error;
    }
  };

  // Function to move student from eligible to available-for-sponsors
  const makeStudentAvailableForSponsors = async (studentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sponsorships/student/${studentId}/make-available`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setStudents(prev => prev.map(student =>
          student.id === studentId
            ? { ...student, sponsorshipStatus: 'available-for-sponsors' }
            : student
        ));
        return true;
      } else {
        throw new Error('Failed to make student available for sponsors');
      }
    } catch (error) {
      console.error('Error making student available:', error);
      throw error;
    }
  };

  // Function to move student back to eligible from available-for-sponsors
  const makeStudentEligible = async (studentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sponsorships/student/${studentId}/make-eligible`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setStudents(prev => prev.map(student =>
          student.id === studentId
            ? { ...student, sponsorshipStatus: 'eligible' }
            : student
        ));
        return true;
      } else {
        throw new Error('Failed to move student to eligible status');
      }
    } catch (error) {
      console.error('Error moving student to eligible:', error);
      throw error;
      }
  };

  const addSponsor = (sponsorData: Omit<Sponsor, 'id'>) => {
    const newSponsor: Sponsor = {
      ...sponsorData,
      id: uuidv4()
    };
    setSponsors(prev => [...prev, newSponsor]);
  };

  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id'>, backendId?: number) => {
    // Use the backend ID if provided, otherwise generate a temporary one
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: backendId ? backendId.toString() : `temp_${Date.now()}` // Use backend ID or temporary ID
    };
    setAttendanceRecords(prev => [...prev, newRecord]);
    
    // Add notification for attendance issues
    if (recordData.status === 'absent') {
      const notification: Omit<Notification, 'id'> = {
        userId: 'admin', // Notify all admins
        type: 'attendance',
        title: 'Student Absent',
        message: `${recordData.studentName} (${recordData.accessNumber}) was marked absent on ${recordData.date.toLocaleDateString()}`,
        date: new Date(),
        read: false,
        link: '/attendance'
      };
      addNotification(notification);
    }
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...updates } : record
    ));
  };

  const addMessage = async (messageData: Omit<Message, 'id'>) => {
    try {
      // Persist to backend so recipients receive it
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: messageData.from,
          to: messageData.to,
          fromRole: messageData.fromRole,
          toRole: messageData.toRole,
          subject: messageData.subject,
          content: messageData.content,
          type: (messageData as any).type || 'GENERAL',
          date: (messageData as any).date || new Date(),
          priority: (messageData as any).priority || 'normal',
          isPinned: (messageData as any).isPinned || false
        })
      });

      if (!response.ok) {
        // Fallback to local state if backend unavailable
        const newMessage: Message = { ...messageData, id: uuidv4() };
        setMessages(prev => [...prev, newMessage]);
        return;
      }

      const saved = await response.json();
      const normalized: Message = {
        id: String(saved.id ?? uuidv4()),
        from: String(saved.senderId ?? messageData.from),
        to: String(saved.receiverId ?? messageData.to ?? ''),
        fromRole: messageData.fromRole,
        toRole: messageData.toRole || '',
        subject: saved.title ?? messageData.subject,
        content: saved.content ?? messageData.content,
        type: (messageData as any).type || 'general',
        date: saved.createdAt ? new Date(saved.createdAt) : (messageData as any).date || new Date(),
        read: false
      } as any;

      setMessages(prev => [normalized, ...prev]);
    } catch (err) {
      console.error('Failed to send message to backend, storing locally:', err);
      const fallback: Message = { ...messageData, id: uuidv4() };
      setMessages(prev => [...prev, fallback]);
    }
  };

  // Fetch messages for the currently logged-in user and raise notifications for new ones
  const fetchMessagesForCurrentUser = async () => {
    try {
      if (! (window as any).appAuthUserId) {
        // Try to read from AuthContext via DOM-less contract: rely on previous API consumers using the same base
      }
    } catch (_e) {}
    try {
      // We need the current user; pull from AuthContext via a lightweight fetch to /users/me is not available,
      // so callers should pass explicit userId (we derive from settings where possible). Instead, expose a helper below.
    } catch (_e) {}
  };

  const fetchMessagesByUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/user/${userId}`);
      if (res.ok) {
        const raw = await res.json();
        const fetched: Message[] = (raw || []).map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }));

        // Detect newly arrived unread messages for this user to create notifications
        const existingIds = new Set(messages.map(m => m.id));
        const newUnread = fetched.filter(m => !existingIds.has(m.id) && String(m.to) === String(user?.id) && !m.read);
        if (newUnread.length > 0) {
          newUnread.forEach(m => {
            addNotification({
              userId: String(user?.id || ''),
              type: 'message',
              title: 'New Message',
              message: `${m.subject || 'New message'} from user ${m.from}`,
              date: new Date(),
              read: false,
              link: '/messages'
            });
          });
        }

        setMessages(fetched);
      }
    } catch (e) {
      console.error('Failed to fetch messages for user:', e);
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4()
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const markMessageRead = async (messageId: string, read: boolean = true) => {
    try {
      await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read })
      });
    } catch (e) {
      console.warn('Failed to update read state in backend, updating locally only');
    } finally {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read } : m));
    }
  };

  const markAllMessagesRead = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/messages/read/all/${userId}`, { method: 'PUT' });
    } catch (e) {
      console.warn('Failed to mark all messages read in backend, updating locally only');
    } finally {
      setMessages(prev => prev.map(m => String(m.to) === String(userId) ? { ...m, read: true } : m));
    }
  };

  // Add this function to update a notification by id
  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const updateSettings = async (newSettings: Partial<Setting>) => {
    try {
      console.log('💾 Saving settings to database:', newSettings);
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      console.log('🔍 Full URL:', `${API_BASE_URL}/settings`);
      
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const updatedSettings = await response.json();
        console.log('📄 Database response:', updatedSettings);
        
        // Verify the data was actually saved by checking the response
        if (updatedSettings && (updatedSettings.currentYear || updatedSettings.securitySettings)) {
          console.log('🔍 Verifying settings were saved to database...');
          
          // Parse securitySettings if it exists and merge with top-level settings
          let parsedSettings = {};
          if (updatedSettings.securitySettings) {
            try {
              parsedSettings = JSON.parse(updatedSettings.securitySettings);
              console.log('📋 Parsed security settings:', parsedSettings);
            } catch (e) {
              console.error('Error parsing securitySettings:', e);
            }
          }
          
          // Merge parsed settings with all returned settings including term dates
          const finalSettings = {
            ...parsedSettings,
            ...updatedSettings
          };
          
          setSettings(prev => ({ ...prev, ...finalSettings }));
          
          // No localStorage fallback cleanup
          
          console.log('✅ Settings permanently saved to database and verified!');
          return updatedSettings; // Return the saved settings for verification
        } else {
          throw new Error('Invalid response from database - settings not properly saved');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Database save failed:', response.status, errorText);
        throw new Error(`Database save failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      
      // No localStorage fallback; bubble error to caller
      throw error;
    }
  };

  const addTimetableEntry = async (entryData: Omit<TimeTable, 'id'>) => {
    try {
      // Try to save to backend first
      const response = await fetch(`${API_BASE_URL}/timetables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        const savedEntry = await response.json();
        console.log('Timetable saved to backend:', savedEntry);
        
        // Add to local state with the backend ID
        const newEntry: TimeTable = {
          ...entryData,
          id: savedEntry.id.toString()
        };
        setTimetables(prev => [...prev, newEntry]);
        
        // Trigger immediate refresh for all connected clients (teachers)
        console.log('🎯 New timetable added - triggering real-time update for teachers');
        
        // Broadcast event for cross-tab communication (no localStorage needed)
        const event = new CustomEvent('timetableUpdated', {
          detail: { action: 'added', entry: newEntry }
        });
        window.dispatchEvent(event);
        
        // Also trigger a global refresh after a short delay
        setTimeout(() => {
          console.log('🔄 Triggering global timetable refresh for real-time sync');
          // This will cause all TeacherScheduling components to refresh
          setTimetables(prev => [...prev]); // Force re-render
        }, 1000);
        
      } else {
        console.error('Failed to save timetable to backend:', response.statusText);
        // Fallback to local state only
        const newEntry: TimeTable = {
          ...entryData,
          id: uuidv4()
        };
        setTimetables(prev => [...prev, newEntry]);
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      // Fallback to local state only
      const newEntry: TimeTable = {
        ...entryData,
        id: uuidv4()
      };
      setTimetables(prev => [...prev, newEntry]);
    }
  };

  const updateTimetableEntry = async (id: string, updates: Partial<TimeTable>) => {
    try {
      console.log('Updating timetable entry:', { id, updates });
      
      // Try to update in backend first
      const response = await fetch(`${API_BASE_URL}/timetables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('Backend response status:', response.status);

      if (response.ok) {
        const updatedEntry = await response.json();
        console.log('Timetable updated in backend:', updatedEntry);
        
        // Update local state
        setTimetables(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ));
        
        return { success: true, data: updatedEntry };
      } else {
        const errorText = await response.text();
        console.error('Failed to update timetable in backend:', response.status, errorText);
        
        // Fallback to local state only
        setTimetables(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ));
        
        return { success: false, error: `Backend update failed: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      
      // Fallback to local state only
      setTimetables(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      ));
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    try {
      // Try to delete from backend first
      const response = await fetch(`${API_BASE_URL}/timetables/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Timetable deleted from backend:', id);
        
        // Remove from local state
        setTimetables(prev => prev.filter(entry => entry.id !== id));
      } else {
        console.error('Failed to delete timetable from backend:', response.statusText);
        // Fallback to local state only
        setTimetables(prev => prev.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);
      // Fallback to local state only
      setTimetables(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const loadTimetables = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/timetables`);
      if (response.ok) {
        const data = await response.json();
        console.log('Timetables loaded from backend:', data);
        setTimetables(data);
      } else {
        console.error('Failed to load timetables from backend:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading timetables:', error);
    }
  }, []);

  const refreshClinicRecords = async () => {
    console.log('🔄 Manual clinic records refresh triggered');
    await fetchClinicRecords();
  };

  const addClinicRecord = async (recordData: Omit<ClinicRecord, 'id'>) => {
    try {
      console.log('🔄 Saving clinic record to database:', recordData);
      console.log('🌐 API URL:', `${API_BASE_URL}/clinic`);
      
      // Skip connectivity test and try POST directly
      console.log('🚀 Attempting direct POST to save clinic record...');
      
      const requestBody = {
        studentId: recordData.studentId?.toString() || '',
        accessNumber: recordData.accessNumber || '',
        studentName: recordData.studentName || '',
        className: recordData.className || '',
        streamName: recordData.streamName || '',
        visitDate: recordData.visitDate || new Date().toISOString(),
        visitTime: recordData.visitTime || '',
        symptoms: recordData.symptoms || '',
        diagnosis: recordData.diagnosis || '',
        treatment: recordData.treatment || '',
        medication: recordData.medication || '',
        cost: recordData.cost || 0,
        nurseId: recordData.nurseId?.toString() || '1',
        nurseName: recordData.nurseName || 'Unknown Nurse',
        followUpRequired: recordData.followUpRequired || false,
        followUpDate: recordData.followUpDate || null,
        parentNotified: recordData.parentNotified || false,
        status: recordData.status || 'resolved',
        notes: recordData.notes || ''
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      // Validate required fields
      if (!requestBody.studentId || !requestBody.studentName || !requestBody.nurseId || !requestBody.nurseName) {
        console.error('❌ Missing required fields:', {
          studentId: requestBody.studentId,
          studentName: requestBody.studentName,
          nurseId: requestBody.nurseId,
          nurseName: requestBody.nurseName
        });
        throw new Error('Missing required fields: studentId, studentName, nurseId, or nurseName');
      }
      
      // Save to database first
      console.log('📤 Sending POST request to:', `${API_BASE_URL}/clinic`);
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/clinic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 POST response status:', response.status);
      console.log('📡 POST response statusText:', response.statusText);
      console.log('📡 POST response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', response.status, response.statusText, errorText);
        throw new Error(`Failed to save clinic record: ${response.status} ${response.statusText}`);
      }

      const savedRecord = await response.json();
      
      // Update local state with the saved record
      const newRecord: ClinicRecord = {
        ...recordData,
        id: savedRecord.id.toString()
      };
      setClinicRecords(prev => [...prev, newRecord]);
      
      console.log('✅ Clinic record saved to database successfully');
    } catch (error) {
      console.error('❌ Error saving clinic record:', error);
      // Still update local state for immediate UI feedback
      const newRecord: ClinicRecord = {
        ...recordData,
        id: uuidv4()
      };
      setClinicRecords(prev => [...prev, newRecord]);
      
      // Don't re-throw error since we successfully saved to localStorage
      console.log('✅ Record saved to localStorage as fallback');
      return; // Successfully saved to localStorage
    }
  };

  // Helper function to find student by access number
  const findStudentByAccessNumber = (accessNumber: string) => {
    return students.find(student => 
      student.accessNumber.toLowerCase() === accessNumber.toLowerCase()
    );
  };

  const updateClinicRecord = (id: string, updates: Partial<ClinicRecord>) => {
    setClinicRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...updates } : record
    ));
  };

  const addClass = (classData: Omit<Class, 'id'>) => {
    const newClass: Class = {
      ...classData,
      id: uuidv4()
    };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: string, updates: Partial<Class>) => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, ...updates } : cls
    ));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
  };

  const addStreamToClass = (classId: string, streamData: Omit<Stream, 'id'>) => {
    const newStream: Stream = {
      ...streamData,
      id: uuidv4()
    };
    setClasses(prev => prev.map(cls => 
      cls.id === classId 
        ? { ...cls, streams: [...cls.streams, newStream] }
        : cls
    ));
  };

  const updateStream = (classId: string, streamId: string, updates: Partial<Stream>) => {
    setClasses(prev => prev.map(cls => 
      cls.id === classId 
        ? {
            ...cls,
            streams: cls.streams.map(stream => 
              stream.id === streamId ? { ...stream, ...updates } : stream
            )
          }
        : cls
    ));
  };

  const deleteStream = (classId: string, streamId: string) => {
    setClasses(prev => prev.map(cls => 
      cls.id === classId 
        ? { ...cls, streams: cls.streams.filter(stream => stream.id !== streamId) }
        : cls
    ));
  };

  // Fetch dropped access numbers from backend
  const fetchDroppedAccessNumbers = useCallback(async () => {
    try {
      console.log('🔄 Fetching dropped access numbers from backend...');
      const response = await fetch(`${API_BASE_URL}/students/dropped-access-numbers`);
      if (response.ok) {
        const droppedNumbers = await response.json();
        const accessNumbers = droppedNumbers.map((item: any) => item.accessNumber);
        setDroppedAccessNumbers(accessNumbers);
        console.log('📋 Fetched dropped access numbers:', accessNumbers);
        
        // Store full dropped records for admission number inheritance
        setDroppedAccessRecords(droppedNumbers);
      } else {
        console.error('❌ Failed to fetch dropped access numbers:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching dropped access numbers:', error);
    }
  }, [API_BASE_URL]);

  // Fetch dropped access numbers on component mount
  React.useEffect(() => {
    fetchDroppedAccessNumbers();
  }, [fetchDroppedAccessNumbers]);

  // Only return dropped access numbers for this class/stream that are NOT in use by active students
  const getAvailableAccessNumbers = (className: string, streamName: string) => {
    const classCode = getClassCode(className);
    const streamCode = streamName?.charAt(0).toUpperCase() || 'X';
    const droppedForClassStream = droppedAccessNumbers.filter(num => num.startsWith(`${classCode}${streamCode}`));
    
    // Filter out any dropped numbers that are still in use by active students
    const trulyAvailable = droppedForClassStream.filter(droppedNum => {
      const isInUse = students.some(student => 
        student.accessNumber === droppedNum && 
        student.status === 'active' &&
        student.class === className &&
        student.stream === streamName
      );
      return !isInUse;
    });
    
    console.log(`🔍 Dropped numbers for ${className} ${streamName}:`, droppedForClassStream);
    console.log(`✅ Truly available (not in use):`, trulyAvailable);
    
    return trulyAvailable;
  };

  const addDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => prev.includes(accessNumber) ? prev : [...prev, accessNumber]);
  };

  const removeDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => prev.filter(num => num !== accessNumber));
  };

  // Get admission number for a dropped access number
  const getAdmissionNumberForDroppedAccess = (accessNumber: string) => {
    const record = droppedAccessRecords.find(record => record.accessNumber === accessNumber);
    return record?.admissionId || null;
  };

  // Clear all students from the system
  const clearAllStudents = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all students from system...');
      
      const response = await fetch(`${API_BASE_URL}/system/clear-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ All students cleared from backend:', result);
      
      // Clear local state
      setStudents([]);
      setDroppedAccessNumbers([]);
      
      return result;
    } catch (error) {
      console.error('❌ Error clearing all students:', error);
      throw error;
    }
  }, [API_BASE_URL]);

  // Delete students by class and stream
  const deleteStudentsByClassStream = useCallback(async (className: string, streamName: string) => {
    try {
      console.log(`🗑️ Deleting students from ${className} ${streamName}...`);
      
      const response = await fetch(`${API_BASE_URL}/students/class/${className}/stream/${streamName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Students deleted from backend:', result);
      
      // Refresh data from backend
      setStudents([]);
      setDroppedAccessNumbers([]);
      
      return result;
    } catch (error) {
      console.error('❌ Error deleting students by class/stream:', error);
      throw error;
    }
  }, [API_BASE_URL]);

  // Clear only dropped access numbers
  const clearDroppedAccessNumbers = () => {
    setDroppedAccessNumbers([]);
    // No localStorage needed - everything is in database
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/enrolled`);
      if (response.ok) {
        const fetchedStudents = await response.json();
        // Transform the data to match the frontend format
        const transformedStudents = fetchedStudents.map((student: any) => ({
          ...student,
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
          conductNotes: student.conductNotes && student.conductNotes !== '' ? 
            (() => {
              try {
                // Check if it's already an object
                if (typeof student.conductNotes === 'object') {
                  return student.conductNotes;
                }
                // Try to parse as JSON
                const parsed = JSON.parse(student.conductNotes);
                return Array.isArray(parsed) ? parsed : [];
              } catch (error) {
                console.warn('⚠️ Failed to parse conductNotes for student:', student.name, error);
                // Return empty array instead of trying to parse invalid JSON
                return [];
              }
            })() : []
        }));
        setStudents(transformedStudents);
        console.log('Enrolled students fetched successfully:', transformedStudents);
      } else {
        console.error('Failed to fetch enrolled students:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  const fetchStudents = async (forceRefresh = false) => {
    // Add caching to prevent excessive API calls
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 seconds cache
    
    // Return cached data if still fresh (unless forced refresh)
    if (!forceRefresh && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && students) {
      console.log('📱 Using cached students data');
      return;
    }
    
    try {
      console.log('🔄 Fetching students from backend...');
      setLastFetchTime(now);
      
      const response = await fetch(`${API_BASE_URL}/students?_t=${now}&_r=${Math.random()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const fetchedStudents = await response.json();
        console.log('📊 Raw students data from backend:', fetchedStudents);
        
        // Transform the data to match the frontend format
        const transformedStudents = fetchedStudents.map((student: any) => ({
          ...student,
          id: student.id.toString(), // Convert ID to string for consistency
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
          conductNotes: student.conductNotes && student.conductNotes !== '' ? 
            (() => {
              try {
                // Check if it's already an object
                if (typeof student.conductNotes === 'object') {
                  return student.conductNotes;
                }
                // Try to parse as JSON
                const parsed = JSON.parse(student.conductNotes);
                return Array.isArray(parsed) ? parsed : [];
              } catch (error) {
                console.warn('⚠️ Failed to parse conductNotes for student:', student.name, error);
                // Return empty array instead of trying to parse invalid JSON
                return [];
              }
            })() : []
        }));
        
        setStudents(transformedStudents);
        console.log('✅ All students fetched successfully:', transformedStudents.length, 'students');
        console.log('📋 Student details:', transformedStudents.map(s => ({ name: s.name, class: s.class, stream: s.stream, status: s.status })));
      } else {
        console.error('❌ Failed to fetch students:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
    }
  };

  const fetchClinicRecords = async () => {
    try {
      console.log('🔄 Fetching clinic records from backend...');
      console.log('🌐 API URL:', `${API_BASE_URL}/clinic`);
      
      const response = await fetch(`${API_BASE_URL}/clinic`);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const fetchedRecords = await response.json();
        console.log('📊 Raw fetched records:', fetchedRecords);
        
        const transformedRecords = fetchedRecords.map((record: any) => ({
          ...record,
          visitDate: new Date(record.visitDate),
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
          // Fix status for records that require follow-up but don't have follow-up status
          status: record.followUpRequired && record.status === 'active' ? 'follow-up' : record.status
        }));
        
        // Load fallback records from localStorage
        const fallbackRecords = JSON.parse(localStorage.getItem('clinicRecords_fallback') || '[]');
        console.log('💾 Fallback records from localStorage:', fallbackRecords.length);
        
        // Fix status for fallback records too
        const correctedFallbackRecords = fallbackRecords.map((record: any) => ({
          ...record,
          status: record.followUpRequired && record.status === 'active' ? 'follow-up' : record.status
        }));
        
        // Combine backend and fallback records
        const allRecords = [...transformedRecords, ...correctedFallbackRecords];
        
        setClinicRecords(allRecords);
        console.log('✅ Clinic records fetched successfully:', allRecords.length, 'total records');
        console.log('📋 Backend records:', transformedRecords.length, 'Fallback records:', fallbackRecords.length);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch clinic records:', response.status, response.statusText, errorText);
        
        // Load only fallback records if backend fails
        const fallbackRecords = JSON.parse(localStorage.getItem('clinicRecords_fallback') || '[]');
        console.log('💾 Loading fallback records only:', fallbackRecords.length);
        
        // Fix status for fallback records
        const correctedFallbackRecords = fallbackRecords.map((record: any) => ({
          ...record,
          status: record.followUpRequired && record.status === 'active' ? 'follow-up' : record.status
        }));
        
        setClinicRecords(correctedFallbackRecords);
      }
    } catch (error) {
      console.error('❌ Error fetching clinic records:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Load fallback records on error
      const fallbackRecords = JSON.parse(localStorage.getItem('clinicRecords_fallback') || '[]');
      console.log('💾 Loading fallback records on error:', fallbackRecords.length);
      setClinicRecords(fallbackRecords);
    }
  };

  const fetchTimetables = async () => {
    try {
      console.log('🔄 Fetching timetables from backend...');
      const response = await fetch(`${API_BASE_URL}/timetables`);
      if (response.ok) {
        const fetchedTimetables = await response.json();
        const transformedTimetables = fetchedTimetables.map((timetable: any) => ({
          ...timetable,
          id: timetable.id.toString(), // Convert to string to match frontend format
          createdAt: new Date(timetable.createdAt),
          updatedAt: new Date(timetable.updatedAt)
        }));
        
        setTimetables(transformedTimetables);
        console.log('✅ Timetables fetched successfully:', transformedTimetables.length, 'entries');
      } else {
        console.error('❌ Failed to fetch timetables:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching timetables:', error);
    }
  };

  const addWeeklyReport = async (reportData: any) => {
    try {
      console.log('🚀 Starting to save weekly report to backend...');
      console.log('📤 Report data being sent:', reportData);
      console.log('🌐 Backend URL:', `${API_BASE_URL}/reports/weekly`);
      
      // Save to backend
      const response = await fetch(`${API_BASE_URL}/reports/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      console.log('📡 Response received:', response.status, response.statusText);
      console.log('📋 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const savedReport = await response.json();
      console.log('✅ Weekly report saved successfully to backend:', savedReport);

      // Refresh weekly reports from backend to ensure data consistency
      await fetchWeeklyReports();
      
      return savedReport;
      
    } catch (error) {
      console.error('❌ Error saving weekly report:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  // Fetch weekly reports from backend
  const fetchWeeklyReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly`);
      if (response.ok) {
        const reports = await response.json();
        // Parse dates and handle arrays safely
        const parsedReports = reports.map((report: any) => ({
          ...report,
          weekStart: new Date(report.weekStart),
          weekEnd: new Date(report.weekEnd),
          submittedAt: new Date(report.submittedAt),
          achievements: report.achievements ? (Array.isArray(report.achievements) ? report.achievements : (() => {
            try { return JSON.parse(report.achievements); } catch { return []; }
          })()) : [],
          challenges: report.challenges ? (Array.isArray(report.challenges) ? report.challenges : (() => {
            try { return JSON.parse(report.challenges); } catch { return []; }
          })()) : [],
          nextWeekGoals: report.nextWeekGoals ? (Array.isArray(report.nextWeekGoals) ? report.nextWeekGoals : (() => {
            try { return JSON.parse(report.nextWeekGoals); } catch { return []; }
          })()) : [],
          attachments: report.attachments ? (Array.isArray(report.attachments) ? report.attachments : (() => {
            try { return JSON.parse(report.attachments); } catch { return []; }
          })()) : []
        }));
        setWeeklyReports(parsedReports);
        console.log('Weekly reports loaded from backend:', parsedReports);
      }
    } catch (error) {
      console.error('Error fetching weekly reports:', error);
    }
  };

  const deleteWeeklyReport = async (reportId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly/${reportId}`, { method: 'DELETE' });
      if (response.ok) {
        setWeeklyReports(prev => prev.filter(report => report.id !== reportId));
        console.log(`Weekly report with ID ${reportId} deleted successfully.`);
      } else {
        console.error(`Failed to delete weekly report with ID ${reportId}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error deleting weekly report with ID ${reportId}:`, error);
    }
  };


  const fetchAttendanceRecords = async (date?: string) => {
    try {
      let url = `${API_BASE_URL}/attendance`;
      if (date) {
        url = `${API_BASE_URL}/attendance/date/${date}`;
      }
      
      console.log('Fetching attendance records from:', url);
      
      const response = await fetch(url);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const records = await response.json();
        console.log('Raw attendance records from backend:', records);
        
        // Convert the backend records to match our frontend format
        const formattedRecords: AttendanceRecord[] = records.map((record: any) => ({
          id: record.id.toString(),
          studentId: record.studentId.toString(),
          date: new Date(record.date),
          time: record.time,
          status: record.status,
          teacherId: record.teacherId.toString(),
          teacherName: record.teacherName,
          remarks: record.remarks,
          notificationSent: record.notificationSent,
          // Preserve timestamps if backend provides them to help deduplication
          createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
        }));
        
        setAttendanceRecords(formattedRecords);
        console.log('Attendance records loaded from backend:', formattedRecords);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch attendance records. Status:', response.status);
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      console.error('This might indicate the backend server is not running or there is a network issue');
    }
  };

  // Load initial data - optimized to prevent excessive re-renders
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
    // One-time cleanup to remove stale compiled sponsorship cache
    try {
      const cleared = localStorage.getItem('sponsorshipsCacheClearedV1');
      if (!cleared) {
        localStorage.removeItem('sponsorships');
        localStorage.setItem('sponsorshipsCacheClearedV1', 'true');
        console.log('🧹 Cleared stale sponsorships cache');
      }
    } catch (e) {
      console.warn('⚠️ Could not clear local sponsorships cache:', e);
    }

        // Load all data in parallel to reduce loading time and prevent flickering
        const [studentsResult, reportsResult, sponsorshipsResult, clinicResult, timetablesResult, billingTypesResult] = await Promise.allSettled([
          fetchStudents(),
          fetchWeeklyReports(),
          fetchClinicRecords(),
          fetchTimetables(),
          fetchBillingTypes(),
          (async () => {
      try {
        console.log('🔄 Loading sponsorships from backend...');
        
        // Load sponsorships from database only
        
        const response = await fetch(`${API_BASE_URL}/sponsorships`);
        if (response.ok) {
          const backendSponsorships = await response.json();
          console.log('✅ Backend sponsorships loaded:', backendSponsorships);
          
                if (isMounted && backendSponsorships) {
            setSponsorships(backendSponsorships);
            console.log('✅ Sponsorships state updated with backend data:', backendSponsorships.length, 'sponsorships');
          } else {
            console.log('ℹ️ No sponsorships found in backend');
          }
        } else {
          console.error('❌ Failed to load sponsorships from backend:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error loading sponsorships from backend:', error);
      }
    })()
  ]);

  // Log results
  console.log('Initial data loading completed:', {
    students: studentsResult.status,
    reports: reportsResult.status,
    sponsorships: sponsorshipsResult.status,
    clinic: clinicResult.status,
    timetables: timetablesResult.status,
    billingTypes: billingTypesResult.status
  });
        
      } catch (error) {
        console.error('❌ Error during initial data loading:', error);
      }
    };

    loadInitialData();
    // Also load financial records initially so analytics reflect payments
    fetchFinancialRecords();

    // Cleanup function to prevent state updates after component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Force refresh all data from backend
  const forceRefresh = async () => {
    try {
      console.log('🔄 Force refreshing all data from backend...');
      
      // Clear current state (no localStorage needed - everything is in database)
      setStudents([]);
      setSponsorships([]);
      setDroppedAccessNumbers([]);
      
      // Fetch fresh data from backend (bypass cache)
      await fetchStudents(true);
      await fetchDroppedAccessNumbers();
      await fetchClinicRecords();
      await fetchTimetables();
      await fetchAttendanceRecords(); // Add attendance records refresh
      await fetchFinancialRecords(); // Ensure payment analytics see latest
      
      // Fetch sponsorships from backend
      try {
        console.log('🔄 Loading sponsorships from backend...');
        const response = await fetch(`${API_BASE_URL}/sponsorships`);
        if (response.ok) {
          const backendSponsorships = await response.json();
          console.log('✅ Backend sponsorships loaded:', backendSponsorships);
          setSponsorships(backendSponsorships);
          console.log('✅ Sponsorships state updated with backend data:', backendSponsorships.length, 'sponsorships');
        } else {
          console.error('❌ Failed to load sponsorships from backend:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error loading sponsorships from backend:', error);
      }
      
      console.log('✅ Force refresh completed - all cached data cleared');
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
    }
  };

  return (
    <DataContext.Provider     value={{
      students,
      financialRecords,
      sponsorships,
      sponsors,
      classes,
      attendanceRecords,
      messages,
      notifications,
      settings,
      timetables,
      clinicRecords,
      droppedAccessNumbers,
      resources,
      weeklyReports,
      billingTypes,
      addResource,
      deleteResource,
      fetchResources,
      getResourcesByClass,
      addStudent,
      updateStudent,
      deleteStudent,
      deleteOverseerStudent,
      clearAllStudents,
      deleteStudentsByClassStream,
      flagStudent,
      addFinancialRecord,
      fetchFinancialRecords,
      addBillingType,
      updateBillingType,
      deleteBillingType,
      fetchBillingTypes,
      addSponsorship,
      updateSponsorship,
      makeStudentAvailableForSponsors,
      makeStudentEligible,
      addSponsor,
      addAttendanceRecord,
      updateAttendanceRecord,
      addMessage,
      addNotification,
      fetchMessagesByUser,
      updateSettings,
      addTimetableEntry,
      updateTimetableEntry,
      deleteTimetableEntry,
      loadTimetables,
      addClinicRecord,
      refreshClinicRecords,
      updateClinicRecord,
      addClass,
      updateClass,
      deleteClass,
      addStreamToClass,
      updateStream,
      deleteStream,
      getAvailableAccessNumbers,
      addDroppedAccessNumber,
      removeDroppedAccessNumber,
      clearDroppedAccessNumbers,
      fetchDroppedAccessNumbers,
      getAdmissionNumberForDroppedAccess,
      updateNotification,
      addWeeklyReport,
      deleteWeeklyReport,
      fetchStudents,
      fetchEnrolledStudents,
      fetchClinicRecords,
      fetchTimetables,
      fetchAttendanceRecords,
      fetchWeeklyReports,
      forceRefresh,
      findStudentByAccessNumber
      ,
      markMessageRead
      ,
      markAllMessagesRead
    }}>
      {children}
    </DataContext.Provider>
  );
};

