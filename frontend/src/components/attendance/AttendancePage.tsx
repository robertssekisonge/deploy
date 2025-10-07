import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AttendanceAnalysis from './AttendanceAnalysis';
import AttendanceManagement from './AttendanceManagement';
import { BarChart3, Calendar, Users } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analysis' | 'management'>('analysis');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERUSER';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER';
  const isOverseer = user?.role === 'SPONSORSHIPS-OVERSEER' || user?.role === 'sponsorships-overseer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-2">
              {isAdmin 
                ? 'Comprehensive attendance overview, analytics, and management for all classes and streams'
                : isOverseer
                ? 'View attendance records for sponsored children only'
                : 'Manage attendance for your assigned classes and view analytics'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Attendance Analysis</span>
              </div>
            </button>
            
            {(isAdmin || isTeacher) && (
              <button
                onClick={() => setActiveTab('management')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'management'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Attendance Management</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'analysis' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Attendance Analysis</h2>
                <p className="text-gray-600">
                  Comprehensive attendance overview and analytics for all classes and streams
                </p>
              </div>
              <AttendanceAnalysis />
            </div>
          )}

          {activeTab === 'management' && (isAdmin || isTeacher) && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Attendance Management</h2>
                <p className="text-gray-600">
                  Mark, edit, and manage daily attendance records for students
                </p>
              </div>
              <AttendanceManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
