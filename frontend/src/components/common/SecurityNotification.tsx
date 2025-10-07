import React from 'react';
import { Shield, AlertTriangle, CheckCircle, X, Key, Lock } from 'lucide-react';

interface SecurityNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'breach-warning' | 'weak-password' | 'security-tip' | 'password-changed';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const SecurityNotification: React.FC<SecurityNotificationProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  actionText,
  onAction
}) => {
  if (!isOpen) return null;

  const getNotificationConfig = () => {
    switch (type) {
      case 'breach-warning':
        return {
          bgGradient: 'from-red-50 via-orange-50 to-yellow-50',
          borderColor: 'border-red-200',
          iconBg: 'from-red-500 to-orange-500',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          titleColor: 'from-red-600 to-orange-600',
          buttonGradient: 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
          emoji: '🚨'
        };
      case 'weak-password':
        return {
          bgGradient: 'from-yellow-50 via-orange-50 to-red-50',
          borderColor: 'border-yellow-200',
          iconBg: 'from-yellow-500 to-orange-500',
          icon: Shield,
          iconColor: 'text-yellow-600',
          titleColor: 'from-yellow-600 to-orange-600',
          buttonGradient: 'from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
          emoji: '⚠️'
        };
      case 'security-tip':
        return {
          bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
          borderColor: 'border-blue-200',
          iconBg: 'from-blue-500 to-purple-500',
          icon: Key,
          iconColor: 'text-blue-600',
          titleColor: 'from-blue-600 to-purple-600',
          buttonGradient: 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          emoji: '💡'
        };
      case 'password-changed':
        return {
          bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
          borderColor: 'border-green-200',
          iconBg: 'from-green-500 to-emerald-500',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          titleColor: 'from-green-600 to-emerald-600',
          buttonGradient: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
          emoji: '✅'
        };
      default:
        return {
          bgGradient: 'from-gray-50 via-blue-50 to-indigo-50',
          borderColor: 'border-gray-200',
          iconBg: 'from-gray-500 to-blue-500',
          icon: Shield,
          iconColor: 'text-gray-600',
          titleColor: 'from-gray-600 to-blue-600',
          buttonGradient: 'from-gray-500 to-blue-500 hover:from-gray-600 hover:to-blue-600',
          emoji: '🔒'
        };
    }
  };

  const config = getNotificationConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-gray-900/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${config.bgGradient} rounded-3xl p-8 shadow-2xl w-full max-w-lg border-2 ${config.borderColor} backdrop-blur-xl transform transition-all duration-300 hover:scale-105`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse`}>
              <IconComponent className={`h-8 w-8 text-white drop-shadow-lg`} />
            </div>
            <div>
              <h2 className={`text-2xl font-black bg-gradient-to-r ${config.titleColor} bg-clip-text text-transparent`}>
                {config.emoji} {title}
              </h2>
              <p className="text-sm text-gray-600 font-medium">🔒 Security Alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30 shadow-lg">
            <p className="text-gray-800 leading-relaxed font-medium text-lg">{message}</p>
          </div>
        </div>

        {/* Security Tips */}
        {type === 'breach-warning' && (
          <div className="mb-6 bg-gradient-to-r from-red-50/80 via-red-100/50 to-pink-50/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200/50 shadow-lg">
            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              🛡️ Security Recommendations:
            </h3>
            <ul className="text-sm text-red-700 space-y-2 font-medium">
              <li className="flex items-center gap-2">• Use a unique password for each account</li>
              <li className="flex items-center gap-2">• Enable two-factor authentication</li>
              <li className="flex items-center gap-2">• Consider using a password manager</li>
              <li className="flex items-center gap-2">• Regularly update your passwords</li>
            </ul>
          </div>
        )}

        {type === 'weak-password' && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50/80 via-yellow-100/50 to-orange-50/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-200/50 shadow-lg">
            <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              🔐 Password Requirements:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-2 font-medium">
              <li className="flex items-center gap-2">• At least 8 characters long</li>
              <li className="flex items-center gap-2">• Mix of uppercase and lowercase letters</li>
              <li className="flex items-center gap-2">• Include numbers and special characters</li>
              <li className="flex items-center gap-2">• Avoid common words or patterns</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Dismiss
          </button>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r ${config.buttonGradient} text-white font-bold transition-all duration-200 hover:scale-105 shadow-xl flex items-center space-x-2`}
            >
              <span>{actionText}</span>
              <div className="h-4 w-4 bg-white/20 rounded-full"></div>
            </button>
          )}
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full animate-pulse"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-white/15 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotification;
