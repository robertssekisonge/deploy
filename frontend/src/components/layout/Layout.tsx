import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  // Memoize background color calculation for performance
  const getBackgroundColor = useCallback(() => {
    // Normalize role to lowercase to handle case sensitivity from backend
    const normalizedRole = user?.role?.toLowerCase();
    
    // Dark theme overrides
    if (document.documentElement.classList.contains('dark')) {
      return 'bg-transparent'; // Let dark theme handle background
    }
    
    switch (normalizedRole) {
      case 'admin':
        return 'bg-gradient-to-br from-purple-50 to-indigo-50';
      case 'user':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50';
      case 'super-teacher':
        return 'bg-gradient-to-br from-indigo-50 to-purple-50';
      case 'sponsor':
        return 'bg-gradient-to-br from-pink-50 to-purple-50';
      case 'parent':
        return 'bg-gradient-to-br from-green-50 to-emerald-50';
      case 'nurse':
        return 'bg-gradient-to-br from-rose-50 to-pink-50';
      case 'superuser':
        return 'bg-gradient-to-br from-gray-50 to-slate-50';
      case 'opm':
        return 'bg-gradient-to-br from-orange-50 via-red-50 to-amber-50';
      default:
        return 'bg-transparent';
    }
  }, [user?.role]);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      if (renderTime > 100) {
        console.warn(`⚠️ Layout render took ${renderTime.toFixed(2)}ms - consider optimization`);
      }
    };
  });

  return (
    <div className={`relative flex h-screen ${getBackgroundColor()} transition-colors duration-300 overflow-hidden`}>
      {/* Animated login-style background (global) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-lg opacity-70 animate-blob shadow-2xl shadow-purple-500/30"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-lg opacity-70 animate-blob animation-delay-2000 shadow-2xl shadow-blue-500/30"></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-lg opacity-60 animate-blob animation-delay-4000 shadow-2xl shadow-pink-500/30"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-lg opacity-50 animate-blob animation-delay-1000 shadow-2xl shadow-yellow-500/30"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-lg opacity-50 animate-blob animation-delay-3000 shadow-2xl shadow-green-500/30"></div>
      </div>
      {/* Sidebar with independent scrolling */}
      <div className="flex-shrink-0 h-screen overflow-y-auto overflow-x-hidden sidebar-scroll pt-0 pb-0">
        <Sidebar />
      </div>
      {/* Main content with independent scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden main-content-scroll">
          <div className="w-full max-w-none px-6 py-8 bg-transparent pr-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;