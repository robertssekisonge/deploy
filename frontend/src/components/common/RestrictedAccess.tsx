import React from 'react';
import { Lock, AlertTriangle, Info, UserX } from 'lucide-react';

interface RestrictedAccessProps {
  title?: string;
  message?: string;
  details?: string;
  severity?: 'warning' | 'error' | 'info';
  showContactAdmin?: boolean;
  className?: string;
}

const RestrictedAccess: React.FC<RestrictedAccessProps> = ({
  title = "Access Restricted",
  message = "You don't have the required permissions to access this feature.",
  details = "Please contact an administrator to request access.",
  severity = 'warning',
  showContactAdmin = true,
  className = ""
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <UserX className="h-16 w-16 text-red-500" />;
      case 'info':
        return <Info className="h-16 w-16 text-blue-500" />;
      default:
        return <Lock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getTextColor = () => {
    switch (severity) {
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-yellow-800';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'error':
        return 'text-red-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      </div>
        
      {/* Restricted Access Message */}
      <div className={`${getBackgroundColor()} border rounded-xl p-8 text-center`}>
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
          {title}
        </h2>
        
        <p className={`${getTextColor()} mb-4`}>
          {message}
        </p>
        
        {showContactAdmin && (
          <div className={`${getBackgroundColor().replace('50', '100')} rounded-lg p-4 max-w-md mx-auto`}>
            <p className={`text-sm ${getTextColor()}`}>
              <strong>What you need:</strong> {details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictedAccess;
