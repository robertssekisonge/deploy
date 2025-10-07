import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Trash2, Download, Eye, Search, Filter, Camera, Users, GraduationCap, User, BarChart3, Scissors, Lock } from 'lucide-react';

interface PhotoItem {
  id: string;
  filename: string;
  type: 'profile' | 'family' | 'passport' | 'student-profile';
  userId?: string;
  studentId?: string;
  userName?: string;
  studentName?: string;
  uploadDate: Date;
  fileSize: number;
  url: string;
}

interface PhotoStats {
  database: {
    userPhotos: number;
    studentProfilePhotos: number;
    familyPhotos: number;
    passportPhotos: number;
    totalReferenced: number;
  };
  fileSystem: {
    totalFiles: number;
    totalSize: number;
    totalSizeMB: number;
  };
  storageBreakdown: {
    profile: { count: number; size: number };
    family: { count: number; size: number };
    passport: { count: number; size: number };
    studentProfile: { count: number; size: number };
    unknown: { count: number; size: number };
  };
  orphanedPhotos: number;
}

const PhotoManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useData();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<PhotoStats | null>(null);
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    if (currentUser?.role?.toLowerCase() !== 'user' && currentUser?.role?.toLowerCase() !== 'super-teacher') {
      return true; // Admin and other roles can see everything
    }

    // Check for new assignedClasses structure
    if (currentUser.assignedClasses) {
      try {
        const assignedClasses = typeof currentUser.assignedClasses === 'string' 
          ? JSON.parse(currentUser.assignedClasses) 
          : currentUser.assignedClasses;
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    // Fallback to old assignedStream logic
    if (currentUser.assignedStream) {
      return true;
    }

    return false;
  };

  // If teacher has no assigned classes, show restricted view
  if (currentUser?.role === 'USER' || currentUser?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Photo Management</h1>
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
                <strong>What you need:</strong> Class and stream assignments to access photo management.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fetch photos from the API
  const fetchPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      
      if (data.success) {
        setPhotos(data.photos);
      } else {
        throw new Error(data.error || 'Failed to fetch photos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      addNotification('Error fetching photos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch photo statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/photos/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch photo stats:', err);
    }
  };

  // Clean up orphaned photos
  const handleCleanupOrphaned = async () => {
    if (!stats?.orphanedPhotos || stats.orphanedPhotos === 0) return;
    
    setIsCleanupLoading(true);
    try {
      const response = await fetch('/api/photos/cleanup-orphaned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        addNotification(`Successfully cleaned up ${data.cleanedCount} orphaned photos`, 'success');
        // Refresh photos and stats
        await Promise.all([fetchPhotos(), fetchStats()]);
      } else {
        throw new Error(data.error || 'Failed to clean up orphaned photos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clean up orphaned photos';
      addNotification(errorMessage, 'error');
    } finally {
      setIsCleanupLoading(false);
    }
  };

  // Fetch photos and stats on component mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Fetch stats when showStats changes
  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  // Filter photos based on search term and type
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (photo.userName && photo.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (photo.studentName && photo.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || photo.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Find the photo to get the filename
      const photo = photos.find(p => p.id === photoId);
      if (!photo) {
        throw new Error('Photo not found');
      }
      
      const response = await fetch(`/api/photos/${photo.filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        addNotification('Photo deleted successfully', 'success');
        // Refresh the photo list
        await fetchPhotos();
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      addNotification('Failed to delete photo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPhoto = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPhotoTypeIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'family':
        return <Users className="h-4 w-4" />;
      case 'passport':
        return <Camera className="h-4 w-4" />;
      case 'student-profile':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Camera className="h-4 w-4" />;
    }
  };

  const getPhotoTypeLabel = (type: string): string => {
    switch (type) {
      case 'profile':
        return 'Profile Photo';
      case 'family':
        return 'Family Photo';
      case 'passport':
        return 'Passport Photo';
      case 'student-profile':
        return 'Student Profile';
      default:
        return type;
    }
  };

  if (currentUser?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Photo Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage all profile, family, and passport photos in the system
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{showStats ? 'Hide Stats' : 'Show Stats'}</span>
                </button>
                <button
                  onClick={handleCleanupOrphaned}
                  disabled={isCleanupLoading || !stats?.orphanedPhotos}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  title={stats?.orphanedPhotos ? `Clean up ${stats.orphanedPhotos} orphaned photos` : 'No orphaned photos to clean up'}
                >
                  <Scissors className="h-4 w-4" />
                  <span>{isCleanupLoading ? 'Cleaning...' : 'Cleanup'}</span>
                </button>
                <button
                  onClick={fetchPhotos}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
                  <div className="text-sm text-gray-500">Total Photos</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Panel */}
          {showStats && stats && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">User Photos</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.database.userPhotos}</div>
                  <div className="text-xs text-gray-500">Referenced in DB</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Student Photos</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.database.studentProfilePhotos + stats.database.familyPhotos + stats.database.passportPhotos}
                  </div>
                  <div className="text-xs text-gray-500">Total student photos</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Storage</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{stats.fileSystem.totalSizeMB} MB</div>
                  <div className="text-xs text-gray-500">{stats.fileSystem.totalFiles} files</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Scissors className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Orphaned</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{stats.orphanedPhotos}</div>
                  <div className="text-xs text-gray-500">Unreferenced files</div>
                </div>
              </div>
              
              {stats.orphanedPhotos > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scissors className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        Found {stats.orphanedPhotos} orphaned photos that are not referenced in the database.
                      </span>
                    </div>
                    <button
                      onClick={handleCleanupOrphaned}
                      disabled={isCleanupLoading}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {isCleanupLoading ? 'Cleaning...' : 'Clean Up Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search photos by filename, user name, or student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="profile">Profile Photos</option>
                  <option value="family">Family Photos</option>
                  <option value="passport">Passport Photos</option>
                  <option value="student-profile">Student Profiles</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading photos...</h3>
                <p className="text-gray-500">Please wait while we fetch your photos.</p>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterType ? 'Try adjusting your search or filters.' : 'No photos have been uploaded yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* Photo Preview */}
                    <div className="aspect-square bg-gray-100 relative group">
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setShowPhotoModal(true);
                            }}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="View Full Size"
                          >
                            <Eye className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDownloadPhoto(photo)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            title="Delete"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Photo Info */}
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPhotoTypeIcon(photo.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {getPhotoTypeLabel(photo.type)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1 truncate" title={photo.filename}>
                        {photo.filename}
                      </h3>
                      
                      {photo.userName && (
                        <p className="text-sm text-gray-600 mb-1">
                          User: {photo.userName}
                        </p>
                      )}
                      
                      {photo.studentName && (
                        <p className="text-sm text-gray-600 mb-1">
                          Student: {photo.studentName}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(photo.fileSize)}</span>
                        <span>{photo.uploadDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedPhoto.filename}
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{getPhotoTypeLabel(selectedPhoto.type)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="ml-2 text-gray-600">{formatFileSize(selectedPhoto.fileSize)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Uploaded:</span>
                  <span className="ml-2 text-gray-600">{selectedPhoto.uploadDate.toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Filename:</span>
                  <span className="ml-2 text-gray-600 font-mono text-xs">{selectedPhoto.filename}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoManagement;
