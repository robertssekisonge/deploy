import React, { useState, useEffect } from 'react';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { generateFeeStructureItems } from '../../utils/feeCalculation';
import { FolderOpen, FileText, Printer, Calendar, User, Filter } from 'lucide-react';

interface FormFolderStructure {
  year: string;
  months: {
    [monthKey: string]: {
      monthName: string;
      students: StudentFolder[];
    };
  };
}

interface StudentFolder {
  student: Student;
  forms: StudentForm[];
  createdDate: Date;
}

interface StudentForm {
  id: string;
  name: string;
  type: 'admission' | 'fee-structure' | 'bank-details' | 'rules-regulations';
  content: string;
  createdDate: Date;
}

const FormsManagement: React.FC = () => {
  const { students, fetchStudents, settings } = useData();
  const [folderStructure, setFolderStructure] = useState<FormFolderStructure[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (students && students.length > 0) {
      loadFormsData();
    } else {
      // Only fetch if students data is not available
      fetchStudentsOnce();
    }
  }, [students]);

  const fetchStudentsOnce = async () => {
    setLoading(true);
    try {
      await fetchStudents();
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const loadFormsData = async () => {
    try {
      // Group students by creation year and month - no need to fetch again
      const groupedStructure = groupStudentsByDate(students);
      setFolderStructure(groupedStructure);
      setLoading(false);
    } catch (error) {
      console.error('Error loading forms data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupStudentsByDate = (studentsList: Student[]): FormFolderStructure[] => {
    const grouped: { [year: string]: { [monthKey: string]: StudentFolder[] } } = {};

    // Filter to only include school-admitted students (exclude overseer-admitted students)
    const schoolStudents = studentsList.filter((student: any) => {
      // Include students admitted by admin/secretary or with no admittedBy field (legacy students)
      return student.admittedByName === 'admin' || 
             student.admittedByName === 'secretary' || 
             student.admittedBy === 'admin' || 
             student.admittedBy === 'secretary' || 
             !student.admittedBy;
    });

    console.log(`📋 Forms Management: Filtering students - Total: ${studentsList.length}, School-admitted: ${schoolStudents.length}`);

    schoolStudents.forEach((student) => {
      const createdDate = student.createdAt ? new Date(student.createdAt) : new Date();
      const year = createdDate.getFullYear().toString();
      const monthKey = createdDate.getMonth().toString();
      const monthName = createdDate.toLocaleString('default', { month: 'long' });

      // Generate forms for this student
      const forms: StudentForm[] = [
        {
          id: `${student.accessNumber}-admission`,
          name: 'Admission Letter',
          type: 'admission',
          content: '',
          createdDate
        },
        {
          id: `${student.accessNumber}-fee`,
          name: 'Fee Structure',
          type: 'fee-structure',
          content: '',
          createdDate
        },
        {
          id: `${student.accessNumber}-bank`,
          name: 'Bank Details',
          type: 'bank-details',
          content: '',
          createdDate
        },
        {
          id: `${student.accessNumber}-rules`,
          name: 'Rules & Regulations',
          type: 'rules-regulations',
          content: '',
          createdDate
        }
      ];

      const studentFolder: StudentFolder = {
        student,
        forms,
        createdDate
      };

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][monthKey]) {
        grouped[year][monthKey] = [];
      }

      grouped[year][monthKey].push(studentFolder);
    });

    // Convert to FormFolderStructure array
    return Object.keys(grouped).map(year => ({
      year,
      months: Object.keys(grouped[year]).reduce((monthAcc, monthKey) => {
        const monthName = new Date(parseInt(year), parseInt(monthKey)).toLocaleString('default', { month: 'long' });
        monthAcc[monthKey] = {
          monthName,
          students: grouped[year][monthKey]
        };
        return monthAcc;
      }, {} as { [monthKey: string]: { monthName: string; students: StudentFolder[] } })
    })).sort((a, b) => b.year.localeCompare(a.year));
  };

  const getFilteredData = () => {
    let filtered = folderStructure;

    if (selectedYear !== 'all') {
      filtered = filtered.filter(year => year.year === selectedYear);
    }

    return filtered.map(yearPath => ({
      ...yearPath,
      months: Object.keys(yearPath.months).reduce((monthAcc, monthKey) => {
        let students = yearPath.months[monthKey].students;

        if (selectedClass !== 'all') {
          students = students.filter(folder => folder.student.class === selectedClass);
        }

        if (selectedFilter === 'recent') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          students = students.filter(folder => folder.createdDate >= thirtyDaysAgo);
        }

        if (students.length > 0) {
          monthAcc[monthKey] = {
            ...yearPath.months[monthKey],
            students
          };
        }

        return monthAcc;
      }, {} as { [monthKey: string]: { monthName: string; students: StudentFolder[] } })
    }));
  };

  const handlePrintForms = async (studentFolder: StudentFolder) => {
    // Generate and print all forms for the student
    const formsHtml = await generateAllForms(studentFolder);
    openPrintWindow(formsHtml);
  };

  const generateAllForms = async (studentFolder: StudentFolder) => {
    const { student } = studentFolder;
    const residence = (student as any).residenceType || 'Day';
    const currentYear = settings?.currentYear || new Date().getFullYear();

    // Get color settings from admin settings
    const parsedSettings = typeof settings?.securitySettings === 'string' ? 
      JSON.parse(settings.securitySettings) : settings || {};
    
    
    const schoolNameColor = parsedSettings?.schoolNameColor || '#1e40af';
    const schoolNameSize = parsedSettings?.schoolNameSize || '18px';
    const mottoColor = parsedSettings?.mottoColor || '#64748b';
    const mottoSize = parsedSettings?.mottoSize || '12px';

    const badge = parsedSettings?.schoolBadge
      ? `<img src="${parsedSettings.schoolBadge}" alt="Badge" style="width:48px;height:48px;border-radius:50%;object-fit:contain;background:#fff;border:2px solid #e5e7eb;" />`
      : `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${(parsedSettings?.schoolName||'SMS').slice(0,1)}</div>`;

    const headerRight = `
      <div style="text-align:right;font-size:11px;color:#334155;line-height:1.4;">
        <div>${parsedSettings?.schoolAddress || ''}</div>
        <div>${parsedSettings?.schoolPhone ? 'Tel: ' + parsedSettings.schoolPhone : ''}${parsedSettings?.schoolPhone && parsedSettings?.schoolEmail ? ' | ' : ''}${parsedSettings?.schoolEmail ? 'Email: ' + parsedSettings.schoolEmail : ''}</div>
      </div>`;

    const footer = `
      <div style="position:fixed;bottom:8px;left:24px;right:24px;border-top:1px solid #e5e7eb;padding-top:6px;font-size:11px;color:#475569;text-align:center;background:white;z-index:1000;">
        <div style="color:${schoolNameColor};font-weight:700;">${parsedSettings?.schoolName || 'SCHOOL NAME'}</div>
        <div style="color:${mottoColor};font-size:${mottoSize};font-style:italic;">${parsedSettings?.schoolMotto || ''}</div>
      </div>`;

    // Generate Admission Letter
    const admissionHtml = generateAdmissionLetter(student, badge, headerRight, footer, currentYear, residence);

    // Generate Fee Structure - use proper fee calculation with boarding
    const feeItems = await generateFeeStructureItems(student.class, (student as any).residenceType);
    const feeStructureHtml = generateFeeStructure(student, feeItems, badge, headerRight, footer, residence);

    // Generate Bank Details
    const bankDetailsHtml = generateBankDetails(badge, headerRight, footer);

    // Generate Rules and Regulations
    const rulesHtml = generateRulesRegulations(badge, headerRight, footer);

    return `
      <html>
      <head>
        <title>Admission Forms - ${student.name}</title>
        <style>
          body{font-family:Arial, sans-serif;margin:24px;color:#0f172a}
          .page{max-width:820px;margin:0 auto;page-break-after:always;padding-bottom:60px}
          .page:last-child{page-break-after:auto}
          .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px}
          .school-name{font-weight:800;font-size:18px}
          .section-title{font-weight:700;margin:16px 0 8px 0}
          .kv{width:100%;border-collapse:collapse}
          .kv td{padding:6px 8px;vertical-align:top}
          .kv td:first-child{color:#334155;width:38%}
          .kv td:last-child{font-weight:700}
          .table{width:100%;border-collapse:collapse;font-size:14px}
          .table th,.table td{border:1px solid #e5e7eb;padding:6px 8px}
          .table th{text-align:left;background:#f8fafc}
          .total-row{font-weight:700;background:#f1f5f9}
          .notes{margin-top:16px;font-size:12px;color:#475569}
          @media print {
            body { margin: 0; }
            @page { margin: 1in; }
            * { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${admissionHtml}
        ${feeStructureHtml}
        ${bankDetailsHtml}
        ${rulesHtml}
      </body>
      </html>`;
  };

  const generateAdmissionLetter = (student: Student, badge: string, headerRight: string, footer: string, currentYear: number, residence: string) => {
    // Use the actual admission date (student.createdAt) instead of current date
    const admissionDate = new Date(student.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Get color settings
    const parsedSettings = typeof settings?.securitySettings === 'string' ? 
      JSON.parse(settings.securitySettings) : settings || {};
    
    const schoolNameColor = parsedSettings?.schoolNameColor || '#1e40af';
    const schoolNameSize = parsedSettings?.schoolNameSize || '18px';
    const mottoColor = parsedSettings?.mottoColor || '#64748b';
    const mottoSize = parsedSettings?.mottoSize || '12px';

    return `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}
            <div>
              <div class="school-name" style="color:${schoolNameColor};font-size:${schoolNameSize};">${parsedSettings?.schoolName || 'SCHOOL NAME'}</div>
            </div>
          </div>
          ${headerRight}
        </div>
        
        <!-- Enhanced school motto display -->
        ${parsedSettings?.schoolMotto ? `
          <div style="text-align:center;margin:8px 0;color:${mottoColor};font-size:${mottoSize};font-style:italic">
            ${parsedSettings.schoolMotto}
          </div>
        ` : ''}
        
        <div style="text-align:center;font-weight:800;margin:8px 0 4px 0;color:#1e40af">ADMISSION LETTER ${currentYear}</div>
        <table class="kv">
          <tr><td>Student Name</td><td>${student.name}</td></tr>
          <tr><td>Access Number</td><td>${student.accessNumber || '-'}</td></tr>
          <tr><td>Programme/Class</td><td>${student.class} ${student.stream || ''} • ${residence} Programme</td></tr>
          <tr><td>Date</td><td>${admissionDate}</td></tr>
          <tr><td>Term Start Date</td><td>${parsedSettings?.termStart ? new Date(parsedSettings.termStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'To be determined'}</td></tr>
          <tr><td>Term End Date</td><td>${parsedSettings?.termEnd ? new Date(parsedSettings.termEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'To be determined'}</td></tr>
          <tr><td>Date of Reporting</td><td>${parsedSettings?.reportingDate ? new Date(parsedSettings.reportingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : admissionDate}</td></tr>
        </table>
        <div style="margin-top:10px">We are pleased to inform you that you have been selected for admission to <strong>${parsedSettings?.schoolName || 'our school'}</strong> for the academic year ${currentYear}.</div>
        <div class="section-title">Residence:</div>
        <div>${residence} section</div>
        <div class="section-title">Reporting:</div>
        <div>Please report with original academic documents for verification on the official reporting date.</div>
        <div class="section-title">School Fees:</div>
        <div>Tuition and other fees should be paid before registration. See the attached fee structure for <strong>${student.class}</strong>.</div>
        <div style="margin-top:18px">We look forward to receiving you.</div>
        <div style="margin-top:24px">Sincerely,</div>
        <div style="margin-top:4px;font-weight:700">Head Teacher</div>
        ${footer}
      </div>`;
  };

  const generateFeeStructure = (student: Student, feeItems: any[], badge: string, headerRight: string, footer: string, residence: string) => {
    const rows = (feeItems || []).map((f: any) => `<tr><td style='border:1px solid #e5e7eb;padding:6px 8px'>${f.feeName || f.name}</td><td style='border:1px solid #e5e7eb;padding:6px 8px;text-align:right'>UGX ${Number(f.amount||0).toLocaleString()}</td></tr>`).join('');
    const total = (feeItems || []).reduce((s: number, f: any) => s + Number(f.amount||0), 0);

    // Get color settings
    const parsedSettings = typeof settings?.securitySettings === 'string' ? 
      JSON.parse(settings.securitySettings) : settings || {};
    
    const schoolNameColor = parsedSettings?.schoolNameColor || '#1e40af';
    const schoolNameSize = parsedSettings?.schoolNameSize || '18px';

    return `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name" style="color:${schoolNameColor};font-size:${schoolNameSize};">${parsedSettings?.schoolName || 'SCHOOL NAME'}</div></div>
          ${headerRight}
        </div>
        <div style="font-weight:800;margin-bottom:8px">Fee Structure for ${student.class}${student.stream ? ' - ' + student.stream : ''} (${residence})</div>
        <table class="table">
          <tr><th>Fee Type</th><th style="text-align:right">Amount</th></tr>
          ${rows}
          <tr class="total-row"><td>Total</td><td style="text-align:right">UGX ${total.toLocaleString()}</td></tr>
        </table>
        <div class="notes">
          <div><strong>Payment Instructions:</strong></div>
          <div>• All fees must be paid before registration</div>
          <div>• Payment can be made through bank transfer or mobile money</div>
          <div>• Keep all payment receipts for verification</div>
        </div>
        ${footer}
      </div>`;
  };

  const generateBankDetails = (badge: string, headerRight: string, footer: string) => {
    const bankDetails = settings?.bankDetailsHtml || `Bank Details\n\nPlease contact the school administration for current bank details and payment instructions.`;

    // Get color settings
    const parsedSettings = typeof settings?.securitySettings === 'string' ? 
      JSON.parse(settings.securitySettings) : settings || {};
    
    const schoolNameColor = parsedSettings?.schoolNameColor || '#1e40af';
    const schoolNameSize = parsedSettings?.schoolNameSize || '18px';

    return `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name" style="color:${schoolNameColor};font-size:${schoolNameSize};">${parsedSettings?.schoolName || 'SCHOOL NAME'}</div></div>
          ${headerRight}
        </div>
        <h1 style="font-size:18px;margin-bottom:16px">Bank Details</h1>
        <div style="white-space:pre-line;line-height:1.4">${bankDetails}</div>
        ${footer}
      </div>`;
  };

  const generateRulesRegulations = (badge: string, headerRight: string, footer: string) => {
    // Get color settings
    const parsedSettings = typeof settings?.securitySettings === 'string' ? 
      JSON.parse(settings.securitySettings) : settings || {};
    
    const schoolNameColor = parsedSettings?.schoolNameColor || '#1e40af';
    const schoolNameSize = parsedSettings?.schoolNameSize || '18px';

    const rulesContent = settings?.rulesRegulationsHtml || `
      <div style="line-height:1.6;color:#374151;font-size:14px">
        <h2 style="color:#1e40af;margin-bottom:12px;border-bottom:2px solid #e5e7eb;padding-bottom:4px">SCHOOL RULES AND REGULATIONS</h2>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">1. GENERAL CONDUCT</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">

          <li>Students must maintain the highest standards of behavior, dignity, and respect at all times</li>
          <li>Respect for teachers, administrative staff, and fellow students is mandatory</li>
          <li>School property must be treated with utmost care and responsibility</li>
          <li>Students must dress appropriately and maintain personal hygiene</li>
          <li>Honesty, integrity, and truthfulness are fundamental expectations</li>
          </ul>
        </div>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">2. ATTENDANCE AND PUNCTUALITY</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">
          <li>Regular attendance is compulsory for all scheduled classes and activities</li>
          <li>Punctuality is essential for all school activities without exception</li>
          <li>Absence must be justified with proper written permission from parents/guardians</li>
          <li>Medical certificates required for illness-related absences exceeding two days</li>
          <li>Late arrivals will be recorded and may result in disciplinary action</li>
          </ul>
        </div>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">3. DRESS CODE AND APPEARANCE</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">
          <li>Official school uniform must be worn correctly, clean, and pressed daily</li>
          <li>Proper footwear as specified in the uniform policy is required</li>
          <li>Hair must be neat, clean, and styled appropriately according to school standards</li>
          <li>No jewelry, makeup, or accessories that violate school policy</li>
          <li>Uniform violations will result in immediate correction or disciplinary measures</li>
          </ul>
        </div>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">4. ACADEMIC REQUIREMENTS</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">
          <li>All assignments must be completed on time with original work</li>
          <li>Required books, supplies, and materials must be brought daily</li>
          <li>Active participation in class activities and discussions is expected</li>
          <li>Academic integrity is paramount - no cheating, copying, or plagiarism</li>
          <li>Regular revision and preparation for examinations is mandatory</li>
          </ul>
        </div>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">5. DISCIPLINARY MEASURES</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">
          <li><strong>Verbal Warning:</strong> For minor behavioral infractions</li>
          <li><strong>Written Reprimand:</strong> For repeated violations or moderate violations</li>
          <li><strong>Detention:</strong> For persistent misconduct or moderate rule violations</li>
          <li><strong>Parent Consultation:</strong> For serious behavioral or academic issues</li>
          <li><strong>Suspension:</strong> For severe violations of school rules and regulations</li>
          <li><strong>Expulsion:</strong> For extremely serious violations that compromise school safety or integrity</li>
          </ul>
        </div>
        
        <div style="margin-bottom:16px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">6. PROHIBITED ACTIVITIES</h3>
          <ul style="margin-left:20px;margin-bottom:12px;line-height:1.5">
          <li>Any form of bullying, harassment, or intimidation</li>
          <li>Possession or use of drugs, alcohol, or tobacco products</li>
          <li>Bringing weapons or dangerous objects to school</li>
          <li>Theft, vandalism, or misuse of school property</li>
          <li>Unauthorized access to restricted areas</li>
          <li>Use of electronic devices during class time unless authorized</li>
          </ul>
        </div>
        
        <div style="margin-bottom:20px">
          <h3 style="color:#4b5563;margin-bottom:8px;font-size:16px">7. DECLARATION</h3>
          <p style="line-height:1.5;margin-bottom:12px">
            By signing below, I acknowledge that I have read, understood, and agree to comply with all the rules and regulations of <strong>${parsedSettings?.schoolName || 'SCHOOL NAME'}</strong> as outlined in this document.
          </p>
        </div>
        
        <div style="margin-bottom:20px;padding:12px;background:#f3f4f6;border-left:4px solid #3b82f6;font-style:italic;color:#64748b">
          <strong>Important Note:</strong> These rules are subject to periodic review and updates. Students, parents, and guardians will be notified of any changes through official school communication channels. Violation of these rules may result in disciplinary action as outlined above.
        </div>
        
        <!-- Signature Section -->
        <div style="margin-top:40px;padding:20px;border:2px solid #e5e7eb;border-radius:8px;width:100%;max-width:600px;margin-left:auto;margin-right:auto;">
          <h3 style="color:#1e40af;margin-bottom:20px;text-align:center;font-size:18px">DECLARATION & SIGNATURES</h3>
          
          <!-- Student Section -->
          <div style="margin-bottom:30px">
            <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
              <label style="font-weight:600;color:#374151">Student Name:</label>
            </div>
            <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
              <label style="font-weight:600;color:#374151">Student Signature:</label>
            </div>
            <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
              <label style="font-weight:600;color:#374151">Date:</label>
            </div>
          </div>
          
          <!-- Parent/Guardian Section -->
          <div style="margin-bottom:15px">
            <h4 style="color:#4b5563;margin-bottom:15px;font-size:16px">Parent/Guardian Declaration</h4>
            <p style="line-height:1.5;margin-bottom:15px;font-size:14px">
              I declare that I have read and understood the school rules and regulations, and I agree to support my child's compliance with these rules. I understand that failure to comply with these regulations may result in disciplinary action.
            </p>
          </div>
          
          <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
            <label style="font-weight:600;color:#374151">Parent/Guardian Name:</label>
          </div>
          <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
            <label style="font-weight:600;color:#374151">Parent/Guardian Signature:</label>
          </div>
          <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
            <label style="font-weight:600;color:#374151">Relationship to Student:</label>
          </div>
          <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;margin-bottom:5px">
            <label style="font-weight:600;color:#374151">Date:</label>
          </div>
          <div style="border-bottom:1px solid #d1d5db;padding:5px 0 8px 0;">
            <label style="font-weight:600;color:#374151">Contact Number:</label>
          </div>
        </div>
      </div>`;

    return `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name" style="color:${schoolNameColor};font-size:${schoolNameSize};">${parsedSettings?.schoolName || 'SCHOOL NAME'}</div></div>
          ${headerRight}
        </div>
        <h1 style="font-size:18px;margin-bottom:16px;color:#1e40af">School Rules & Regulations</h1>
        <div style="line-height:1.4">${rulesContent}</div>
        ${footer}
      </div>`;
  };

  const fetchClassFees = async (className: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/settings/fee-structures/${encodeURIComponent(className)}`);
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json?.feeStructures) ? json.feeStructures : [];
      }
    } catch (_) {}
    return [];
  };

  const openPrintWindow = (html: string) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
      
      // Add professional meta tags
      win.document.head.appendChild(win.document.createElement('meta')).setAttribute('name', 'viewport');
      win.document.head.appendChild(win.document.createElement('meta')).setAttribute('content', 'width=device-width, initial-scale=1.0');
      
      win.focus();
      
      // Wait for content to load before printing
      setTimeout(() => {
        win.print();
      }, 500);
    }
  };

  const getUniqueClasses = () => {
    const classes = new Set<string>();
    folderStructure.forEach(year => {
      Object.values(year.months).forEach(month => {
        month.students.forEach(folder => {
          classes.add(folder.student.class);
        });
      });
    });
    return Array.from(classes).sort();
  };

  const getUniqueYears = () => {
    return folderStructure.map(year => year.year).sort((a, b) => b.localeCompare(a));
  };

  const getTotalStudents = () => {
    return folderStructure.reduce((total, year) => {
      return total + Object.values(year.months).reduce((monthTotal, month) => {
        return monthTotal + month.students.length;
      }, 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium text-gray-700">Loading forms...</span>
          </div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Forms Management</h1>
                <p className="text-gray-600">School-admitted students forms only - organized by academic year and class</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{getTotalStudents()}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Students</option>
              <option value="recent">Last 30 Days</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {getUniqueClasses().map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Display */}
        <div className="space-y-6">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Forms Found</h3>
              <p className="text-gray-500">No admission forms found for the selected filters.</p>
            </div>
          ) : (
            filteredData.map((yearPath) => (
              <div key={yearPath.year} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-white" />
                    <h2 className="text-xl font-bold text-white">{yearPath.year}</h2>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    {Object.keys(yearPath.months).map((monthKey) => {
                      const monthData = yearPath.months[monthKey];
                      return (
                        <div key={monthKey} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                            <span>{monthData.monthName}</span>
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {monthData.students.length} student{monthData.students.length !== 1 ? 's' : ''}
                            </span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {monthData.students.map((studentFolder) => (
                              <div key={studentFolder.student.accessNumber} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="bg-purple-100 rounded-full p-2">
                                      <User className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-800 text-sm">{studentFolder.student.name}</h4>
                                      <p className="text-xs text-gray-600">Access: {studentFolder.student.accessNumber}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-xs text-gray-600 mb-1">Class:</p>
                                  <p className="font-medium text-sm">{studentFolder.student.class} {studentFolder.student.stream}</p>
                                </div>
                                
                                <div className="mb-4">
                                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <FileText className="h-3 w-3" />
                                      <span>Admission</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <FileText className="h-3 w-3" />
                                      <span>Fee Structure</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <FileText className="h-3 w-3" />
                                      <span>Bank Details</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <FileText className="h-3 w-3" />
                                      <span>Rules</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handlePrintForms(studentFolder)}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm py-2 px-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  <span>Print All Forms</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FormsManagement;
