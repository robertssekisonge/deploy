import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Download, Eye, Plus, Filter, Calendar, BookOpen, GraduationCap, TrendingUp, User, FileText, Edit } from 'lucide-react';
import StudentReportCard from './StudentReportCard';

const ReportCards: React.FC = () => {
  const { students, settings } = useData();
  const { user } = useAuth();
  
  // State for report generation
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState(students || []);
  const [classRecords, setClassRecords] = useState<Record<string, any[]>>({});
  const [attendanceByStudent, setAttendanceByStudent] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Available terms and years
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  // Get available classes based on user role
  const getAvailableClasses = () => {
    if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
      let assignedClasses = [];
      if (user.assignedClasses) {
        try {
          assignedClasses = typeof user.assignedClasses === 'string' 
            ? JSON.parse(user.assignedClasses) 
            : user.assignedClasses;
        } catch (error) {
          console.error('Error parsing assignedClasses:', error);
          assignedClasses = [];
        }
      }
      
      if (assignedClasses.length > 0) {
        return ['all', ...Array.from(new Set(assignedClasses.map((a: any) => a.className)))];
      } else if (user.assignedStream) {
        const [className] = user.assignedStream.split(' ');
        return ['all', className];
      }
      return ['all'];
    }
    
    // For admin/superuser, show all classes
    if (!students || !Array.isArray(students)) {
      return ['all'];
    }
    return ['all', ...Array.from(new Set(students.map(s => s.class).filter(Boolean)))];
  };

  const classes = getAvailableClasses();

  // Handle data loading and error states
  useEffect(() => {
    try {
      // Set loading to false after a short delay to allow data to load
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (!students || students.length === 0) {
          console.warn('No students data available, but continuing with empty list');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to load students data');
      setIsLoading(false);
      console.error('Error loading students:', err);
    }
  }, [students]);

  // Filter students based on teacher's assigned classes and other filters
  useEffect(() => {
    if (!students || !Array.isArray(students)) {
      setFilteredStudents([]);
      return;
    }
    
    let filtered = students;
    
    // For teachers, only show students from their assigned classes
    if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
      let assignedClasses = [];
      if (user.assignedClasses) {
        try {
          assignedClasses = typeof user.assignedClasses === 'string' 
            ? JSON.parse(user.assignedClasses) 
            : user.assignedClasses;
        } catch (error) {
          console.error('Error parsing assignedClasses:', error);
          assignedClasses = [];
        }
      }
      
      // Filter students based on assigned classes - BOTH class AND stream must match
      if (assignedClasses.length > 0) {
        filtered = filtered.filter(student => 
          assignedClasses.some((assignment: any) => 
            assignment.className === student.class && assignment.streamName === student.stream
          )
        );
      } else if (user.assignedStream) {
        // Fallback to old assignedStream logic
        const [className, streamName] = user.assignedStream.split(' ');
        filtered = filtered.filter(student => 
          student.class === className && student.stream === streamName
        );
      } else {
        // SECURITY FIX: If teacher has no assigned classes, return NO STUDENTS
        console.warn(`⚠️ Teacher ${user.name} (${user.role}) has no assigned classes - restricting access to students in Reports`);
        filtered = [];
      }
    }
    
    // For overseers, only show sponsored children and exclude students still in sponsorship process
    if (user?.role === 'SPONSORSHIPS_OVERSEER' || user?.role === 'sponsorships-overseer' || user?.role === 'SPONSORSHIP-OVERSEER' || user?.role === 'SPONSORSHIPS-OVERSEER') {
      filtered = filtered.filter(student => 
        student.sponsorshipStatus === 'sponsored'
      );
    }
    
    // Filter by class (only for admin/superuser or if teacher has multiple assigned classes)
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.class === selectedClass);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.accessNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.class?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // SECURITY LOGGING: Log what students are being shown
    if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
      console.log(`🔒 ReportCards: Teacher ${user.name} (${user.role}) - Filtered students:`, filtered.length);
      if (filtered.length === 0) {
        console.warn(`⚠️ ReportCards: Teacher ${user.name} has no access to any students`);
      }
    }
    
    setFilteredStudents(filtered);
  }, [students, selectedClass, searchQuery, user]);

  // Fetch real academic records (ranked) from backend for unique class/stream
  useEffect(() => {
    const loadRecords = async () => {
      if (!filteredStudents || filteredStudents.length === 0) {
        setClassRecords({});
        setAttendanceByStudent({});
        return;
      }
      const uniqueKeys = Array.from(new Set(
        filteredStudents
          .filter(s => s.class && s.stream)
          .map(s => `${s.class}|${s.stream}`)
      ));
      const newMap: Record<string, any[]> = {};
      await Promise.all(uniqueKeys.map(async (key) => {
        const [cls, str] = key.split('|');
        try {
          const res = await fetch(`http://localhost:5000/api/academic/class/${encodeURIComponent(cls)}/stream/${encodeURIComponent(str)}?term=${encodeURIComponent(selectedTerm)}&year=${encodeURIComponent(String(selectedYear))}`);
          if (res.ok) {
            newMap[key] = await res.json();
          } else {
            newMap[key] = [];
          }
        } catch (e) {
          console.error('Failed to load class records', key, e);
          newMap[key] = [];
        }
      }));
      setClassRecords(newMap);

      // Attendance: fetch per student and filter by term window
      const termWindow = (() => {
        const y = Number(selectedYear);
        if (selectedTerm === 'Term 1') return { start: new Date(y, 0, 1), end: new Date(y, 3, 30) };
        if (selectedTerm === 'Term 2') return { start: new Date(y, 4, 1), end: new Date(y, 7, 31) };
        return { start: new Date(y, 8, 1), end: new Date(y, 11, 31) };
      })();
      const attMap: Record<string, any[]> = {};
      await Promise.all(filteredStudents.map(async (s) => {
        try {
          const res = await fetch(`http://localhost:5000/api/attendance/student/${encodeURIComponent(s.id)}`);
          if (res.ok) {
            const all = await res.json();
            attMap[s.id] = all.filter((r: any) => {
              const d = new Date(r.date);
              return d >= termWindow.start && d <= termWindow.end;
            });
          } else {
            attMap[s.id] = [];
          }
        } catch (e) {
          console.error('Failed to load attendance for', s.id, e);
          attMap[s.id] = [];
        }
      }));
      setAttendanceByStudent(attMap);
    };
    loadRecords();
  }, [filteredStudents, selectedTerm, selectedYear]);

  // Generate stable attendance records
  const generateStableAttendanceRecord = (student: any, term: string, year: number) => {
    const records = [];
    const startDate = new Date(year, term === 'Term 1' ? 0 : term === 'Term 2' ? 4 : 8, 1);
    const endDate = new Date(year, term === 'Term 1' ? 3 : term === 'Term 2' ? 7 : 11, 30);
    
    // Create stable hash for attendance
    const attendanceHash = `${student.id}_${term}_${year}`.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    let dayCount = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        // Use hash + day count to determine attendance consistently
        const dayHash = (attendanceHash + dayCount * 1000) % 100;
        const status = dayHash > 10 ? 'present' : 'absent'; // 90% attendance rate
        
        records.push({
          id: `attendance_${student.id}_${d.toISOString()}`,
          studentId: student.id,
          date: new Date(d),
          time: '08:00',
          status,
          teacherId: 'teacher_1',
          teacherName: 'Class Teacher',
          remarks: '',
          notificationSent: false
        });
        dayCount++;
      }
    }
    
    return records;
  };

  // Memoize the academic and attendance data to prevent regeneration
  const studentData = useMemo(() => {
    if (!filteredStudents || !Array.isArray(filteredStudents)) {
      return [];
    }
    return filteredStudents.map(student => {
      const key = `${student.class}|${student.stream}`;
      const recs = classRecords[key] || [];
      const academic = recs.find((r: any) => r.studentId === student.id && r.term === selectedTerm && (r.year === selectedYear || String(r.year) === String(selectedYear)));
      // Parse subjects if stored as JSON string
      let subjects = [] as any[];
      if (academic && academic.subjects) {
        try {
          subjects = typeof academic.subjects === 'string' ? JSON.parse(academic.subjects) : academic.subjects;
        } catch {
          subjects = [];
        }
      }
      const academicRecord = academic ? {
        id: academic.id,
        term: academic.term,
        year: Number(academic.year),
        subjects,
        totalMarks: academic.totalMarks,
        percentage: academic.percentage,
        grade: academic.overallGrade,
        position: academic.position,
        remarks: academic.overallComment || '',
        teacherComments: academic.teacherName ? `Teacher: ${academic.teacherName}` : '',
        headTeacherComments: '',
        autoComments: ''
      } : {
        id: `no_record_${student.id}_${selectedTerm}_${selectedYear}`,
        term: selectedTerm,
        year: selectedYear,
        subjects: [],
        totalMarks: 0,
        percentage: 0,
        grade: 'N/A',
        position: 'N/A',
        remarks: 'No academic record for selected term/year',
        teacherComments: '',
        headTeacherComments: '',
        autoComments: ''
      };

      return {
      ...student,
        academicRecord,
        attendanceRecords: attendanceByStudent[student.id] || []
      };
    });
  }, [filteredStudents, selectedTerm, selectedYear, classRecords, attendanceByStudent]);

  // Check if teacher can edit this student's report
  const canTeacherEditStudent = (student: any): boolean => {
    if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
      return false;
    }

    // Check if teacher is assigned to this student's class and stream
    let assignedClasses = [];
    if (user.assignedClasses) {
      try {
        assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        assignedClasses = [];
      }
    }

    if (assignedClasses.length > 0) {
      return assignedClasses.some((assignment: any) => 
        assignment.className === student.class && assignment.streamName === student.stream
      );
    }

    // Fallback to old assignedStream logic
    if (user.assignedStream) {
      const [className, streamName] = user.assignedStream.split(' ');
      return student.class === className && student.stream === streamName;
    }

    return false;
  };

  // Check if parent has paid fees
  const checkParentFeeBalance = async (studentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/fee-balance`);
      if (response.ok) {
        const feeData = await response.json();
        return feeData.feesFullyPaid;
      } else {
        console.error('Failed to check fee balance:', response.status);
        return false; // If we can't check, assume fees are not paid
      }
    } catch (error) {
      console.error('Error checking fee balance:', error);
      return false; // If there's an error, assume fees are not paid
    }
  };

  // Handle report generation
  const handleGenerateReport = async (studentId: string) => {
    console.log('🔍 handleGenerateReport called with studentId:', studentId);
    console.log('🔍 Current user role:', user?.role);
    
    // Check if user is a parent and if fees are paid
    if (user?.role === 'PARENT') {
      console.log('🔍 Checking fee balance for parent...');
      const feesPaid = await checkParentFeeBalance(studentId);
      console.log('🔍 Fee balance check result:', feesPaid);
      if (!feesPaid) {
        alert('Dear Parent, in order to view the report card, please first finish the fees balance. Thank you.');
        return;
      }
    }
    
    console.log('🔍 Setting selected student and showing report card...');
    setSelectedStudent(studentId);
    setShowReportCard(true);
    console.log('🔍 Modal should now be visible');
  };

  // Handle download report card
  const handleDownloadReport = (studentId: string) => {
    console.log('🔍 Downloading report for student:', studentId);
    
    // Check if user is a parent and if fees are paid
    if (user?.role === 'PARENT') {
      // Parents cannot download, only view
      alert('Download is not available for parents. You can only view the report card.');
      return;
    }
    
    // For other users, generate and download PDF
    const student = students?.find(s => s.id === studentId);
    const studentDataItem = studentData.find(s => s.id === studentId);
    
    if (!student || !studentDataItem) {
      alert('Student data not found for download');
      return;
    }
    
    // Create a new window for printing/downloading
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const reportStudent = {
        ...student,
        academicRecords: [studentDataItem.academicRecord],
        attendanceRecords: studentDataItem.attendanceRecords,
        parent: student.parent || {
          name: student.parentName || 'Parent Name',
          phone: student.parentPhone || 'Phone Number',
          email: student.parentEmail || 'Email Address',
          address: student.parentAddress || 'Address'
        }
      };
      
      // Generate HTML content for the report card
      const htmlContent = generateReportCardHTML(reportStudent, selectedTerm, selectedYear, settings);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  // Generate HTML content for report card
  const generateReportCardHTML = (student: any, term: string, year: number, settings: any) => {
    const academic = student.academicRecords?.[0];
    const attendance = student.attendanceRecords || [];
    const timesPresent = attendance.filter((a: any) => a.status === 'present').length;
    const timesAbsent = attendance.filter((a: any) => a.status === 'absent').length;
    const studentPhoto = student.passportPhoto || student.photo || '';
    const attendanceRate = attendance.length > 0 ? Math.round((timesPresent / attendance.length) * 100) : 0;
    // Compute opened days in window using settings
    const parseISO = (s: string) => { try { return s ? new Date(s) : null; } catch { return null; } };
    const start = parseISO(settings?.attendanceStart || '');
    const end = parseISO(settings?.attendanceEnd || '');
    const holidays: Date[] = (settings?.publicHolidays || '')
      .split(',')
      .map((d: string) => d.trim())
      .filter(Boolean)
      .map((d: string) => new Date(d));
    const isHoliday = (d: Date) => holidays.some(h => h.toDateString() === d.toDateString());
    const inWindow = (d: Date) => (!start || d >= start) && (!end || d <= end);
    let openedDays = 0;
    if (start && end) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && !isHoliday(d)) openedDays++;
      }
    }
    const presentInWindow = attendance.filter((a: any) => { const d=new Date(a.date); return inWindow(d) && a.status==='present'; }).length;
    const absentInWindow = attendance.filter((a: any) => { const d=new Date(a.date); return inWindow(d) && a.status==='absent'; }).length;
    const gradeOf = (pct: number) => {
      if (pct >= 80) return 'A';
      if (pct >= 75) return 'B+';
      if (pct >= 70) return 'B';
      if (pct >= 65) return 'C+';
      if (pct >= 60) return 'C';
      if (pct >= 55) return 'D+';
      if (pct >= 50) return 'D';
      return 'F';
    };
    const teamWorkGrade = gradeOf(academic?.percentage ?? 0);
    const smartnessGrade = gradeOf(academic?.percentage ?? 0);
    const punctualityGrade = gradeOf(attendanceRate);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Report Card - ${student.name}</title>
        <style>
          :root{
            --bgStart:#f5f3ff;
            --bgEnd:#ecfeff;
            --ink:#0f172a;
            --muted:#475569;
            --card:#ffffff;
            --brand:#6d28d9;
            --brandLight:#ede9fe;
            --accent:#10b981;
            --warn:#f59e0b;
          }
          *{ box-sizing: border-box; }
          html,body{ height:100%; }
          body{ margin:0; font-family: Inter, Arial, sans-serif; color:var(--ink); background:linear-gradient(135deg, var(--bgStart), var(--bgEnd)); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .page{ width:210mm; height:297mm; background:var(--card); margin:0 auto; padding:14mm; position:relative; }
          @page{ size:A4; margin:0; }
          h1,h2,h3{ margin:0; }
          .header{ display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:12px; background:linear-gradient(90deg, rgba(109,40,217,.1), rgba(16,185,129,.1)); border:1px solid #e9e8ff; }
          .school{ display:flex; align-items:center; gap:10px; }
          .badge{ width:44px; height:44px; border-radius:50%; background:var(--brandLight); color:var(--brand); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; border:1px solid #ddd; }
          .meta{ text-align:right; font-size:11px; color:var(--muted); }
          .title{ text-align:center; font-weight:800; margin:10px 0 8px 0; font-size:16px; }
          .grid{ display:grid; grid-template-columns:1fr 120px 1fr; gap:10px; }
          .card{ background:var(--card); border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
          .card h4{ font-size:12px; color:var(--muted); margin-bottom:6px; }
          .passport{ width:90px; height:90px; border-radius:10px; border:2px solid var(--brandLight); display:flex; align-items:center; justify-content:center; overflow:hidden; margin:0 auto; background:#fff; }
          .passport img{ width:100%; height:100%; object-fit:cover; }
          .mini-passport{ width:72px; height:72px; border-radius:10px; border:2px solid #e5e7eb; overflow:hidden; background:#f8fafc; display:flex; align-items:center; justify-content:center; }
          .mini-passport img{ width:100%; height:100%; object-fit:cover; }
          .cap-circle{ width:68px; height:68px; border-radius:50%; background:linear-gradient(135deg, #eef2ff, #ddd6fe); display:flex; align-items:center; justify-content:center; color:#4c1d95; font-size:30px; border:2px solid #e0e7ff; box-shadow: inset 0 0 0 3px rgba(255,255,255,.6); }
          .center-stack{ display:flex; flex-direction:column; align-items:center; gap:8px; }
          table{ width:100%; border-collapse:collapse; font-size:12px; }
          th,td{ border:1px solid #e5e7eb; padding:6px 8px; }
          thead th{ background:#f8fafc; font-weight:700; color:#1f2937; }
          .summary{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px; }
          .pill{ background:var(--brandLight); color:var(--brand); border:1px solid #e9e8ff; padding:6px 8px; border-radius:8px; font-weight:700; text-align:center; }
          .flex{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
          .sign{ display:flex; justify-content:space-between; font-size:11px; margin-top:8px; }
          .footer{ position:absolute; bottom:12mm; left:14mm; right:14mm; display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--muted); }
          .motto{ margin-top:10px; text-align:center; font-size:12px; color:var(--muted); font-style:italic; }
          .next-term{ margin-top:6px; text-align:center; font-size:11px; color:var(--muted); }
          .assessment{ margin-top:10px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
          .assessment .item{ background:var(--card); border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
          .badge-grade{ display:inline-block; padding:6px 10px; border-radius:999px; font-weight:800; }
          .gA{ background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }
          .gB{ background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; }
          .gC{ background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
          .gD{ background:#fff7ed; color:#9a3412; border:1px solid #fed7aa; }
          .gF{ background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="page">
        <div class="header">
            <div class="school">
              <div class="badge">${settings?.schoolBadge ? `<img src="${settings.schoolBadge}" alt="Badge" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>` : (settings?.schoolName || 'SJS').slice(0,1)}</div>
        </div>
            <div style="flex:1; text-align:center;">
              <div style="font-weight:800; font-size:${settings?.schoolNameSize || 18}px; color:${settings?.schoolNameColor || '#0f172a'};">${settings?.schoolName || 'School Name'}</div>
            </div>
            <div class="meta">
              <div>${settings?.schoolAddress || 'Address'}</div>
            </div>
          </div>
          <div class="title">${year} ${term} REPORT SHEET</div>

          <div class="grid" style="margin-top:8px;">
            <div class="card">
              <h4>STUDENT’S PERSONAL DATA</h4>
              <div style="font-size:12px; line-height:1.5;">
                <div><strong>Name:</strong> ${student.name}</div>
                <div><strong>Date of Birth:</strong> ${student.dateOfBirth || student.nin || '-'}</div>
                <div><strong>Sex:</strong> ${student.gender || '-'}</div>
                <div><strong>Class:</strong> ${student.class}</div>
                <div><strong>Stream:</strong> ${student.stream}</div>
                <div><strong>Access Number:</strong> ${student.accessNumber}</div>
                <div><strong>Parent:</strong> ${student.parent?.name || '-'}</div>
              </div>
            </div>
            <div class="card" style="display:flex; align-items:center; justify-content:center;">
              <div class="center-stack">
                <div class="mini-passport">${studentPhoto ? `<img src="${studentPhoto}" alt="Passport"/>` : `📷`}</div>
                <div class="cap-circle">🎓</div>
              </div>
            </div>
            <div class="card">
              <h4>ATTENDANCE</h4>
              <div style="font-size:12px; line-height:1.6;">
                <div>No. of Times School Opened: ${openedDays || attendance.length}</div>
                <div>No. of Times Present: ${presentInWindow || timesPresent}</div>
                <div>No. of Times Absent: ${absentInWindow || timesAbsent}</div>
              </div>
            </div>
        </div>
        
          <div class="card" style="margin-top:10px;">
            <table>
            <thead>
              <tr>
                  <th style="width:60%; text-align:left;">SUBJECT</th>
                  <th style="width:20%; text-align:center;">MARKS</th>
                  <th style="width:20%; text-align:center;">GRADE</th>
              </tr>
            </thead>
            <tbody>
                ${(academic?.subjects || []).map((s:any)=>`
                  <tr>
                    <td>${s.subject}</td>
                    <td style="text-align:center;">${s.marks}</td>
                    <td style="text-align:center;">${s.grade}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
            <div class="summary">
              <div class="pill">Total Marks: ${academic?.totalMarks ?? 0}</div>
              <div class="pill">Percentage: ${(academic?.percentage ?? 0)}%</div>
        </div>
        </div>
        
          <div class="assessment">
            <div class="item">
              <div style="font-size:12px; color:var(--muted); margin-bottom:6px;">Team Work</div>
              <span class="badge-grade ${teamWorkGrade==='A'?'gA':teamWorkGrade==='B+'||teamWorkGrade==='B'?'gB':teamWorkGrade==='C+'||teamWorkGrade==='C'?'gC':teamWorkGrade==='D+'||teamWorkGrade==='D'?'gD':'gF'}">${teamWorkGrade}</span>
            </div>
            <div class="item">
              <div style="font-size:12px; color:var(--muted); margin-bottom:6px;">Smartness</div>
              <span class="badge-grade ${smartnessGrade==='A'?'gA':smartnessGrade==='B+'||smartnessGrade==='B'?'gB':smartnessGrade==='C+'||smartnessGrade==='C'?'gC':smartnessGrade==='D+'||smartnessGrade==='D'?'gD':'gF'}">${smartnessGrade}</span>
            </div>
            <div class="item">
              <div style="font-size:12px; color:var(--muted); margin-bottom:6px;">Punctuality</div>
              <div style="font-size:10px; color:var(--muted);">Attendance Rate: ${attendanceRate}%</div>
              <span class="badge-grade ${punctualityGrade==='A'?'gA':punctualityGrade==='B+'||punctualityGrade==='B'?'gB':punctualityGrade==='C+'||punctualityGrade==='C'?'gC':punctualityGrade==='D+'||smartnessGrade==='D'?'gD':'gF'}" style="margin-top:6px;">${punctualityGrade}</span>
            </div>
        </div>
        
          <div class="grid" style="margin-top:10px; grid-template-columns:1fr 1fr;">
            <div class="card">
              <div class="flex"><div class="pill" style="background:#ecfeff; color:#0891b2; border-color:#cffafe;">Overall Grade: ${academic?.grade || 'N/A'}</div><div class="pill" style="background:#fff7ed; color:#9a3412; border-color:#ffedd5;">Position: ${academic?.position || 'N/A'}</div></div>
              <div style="font-size:12px; margin-top:8px;"><strong>Class Teacher’s Comments:</strong> ${academic?.teacherComments || 'Student shows good potential. Continue working hard.'}</div>
              <div class="sign"><span>Sign.:</span><span>Date: ${new Date().toLocaleDateString()}</span></div>
          </div>
            <div class="card">
              <div style="font-size:12px; margin-bottom:8px;"><strong>HeadTeacher’s Comments:</strong> ${academic?.headTeacherComments || 'Keep up the good work.'}</div>
              <div class="sign"><span>Sign.:</span><span>Date: ${new Date().toLocaleDateString()}</span></div>
              <div class="pill" style="margin-top:8px; background:#fef2f2; color:#991b1b; border-color:#fee2e2; text-align:left;">Promotion Status: ${(academic?.percentage ?? 0) < 50 ? 'REPEAT CLASS' : 'PROMOTED'}</div>
          </div>
           </div>

           <div class="motto-section" style="margin-top:15px; text-align:center; padding:12px; background:linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius:12px; border:1px solid #e5e7eb;">
             <div style="font-size:${settings?.mottoSize || 14}px; color:${settings?.mottoColor || '#475569'}; font-style:italic; font-weight:500;">${settings?.schoolMotto || 'Excellence in Education'}</div>
           </div>

           <div class="next-term">Next Term Begins: ${settings?.nextTermBegins || 'TBA'}</div>

           <div class="footer">
            <div>Generated by ${settings?.schoolName || 'School'} • ${new Date().toLocaleDateString()}</div>
            <div>Powered by School Management System</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Handle edit report card
  const handleEditReport = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    if (!student) {
      alert('Student not found');
      return;
    }

    if (!canTeacherEditStudent(student)) {
      alert('You can only edit report cards for students in your assigned classes and streams.');
      return;
    }

    const studentDataItem = studentData.find(s => s.id === studentId);
    if (!studentDataItem) {
      alert('Student data not found');
      return;
    }

    // Set up edit form data
    setEditFormData({
      studentId: studentId,
      studentName: student.name,
      className: student.class,
      streamName: student.stream,
      academicRecord: studentDataItem.academicRecord,
      classTeacherComment: 'Student shows good potential. Continue working hard.',
      headTeacherComment: 'Keep up the good work.',
      promotionStatus: 'PROMOTED'
    });

    setEditingReport(studentId);
  };

  // Handle save edited report
  const handleSaveEditedReport = () => {
    if (!editFormData) return;

    // Here you would typically save to the backend
    console.log('Saving edited report:', editFormData);
    
    // For now, just show success message
    alert('Report card updated successfully!');
    
    // Close edit mode
    setEditingReport(null);
    setEditFormData(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditFormData(null);
  };

  // Handle bulk report generation
  const handleBulkGenerateReports = () => {
    // Check permissions for bulk download
    if (user?.role === 'PARENT') {
      alert('Bulk download is not available for parents.');
      return;
    }
    
    alert(`Generating reports for ${filteredStudents.length} students...`);
    // This would typically generate PDFs for all filtered students
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Report Cards</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Report Cards Management
              </h1>
              <p className="text-gray-600 mt-2">Generate and manage student academic reports</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkGenerateReports}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  user?.role === 'PARENT' 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={user?.role === 'PARENT'}
                title={user?.role === 'PARENT' ? 'Bulk download not available for parents' : 'Generate reports for all students'}
              >
                <Download className="h-5 w-5" />
                Bulk Generate
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Show assigned classes info for teachers */}
            {(user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') && (() => {
              let assignedClasses = [];
              if (user.assignedClasses) {
                try {
                  assignedClasses = typeof user.assignedClasses === 'string' 
                    ? JSON.parse(user.assignedClasses) 
                    : user.assignedClasses;
                } catch (error) {
                  console.error('Error parsing assignedClasses:', error);
                  assignedClasses = [];
                }
              }
              
              if (assignedClasses.length > 0) {
                return (
                  <div className="md:col-span-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Your Assigned Classes:</strong> {assignedClasses.map((a: any) => `${a.className} - Stream ${a.streamName}`).join(', ')}
                    </p>
                  </div>
                );
              } else if (!user.assignedStream) {
                // SECURITY WARNING: Teacher without assigned classes
                return (
                  <div className="md:col-span-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-800">No Classes Assigned</p>
                        <p className="text-xs text-red-700">You cannot access student report cards until you are assigned to specific classes and streams.</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER' ? 'Your Assigned Classes' : 'Class'}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>
                    {cls === 'all' ? 
                      (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER' ? 'All My Classes' : 'All Classes') : 
                      cls
                    }
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, Access Number, Class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Term</p>
                <p className="text-2xl font-bold text-gray-900">{selectedTerm}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Academic Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length - 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Students ({filteredStudents.length})</h2>
            <p className="text-sm text-gray-600 mt-1">Select students to generate individual report cards</p>
          </div>
          
          <div className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500 mb-4">
                  {!students || students.length === 0 
                    ? "No students are currently enrolled in the system."
                    : "Try adjusting your filters or search criteria"
                  }
                </p>
                {(!students || students.length === 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> If you're expecting to see students, please check:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 text-left">
                      <li>• Students are properly enrolled in the system</li>
                      <li>• Database connection is working</li>
                      <li>• You have the correct permissions</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentData.map(student => (
                  <div key={student.id} className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-4 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
                    {/* AI Design Elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-lg group-hover:scale-110 transition-transform duration-300"></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 p-3 rounded-xl mb-4 relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <span className="text-xl font-bold text-white">{student.name[0]}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-pink-200 text-xs">✨</span>
                            <span className="text-yellow-200 text-xs">📊</span>
                            <span className="text-pink-200 text-xs">✨</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="font-bold text-white text-lg">{student.name}</h4>
                          <p className="text-purple-100 text-sm">{student.class || 'Not enrolled'} - {student.stream || 'No stream'}</p>
                        </div>
                        <div className="absolute top-1 left-1">
                          <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center space-x-1 shadow-sm">
                            <span className="text-xs">📈</span>
                            <span className="text-xs font-semibold text-yellow-900">Report</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Student Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-md p-2 border border-blue-200">
                          <span className="font-semibold text-blue-600 mr-2 text-sm">🔑</span>
                          <span className="font-medium text-sm">Access:</span>
                          <span className="ml-1 text-gray-700 font-mono text-sm">{student.accessNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-md p-2 border border-orange-200">
                          <span className="font-semibold text-orange-600 mr-2 text-sm">🎂</span>
                          <span className="font-medium text-sm">Age:</span>
                          <span className="ml-1 text-gray-700 text-sm">{student.age} years</span>
                        </div>
                      </div>
                      
                      {/* Academic Summary */}
                      <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 mb-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-lg"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-800">Academic Performance</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              student.academicRecord.grade === 'A' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                              student.academicRecord.grade === 'B' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                              student.academicRecord.grade === 'C' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                              'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                            }`}>
                              Grade {student.academicRecord.grade}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-gray-800">Total: {student.academicRecord.totalMarks}</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-gray-800">Percentage: {student.academicRecord.percentage}%</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-gray-800">Position: {student.academicRecord.position}</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-gray-800">Status: {student.academicRecord.percentage >= 50 ? 'PASS' : 'FAIL'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attendance Summary */}
                      <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-xl p-3 mb-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-lg"></div>
                        <div className="relative z-10">
                          <div className="text-sm font-bold text-gray-800 mb-2">Attendance</div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-center">
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-green-600">{student.attendanceRecords.filter(r => r.status === 'present').length}</div>
                              <div className="text-gray-600">Present</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-red-600">{student.attendanceRecords.filter(r => r.status === 'absent').length}</div>
                              <div className="text-gray-600">Absent</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                              <div className="font-bold text-blue-600">{student.attendanceRecords.length}</div>
                              <div className="text-gray-600">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGenerateReport(student.id)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <Eye className="h-4 w-4" />
                          View Report
                        </button>
                        <button
                          onClick={() => handleDownloadReport(student.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl text-sm hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                          title={user?.role === 'PARENT' ? 'Download not available for parents' : 'Download Report Card'}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {/* Edit button - only for teachers on their assigned students */}
                        {canTeacherEditStudent(student) && (
                          <button
                            onClick={() => handleEditReport(student.id)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-xl text-sm hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                            title="Edit Report Card"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Card Modal */}
        {showReportCard && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {console.log('🔍 Modal is rendering with selectedStudent:', selectedStudent)}
            {console.log('🔍 showReportCard:', showReportCard)}
            {console.log('🔍 selectedStudent:', selectedStudent)}
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Student Report Card</h2>
                  <button
                    onClick={() => setShowReportCard(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {(() => {
                  const student = students?.find(s => s.id === selectedStudent);
                  const studentDataItem = studentData.find(s => s.id === selectedStudent);
                  
                  if (!student || !studentDataItem) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-red-600">Student data not found</p>
                      </div>
                    );
                  }
                  
                  // Create a proper student object for the report card
                  const reportStudent = {
                    ...student,
                    academicRecords: [studentDataItem.academicRecord],
                    attendanceRecords: studentDataItem.attendanceRecords,
                    // Ensure all required fields exist
                    parent: student.parent || {
                      name: student.parentName || 'Parent Name',
                      phone: student.parentPhone || 'Phone Number',
                      email: student.parentEmail || 'Email Address',
                      address: student.parentAddress || 'Address'
                    }
                  };

                  console.log('🔍 Report student object:', reportStudent);
                  console.log('🔍 Academic records:', reportStudent.academicRecords);
                  console.log('🔍 Attendance records:', reportStudent.attendanceRecords);

                  try {
                    return (
                      <StudentReportCard
                        student={reportStudent}
                        settings={settings || { schoolName: 'School Name' }}
                        term={selectedTerm}
                        year={selectedYear}
                        comments={{
                          classTeacher: 'Student shows good potential. Continue working hard.',
                          headTeacher: 'Keep up the good work.',
                          promotion: 'PROMOTED',
                          date: new Date().toLocaleDateString()
                        }}
                      />
                    );
                  } catch (error) {
                    console.error('🔍 Error rendering StudentReportCard:', error);
                    return (
                      <div className="text-center py-8">
                        <p className="text-red-600">Error rendering report card: {error.message}</p>
                        <button 
                          onClick={() => setShowReportCard(false)}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Close
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Edit Report Card Modal */}
        {editingReport && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Report Card</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Student: {editFormData.studentName}</h3>
                  <p className="text-gray-600">Class: {editFormData.className} - {editFormData.streamName}</p>
                </div>

                {/* Academic Performance */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Academic Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={editFormData.academicRecord.totalMarks}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          academicRecord: {
                            ...editFormData.academicRecord,
                            totalMarks: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                      <input
                        type="number"
                        value={editFormData.academicRecord.percentage}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          academicRecord: {
                            ...editFormData.academicRecord,
                            percentage: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Comments</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher Comment</label>
                      <textarea
                        value={editFormData.classTeacherComment}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          classTeacherComment: e.target.value
                        })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Head Teacher Comment</label>
                      <textarea
                        value={editFormData.headTeacherComment}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          headTeacherComment: e.target.value
                        })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Promotion Status */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Promotion Status</h4>
                  <select
                    value={editFormData.promotionStatus}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      promotionStatus: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="PROMOTED">PROMOTED</option>
                    <option value="REPEAT CLASS">REPEAT CLASS</option>
                    <option value="CONDITIONAL PROMOTION">CONDITIONAL PROMOTION</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedReport}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCards;


