import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  showLabel = false, 
  className = '' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          relative overflow-hidden
          bg-gradient-to-br from-slate-100 to-slate-200
          dark:from-slate-800 dark:to-slate-900
          border border-slate-300 dark:border-slate-600
          rounded-xl
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95
          group
        `}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon container with smooth rotation */}
        <div className="relative z-10 flex items-center justify-center">
          <div className={`
            transition-all duration-500 ease-in-out
            ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}
          `}>
            {theme === 'light' ? (
              <Moon 
                className={`
                  ${iconSizes[size]}
                  text-slate-600 dark:text-slate-300
                  transition-colors duration-300
                `} 
              />
            ) : (
              <Sun 
                className={`
                  ${iconSizes[size]}
                  text-amber-500 dark:text-amber-400
                  transition-colors duration-300
                `} 
              />
            )}
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className={`
          absolute inset-0 rounded-xl
          ${theme === 'light' 
            ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
            : 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
          }
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        `} />
      </button>

      {showLabel && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
