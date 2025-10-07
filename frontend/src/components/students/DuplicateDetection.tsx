import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Student } from '../../types';
import DuplicateWarning from './DuplicateWarning';

interface DuplicateDetectionProps {
  students: Student[];
  onCleanupDuplicates?: () => void;
}

interface DuplicateGroup {
  key: string;
  students: Student[];
}

const DuplicateDetection: React.FC<DuplicateDetectionProps> = ({ 
  students, 
  onCleanupDuplicates 
}) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  useEffect(() => {
    detectDuplicates();
  }, [students]);

  const detectDuplicates = () => {
    const activeStudents = students.filter(s => s.status !== 'dropped');
    
    // Group students by name, class, and parent
    const studentGroups = new Map<string, Student[]>();
    
    activeStudents.forEach(student => {
      const key = `${student.name.toLowerCase()}|${student.class}|${student.parentName?.toLowerCase() || ''}`;
      
      if (!studentGroups.has(key)) {
        studentGroups.set(key, []);
      }
      studentGroups.get(key)!.push(student);
    });

    // Find groups with duplicates
    const duplicates: DuplicateGroup[] = [];
    studentGroups.forEach((groupStudents, key) => {
      if (groupStudents.length > 1) {
        duplicates.push({
          key,
          students: groupStudents.sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          )
        });
      }
    });

    setDuplicateGroups(duplicates);
  };

  const handleViewDuplicate = (student: Student) => {
    // Scroll to student in the list
    const element = document.getElementById(`student-${student.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-duplicate');
      setTimeout(() => {
        element.classList.remove('highlight-duplicate');
      }, 2000);
    }
  };

  if (duplicateGroups.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-800">No Duplicates Detected</h3>
            <p className="text-sm text-green-600">
              All student records appear to be unique. No duplicate students found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Duplicate Students Detected</h3>
              <p className="text-sm text-red-600">
                Found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} 
                with {duplicateGroups.reduce((sum, group) => sum + group.students.length, 0)} total records
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDuplicateModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>

      {/* Duplicate Groups Summary */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="border-b border-gray-200 px-4 py-3">
          <h4 className="text-sm font-medium text-gray-800">Duplicate Groups Summary</h4>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {duplicateGroups.map((group, index) => (
              <div key={group.key} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {group.students.length} duplicates
                    </span>
                    <span className="font-medium text-gray-800">
                      Group {index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{group.students[0].name}</span>
                    <span>•</span>
                    <span>{group.students[0].class}</span>
                    <span>•</span>
                    <span>{group.students[0].parentName || 'No parent'}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Latest: {group.students[group.students.length - 1].accessNumber}</span>
                    <span>Oldest: {group.students[0].accessNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <DuplicateWarning
          duplicateStudents={duplicateGroups.map(group => group.students)}
          onClose={() => setShowDuplicateModal(false)}
          onViewDuplicate={handleViewDuplicate}
        />
      )}

      {/* CSS for highlighting */}
      <style>{`
        .highlight-duplicate {
          animation: pulse-border 2s ease-in-out;
        }
        
        @keyframes pulse-border {
          0% { border-left: 4px solid #ef4444; }
          50% { border-left: 4px solid #fca5a5; }
          100% { border-left: 4px solid #ef4444; }
        }
      `}</style>
    </>
  );
};

export default DuplicateDetection;
