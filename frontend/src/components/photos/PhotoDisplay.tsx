import React, { useState } from 'react';
import { Camera, User, Users, GraduationCap } from 'lucide-react';

interface PhotoDisplayProps {
  photoUrl?: string | null;
  photoType?: 'profile' | 'family' | 'passport' | 'student-profile';
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  rounded?: boolean;
  bordered?: boolean;
}

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
  photoUrl,
  photoType = 'profile',
  alt = 'Photo',
  size = 'md',
  className = '',
  showUploadButton = false,
  onUploadClick,
  rounded = true,
  bordered = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getDefaultIcon = () => {
    switch (photoType) {
      case 'profile':
        return <User className="h-full w-full text-gray-400" />;
      case 'family':
        return <Users className="h-full w-full text-gray-400" />;
      case 'passport':
        return <Camera className="h-full w-full text-gray-400" />;
      case 'student-profile':
        return <GraduationCap className="h-full w-full text-gray-400" />;
      default:
        return <User className="h-full w-full text-gray-400" />;
    }
  };

  const getDefaultBackground = () => {
    switch (photoType) {
      case 'profile':
        return 'bg-blue-100';
      case 'family':
        return 'bg-green-100';
      case 'passport':
        return 'bg-purple-100';
      case 'student-profile':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const containerClasses = `
    ${sizeClasses[size]}
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    ${bordered ? 'border-2 border-gray-200' : ''}
    overflow-hidden
    relative
    flex-shrink-0
    ${className}
  `.trim();

  if (!photoUrl || imageError) {
    return (
      <div className={`${containerClasses} ${getDefaultBackground()} flex items-center justify-center`}>
        {getDefaultIcon()}
        {showUploadButton && onUploadClick && (
          <button
            onClick={onUploadClick}
            className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Upload photo"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}
      
      <img
        src={photoUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      
      {showUploadButton && onUploadClick && (
        <button
          onClick={onUploadClick}
          className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Change photo"
        >
          <Camera className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
};

export default PhotoDisplay;
