import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

interface AINotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const AINotification: React.FC<AINotificationProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-white" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-white" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-white" />;
      case 'info':
        return <Info className="h-6 w-6 text-white" />;
      default:
        return <Info className="h-6 w-6 text-white" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'success':
        return 'from-green-500 via-emerald-500 to-teal-500';
      case 'error':
        return 'from-red-500 via-rose-500 to-pink-500';
      case 'warning':
        return 'from-yellow-500 via-orange-500 to-red-500';
      case 'info':
        return 'from-blue-500 via-indigo-500 to-purple-500';
      default:
        return 'from-blue-500 via-indigo-500 to-purple-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-right duration-300">
      <div 
        className={`bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 w-[280px] transform transition-all duration-300 ${
          isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
              {getIcon()}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium text-sm leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-100 ease-linear"
            style={{
              width: isExiting ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AINotification;