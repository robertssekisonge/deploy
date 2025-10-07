import React from 'react';
import { Lock, AlertTriangle, Info, X } from 'lucide-react';
import { PrivilegeName } from '../types';

interface AccessDeniedNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  privilege?: PrivilegeName;
  action?: string;
  severity?: 'warning' | 'error' | 'info';
}

const AccessDeniedNotification: React.FC<AccessDeniedNotificationProps> = ({
  isOpen,
  onClose,
  privilege,
  action,
  severity = 'error'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
      case 'info':
        return <Info className="h-16 w-16 text-blue-500" />;
      default:
        return <Lock className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (severity) {
      case 'warning':
        return 'Access Restricted';
      case 'info':
        return 'Additional Privileges Required';
      default:
        return 'Access Denied';
    }
  };

  const getMessage = () => {
    if (action) {
      return `You don't have permission to ${action}. Please contact an administrator to request access.`;
    }
    if (privilege) {
      return `You don't have the required privilege: ${privilege.replace(/_/g, ' ')}. Please contact an administrator to request access.`;
    }
    return 'You don't have the required permissions to access this feature. Please contact an administrator to request access.';
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (severity) {
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className={`${getBackgroundColor()} border rounded-xl p-8 max-w-md mx-4 shadow-xl`}>
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          
          {/* Title */}
          <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
            {getTitle()}
          </h2>
          
          {/* Message */}
          <p className={`${getTextColor()} mb-6`}>
            {getMessage()}
          </p>
          
          {/* Additional Info */}
          <div className={`${getBackgroundColor().replace('50', '100')} rounded-lg p-4 mb-6`}>
            <p className={`text-sm ${getTextColor()}`}>
              <strong>What you need:</strong> Contact an administrator to assign you the necessary privileges for this role.
            </p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`px-6 py-2 ${getIconColor()} bg-white border-2 ${getIconColor().replace('text-', 'border-')} rounded-lg hover:bg-gray-50 transition-colors duration-200`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedNotification;
