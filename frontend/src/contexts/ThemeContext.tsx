import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeIntensity: 'normal' | 'dim' | 'ultra';
  toggleTheme: () => void;
  setThemeIntensity: (intensity: 'normal' | 'dim' | 'ultra') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [themeIntensity, setThemeIntensity] = useState<'normal' | 'dim' | 'ultra'>(() => {
    const saved = localStorage.getItem('themeIntensity');
    return (saved as 'normal' | 'dim' | 'ultra') || 'normal';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-dark-intensity', themeIntensity);
      
      // Set professional dark background based on intensity
      const darkColors = {
        normal: '#0f0f23', // Deep professional blue-black
        dim: '#1a1a2e',    // Slightly lighter professional dark
        ultra: '#0a0a1a'   // Ultra dark professional
      };
      
      document.body.style.backgroundColor = darkColors[themeIntensity];
    } else {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.removeAttribute('data-dark-intensity');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('themeIntensity', themeIntensity);
  }, [theme, themeIntensity]);

  const value: ThemeContextType = {
    theme,
    themeIntensity,
    toggleTheme,
    setThemeIntensity,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
