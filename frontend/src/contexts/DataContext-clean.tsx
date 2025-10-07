import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Student, User, FinancialRecord, Sponsorship, AttendanceRecord, AcademicRecord, ConductNote, ClinicRecord, Message, WeeklyReport } from '../types';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

interface DataContextType {
  // Students
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  fetchStudents: () => Promise<void>;
  
  // Financial Records
  financialRecords: FinancialRecord[];
  setFinancialRecords: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  updateFinancialRecord: (id: string, updates: Partial<FinancialRecord>) => void;
  deleteFinancialRecord: (id: string) => void;
  
  // Sponsorships
  sponsorships: Sponsorship[];
  setSponsorships: React.Dispatch<React.SetStateAction<Sponsorship[]>>;
  addSponsorship: (sponsorship: Omit<Sponsorship, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSponsorship: (id: string, updates: Partial<Sponsorship>) => void;
  deleteSponsorship: (id: string) => void;
  
  // Attendance Records
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  fetchAttendanceRecords: (date: string) => Promise<void>;
  
  // Academic Records
  academicRecords: AcademicRecord[];
  setAcademicRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
  addAcademicRecord: (record: Omit<AcademicRecord, 'id'>) => void;
  updateAcademicRecord: (id: string, updates: Partial<AcademicRecord>) => void;
  deleteAcademicRecord: (id: string) => void;
  
  // Conduct Notes
  conductNotes: ConductNote[];
  setConductNotes: React.Dispatch<React.SetStateAction<ConductNote[]>>;
  addConductNote: (note: Omit<ConductNote, 'id'>) => void;
  updateConductNote: (id: string, updates: Partial<ConductNote>) => void;
  deleteConductNote: (id: string) => void;
  
  // Clinic Records
  clinicRecords: ClinicRecord[];
  setClinicRecords: React.Dispatch<React.SetStateAction<ClinicRecord[]>>;
  addClinicRecord: (record: Omit<ClinicRecord, 'id'>) => void;
  updateClinicRecord: (id: string, updates: Partial<ClinicRecord>) => void;
  deleteClinicRecord: (id: string) => void;
  
  // Messages
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  
  // Weekly Reports
  weeklyReports: WeeklyReport[];
  setWeeklyReports: React.Dispatch<React.SetStateAction<WeeklyReport[]>>;
  addWeeklyReport: (report: Omit<WeeklyReport, 'id' | 'createdAt'>) => Promise<void>;
  updateWeeklyReport: (id: string, updates: Partial<WeeklyReport>) => void;
  deleteWeeklyReport: (id: string) => void;
  
  // Dropped Access Numbers
  droppedAccessNumbers: string[];
  setDroppedAccessNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  addDroppedAccessNumber: (accessNumber: string) => void;
  removeDroppedAccessNumber: (accessNumber: string) => void;
  clearAllStudents: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  
  // Other states - all empty initially
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [conductNotes, setConductNotes] = useState<ConductNote[]>([]);
  const [clinicRecords, setClinicRecords] = useState<ClinicRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [droppedAccessNumbers, setDroppedAccessNumbers] = useState<string[]>([]);

  // Fetch students from API
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
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setStudents([]);
    }
  };

  // Fetch students on component mount
  React.useEffect(() => {
    fetchStudents();
  }, []);

  // Student operations
  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (response.ok) {
        const newStudent = await response.json();
        setStudents(prev => [...prev, newStudent]);
        console.log('✅ Student added successfully');
      } else {
        console.error('❌ Failed to add student');
      }
    } catch (error) {
      console.error('❌ Error adding student:', error);
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedStudent = await response.json();
        setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
        console.log('✅ Student updated successfully');
      } else {
        console.error('❌ Failed to update student');
      }
    } catch (error) {
      console.error('❌ Error updating student:', error);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== id));
        console.log('✅ Student deleted successfully');
      } else {
        console.error('❌ Failed to delete student');
      }
    } catch (error) {
      console.error('❌ Error deleting student:', error);
    }
  };

  // Financial Records operations
  const addFinancialRecord = (record: Omit<FinancialRecord, 'id'>) => {
    const newRecord: FinancialRecord = {
      ...record,
      id: Date.now().toString()
    };
    setFinancialRecords(prev => [...prev, newRecord]);
  };

  const updateFinancialRecord = (id: string, updates: Partial<FinancialRecord>) => {
    setFinancialRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteFinancialRecord = (id: string) => {
    setFinancialRecords(prev => prev.filter(r => r.id !== id));
  };

  // Sponsorship operations
  const addSponsorship = (sponsorship: Omit<Sponsorship, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSponsorship: Sponsorship = {
      ...sponsorship,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSponsorships(prev => [...prev, newSponsorship]);
  };

  const updateSponsorship = (id: string, updates: Partial<Sponsorship>) => {
    setSponsorships(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
  };

  const deleteSponsorship = (id: string) => {
    setSponsorships(prev => prev.filter(s => s.id !== id));
  };

  // Attendance Records operations
  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString()
    };
    setAttendanceRecords(prev => [...prev, newRecord]);
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
  };

  const fetchAttendanceRecords = async (date: string) => {
    // This would fetch from API in a real implementation
    console.log('Fetching attendance records for:', date);
  };

  // Academic Records operations
  const addAcademicRecord = (record: Omit<AcademicRecord, 'id'>) => {
    const newRecord: AcademicRecord = {
      ...record,
      id: Date.now().toString()
    };
    setAcademicRecords(prev => [...prev, newRecord]);
  };

  const updateAcademicRecord = (id: string, updates: Partial<AcademicRecord>) => {
    setAcademicRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteAcademicRecord = (id: string) => {
    setAcademicRecords(prev => prev.filter(r => r.id !== id));
  };

  // Conduct Notes operations
  const addConductNote = (note: Omit<ConductNote, 'id'>) => {
    const newNote: ConductNote = {
      ...note,
      id: Date.now().toString()
    };
    setConductNotes(prev => [...prev, newNote]);
  };

  const updateConductNote = (id: string, updates: Partial<ConductNote>) => {
    setConductNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteConductNote = (id: string) => {
    setConductNotes(prev => prev.filter(n => n.id !== id));
  };

  // Clinic Records operations
  const addClinicRecord = (record: Omit<ClinicRecord, 'id'>) => {
    const newRecord: ClinicRecord = {
      ...record,
      id: Date.now().toString()
    };
    setClinicRecords(prev => [...prev, newRecord]);
  };

  const updateClinicRecord = (id: string, updates: Partial<ClinicRecord>) => {
    setClinicRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteClinicRecord = (id: string) => {
    setClinicRecords(prev => prev.filter(r => r.id !== id));
  };

  // Messages operations
  const addMessage = (message: Omit<Message, 'id' | 'createdAt'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // Weekly Reports operations
  const addWeeklyReport = async (report: Omit<WeeklyReport, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        const newReport = await response.json();
        setWeeklyReports(prev => [...prev, newReport]);
        console.log('✅ Weekly report added successfully');
      } else {
        console.error('❌ Failed to add weekly report');
      }
    } catch (error) {
      console.error('❌ Error adding weekly report:', error);
    }
  };

  const updateWeeklyReport = (id: string, updates: Partial<WeeklyReport>) => {
    setWeeklyReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteWeeklyReport = (id: string) => {
    setWeeklyReports(prev => prev.filter(r => r.id !== id));
  };

  // Dropped Access Numbers operations
  const addDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => [...prev, accessNumber]);
  };

  const removeDroppedAccessNumber = (accessNumber: string) => {
    setDroppedAccessNumbers(prev => prev.filter(num => num !== accessNumber));
  };

  const clearAllStudents = () => {
    setStudents([]);
    setDroppedAccessNumbers([]);
  };

  const value: DataContextType = {
    // Students
    students,
    setStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudents,
    
    // Financial Records
    financialRecords,
    setFinancialRecords,
    addFinancialRecord,
    updateFinancialRecord,
    deleteFinancialRecord,
    
    // Sponsorships
    sponsorships,
    setSponsorships,
    addSponsorship,
    updateSponsorship,
    deleteSponsorship,
    
    // Attendance Records
    attendanceRecords,
    setAttendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    fetchAttendanceRecords,
    
    // Academic Records
    academicRecords,
    setAcademicRecords,
    addAcademicRecord,
    updateAcademicRecord,
    deleteAcademicRecord,
    
    // Conduct Notes
    conductNotes,
    setConductNotes,
    addConductNote,
    updateConductNote,
    deleteConductNote,
    
    // Clinic Records
    clinicRecords,
    setClinicRecords,
    addClinicRecord,
    updateClinicRecord,
    deleteClinicRecord,
    
    // Messages
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    
    // Weekly Reports
    weeklyReports,
    setWeeklyReports,
    addWeeklyReport,
    updateWeeklyReport,
    deleteWeeklyReport,
    
    // Dropped Access Numbers
    droppedAccessNumbers,
    setDroppedAccessNumbers,
    addDroppedAccessNumber,
    removeDroppedAccessNumber,
    clearAllStudents
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;








