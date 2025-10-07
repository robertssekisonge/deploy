import React, { useState } from 'react';
import { RefreshCw, Zap, Sparkles, RotateCcw, Loader2 } from 'lucide-react';

interface AIRefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'dashboard' | 'system' | 'data' | 'stats';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const AIRefreshButton: React.FC<AIRefreshButtonProps> = ({
  onClick,
  isLoading = false,
  variant = 'default',
  size = 'md',
  className = '',
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'dashboard':
        return {
          gradient: 'from-purple-500 via-pink-500 to-red-500',
          hoverGradient: 'from-purple-600 via-pink-600 to-red-600',
          shadow: 'shadow-purple-500/25',
          hoverShadow: 'shadow-purple-500/40',
          icon: RefreshCw,
          bgPattern: 'bg-gradient-to-br from-purple-100/20 to-pink-100/20'
        };
      case 'system':
        return {
          gradient: 'from-blue-500 via-cyan-500 to-teal-500',
          hoverGradient: 'from-blue-600 via-cyan-600 to-teal-600',
          shadow: 'shadow-blue-500/25',
          hoverShadow: 'shadow-blue-500/40',
          icon: Zap,
          bgPattern: 'bg-gradient-to-br from-blue-100/20 to-cyan-100/20'
        };
      case 'data':
        return {
          gradient: 'from-emerald-500 via-green-500 to-lime-500',
          hoverGradient: 'from-emerald-600 via-green-600 to-lime-600',
          shadow: 'shadow-emerald-500/25',
          hoverShadow: 'shadow-emerald-500/40',
          icon: RotateCcw,
          bgPattern: 'bg-gradient-to-br from-emerald-100/20 to-green-100/20'
        };
      case 'stats':
        return {
          gradient: 'from-orange-500 via-amber-500 to-yellow-500',
          hoverGradient: 'from-orange-600 via-amber-600 to-yellow-600',
          shadow: 'shadow-orange-500/25',
          hoverShadow: 'shadow-orange-500/40',
          icon: Sparkles,
          bgPattern: 'bg-gradient-to-br from-orange-100/20 to-amber-100/20'
        };
      default:
        return {
          gradient: 'from-indigo-500 via-purple-500 to-pink-500',
          hoverGradient: 'from-indigo-600 via-purple-600 to-pink-600',
          shadow: 'shadow-indigo-500/25',
          hoverShadow: 'shadow-indigo-500/40',
          icon: RefreshCw,
          bgPattern: 'bg-gradient-to-br from-indigo-100/20 to-purple-100/20'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-3 py-1.5',
          iconSize: 'h-4 w-4',
          textSize: 'text-sm',
          borderRadius: 'rounded-lg'
        };
      case 'lg':
        return {
          padding: 'px-6 py-3',
          iconSize: 'h-6 w-6',
          textSize: 'text-lg',
          borderRadius: 'rounded-xl'
        };
      default:
        return {
          padding: 'px-4 py-2',
          iconSize: 'h-5 w-5',
          textSize: 'text-base',
          borderRadius: 'rounded-lg'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const IconComponent = variantStyles.icon;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden group
        ${sizeStyles.padding} ${sizeStyles.borderRadius}
        bg-gradient-to-r ${variantStyles.gradient}
        hover:bg-gradient-to-r ${variantStyles.hoverGradient}
        text-white font-semibold ${sizeStyles.textSize}
        shadow-lg ${variantStyles.shadow}
        hover:shadow-xl ${variantStyles.hoverShadow}
        transform transition-all duration-300 ease-out
        hover:scale-105 hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
    >
      {/* AI Background Pattern */}
      <div className={`absolute inset-0 ${variantStyles.bgPattern} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className={`
          absolute -top-2 -right-2 w-8 h-8 
          bg-white/20 rounded-full blur-sm
          transform transition-all duration-500
          ${isHovered ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
        `}></div>
        <div className={`
          absolute -bottom-2 -left-2 w-6 h-6 
          bg-white/20 rounded-full blur-sm
          transform transition-all duration-700
          ${isHovered ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
        `}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 className={`${sizeStyles.iconSize} animate-spin`} />
        ) : (
          <IconComponent className={`${sizeStyles.iconSize} transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`} />
        )}
        
        {children && (
          <span className="whitespace-nowrap">
            {children}
          </span>
        )}
      </div>

      {/* Ripple Effect */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className={`
          absolute inset-0 bg-white/20 rounded-lg
          transform scale-0 transition-transform duration-300
          ${isHovered ? 'scale-100' : 'scale-0'}
        `}></div>
      </div>

      {/* Glow Effect */}
      <div className={`
        absolute inset-0 rounded-lg
        bg-gradient-to-r ${variantStyles.gradient} opacity-0
        blur-xl transition-opacity duration-300
        ${isHovered ? 'opacity-20' : 'opacity-0'}
        -z-10
      `}></div>
    </button>
  );
};

export default AIRefreshButton;
