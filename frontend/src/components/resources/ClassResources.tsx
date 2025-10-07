import React, { useState } from 'react';
import { useData, Resource } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Plus, Trash2, Download, BookOpen, Eye, X, Lock, Upload, Filter, RefreshCw } from 'lucide-react';

const API_BASE_URL = '/api';

function base64ToBlobUrl(base64: string, type: string): string {
  const arr = base64.split(',');
  const match = arr[0].match(/:(.*?);/);
  const mime = match ? match[1] : type;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return URL.createObjectURL(blob);
}

const ClassResources: React.FC = () => {
  const { user } = useAuth();
  const { classes, resources, addResource, deleteResource, fetchResources } = useData();
  const { showSuccess, showError } = useNotification();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [fitToView, setFitToView] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isImagePreview, setIsImagePreview] = useState(false);

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    // Only restrict TEACHER and SUPER_TEACHER; all other roles can see everything
    if (user?.role?.toLowerCase() !== 'teacher' && user?.role?.toLowerCase() !== 'super_teachER' && user?.role?.toLowerCase() !== 'super-teacher') {
      return true; // Admin and other roles can see everything
    }

    // Check for new assignedClasses structure
    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    // Fallback to old assignedStream logic
    if (user.assignedStream) {
      return true;
    }

    return false;
  };

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Class Resources</h1>
          </div>
            
          {/* Restricted Access Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Access Restricted</h2>
            <p className="text-yellow-700 mb-4">
              You haven't been assigned to any classes or streams yet. Please contact an administrator to get assigned.
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>What you need:</strong> Class and stream assignments to access class resources.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Determine allowed classes for upload/view
  let allowedClassIds: string[] = [];
  let allowedClassNames: string[] = [];
  if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser') {
    allowedClassIds = classes.map(cls => cls.id);
    allowedClassNames = classes.map(cls => cls.name);
  } else if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
    // Parse assignedClasses from the new structure
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
    
    // Prefer classId when provided; fall back to mapping className to id
    const idsFromAssignments = assignedClasses
      .map((assignment: any) => assignment.classId)
      .filter(Boolean);
    const namesFromAssignments = assignedClasses
      .map((assignment: any) => assignment.className)
      .filter(Boolean);

    if (idsFromAssignments.length) {
      allowedClassIds = idsFromAssignments;
    } else if (namesFromAssignments.length) {
      const nameToId = new Map(classes.map(c => [c.name, c.id] as const));
      allowedClassIds = namesFromAssignments.map((n: string) => nameToId.get(n)).filter(Boolean) as string[];
      allowedClassNames = namesFromAssignments;
    }
  }

  const handleUpload = async () => {
    if (!file || !title || selectedClasses.length === 0) return;
    setUploading(true);
    
    try {
      await addResource({
        title,
        fileType: '', // will be set in context
        classIds: selectedClasses,
        uploadedBy: user?.name || '',
      }, file);
      
      // Clear form after successful upload
      setFile(null);
      setTitle('');
      setSelectedClasses([]);
      
      // Show success message
      const successMessage = `Resource "${title}" uploaded successfully and saved permanently! It will be available to all teachers assigned to the selected classes.`;
      showSuccess(
        '📚 Resource Uploaded!',
        successMessage
      );
    } catch (error) {
      console.error('Error uploading resource:', error);
      showError(
        '❌ Upload Failed',
        'Failed to upload resource. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      deleteResource(id);
      showSuccess(
        '🗑️ Resource Deleted',
        'The resource has been successfully deleted from the system.'
      );
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchResources();
      showSuccess(
        '🔄 Resources Refreshed',
        'Resource list has been updated successfully.'
      );
    } catch (error) {
      console.error('Error refreshing resources:', error);
      showError(
        '❌ Refresh Failed',
        'Failed to refresh resources. Please try again.'
      );
    }
  };

  const filteredResources = resources.filter(r => {
    // For admins, show all resources
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser') {
      return filterClass ? r.classIds.includes(filterClass) : true;
    }
    
    // For teachers, only show resources for their assigned classes
    const hasAccessById = allowedClassIds.some(cid => r.classIds.includes(cid));
    // If resource stores class IDs, above works. If it stores names (legacy), map IDs->names and compare.
    let hasAccessByName = false;
    if (!hasAccessById && allowedClassNames.length) {
      const idToName = new Map(classes.map(c => [c.id, c.name] as const));
      const resourceClassNames = r.classIds.map((id: string) => idToName.get(id) || id);
      hasAccessByName = resourceClassNames.some(name => allowedClassNames.includes(String(name)));
    }
    const hasAccess = hasAccessById || hasAccessByName;
    const matchesFilter = filterClass ? r.classIds.includes(filterClass) : true;
    
    return hasAccess && matchesFilter;
  });

      const canDelete = (r: Resource) => user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser' || r.uploadedBy === user?.name;

  const handlePreview = (url: string) => {
    setFitToView(true);
    setZoom(1);
    setPreviewUrl(url);
    setPreviewError(false); // Reset error state when opening new preview
  };

  const handleViewResource = async (resource: Resource) => {
    console.log('🔍 View button clicked for resource:', resource);
    try {
      // First verify the resource exists on the server
      const checkResponse = await fetch(`${API_BASE_URL}/resources/${resource.id}`);
      if (!checkResponse.ok) {
        throw new Error(`Resource ${resource.id} not found on server`);
      }

      if (resource.fileUrl) {
        console.log('📁 Using fileUrl:', resource.fileUrl);
        // For file URLs, use preview modal
        const fileExtension = resource.fileType?.toLowerCase() || '';
        console.log('📄 File extension:', fileExtension);
        
        // For all file types, try to show in preview modal
        console.log('✅ Opening preview modal for:', resource.title);
        setFitToView(true);
        setZoom(1);
        setIsImagePreview((resource.fileType || '').toLowerCase().startsWith('image'));
        setPreviewUrl(resource.fileUrl);
      } else if (resource.fileData) {
        console.log('📁 Using fileData (base64)');
        // For base64 data, create blob URL and show in preview modal
        const fileExtension = resource.fileType?.toLowerCase() || '';
        
        const blobUrl = base64ToBlobUrl(resource.fileData, resource.fileType);
        console.log('✅ Created blob URL, opening preview modal:', blobUrl);
        setFitToView(true);
        setZoom(1);
        setIsImagePreview((resource.fileType || '').toLowerCase().startsWith('image'));
        setPreviewUrl(blobUrl);
      } else {
        console.log('❌ No fileUrl or fileData available');
        showError(
          '📄 No Preview Available',
          'No file data available for preview. Please download the resource instead.'
        );
      }
    } catch (error) {
      console.error('❌ Error viewing resource:', error);
      showError(
        '❌ Preview Failed',
        `Resource ${resource.id} may have been deleted from the server. Please refresh the page to update the resource list.`
      );
    }
  };

  const handleDownloadResource = (resource: Resource) => {
    try {
      if (resource.id) {
        // Use the download endpoint for actual downloads
        const downloadUrl = `${API_BASE_URL}/resources/${resource.id}/download`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = resource.title || `resource.${resource.fileType?.split('/')[1] || 'file'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(`📥 Downloading: ${resource.title}`);
      } else if (resource.fileData) {
        // Fallback for base64 data
        const blobUrl = base64ToBlobUrl(resource.fileData, resource.fileType);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = resource.title || `resource.${resource.fileType?.split('/')[1] || 'file'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(`�세 Downloading: ${resource.title}`);
      }
    } catch (error) {
      console.error('❌ Error downloading resource:', error);
      showError(
        '❌ Download Failed',
        'Failed to download resource. Please try again.'
      );
    }
  };

  // Debug logs
  console.log('Current user:', user);
  console.log('Allowed class IDs:', allowedClassIds);
  console.log('All resources:', resources);

  return (
    <div className="space-y-8">
      {/* AI-Generated Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                📚 Class Resources
              </h1>
              <p className="text-purple-100 mt-2 text-lg">
                Manage and access educational materials for your classes
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 backdrop-blur-sm transition-all duration-200 flex items-center space-x-2"
              title="Refresh resources list"
            >
              <RefreshCw className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Refresh</span>
            </button>
            <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                {resources.length} Resources Available
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI-Generated Upload Section - Only for Admins */}
      {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser') && (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl backdrop-blur-sm">
          {/* AI-Generated Upload Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-2xl p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  📤 Upload Resource
                </h2>
                <p className="text-blue-100 text-sm">Add new educational materials for your classes</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                Resource Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-blue-200/50 shadow-lg focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-blue-50/30 px-4 py-3 text-gray-800 font-medium transition-all duration-200 hover:shadow-xl"
                placeholder="Enter resource title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 text-purple-600 mr-2" />
                Select Classes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {classes.map(cls => (
                  <label key={cls.id} className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-2 border-gray-200/50 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                <Upload className="h-4 w-4 text-green-600 mr-2" />
                File Upload
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border-2 border-blue-200/50 shadow-lg focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-green-50/30 px-4 py-3 text-gray-800 font-medium transition-all duration-200 hover:shadow-xl"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
                />
                {file && (
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-3">
                    <p className="text-sm font-medium text-green-800 flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Selected: {file.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!file || !title || selectedClasses.length === 0 || uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>{uploading ? 'Uploading...' : 'Upload Resource'}</span>
            </button>
          </div>
        </div>
      )}

      {/* AI-Generated Teacher Notice */}
      {(user?.role === 'USER' || user?.role === 'SUPER_TEACHER') && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
                📚 Resource Access
              </h3>
              {allowedClassIds.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-blue-800 font-medium">
                    You can view and download resources for your assigned classes. Only administrators can upload new resources.
                  </p>
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-700 text-sm font-medium">
                      <strong>Your assigned classes:</strong> {classes.filter(cls => allowedClassIds.includes(cls.id)).map(cls => cls.name).join(', ')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-blue-800 font-medium">
                  You don't have any assigned classes yet. Please contact an administrator to assign classes to your account.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI-Generated Filter Section */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 border-2 border-purple-200/50 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* AI-Generated Filter Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🔍 Filter Resources
              </h2>
              <p className="text-purple-100 text-sm">Filter resources by class to find what you need</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                <Filter className="h-4 w-4 text-purple-600 mr-2" />
                Filter by Class
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full rounded-xl border-2 border-purple-200/50 shadow-lg focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-4 py-3 text-gray-800 font-medium transition-all duration-200 hover:shadow-xl"
              >
                <option value="">All Classes</option>
                {classes
                  .filter(cls => user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superuser' || allowedClassIds.includes(cls.id))
                  .map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* AI-Generated Resource List */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 border-2 border-indigo-200/50 rounded-2xl shadow-2xl backdrop-blur-sm">
        {/* AI-Generated Resource List Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  📚 Available Resources
                </h2>
                <p className="text-indigo-100 text-sm">{filteredResources.length} resources found</p>
              </div>
            </div>
          </div>
        </div>
        
        {filteredResources.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gradient-to-r from-gray-100 to-blue-100 rounded-2xl p-8 max-w-md mx-auto">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Resources Found</h3>
              <p className="text-gray-500">No resources match your current filter criteria</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/50">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${
                      resource.fileType.includes('pdf') ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      resource.fileType.includes('docx') || resource.fileType.includes('doc') ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      resource.fileType.includes('jpg') || resource.fileType.includes('jpeg') || resource.fileType.includes('png') ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      resource.fileType.includes('txt') ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                      'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      {resource.fileType.split('/')[1]?.toUpperCase() || resource.fileType.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.title}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 font-medium">
                          📤 Uploaded by {resource.uploadedBy} • 📅 {new Date(resource.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1 inline-block">
                          🏫 Classes: {resource.classIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'All Classes'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleViewResource(resource)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDownloadResource(resource)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    {canDelete(resource) && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI-Generated Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl max-w-3xl w-full h-auto backdrop-blur-sm">
            {/* AI-Generated Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                      👁️ Resource Preview
                    </h3>
                    <p className="text-blue-100 text-sm">Preview your resource before downloading</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setFitToView(true); }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${fitToView ? 'bg-white/90 text-blue-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                    title="Fit to view"
                  >
                    Fit
                  </button>
                  <button
                    onClick={() => { setFitToView(false); setZoom(1); }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${!fitToView ? 'bg-white/90 text-blue-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                    title="Show at original size"
                  >
                    Original
                  </button>
                  {!fitToView && (
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => setZoom(z => Math.max(0.1, +(z - 0.25).toFixed(2)))}
                        className="px-2 py-1 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white"
                        title="Zoom out"
                      >
                        −
                      </button>
                      <span className="px-2 py-1 rounded-lg text-sm font-semibold bg-white/90 text-blue-700 min-w-[56px] text-center">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                        className="px-2 py-1 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white"
                        title="Zoom in"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white"
                        title="Reset to 100%"
                      >
                        100%
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-2 border-gray-200/50 rounded-xl">
                <div className={`w-full ${fitToView ? 'h-[70vh] overflow-hidden' : 'max-h-[70vh] overflow-auto'} flex items-center justify-center`}>
                  {previewUrl ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                      {/* Render image when type is image regardless of URL extension */}
                      {isImagePreview ? (
                        <img 
                          src={previewUrl} 
                          alt="Resource preview"
                          className={`${fitToView ? 'max-w-full max-h-full w-auto h-auto object-contain' : 'max-w-none max-h-none w-auto h-auto'}`}
                          style={!fitToView ? { transform: `scale(${zoom})`, transformOrigin: 'top left' } : undefined}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', previewUrl);
                            setPreviewError(false);
                          }}
                          onError={() => {
                            console.log('❌ Image failed to load:', previewUrl);
                            setPreviewError(true);
                          }}
                        />
                      ) : (
                        /* Try iframe for PDFs and other content */
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-full border-0"
                          onLoad={() => {
                            console.log('✅ Iframe loaded successfully:', previewUrl);
                            setPreviewError(false);
                          }}
                          onError={() => {
                            console.log('❌ Iframe failed to load:', previewUrl);
                            setPreviewError(true);
                          }}
                        />
                      )}
                      
                      {/* Error overlay */}
                      {previewError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                          <div className="text-center text-red-600 p-6">
                         <div className="text-4xl mb-3">❌</div>
                            <p className="text-lg font-medium mb-2">File Not Found</p>
                            <p className="text-sm text-gray-600 mb-4">
                              The resource file could not be loaded for preview.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left text-xs">
                              <p className="font-medium mb-1">Troubleshooting:</p>
                              <ul className="space-x-1 text-gray-600">
                                <li>• File may have been deleted or moved</li>
                                <li>• Server uploads directory may be missing</li>
                                <li>• File permissions may be incorrect</li>
                                <li>• Try downloading the file instead</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-lg">No preview available</p>
                      <p className="text-sm">Please download the file to view it</p>
                    </div>
                  )}
                </div>
              </div>
              
               {/* Preview only - no download buttons */}
               <div className="mt-4 text-center">
                 <p className="text-sm text-gray-600">
                   This is a preview only. Use the Download button in the main interface to save the file.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassResources; 