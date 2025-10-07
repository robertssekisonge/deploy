import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoUpload: (fileData: string, fileType: string) => void;
  onPhotoRemove?: () => void;
  currentPhotoUrl?: string;
  photoType: 'profile' | 'family' | 'passport' | 'student-profile';
  userId?: string;
  studentId?: string;
  className?: string;
  disabled?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoUpload,
  onPhotoRemove,
  currentPhotoUrl,
  photoType,
  userId,
  studentId,
  className = '',
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Please select an image smaller than 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // Convert to base64 and call the upload function
      onPhotoUpload(result, file.type);
      setIsUploading(false);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
    if (onPhotoRemove) {
      onPhotoRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPhotoTypeLabel = (): string => {
    switch (photoType) {
      case 'profile':
        return 'Profile Photo';
      case 'family':
        return 'Family Photo';
      case 'passport':
        return 'Passport Photo';
      case 'student-profile':
        return 'Student Profile Photo';
      default:
        return 'Photo';
    }
  };

  const getPhotoTypeIcon = () => {
    switch (photoType) {
      case 'profile':
        return <Camera className="h-6 w-6" />;
      case 'family':
        return <Camera className="h-6 w-6" />;
      case 'passport':
        return <Camera className="h-6 w-6" />;
      case 'student-profile':
        return <Camera className="h-6 w-6" />;
      default:
        return <Camera className="h-6 w-6" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {getPhotoTypeLabel()}
        </h3>
        <p className="text-sm text-gray-500">
          Upload a clear, high-quality image
        </p>
      </div>

      {/* Current Photo Display */}
      {previewUrl && (
        <div className="relative">
          <div className="aspect-square w-32 mx-auto rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={previewUrl}
              alt="Photo preview"
              className="w-full h-full object-cover"
            />
          </div>
          {onPhotoRemove && (
            <button
              onClick={handleRemovePhoto}
              disabled={disabled}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-3">
            {getPhotoTypeIcon()}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragging ? 'Drop your photo here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span>Photo uploaded successfully!</span>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading photo...</span>
        </div>
      )}

      {/* Upload Button (if no preview) */}
      {!previewUrl && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Choose Photo</span>
        </button>
      )}
    </div>
  );
};

export default PhotoUpload;
