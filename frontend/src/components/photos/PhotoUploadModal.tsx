import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUpload: (fileData: string, fileType: string) => void;
  photoType: 'profile' | 'family' | 'passport' | 'student-profile';
  userId?: string;
  studentId?: string;
  currentPhotoUrl?: string;
  title?: string;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onPhotoUpload,
  photoType,
  userId,
  studentId,
  currentPhotoUrl,
  title
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePhotoUpload = async (fileData: string, fileType: string) => {
    setIsUploading(true);
    try {
      await onPhotoUpload(fileData, fileType);
      setUploadSuccess(true);
      
      // Close modal after successful upload
      setTimeout(() => {
        setUploadSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    if (title) return title;
    
    switch (photoType) {
      case 'profile':
        return 'Upload Profile Photo';
      case 'family':
        return 'Upload Family Photo';
      case 'passport':
        return 'Upload Passport Photo';
      case 'student-profile':
        return 'Upload Student Profile Photo';
      default:
        return 'Upload Photo';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {getModalTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {uploadSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Photo Uploaded Successfully!
              </h3>
              <p className="text-gray-500">
                Your photo has been uploaded and saved.
              </p>
            </div>
          ) : (
            <PhotoUpload
              onPhotoUpload={handlePhotoUpload}
              currentPhotoUrl={currentPhotoUrl}
              photoType={photoType}
              userId={userId}
              studentId={studentId}
              disabled={isUploading}
            />
          )}
        </div>

        {/* Footer */}
        {!uploadSuccess && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            {isUploading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUploadModal;
