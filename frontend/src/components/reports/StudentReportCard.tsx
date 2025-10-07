import React from 'react';
import { Student, Settings, AcademicRecord, AttendanceRecord } from '../../types';

interface StudentReportCardProps {
  student: Student;
  settings: Settings;
  term: string;
  year: number;
  comments?: {
    classTeacher?: string;
    headTeacher?: string;
    promotion?: string;
    date?: string;
  };
}

const ratingKeys = [
  { label: '5. Excellent', value: 5 },
  { label: '4. Good', value: 4 },
  { label: '3. Fair', value: 3 },
  { label: '2. Poor', value: 2 },
  { label: '1. Very Poor', value: 1 },
];

const StudentReportCard: React.FC<StudentReportCardProps> = ({ student, settings, term, year, comments }) => {
  // Add safety checks
  if (!student) {
    return <div className="text-center py-8 text-red-600">Student data not found</div>;
  }

  // Academic record for this term/year
  const academic = student.academicRecords?.find(r => r.term === term && r.year === year);
  // Attendance for this term/year
  const attendance = (student.attendanceRecords || []).filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year;
  });
  const timesOpened = attendance.length;
  const timesPresent = attendance.filter(a => a.status === 'present').length;
  const timesAbsent = attendance.filter(a => a.status === 'absent').length;
  // Parent info
  const parent = student.parent;
  // Promotion status logic (example)
  const promotion = comments?.promotion || (academic?.percentage && academic.percentage < 50 ? 'REPEAT CLASS' : 'PROMOTED');
  // Date
  const date = comments?.date || new Date().toLocaleDateString();

  // Safe settings with defaults
  const safeSettings = {
    schoolName: settings?.schoolName || 'School Name',
    schoolAddress: settings?.schoolAddress || 'School Address',
    schoolPhone: settings?.schoolPhone || 'Phone Number',
    schoolEmail: settings?.schoolEmail || 'Email Address'
  };

  const studentPhoto = student.passportPhoto || student.photo || '';

  return (
    <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-xl shadow p-6 print:p-2 print:shadow-none print:border-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl font-bold">{safeSettings.schoolName[0]}</div>
          <div>
            <h2 className="text-xl font-bold uppercase text-gray-900">{safeSettings.schoolName}</h2>
            <div className="text-xs text-gray-700">{safeSettings.schoolAddress}</div>
            <div className="text-xs text-gray-700">Email: {safeSettings.schoolEmail}</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">✍️</span>
          </div>
        </div>
      </div>
      <div className="text-center font-bold text-lg mb-2">{year} {term} REPORT SHEET</div>
      {/* Student Info & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <div className="border p-2 rounded">
          <div className="font-semibold text-xs mb-1">STUDENT’S PERSONAL DATA</div>
          <div className="text-xs">Name: <span className="font-bold">{student.name}</span></div>
          <div className="text-xs">Date of Birth: {student.nin}</div>
          <div className="text-xs">Sex: {'-'}</div>
          <div className="text-xs">Class: {student.class}</div>
          <div className="text-xs">Stream: {student.stream}</div>
          <div className="text-xs">Access Number: {student.accessNumber}</div>
          <div className="text-xs">Parent: {parent?.name}</div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-yellow-50 flex items-center justify-center mb-2 overflow-hidden">
            {studentPhoto ? (
              <img src={studentPhoto} alt="Passport" className="h-16 w-16 object-cover" />
            ) : (
              <span className="text-5xl">🧑‍🎓</span>
            )}
          </div>
        </div>
        <div className="border p-2 rounded">
          <div className="font-semibold text-xs mb-1">ATTENDANCE</div>
          <div className="text-xs">No. of Times School Opened: {timesOpened}</div>
          <div className="text-xs">No. of Times Present: {timesPresent}</div>
          <div className="text-xs">No. of Times Absent: {timesAbsent}</div>
        </div>
      </div>
      {/* Academic Performance Table */}
      <div className="overflow-x-auto mt-2 mb-2">
        <table className="min-w-full text-xs border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-1">SUBJECT</th>
              <th className="border px-1">MARKS</th>
              <th className="border px-1">GRADE</th>
            </tr>
          </thead>
          <tbody>
            {academic?.subjects.map((s, i) => (
              <tr key={i}>
                <td className="border px-1 font-semibold">{s.subject}</td>
                <td className="border px-1">{s.marks}</td>
                <td className="border px-1">{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Academic Summary */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div className="border p-2 rounded">Total Marks: <span className="font-bold">{academic?.totalMarks}</span></div>
        <div className="border p-2 rounded">Percentage: <span className="font-bold">{academic?.percentage}%</span></div>
        <div className="border p-2 rounded">Grade: <span className="font-bold">{academic?.grade}</span></div>
        <div className="border p-2 rounded">Position: <span className="font-bold">{academic?.position}</span></div>
      </div>
      {/* Comments & Promotion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div className="border p-2 rounded text-xs">
          <div><span className="font-semibold">Class Teacher’s Comments:</span> {academic?.teacherComments || comments?.classTeacher}</div>
          <div className="flex items-center justify-between mt-1">
            <span>Sign.:</span>
            <span>Date: {date}</span>
          </div>
        </div>
        <div className="border p-2 rounded text-xs">
          <div><span className="font-semibold">HeadTeacher’s Comments:</span> {academic?.headTeacherComments || comments?.headTeacher}</div>
          <div className="flex items-center justify-between mt-1">
            <span>Sign.:</span>
            <span>Date: {date}</span>
          </div>
        </div>
      </div>
      <div className="border p-2 rounded text-xs font-semibold text-red-700 bg-red-50">
        Promotion Status: {promotion}
      </div>
    </div>
  );
};

export default StudentReportCard; 