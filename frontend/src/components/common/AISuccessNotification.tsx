import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Star, Trophy, Rocket, Heart, Zap, Crown, FileText } from 'lucide-react';

interface AISuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'report' | 'general' | 'achievement' | 'celebration';
  duration?: number;
}

const AISuccessNotification: React.FC<AISuccessNotificationProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'report',
  duration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'stable' | 'exit'>('enter');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setAnimationPhase('enter');
      
      // Auto close after duration
      const timer = setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'report':
        return <FileText className="h-8 w-8 text-emerald-500" />;
      case 'achievement':
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 'celebration':
        return <Crown className="h-8 w-8 text-purple-500" />;
      default:
        return <CheckCircle className="h-8 w-8 text-emerald-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'report':
        return 'from-emerald-500 via-teal-500 to-cyan-500';
      case 'achievement':
        return 'from-yellow-500 via-orange-500 to-red-500';
      case 'celebration':
        return 'from-purple-500 via-pink-500 to-rose-500';
      default:
        return 'from-emerald-500 via-teal-500 to-cyan-500';
    }
  };

  const getParticles = () => {
    return Array.from({ length: 12 }, (_, i) => (
      <div
        key={i}
        className={`absolute w-2 h-2 bg-white/30 rounded-full animate-ping`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1 + Math.random() * 2}s`
        }}
      />
    ));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animationPhase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />
      
      {/* Notification Card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-500 ${
          animationPhase === 'enter' 
            ? 'scale-50 opacity-0 translate-y-8' 
            : animationPhase === 'exit'
            ? 'scale-95 opacity-0 translate-y-4'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} rounded-3xl opacity-10`} />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {getParticles()}
        </div>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon with Animation */}
          <div className="relative mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getGradient()} shadow-lg transform transition-all duration-700 ${
              animationPhase === 'enter' ? 'scale-0 rotate-180' : 'scale-100 rotate-0'
            }`}>
              {getIcon()}
            </div>
            
            {/* Success Ring Animation */}
            <div className={`absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping ${
              animationPhase === 'enter' ? 'opacity-0' : 'opacity-100'
            }`} />
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold text-gray-900 mb-3 transform transition-all duration-700 delay-200 ${
            animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`text-gray-600 mb-6 leading-relaxed transform transition-all duration-700 delay-300 ${
            animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            {message}
          </p>

          {/* Action Buttons */}
          <div className={`flex space-x-3 transform transition-all duration-700 delay-400 ${
            animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            <button
              onClick={onClose}
              className={`flex-1 bg-gradient-to-r ${getGradient()} text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Awesome!</span>
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse" />
          <div className="absolute top-1/2 -right-4 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
        </div>

        {/* Bottom Gradient Bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient()} rounded-b-3xl transform transition-all duration-1000 ${
          animationPhase === 'enter' ? 'scale-x-0' : 'scale-x-100'
        }`} />
      </div>
    </div>
  );
};

export default AISuccessNotification;
