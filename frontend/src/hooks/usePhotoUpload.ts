import { useState } from 'react';

interface PhotoUploadResponse {
  success: boolean;
  photo: string;
  photoUrl: string;
  user?: any;
  student?: any;
  message?: string;
  warning?: string;
}

interface UsePhotoUploadReturn {
  uploadPhoto: (fileData: string, fileType: string, endpoint: string) => Promise<PhotoUploadResponse>;
  isUploading: boolean;
  error: string | null;
  success: string | null;
  resetStatus: () => void;
}

const usePhotoUpload = (): UsePhotoUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadPhoto = async (
    fileData: string, 
    fileType: string, 
    endpoint: string
  ): Promise<PhotoUploadResponse> => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData,
          fileType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      if (data.success) {
        setSuccess('Photo uploaded successfully!');
        return data;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    uploadPhoto,
    isUploading,
    error,
    success,
    resetStatus,
  };
};

export default usePhotoUpload;
