import React from 'react';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';

interface AdmissionLetterProps {
  student: Student;
  onClose: () => void;
}

const AdmissionLetter: React.FC<AdmissionLetterProps> = ({ student, onClose }) => {
  const { settings } = useData();
  const [feeStructureItems, setFeeStructureItems] = React.useState<any[]>([]);
  
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Get term dates from settings
  const parsedSettings = typeof settings?.securitySettings === 'string' ? 
    JSON.parse(settings.securitySettings) : settings || {};
  
  const termStartDate = parsedSettings?.termStart ? new Date(parsedSettings.termStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'To be determined';
  const termEndDate = parsedSettings?.termEnd ? new Date(parsedSettings.termEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'To be determined';
  const reportingDate = parsedSettings?.reportingDate ? new Date(parsedSettings.reportingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : currentDate;

  const handlePrint = async () => {
    // Generate a single print window containing all four documents with page breaks
    const residence = (student as any).residenceType || 'Day';
    const currentYear = settings?.currentYear || new Date().getFullYear();

    const openPrintWindow = (html: string) => {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
      }
    };

    const badge = settings?.schoolBadge
      ? `<img src="${settings.schoolBadge}" alt="Badge" style="width:48px;height:48px;border-radius:50%;object-fit:contain;background:#fff;" />`
      : `<div style="width:48px;height:48px;border-radius:50%;background:#cbd5e1;display:flex;align-items:center;justify-content:center;font-weight:800;">${(settings?.schoolName||'SMS').slice(0,1)}</div>`;

    const headerRight = `
      <div style="text-align:right;font-size:11px;color:#334155;line-height:1.4;">
        <div>${settings?.schoolAddress || ''}</div>
        <div>${settings?.schoolPhone ? 'Tel: ' + settings.schoolPhone : ''}${settings?.schoolPhone && settings?.schoolEmail ? ' | ' : ''}${settings?.schoolEmail ? 'Email: ' + settings.schoolEmail : ''}</div>
        ${settings?.schoolWebsite ? `<div>${settings.schoolWebsite}</div>` : ''}
      </div>`;

    const footer = `
      <div style="position:fixed;bottom:24px;left:24px;right:24px;border-top:1px solid #e5e7eb;padding-top:6px;font-size:11px;color:#475569;text-align:center">
        <div><strong>${settings?.schoolName || 'SCHOOL NAME'}</strong></div>
        <div>${settings?.schoolPOBox ? `P.O. Box ${settings.schoolPOBox}` : ''}${settings?.schoolPOBox && settings?.schoolEmail ? ' | ' : ''}${settings?.schoolEmail || ''}${settings?.schoolPhone ? ` | ${settings.schoolPhone}` : ''}</div>
        <div><em>${settings?.schoolMotto || ''}</em></div>
      </div>`;

    const buildAdmissionHtml = () => `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}
            <div>
              <div class="school-name">${settings?.schoolName || 'SCHOOL NAME'}</div>
              <div class="motto">${settings?.schoolMotto || ''}</div>
            </div>
          </div>
          ${headerRight}
        </div>
        <div style="text-align:center;font-weight:800;margin:8px 0 4px 0">SELECTION FOR ADMISSION ${currentYear}</div>
        <div style="text-align:center;color:#475569;margin-bottom:12px">Office of the Head Teacher • Academic Affairs</div>
        <table class="kv">
          <tr><td>Student Name</td><td>${student.name}</td></tr>
          <tr><td>Admission Number</td><td>${student.admissionId || '-'}</td></tr>
          <tr><td>Access Number</td><td>${student.accessNumber || '-'}</td></tr>
          <tr><td>Programme/Class</td><td>${student.class} ${student.stream || ''} • ${residence} Programme</td></tr>
          <tr><td>Date</td><td>${currentDate}</td></tr>
          <tr><td>Date of Reporting</td><td>${currentDate}</td></tr>
        </table>
        <div style="margin-top:10px">We are pleased to inform you that you have been selected for admission to <strong>${settings?.schoolName || 'our school'}</strong> for the academic year ${currentYear}.</div>
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

    const buildFeeStructureHtml = (items: any[]) => {
      const rows = (items || []).map((f: any) => `<tr><td style='border:1px solid #e5e7eb;padding:6px 8px'>${f.feeName || f.name}</td><td style='border:1px solid #e5e7eb;padding:6px 8px;text-align:right'>UGX ${Number(f.amount||0).toLocaleString()}</td></tr>`).join('');
      const total = (items || []).reduce((s: number, f: any) => s + Number(f.amount||0), 0);
      return `
      <div class="page">
        <div class="header">
          <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name">${settings?.schoolName || 'SCHOOL NAME'}</div></div>
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
          <div>• Contact the school for payment assistance if needed</div>
        </div>
        ${footer}
      </div>`;
    };

    const bankDetails = settings?.bankDetailsHtml || `Bank Details

Please contact the school administration for current bank details and payment instructions.`;
    const rulesContent = settings?.rulesRegulationsHtml || `SCHOOL RULES AND REGULATIONS

Please contact the school administration for the complete and current school rules and regulations.`;

    // Ensure we have up-to-date class fees for the print
    const items = feeStructureItems && feeStructureItems.length > 0
      ? feeStructureItems
      : await fetchClassFees(student.class);

    const html = `
      <html>
      <head>
        <title>Admission Pack - ${student.name}</title>
        <style>
          body{font-family:Arial, sans-serif;margin:24px;color:#0f172a}
          .page{max-width:820px;margin:0 auto;page-break-after:always}
          .page:last-child{page-break-after:auto}
          .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px}
          .school-name{font-weight:800;font-size:18px}
          .motto{font-style:italic;color:#475569;font-size:12px}
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
        </style>
      </head>
      <body>
        ${buildAdmissionHtml()}
        ${buildFeeStructureHtml(items)}
        <div class="page">
          <div class="header">
            <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name">${settings?.schoolName || 'SCHOOL NAME'}</div></div>
            ${headerRight}
          </div>
          <h1 style="font-size:18px;margin-bottom:16px">Bank Details</h1>
          <div style="white-space:pre-line;line-height:1.4">${bankDetails}</div>
          ${footer}
        </div>
        <div class="page">
          <div class="header">
            <div style="display:flex;gap:10px;align-items:center">${badge}<div class="school-name">${settings?.schoolName || 'SCHOOL NAME'}</div></div>
            ${headerRight}
          </div>
          <h1 style="font-size:18px;margin-bottom:16px">School Rules & Regulations</h1>
          <div style="line-height:1.4">${rulesContent}</div>
          ${footer}
        </div>
      </body>
      </html>`;

    openPrintWindow(html);
  };

  // Helper: load fee structure for the student's class with resilient fallback
  const fetchClassFees = async (className: string) => {
    try {
      console.log(`🔍 Fetching fee structure for class: ${className}`);
      
      // First try fee-structures endpoint
      const res = await fetch((await import('../../utils/api')).buildApiUrl(`settings/fee-structures/${encodeURIComponent(className)}`));
      if (res.ok) {
        const json = await res.json();
        let items = Array.isArray(json?.feeStructures) ? json.feeStructures : [];
        if (items && items.length > 0) {
          console.log(`✅ Found ${items.length} fee structures for ${className}`);
          return items;
        }
      }
      
      // Fallback to billing types
      console.log(`🔄 Falling back to billing types for ${className}`);
      const bt = await fetch((await import('../../utils/api')).buildApiUrl('settings/billing-types'));
      if (bt.ok) {
        const data = await bt.json();
        const list = Array.isArray(data?.value) ? data.value : (Array.isArray(data) ? data : []);
        
        // Filter by class name (case insensitive) - handle class streams like "Senior 3 - A"
        const classBillingTypes = list.filter((b: any) => {
          const billingClassName = String(b.className || '').toLowerCase();
          const studentClassName = String(className).toLowerCase();
          
          // Extract base class name (remove stream info like "- A", "- B", etc.)
          const baseClassName = studentClassName.split(' - ')[0].trim();
          
          return billingClassName === baseClassName || billingClassName === studentClassName;
        });
        
        console.log(`📊 Found ${classBillingTypes.length} billing types for ${className}`);
        
        // Get current settings for term/year filtering
        const settingsResponse = await fetch((await import('../../utils/api')).buildApiUrl('settings'));
        let currentYear = new Date().getFullYear();
        let currentTerm = 'Term 3'; // Default to Term 3
        
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          currentYear = settings.currentYear || currentYear;
          currentTerm = settings.currentTerm || currentTerm;
        }
        
        // Filter by current term/year
        const currentTermTypes = classBillingTypes.filter((bt: any) => 
          String(bt.year) === String(currentYear) && 
          String(bt.term || '').toLowerCase() === String(currentTerm).toLowerCase()
        );
        
        // If no current term data, use latest available
        let typesToUse = currentTermTypes;
        if (typesToUse.length === 0) {
          console.log(`⚠️ No fees for ${currentTerm} ${currentYear}, using latest available`);
          typesToUse = classBillingTypes;
        }
        
        const items = typesToUse.map((b: any) => ({ 
          feeName: b.name || b.feeName, 
          amount: Number(b.amount || 0) 
        }));
        
        console.log(`✅ Returning ${items.length} fees for ${className}:`, items);
        return items;
      }
    } catch (error) {
      console.error(`❌ Error fetching fees for ${className}:`, error);
    }
    return [] as any[];
  };

  // Load fee structure on component mount
  React.useEffect(() => {
    const loadFees = async () => {
      try {
        const classFees = await fetchClassFees(student.class);
        setFeeStructureItems(classFees);
      } catch (error) {
        console.error('Error loading fee structure:', error);
        setFeeStructureItems([]);
      }
    };
    loadFees();
  }, [student.class]);

  // Load fee structure on component mount (no auto-print)
  React.useEffect(() => {
    const run = async () => {
      try {
        const classFees = await fetchClassFees(student.class);
        // Update fee state for the in-modal view
        setFeeStructureItems(classFees);
      } catch (_) {}
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Admission Letter</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Letter Content */}
        <div className="p-8 print:p-6" id="admission-letter">
          {/* School Header */}
          <div className="text-center mb-8 print:mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                {settings?.schoolBadge ? (
                  <img 
                    src={settings.schoolBadge} 
                    alt="School Badge" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {(settings?.schoolName || 'SMS').slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {settings?.schoolName || 'SCHOOL NAME'}
                </h1>
                <p className="text-gray-600">
                  {settings?.schoolMotto || 'Excellence in Education'}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>{settings?.schoolAddress || 'School Address'}</p>
              <p>Tel: {settings?.schoolPhone || '+256 700 000 000'} | Email: {settings?.schoolEmail || 'info@school.ac.ug'}</p>
              {settings?.schoolWebsite && <p>Website: {settings.schoolWebsite}</p>}
            </div>
          </div>

          {/* Letter Body */}
          <div className="space-y-6 print:space-y-4">
            <div className="text-right">
              <p className="text-gray-600">Date: {currentDate}</p>
            </div>

            <div>
              <p className="text-gray-600">Admission Number: <span className="font-semibold text-black">{student.admissionId}</span></p>
              <p className="text-gray-600">Access Number: <span className="font-semibold text-black">{student.accessNumber}</span></p>
            </div>

            <div>
              <p className="font-semibold text-lg mb-2">Dear {student.name},</p>
              <p className="text-gray-700 leading-relaxed">
                We are pleased to inform you of your successful admission to {settings?.schoolName || 'our school'} for the academic year {settings?.currentYear || 2025}. 
                You have been admitted to <span className="font-semibold">{student.class} {student.stream}</span> stream.
              </p>
            </div>

            {/* Student Details */}
            <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
              <h3 className="font-semibold text-lg mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Name:</span> {student.name}</p>
                  <p><span className="font-medium">Age:</span> {student.age} years</p>
                  <p><span className="font-medium">Gender:</span> {student.gender}</p>
                </div>
                <div>
                  <p><span className="font-medium">Class:</span> {student.class}</p>
                  <p><span className="font-medium">Stream:</span> {student.stream}</p>
                  <p><span className="font-medium">Village:</span> {student.village || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {student.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="bg-blue-50 p-4 rounded-lg print:bg-blue-100">
              <h3 className="font-semibold text-lg mb-3">Fee Structure</h3>
              <div className="space-y-2 text-sm">
                {feeStructureItems.length > 0 ? (
                  feeStructureItems.map((fee, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{fee.name}:</span>
                      <span className="font-semibold">UGX {fee.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p>Fee structure will be provided upon enrollment</p>
                    <p className="text-sm">Please contact the school administration for current fee details</p>
                  </div>
                )}
                {student.individualFee && (
                  <div className="flex justify-between">
                    <span>Individual Fee:</span>
                    <span className="font-semibold">UGX {student.individualFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Fees:</span>
                    <span>UGX {feeStructureItems.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* School Rules and Regulations */}
            <div>
              <h3 className="font-semibold text-lg mb-3">School Rules and Regulations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800">General Conduct:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Students must maintain high standards of discipline and respect for all members of the school community</li>
                    <li>Regular attendance is mandatory. Absence without permission will result in disciplinary action</li>
                    <li>Students must wear the complete school uniform at all times while on school premises</li>
                    <li>Mobile phones and electronic devices are not allowed during school hours</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">Academic Requirements:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Students must complete all assignments and projects on time</li>
                    <li>Minimum attendance of 80% is required to sit for examinations</li>
                    <li>Academic dishonesty (cheating, plagiarism) will result in severe penalties</li>
                    <li>Students must maintain a minimum grade point average of 2.0</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Health and Safety:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Students must report any health issues to the school nurse immediately</li>
                    <li>Smoking, alcohol, and drug use are strictly prohibited</li>
                    <li>Students must follow all safety protocols during laboratory and practical sessions</li>
                    <li>Emergency contact information must be kept up to date</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Policies and Guidelines */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Policies and Guidelines</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800">Payment Policy:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Fees must be paid in full before the start of each term</li>
                    <li>Late payment will incur a 5% penalty per month</li>
                    <li>Payment plans are available upon request and approval</li>
                    <li>Refunds are only available within the first two weeks of the term</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Examination Policy:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Students must arrive 30 minutes before examination time</li>
                    <li>No electronic devices are allowed in examination rooms</li>
                    <li>Medical certificates are required for missed examinations</li>
                    <li>Results will be available within two weeks after examinations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Parent/Guardian Involvement:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Parents/Guardians must attend all parent-teacher meetings</li>
                    <li>Regular communication between school and home is encouraged</li>
                    <li>Parents must inform the school of any changes in contact information</li>
                    <li>Parental consent is required for all school trips and activities</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-yellow-50 p-4 rounded-lg print:bg-yellow-100">
              <h3 className="font-semibold text-lg mb-3">Important Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Term Start Date:</span>
                  <span className="font-semibold">{termStartDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Term End Date:</span>
                  <span className="font-semibold">{termEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reporting Date:</span>
                  <span className="font-semibold">{reportingDate}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Principal:</span> {settings?.principalName || 'Principal Name'}</p>
                  <p><span className="font-medium">Phone:</span> {settings?.principalPhone || settings?.schoolPhone || '+256 700 000 001'}</p>
                  <p><span className="font-medium">Email:</span> {settings?.principalEmail || settings?.schoolEmail || 'principal@school.ac.ug'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Deputy Principal:</span> {settings?.deputyPrincipalName || 'Deputy Principal Name'}</p>
                  <p><span className="font-medium">Phone:</span> {settings?.deputyPrincipalPhone || settings?.schoolPhone || '+256 700 000 002'}</p>
                  <p><span className="font-medium">Email:</span> {settings?.deputyPrincipalEmail || settings?.schoolEmail || 'deputy@school.ac.ug'}</p>
                </div>
              </div>
            </div>

            {/* Acknowledgment Section */}
            <div className="border-t pt-6 mt-8">
              <h3 className="font-semibold text-lg mb-4">Acknowledgment and Agreement</h3>
              <p className="text-sm text-gray-700 mb-4">
                I, <span className="font-semibold">{student.name}</span>, have read and understood all the rules, 
                regulations, policies, and guidelines outlined in this admission letter. I agree to abide by them 
                throughout my stay at {settings?.schoolName || 'this school'}.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                  <p className="text-sm font-medium mb-2">Student Signature:</p>
                  <div className="border-b border-gray-400 h-8"></div>
                  <p className="text-xs text-gray-600 mt-1">Date: _______________</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Parent/Guardian Signature:</p>
                  <div className="border-b border-gray-400 h-8"></div>
                  <p className="text-xs text-gray-600 mt-1">Date: _______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{settings?.schoolName || 'School Name'}</span><br />
                {settings?.schoolAddress || ''}{settings?.schoolPOBox ? ` | ${settings.schoolPOBox}` : ''}{settings?.schoolDistrict ? ` | ${settings.schoolDistrict}` : ''}{settings?.schoolRegion ? ` | ${settings.schoolRegion}` : ''}{settings?.schoolCountry ? ` | ${settings.schoolCountry}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {settings?.schoolPhone || ''}{settings?.schoolPhone && settings?.schoolEmail ? ' | ' : ''}{settings?.schoolEmail || ''}{settings?.schoolWebsite ? ` | ${settings.schoolWebsite}` : ''}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                "{settings?.schoolMotto || 'Excellence in Education, Character, and Service'}"
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This admission letter is valid for the academic year {settings?.currentYear || 2025} only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #admission-letter, #admission-letter * {
            visibility: visible;
          }
          #admission-letter {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:bg-blue-100 {
            background-color: #dbeafe !important;
          }
          .print\\:bg-yellow-100 {
            background-color: #fef3c7 !important;
          }
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdmissionLetter;
