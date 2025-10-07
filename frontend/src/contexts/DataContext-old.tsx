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
  id: string;
  name: string;
  amount: number;
  year: number;
  term: string;
  className: string;
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
  getResourcesByClass: (classId: string) => Resource[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { wasDroppedNumberChosen?: boolean }) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  addSponsorship: (sponsorship: Omit<Sponsorship, 'id'>) => void;
  updateSponsorship: (id: string, sponsorship: Partial<Sponsorship>) => void;
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  addMessage: (message: Omit<Message, 'id'>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  updateSettings: (settings: Partial<Setting>) => void;
  addTimetableEntry: (entry: Omit<TimeTable, 'id'>) => void;
  updateTimetableEntry: (id: string, entry: Partial<TimeTable>) => void;
  deleteTimetableEntry: (id: string) => void;
  addClinicRecord: (record: Omit<ClinicRecord, 'id'>) => void;
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
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  flagStudent: (id: string, status: 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted', flagComment?: string) => void;
  clearAllStudents: () => void;
  addWeeklyReport: (report: any) => void;
  deleteWeeklyReport: (reportId: string) => Promise<void>;
  fetchStudents: () => Promise<void>;
  loadTimetables: () => Promise<void>;
  fetchAttendanceRecords: (date?: string) => Promise<void>;
  fetchWeeklyReports: () => Promise<void>;
  findStudentByAccessNumber: (accessNumber: string) => Student | undefined;
  addBillingType: (billingType: Omit<BillingType, 'id'>) => void;
  updateBillingType: (id: string, updates: Partial<BillingType>) => void;
  deleteBillingType: (id: string) => void;
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
      const match = s.accessNumber?.match(/\d{4}$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    // Find the highest used number (last admitted)
    const maxUsed = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
    // Get dropped numbers for this stream
    const droppedNumbers = droppedAccessNumbers
      .filter(num => num.startsWith(`${classCode}${streamCode}`))
      .map(num => parseInt(num.slice(-4), 10));
    // The next number is maxUsed if no students, or maxUsed+1 if not reusing dropped
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber) || droppedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    // If there are no students, reuse the last number (if last was deleted)
    if (usedNumbers.length === 0 && maxUsed > 0) {
      nextNumber = maxUsed;
    }
    return `${classCode}${streamCode}${String(nextNumber).padStart(4, '0')}`;
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

  const [settings] = useState<Setting>({
    schoolName: 'Sukrop Schools Management System',
    schoolAddress: 'Kampala, Uganda',
    schoolPhone: '+256-700-123-456',
    schoolEmail: 'info@ugandaexcellence.edu.ug',
    currentTerm: 'Term 1',
    currentYear: 2024,
    feesStructure: {
      // NO HARDCODED DEFAULTS - All fees must come from database
    },
    paymentMethods: ['Mobile Money', 'Bank Transfer', 'Cash', 'MTN MoMo', 'Airtel Money', 'Visa', 'Mastercard'],
    gradeSystem: DEFAULT_GRADE_SYSTEM,
    overdueSettings: {
      gracePeriod: 30,
      lateFeePercentage: 5,
      notificationDays: '7,15,30'
    }
  });

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
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch students from API on component mount
  React.useEffect(() => {
    fetchStudents();
  }, []);

  // Fallback: if API fails, show a message
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (students.length === 0) {
        console.log('No students loaded from API, checking connection...');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [students]);

  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([
    // Sponsored student payments
    {
      id: 'sp1',
      studentId: 's1a1',
      type: 'payment',
      billingType: 'Sponsored Payment',
      billingAmount: 0,
      amount: 0,
      description: 'Sponsored payment for Grace Nakato - Term 1',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paymentTime: '14:30',
      paymentMethod: 'bank-transfer',
      status: 'paid',
      balance: 0,
      receiptNumber: 'SP001'
    },
    {
      id: 'sp2',
      studentId: 's2b1',
      type: 'payment',
      billingType: 'Sponsored Payment',
      billingAmount: 0,
      amount: 0,
      description: 'Sponsored payment for John Okello - Term 1',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paymentTime: '10:15',
      paymentMethod: 'bank-transfer',
      status: 'paid',
      balance: 0,
      receiptNumber: 'SP002'
    },
    {
      id: 'sp3',
      studentId: 's3c1',
      type: 'payment',
      billingType: 'Sponsored Payment',
      billingAmount: 0,
      amount: 0,
      description: 'Sponsored payment for Aisha Mbabazi - Term 1',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentTime: '09:45',
      paymentMethod: 'bank-transfer',
      status: 'paid',
      balance: 0,
      receiptNumber: 'SP003'
    },
    // Regular student payments
    {
      id: '1',
      studentId: '1',
      type: 'payment',
      billingType: 'School Fees',
      billingAmount: 0,
      amount: 0,
      description: 'Partial school fees payment - Term 1',
      date: new Date(),
      paymentDate: new Date(),
      paymentTime: '14:30',
      paymentMethod: 'mobile-money',
      status: 'paid',
      balance: 0,
      receiptNumber: 'RCP001'
    },
    {
      id: '2',
      studentId: '2',
      type: 'payment',
      billingType: 'School Fees',
      billingAmount: 0,
      amount: 0,
      description: 'Partial school fees payment - Term 1',
      date: new Date(),
      paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentTime: '10:15',
      paymentMethod: 'momo',
      status: 'paid',
      balance: 0,
      receiptNumber: 'RCP002'
    },
    {
      id: '3',
      studentId: '3',
      type: 'payment',
      billingType: 'School Fees',
      billingAmount: 0,
      amount: 0,
      description: 'Full school fees payment - Term 1',
      date: new Date(),
      paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentTime: '09:45',
      paymentMethod: 'bank-transfer',
      status: 'paid',
      balance: 0,
      receiptNumber: 'RCP003'
    },
    {
      id: '4',
      studentId: '4',
      type: 'sponsorship',
      billingType: 'Sponsorship Payment',
      billingAmount: 0,
      amount: 0,
      description: 'Full sponsorship payment - Johnson Foundation',
      date: new Date(),
      paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paymentTime: '11:20',
      paymentMethod: 'bank-transfer',
      status: 'paid',
      balance: 0,
      receiptNumber: 'SPR001'
    },
    {
      id: '5',
      studentId: '1',
      type: 'fee',
      billingType: 'Books and Supplies',
      billingAmount: 0,
      amount: 0,
      description: 'Books and school supplies',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'pending',
      balance: 0
    },
    {
      id: '6',
      studentId: '2',
      type: 'fee',
      billingType: 'Uniform',
      billingAmount: 0,
      amount: 0,
      description: 'School uniform and sports kit',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      paymentTime: '16:30',
      paymentMethod: 'cash',
      status: 'paid',
      balance: 0,
      receiptNumber: 'RCP004'
    },
    {
      id: '7',
      studentId: '3',
      type: 'payment',
      billingType: 'Laboratory Fees',
      billingAmount: 0,
      amount: 0,
      description: 'Science laboratory fees',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentTime: '13:15',
      paymentMethod: 'airtel-money',
      status: 'paid',
      balance: 0,
      receiptNumber: 'LAB001'
    },
    {
      id: '8',
      studentId: '4',
      type: 'payment',
      billingType: 'Monthly Allowance',
      billingAmount: 0,
      amount: 0,
      description: 'Monthly student allowance from sponsor',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentTime: '08:00',
      paymentMethod: 'mobile-money',
      status: 'paid',
      balance: 0,
      receiptNumber: 'ALL001'
    },
    {
      id: '9',
      studentId: '1',
      type: 'fee',
      billingType: 'Examination Fees',
      billingAmount: 0,
      amount: 0,
      description: 'End of term examination fees',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      status: 'overdue',
      balance: 0
    },
    {
      id: '10',
      studentId: '2',
      type: 'fee',
      billingType: 'Transport',
      billingAmount: 0,
      amount: 0,
      description: 'School transport fees - Term 1',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      paymentTime: '12:45',
      paymentMethod: 'visa',
      status: 'partial',
      balance: 0,
      receiptNumber: 'TRP001'
    }
  ]);

  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([
    {
      id: '1',
      studentId: '4',
      sponsorId: 'sponsor-1',
      sponsorName: 'Johnson Foundation',
      sponsorEmail: 'contact@johnsonfoundation.org',
      sponsorPhone: '+256705123456',
      sponsorOrganization: 'Johnson Educational Foundation',
      amount: 0,
      duration: 12,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
      status: 'active',
      blockchainTxHash: '0x1a2b3c4d5e6f7890',
      description: 'Full academic year sponsorship including fees, books, and allowance',
      paymentSchedule: 'quarterly'
    }
  ]);

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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'parent-1',
      to: '2',
      fromRole: 'parent',
      toRole: 'user',
      subject: 'Question about homework',
      content: 'Hello teacher, I wanted to ask about the mathematics homework assigned yesterday. My child is having difficulty with question 5.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      studentId: '1',
      type: 'general'
    }
  ]);

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

  const [timetables, setTimetables] = useState<TimeTable[]>([
    // Monday Schedule
    { id: '1', classId: '1', streamId: 's1a', className: 'Senior 1', streamName: 'A', day: 'Monday', startTime: '08:00', endTime: '09:00', subject: 'Mathematics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Room 101' },
    { id: '2', classId: '1', streamId: 's1a', className: 'Senior 1', streamName: 'A', day: 'Monday', startTime: '09:00', endTime: '10:00', subject: 'English', teacherId: '7', teacherName: 'Super Teacher', duration: 60, room: 'Room 102' },
    { id: '3', classId: '1', streamId: 's1a', className: 'Senior 1', streamName: 'A', day: 'Monday', startTime: '11:00', endTime: '12:00', subject: 'Physics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Lab 1' },
    
    // Tuesday Schedule
    { id: '4', classId: '1', streamId: 's1a', className: 'Senior 1', streamName: 'A', day: 'Tuesday', startTime: '08:00', endTime: '09:00', subject: 'Chemistry', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Lab 2' },
    { id: '5', classId: '1', streamId: 's1a', className: 'Senior 1', streamName: 'A', day: 'Tuesday', startTime: '10:00', endTime: '11:00', subject: 'Biology', teacherId: '7', teacherName: 'Super Teacher', duration: 60, room: 'Lab 3' },
    
    // Senior 2 A Schedule
    { id: '6', classId: '2', streamId: 's2a', className: 'Senior 2', streamName: 'A', day: 'Monday', startTime: '10:00', endTime: '11:00', subject: 'Mathematics', teacherId: '7', teacherName: 'Super Teacher', duration: 60, room: 'Room 201' },
    { id: '7', classId: '2', streamId: 's2a', className: 'Senior 2', streamName: 'A', day: 'Monday', startTime: '14:00', endTime: '15:00', subject: 'Physics', teacherId: '7', teacherName: 'Super Teacher', duration: 60, room: 'Lab 1' },
    
    // Senior 3 A Schedule (Teacher User's main stream)
    { id: '8', classId: '3', streamId: 's3a', className: 'Senior 3', streamName: 'A', day: 'Monday', startTime: '13:00', endTime: '14:00', subject: 'Mathematics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Room 301' },
    { id: '9', classId: '3', streamId: 's3a', className: 'Senior 3', streamName: 'A', day: 'Tuesday', startTime: '09:00', endTime: '10:00', subject: 'Physics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Lab 1' },
    { id: '10', classId: '3', streamId: 's3a', className: 'Senior 3', streamName: 'A', day: 'Wednesday', startTime: '08:00', endTime: '09:00', subject: 'Mathematics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Room 301' },
    { id: '11', classId: '3', streamId: 's3a', className: 'Senior 3', streamName: 'A', day: 'Thursday', startTime: '11:00', endTime: '12:00', subject: 'Physics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Lab 1' },
    { id: '12', classId: '3', streamId: 's3a', className: 'Senior 3', streamName: 'A', day: 'Friday', startTime: '10:00', endTime: '11:00', subject: 'Mathematics', teacherId: '2', teacherName: 'Teacher User', duration: 60, room: 'Room 301' }
  ]);

  const [clinicRecords, setClinicRecords] = useState<ClinicRecord[]>([
    {
      id: '1',
      studentId: '1',
      accessNumber: 'CA001',
      studentName: 'Nakato Grace',
      className: 'Senior 3',
      streamName: 'A',
      visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      visitTime: '10:30',
      symptoms: 'Headache and fever',
      diagnosis: 'Common cold',
      treatment: 'Rest and hydration',
      medication: 'Paracetamol 500mg',
      cost: 15000,
      nurseId: '6',
      nurseName: 'School Nurse',
      followUpRequired: false,
      parentNotified: true,
      status: 'resolved',
      notes: 'Student feeling better after treatment'
    }
  ]);

  const [droppedAccessNumbers, setDroppedAccessNumbers] = useState<string[]>([]);

  // Weekly reports state
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);

  // One-time cleanup to remove duplicate dropped access numbers and clear the dropped table
  React.useEffect(() => {
    setDroppedAccessNumbers([]);
  }, []);

  const API_BASE_URL = 'http://localhost:5000/api';
  const [resources, setResources] = useState<Resource[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([
    // Initial billing types for permanent storage
    { id: '1', name: 'Tuition', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
    { id: '2', name: 'Uniform', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
    { id: '3', name: 'Tuition', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 2' },
    { id: '4', name: 'Lunch', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 2' },
    { id: '5', name: 'Library', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
    { id: '6', name: 'Laboratory', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
    { id: '7', name: 'Sports', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
    { id: '8', name: 'Clinical', amount: 0, year: 2024, term: 'Term 1', className: 'Senior 1' },
  ]);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the frontend Resource interface
        const transformedResources = data.map((resource: any) => ({
          id: resource.id.toString(),
          title: resource.title,
          fileType: resource.fileType,
          fileData: resource.fileData, // This is now a filename
          fileUrl: `${API_BASE_URL}/resources/${resource.id}/download`, // URL to download the file
          classIds: resource.classIds ? JSON.parse(resource.classIds) : [],
          uploadedBy: resource.uploadedBy,
          uploadedAt: resource.uploadedAt
        }));
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
      sponsorshipApplications: [],
      maxSponsors: 3,
      status: 'active', // Default to active
      // Automatically route students needing sponsorship to workflow
      sponsorshipStatus: studentData.needsSponsorship ? 'pending' : 'none',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to backend
    try {
      console.log('🌐 Sending student data to backend...');
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      
      if (response.ok) {
        const savedStudent = await response.json();
        setStudents(prev => [...prev, savedStudent]);
        console.log('✅ Student saved successfully to backend:', savedStudent);
        return savedStudent; // Return the saved student
      } else {
        const errorText = await response.text();
        console.error('❌ Backend failed to save student:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error saving student to backend:', error);
      // Don't add to local state if backend fails - let the form handle the error
      throw error;
    }
  }, []);

  // Update a student; if class/stream changes, drop old number and assign new ones for the new stream
  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
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
    
          setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...preservedUpdates, updatedAt: new Date() } : student
      ));
    }, [students, droppedAccessNumbers]);

  // Delete a student and drop their access number if not last admitted (hard delete)
  const deleteStudent = useCallback((id: string) => {
    setStudents(prev => {
      const student = prev.find(s => s.id === id);
      if (student && student.accessNumber) {
        // Only add to dropped if not last admitted in stream
        const streamStudents = prev.filter(s => s.class === student.class && s.stream === student.stream && s.status === 'active');
        // Find the highest access number in this stream
        const maxAccess = streamStudents.reduce((max, s) => {
          const match = s.accessNumber?.match(/\d{4}$/);
          const num = match ? parseInt(match[0], 10) : 0;
          return num > max ? num : max;
        }, 0);
        const thisNum = parseInt(student.accessNumber.slice(-4), 10);
        if (thisNum !== maxAccess) {
          addDroppedAccessNumber(student.accessNumber);
        } else {
          // Remove from dropped if it was incorrectly added
          removeDroppedAccessNumber(student.accessNumber);
        }
      }
      // Actually remove the student from the array (hard delete)
      return prev.filter(s => s.id !== id);
    });
  }, [students]);

  // Flag a student with a given status and optional comment
  const flagStudent = (id: string, status: 'left' | 'transferred' | 'expelled' | 'graduated' | 're-admitted', flagComment?: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status, flagComment, updatedAt: new Date() } : s));
    // Add access number to droppedAccessNumbers if not re-admitted
    if (status !== 're-admitted') {
      const student = students.find(s => s.id === id);
      if (student && student.accessNumber) {
        addDroppedAccessNumber(student.accessNumber);
      }
    }
  };

  const addFinancialRecord = (recordData: Omit<FinancialRecord, 'id'>) => {
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
  };

  const addSponsorship = (sponsorshipData: Omit<Sponsorship, 'id'>) => {
    const newSponsorship: Sponsorship = {
      ...sponsorshipData,
      id: uuidv4()
    };
    setSponsorships(prev => [...prev, newSponsorship]);
    
    // Add notification for new sponsorship request
    const notification: Omit<Notification, 'id'> = {
      userId: 'admin', // Notify all admins
      type: 'sponsorship',
      title: 'New Sponsorship Request',
      message: `${sponsorshipData.studentName} needs sponsorship support. Amount: UGX ${sponsorshipData.amount.toLocaleString()}`,
      date: new Date(),
      read: false,
      link: '/sponsorships'
    };
    addNotification(notification);
  };

  const updateSponsorship = (id: string, updates: Partial<Sponsorship>) => {
    setSponsorships(prev => prev.map(sponsorship => 
      sponsorship.id === id ? { ...sponsorship, ...updates } : sponsorship
    ));
    // If status is set to 'active', update the corresponding student
    if (updates.status === 'active') {
      const sponsorship = sponsorships.find(s => s.id === id);
      if (sponsorship) {
        setStudents(prev => prev.map(student =>
          student.id === sponsorship.studentId
            ? { ...student, sponsorship: { ...sponsorship, ...updates } }
            : student
        ));
      }
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
      const response = await fetch('http://localhost:5000/api/messages', {
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
          date: (messageData as any).date || new Date()
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

  const addNotification = (notificationData: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4()
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  // Add this function to update a notification by id
  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const updateSettings = (newSettings: Partial<Setting>) => {
    // In a real app, this would update the settings in the database
    console.log('Settings updated:', newSettings);
  };

  const addTimetableEntry = async (entryData: Omit<TimeTable, 'id'>) => {
    try {
      // Try to save to backend first
      const response = await fetch('http://localhost:5000/api/timetables', {
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
        
        // Broadcast to localStorage for cross-tab communication
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
      const response = await fetch(`http://localhost:5000/api/timetables/${id}`, {
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
        
        return updatedEntry; // Return the updated entry
      } else {
        const errorText = await response.text();
        console.error('Failed to update timetable in backend:', response.status, errorText);
        
        // Fallback to local state only
        setTimetables(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ));
        
        throw new Error(`Backend update failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      
      // Fallback to local state only
      setTimetables(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      ));
      
      // Re-throw the error so the calling function can handle it
      throw error;
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    try {
      // Try to delete from backend first
      const response = await fetch(`http://localhost:5000/api/timetables/${id}`, {
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
      const response = await fetch('http://localhost:5000/api/timetables');
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

  const addClinicRecord = (recordData: Omit<ClinicRecord, 'id'>) => {
    const newRecord: ClinicRecord = {
      ...recordData,
      id: uuidv4()
    };
    setClinicRecords(prev => [...prev, newRecord]);
    
    // Note: Notifications are now handled in the component itself
    // This allows for more targeted notifications to specific users
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

  // Only return dropped access numbers for this class/stream
  const getAvailableAccessNumbers = (className: string, streamName: string) => {
    const classCode = getClassCode(className);
    const streamCode = streamName?.charAt(0).toUpperCase() || 'X';
    return droppedAccessNumbers.filter(num => num.startsWith(`${classCode}${streamCode}`));
  };

  const addDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => prev.includes(accessNumber) ? prev : [...prev, accessNumber]);
  };

  const removeDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => prev.filter(num => num !== accessNumber));
  };

  // Clear all students from the system
  const clearAllStudents = () => {
    setStudents([]);
    setDroppedAccessNumbers([]);
  };

  const fetchStudents = async () => {
    try {
      console.log('🔍 Fetching students from API...');
      const response = await fetch(`${API_BASE_URL}/students`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const fetchedStudents = await response.json();
        console.log('✅ Fetched students from API:', fetchedStudents.length);
        
        // Transform the data to match the frontend format
        const transformedStudents = fetchedStudents.map((student: any) => ({
          ...student,
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
          conductNotes: student.conductNotes ? JSON.parse(student.conductNotes) : [],
          // Ensure parent object exists
          parent: {
            name: student.parentName || '',
            nin: student.parentNin || '',
            phone: student.parentPhone || '',
            email: student.parentEmail || '',
            address: student.parentAddress || '',
            occupation: student.parentOccupation || ''
          }
        }));
        setStudents(transformedStudents);
        console.log('✅ Students loaded successfully:', transformedStudents.length);
      } else {
        console.error('❌ Failed to fetch students:', response.statusText);
        // Fallback: show empty state with message
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      // Fallback: show empty state with message
      setStudents([]);
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

      // Add to local state
      setWeeklyReports(prev => [savedReport, ...prev]);
      
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
          achievements: Array.isArray(report.achievements) ? report.achievements : [],
          challenges: Array.isArray(report.challenges) ? report.challenges : [],
          nextWeekGoals: Array.isArray(report.nextWeekGoals) ? report.nextWeekGoals : []
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

  // Billing type management functions
  const addBillingType = (billingType: Omit<BillingType, 'id'>) => {
    const newBillingType: BillingType = {
      id: uuidv4(),
      ...billingType
    };
    setBillingTypes(prev => [...prev, newBillingType]);
  };

  const updateBillingType = (id: string, updates: Partial<BillingType>) => {
    setBillingTypes(prev => prev.map(bt => 
      bt.id === id ? { ...bt, ...updates } : bt
    ));
  };

  const deleteBillingType = (id: string) => {
    setBillingTypes(prev => prev.filter(bt => bt.id !== id));
  };

  const fetchAttendanceRecords = async (date?: string) => {
    try {
      let url = 'http://localhost:5000/api/attendance';
      if (date) {
        url = `http://localhost:5000/api/attendance/date/${date}`;
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
          studentId: record.studentId,
          date: new Date(record.date),
          time: record.time,
          status: record.status,
          teacherId: record.teacherId,
          teacherName: record.teacherName,
          remarks: record.remarks,
          notificationSent: record.notificationSent
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

  // Load initial data
  useEffect(() => {
    // Load timetables from backend
    loadTimetables();
    // Load weekly reports from backend
    fetchWeeklyReports();
  }, [loadTimetables, fetchWeeklyReports]);

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
      getResourcesByClass,
      addStudent,
      updateStudent,
      deleteStudent,
      clearAllStudents,
      flagStudent,
      addFinancialRecord,
      addSponsorship,
      updateSponsorship,
      addSponsor,
      addAttendanceRecord,
      updateAttendanceRecord,
      addMessage,
      addNotification,
      updateSettings,
      addTimetableEntry,
      updateTimetableEntry,
      deleteTimetableEntry,
      loadTimetables,
      addClinicRecord,
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
      updateNotification,
      addWeeklyReport,
      deleteWeeklyReport,
      fetchStudents,
      fetchAttendanceRecords,
      fetchWeeklyReports,
      findStudentByAccessNumber,
      addBillingType,
      updateBillingType,
      deleteBillingType
    }}>
      {children}
    </DataContext.Provider>
  );
};
