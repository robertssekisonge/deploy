import React from 'react';

interface LoadingDotsFixedProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingDotsFixed: React.FC<LoadingDotsFixedProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: { width: '8px', height: '8px' },
    md: { width: '12px', height: '12px' },
    lg: { width: '16px', height: '16px' }
  };

  const dotSize = sizeClasses[size];

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px', // Increased gap to ensure separation
    padding: '16px',
    minWidth: '200px', // Ensure enough space for all dots
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.1)'
  };

  const dotStyle = {
    flexShrink: 0,
    borderRadius: '50%',
    animation: 'bounce 1.4s ease-in-out infinite both',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    ...dotSize
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Red dot */}
      <div 
        style={{ ...dotStyle, backgroundColor: '#ef4444' }}
        title="Red Dot (1/5)"
      />
      
      {/* Yellow dot */}
      <div 
        style={{ ...dotStyle, backgroundColor: '#eab308' }}
        title="Yellow Dot (2/5)"
      />
      
      {/* First green dot */}
      <div 
        style={{ ...dotStyle, backgroundColor: '#22c55e' }}
        title="Green Dot 1 (3/5)"
      />
      
      {/* Second green dot */}
      <div 
        style={{ ...dotStyle, backgroundColor: '#16a34a' }}
        title="Green Dot 2 (4/5)"
      />
      
      {/* Blue dot */}
      <div 
        style={{ ...dotStyle, backgroundColor: '#3b82f6' }}
        title="Blue Dot (5/5)"
      />
      
      {/* Debug info */}
      <div style={{ 
        fontSize: '10px', 
        color: '#6b7280', 
        marginTop: '8px', 
        textAlign: 'center', 
        width: '100%',
        position: 'absolute',
        bottom: '-20px'
      }}>
        Dots: 5 | Size: {size} | Gap: 16px
      </div>
    </div>
  );
};

export default LoadingDotsFixed;










