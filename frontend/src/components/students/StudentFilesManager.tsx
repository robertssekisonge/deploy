import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import AIRefreshButton from '../common/AIRefreshButton';
import { 
  Upload, Image, FileText, Eye, Download, Trash2, Plus, 
  Camera, Document, AlertCircle, CheckCircle, Star, 
  User, Calendar, Tag, Filter, Search
} from 'lucide-react';

interface StudentPhoto {
  id: number;
  studentId: string;
  photoType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface ConductNote {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  streamName: string;
  noteType: string;
  title: string;
  description: string;
  severity: string;
  teacherId: string;
  teacherName: string;
  date: string;
  isActive: boolean;
}

interface StudentDocument {
  id: number;
  studentId: string;
  studentName: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

const StudentFilesManager: React.FC<{ studentId: string; studentName: string }> = ({ 
  studentId, 
  studentName 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showData } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'photos' | 'documents' | 'conduct'>('photos');
  const [photos, setPhotos] = useState<StudentPhoto[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [conductNotes, setConductNotes] = useState<ConductNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConductModal, setShowConductModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    photoType: 'profile',
    documentType: 'other',
    title: '',
    description: ''
  });
  const [conductForm, setConductForm] = useState({
    noteType: 'positive',
    title: '',
    description: '',
    severity: 'low'
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch data based on active tab
  const fetchData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'photos':
          const photosResponse = await fetch(`${API_BASE_URL}/files/photos/${studentId}`);
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            setPhotos(photosData);
          }
          break;
        case 'documents':
          const docsResponse = await fetch(`${API_BASE_URL}/files/documents/${studentId}`);
          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            setDocuments(docsData);
          }
          break;
        case 'conduct':
          const conductResponse = await fetch(`${API_BASE_URL}/files/conduct-notes/${studentId}`);
          if (conductResponse.ok) {
            const conductData = await conductResponse.json();
            setConductNotes(conductData);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Fetch Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, studentId]);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      let endpoint = '';
      let additionalData: any = {};

      if (activeTab === 'photos') {
        endpoint = '/files/photos/upload';
        additionalData = {
          studentId,
          photoType: uploadData.photoType,
          uploadedBy: user?.name || 'Unknown'
        };
      } else if (activeTab === 'documents') {
        endpoint = '/files/documents/upload';
        additionalData = {
          studentId,
          studentName,
          documentType: uploadData.documentType,
          uploadedBy: user?.name || 'Unknown'
        };
      }

      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showSuccess('Upload Successful', 'File uploaded successfully');
        setShowUploadModal(false);
        setSelectedFile(null);
        fetchData();
      } else {
        showError('Upload Failed', 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload Error', 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle conduct note creation
  const handleConductNote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/files/conduct-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          className: 'Unknown', // You might want to get this from student data
          streamName: 'Unknown',
          ...conductForm,
          teacherId: user?.id?.toString() || '',
          teacherName: user?.name || 'Unknown'
        })
      });

      if (response.ok) {
        showSuccess('Conduct Note Added', 'Conduct note created successfully');
        setShowConductModal(false);
        setConductForm({ noteType: 'positive', title: '', description: '', severity: 'low' });
        fetchData();
      } else {
        showError('Failed', 'Failed to create conduct note');
      }
    } catch (error) {
      console.error('Conduct note error:', error);
      showError('Error', 'Failed to create conduct note');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (id: number, type: 'photo' | 'document' | 'conduct') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setIsLoading(true);
    try {
      let endpoint = '';
      if (type === 'photo') endpoint = `/files/photos/${id}`;
      else if (type === 'document') endpoint = `/files/documents/${id}`;
      else if (type === 'conduct') endpoint = `/files/conduct-notes/${id}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Deleted', 'Item deleted successfully');
        fetchData();
      } else {
        showError('Delete Failed', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Delete Error', 'Failed to delete item');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'achievement': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Files & Records</h2>
          <p className="text-gray-600">Manage photos, documents, and conduct notes for {studentName}</p>
        </div>
        <AIRefreshButton
          onClick={fetchData}
          isLoading={isLoading}
          variant="data"
          size="sm"
        >
          Refresh
        </AIRefreshButton>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-2">
          {[
            { id: 'photos', label: 'Photos', icon: Camera, count: photos.length },
            { id: 'documents', label: 'Documents', icon: Document, count: documents.length },
            { id: 'conduct', label: 'Conduct Notes', icon: FileText, count: conductNotes.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {activeTab === 'photos' && 'Student Photos'}
            {activeTab === 'documents' && 'Student Documents'}
            {activeTab === 'conduct' && 'Conduct Notes'}
          </h3>
          <div className="flex space-x-2">
            {activeTab === 'conduct' ? (
              <button
                onClick={() => setShowConductModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </button>
            ) : (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {activeTab === 'photos' ? 'Photo' : 'Document'}
              </button>
            )}
          </div>
        </div>

        {/* Data Display */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'photos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{photo.photoType}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => window.open(`${API_BASE_URL}/files/photos/${photo.id}/download`)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(photo.id, 'photo')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{photo.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(photo.fileSize)}</p>
                    <p className="text-xs text-gray-500">{new Date(photo.uploadedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Document className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                        <p className="text-sm text-gray-600">{doc.documentType} • {formatFileSize(doc.fileSize)}</p>
                        <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.isVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                      <button
                        onClick={() => window.open(`${API_BASE_URL}/files/documents/${doc.id}/download`)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, 'document')}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'conduct' && (
              <div className="space-y-4">
                {conductNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNoteTypeColor(note.noteType)}`}>
                          {note.noteType}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(note.severity)}`}>
                          {note.severity}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(note.id, 'conduct')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{note.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {note.teacherName}</span>
                      <span>{new Date(note.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {((activeTab === 'photos' && photos.length === 0) ||
              (activeTab === 'documents' && documents.length === 0) ||
              (activeTab === 'conduct' && conductNotes.length === 0)) && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  {activeTab === 'photos' && <Camera className="h-12 w-12 mx-auto" />}
                  {activeTab === 'documents' && <Document className="h-12 w-12 mx-auto" />}
                  {activeTab === 'conduct' && <FileText className="h-12 w-12 mx-auto" />}
                </div>
                <p className="text-gray-600 mb-4">No {activeTab} found for this student</p>
                <button
                  onClick={() => activeTab === 'conduct' ? setShowConductModal(true) : setShowUploadModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add {activeTab === 'conduct' ? 'Conduct Note' : activeTab === 'photos' ? 'Photo' : 'Document'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload {activeTab === 'photos' ? 'Photo' : 'Document'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept={activeTab === 'photos' ? 'image/*' : '*'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {activeTab === 'photos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo Type
                  </label>
                  <select
                    value={uploadData.photoType}
                    onChange={(e) => setUploadData({ ...uploadData, photoType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="profile">Profile Photo</option>
                    <option value="family">Family Photo</option>
                    <option value="passport">Passport Photo</option>
                    <option value="document">Document Photo</option>
                  </select>
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={uploadData.documentType}
                    onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="birth_certificate">Birth Certificate</option>
                    <option value="report_card">Report Card</option>
                    <option value="medical">Medical Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conduct Note Modal */}
      {showConductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Conduct Note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type
                </label>
                <select
                  value={conductForm.noteType}
                  onChange={(e) => setConductForm({ ...conductForm, noteType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="warning">Warning</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={conductForm.severity}
                  onChange={(e) => setConductForm({ ...conductForm, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={conductForm.title}
                  onChange={(e) => setConductForm({ ...conductForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter note title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={conductForm.description}
                  onChange={(e) => setConductForm({ ...conductForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter note description"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConductModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConductNote}
                  disabled={!conductForm.title || !conductForm.description || isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFilesManager;
