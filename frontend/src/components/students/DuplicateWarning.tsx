import React from 'react';
import { AlertTriangle, X, Eye } from 'lucide-react';

interface DuplicateWarningProps {
  duplicateStudents: any[];
  onClose: () => void;
  onViewDuplicate: (student: any) => void;
}

const DuplicateWarning: React.FC<DuplicateWarningProps> = ({ 
  duplicateStudents, 
  onClose, 
  onViewDuplicate 
}) => {
  if (duplicateStudents.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-red-800">Duplicate Students Detected</h2>
              <p className="text-red-600">Found potential duplicate student records</p>
            </div>
          </div>
         <br/>
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> The following students appear to be duplicates based on name, class, and parent information. 
              Please review each group carefully before proceeding with cleanup.
            </p>
          </div>

          <div className="space-y-4">
            {duplicateStudents.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  Group {groupIndex + 1}: {group[0].name} ({group[0].class})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.map((student: any, studentIndex: number) => (
                    <div 
                      key={student.id}
                      className={`border rounded-lg p-3 ${
                        studentIndex === 0 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              studentIndex === 0 
                                ? 'bg-green-200 text-green-800' 
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {studentIndex === 0 ? '☑️ Original' : '🗑️ Duplicate'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div><strong>Name:</strong> {student.name}</div>
                            <div><strong>Access:</strong> {student.accessNumber}</div>
                            <div><strong>Admission ID:</strong> {student.admissionId}</div>
                            <div><strong>Class:</strong> {student.class} {student.stream || ''}</div>
                            <div><strong>Parent:</strong> {student.parentName}</div>
                            <div><strong>Created:</strong> {new Date(student.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => onViewDuplicate(student)}
                          className="ml-3 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View student details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  💡 <strong>Recommendation:</strong> Keep the original record (green) and remove duplicates (red)
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // TODO: Implement cleanup functionality
                console.log('Running cleanup...');
                alert('Cleanup feature coming soon! Use the backend script for now.');
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Clean Up Duplicates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarning;
