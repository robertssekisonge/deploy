import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  Users, 
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const TeacherScheduling: React.FC = () => {
  const { user, users } = useAuth();
  const { classes, timetables, loadTimetables } = useData();
  const [lastTimetableCount, setLastTimetableCount] = useState(0);
  const [hasNewTimetables, setHasNewTimetables] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load timetables from backend when component mounts (only once)
  useEffect(() => {
    try {
      loadTimetables();
    } catch (error) {
      console.error('Error loading timetables:', error);
    }
  }, []); // Empty dependency array to run only once

  // Temporarily disabled auto-refresh to fix excessive API calls
  // useEffect(() => {
  //   // Only run auto-refresh if user is a teacher
  //   if (user?.role !== 'TEACHER' && user?.role !== 'SUPER_TEACHER') {
  //     return;
  //   }

  //   const interval = setInterval(() => {
  //     try {
  //       console.log('Auto-refreshing timetables for real-time updates...');
  //       loadTimetables();
  //     } catch (error) {
  //       console.error('Error auto-refreshing timetables:', error);
  //     }
  //   }, 60000); // Refresh every 60 seconds to reduce API calls

  //   return () => clearInterval(interval);
  // }, [loadTimetables, user?.role]);

  // Detect new timetables and show notifications
  useEffect(() => {
    if (timetables && timetables.length > 0) {
      const currentCount = getFilteredTimetable().length;
      
      if (lastTimetableCount > 0 && currentCount > lastTimetableCount) {
        const newCount = currentCount - lastTimetableCount;
        setHasNewTimetables(true);
        console.log(`🎉 New timetables detected! ${newCount} new entries added.`);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => setHasNewTimetables(false), 10000);
      }
      
      setLastTimetableCount(currentCount);
    }
  }, [timetables, lastTimetableCount]);

  // Listen for real-time timetable updates from admin
  useEffect(() => {
    const handleTimetableUpdate = (event: CustomEvent) => {
      console.log('🎯 Real-time timetable update received:', event.detail);
      
      if (event.detail.action === 'added') {
        // Immediately refresh timetables to show new entry
        loadTimetables();
        
        // Show notification
        setHasNewTimetables(true);
        setTimeout(() => setHasNewTimetables(false), 10000);
        
        console.log('🚀 Real-time update: New timetable entry detected and refreshed!');
      }
    };

    // Add event listener for real-time updates
    window.addEventListener('timetableUpdated', handleTimetableUpdate as EventListener);
    
    return () => {
      window.removeEventListener('timetableUpdated', handleTimetableUpdate as EventListener);
    };
  }, [loadTimetables]);

  // Filter timetables by teacher ID AND assigned classes
  const getFilteredTimetable = () => {
    try {
      if (!timetables || !user) return [];
      
      // Convert both IDs to strings for comparison to avoid type mismatches
      const userId = String(user.id);
      
      // First filter by teacher ID
      let filtered = timetables.filter(entry => String(entry.teacherId) === userId);
      
      // If user is a teacher, also filter by assigned classes
      if (user?.role === 'TEACHER' || user?.role === 'SUPER_TEACHER') {
        let assignedClasses = [];
        if (user?.assignedClasses) {
          try {
            assignedClasses = typeof user.assignedClasses === 'string' 
              ? JSON.parse(user.assignedClasses) 
              : user.assignedClasses;
          } catch (error) {
            console.error('Error parsing assignedClasses:', error);
            assignedClasses = [];
          }
        }
        
        // Filter timetables to only show classes the teacher is assigned to
        if (assignedClasses.length > 0) {
          filtered = filtered.filter(timetable => 
            assignedClasses.some(assignment => 
              assignment.className === timetable.className && 
              assignment.streamName === timetable.streamName
            )
          );
        }
      }
      
      return filtered;
    } catch (error) {
      console.error('Error filtering timetables:', error);
      return [];
    }
  };

  const filteredTimetable = getFilteredTimetable();

  // Simple fallback if data is not loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Loading user data...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Get teacher's assigned classes/streams
  const getTeacherAssignedClasses = () => {
    try {
    if (user?.role === 'ADMIN' || user?.role === 'SUPERUSER') {
        return classes || [];
    }

    // Parse assignedClasses from the new structure
    let assignedClasses = [];
    if (user?.assignedClasses) {
      try {
        assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        assignedClasses = [];
      }
    }

      // If no assignments found, try to find classes by teacher ID in timetables
      if ((!assignedClasses || assignedClasses.length === 0) && timetables && timetables.length > 0) {
        const teacherTimetables = timetables.filter(t => t.teacherId === user?.id);
        
        if (teacherTimetables.length > 0) {
          // Extract unique class/stream combinations from teacher's timetables
          const uniqueAssignments = teacherTimetables.reduce((acc, timetable) => {
            const key = `${timetable.className}-${timetable.streamName}`;
            if (!acc[key]) {
              acc[key] = {
                className: timetable.className,
                streamName: timetable.streamName,
                classId: timetable.classId,
                streamId: timetable.streamId
              };
            }
            return acc;
          }, {} as any);
          
          return Object.values(uniqueAssignments);
        }
      }

      return assignedClasses || [];
    } catch (error) {
      console.error('Error getting teacher assigned classes:', error);
      return [];
    }
  };

  const teacherClasses = getTeacherAssignedClasses();

  // Check if teacher has any assigned classes
  const hasAssignedClasses = teacherClasses.length > 0;

  // If no assigned classes, show restricted message
  if (!hasAssignedClasses) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No Assigned Classes</h3>
            <p className="mt-2 text-sm text-gray-600">
              You don't have any classes assigned yet. Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group timetable entries by day
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  // Pie-inspired gradient palette (green → purple → orange variations)
  const PIE_GRADIENTS = [
    'from-green-500 via-fuchsia-500 to-orange-500',
    'from-emerald-500 via-purple-500 to-amber-500',
    'from-teal-500 via-violet-500 to-orange-400',
    'from-green-400 via-pink-500 to-orange-500'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Portal - School Management System</h1>
          <p className="mt-2 text-gray-600">Manage your schedule and classes</p>
        </div>

        {/* New Timetable Notification */}
        {hasNewTimetables && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-800">New Timetables Available!</h4>
                <p className="text-sm text-green-700">Your schedule has been updated with new entries.</p>
              </div>
              <button
                onClick={() => setHasNewTimetables(false)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Schedule Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This week</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredTimetable.length} Total Entries</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Your responsibility</p>
                <p className="text-2xl font-semibold text-gray-900">{teacherClasses.length} Assigned Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monday to Friday</p>
                <p className="text-2xl font-semibold text-gray-900">{days.length} Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Weekly Schedule</h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    console.log('Manual refresh requested by teacher');
                    setIsRefreshing(true);
                    setHasNewTimetables(false); // Clear any existing notifications
                    
                    // Reload timetables
                    await loadTimetables();
                    
                    // Show success feedback
                    setHasNewTimetables(true);
                    setTimeout(() => setHasNewTimetables(false), 3000);
                    
                    console.log('Timetables refreshed successfully');
                  } catch (error) {
                    console.error('Error refreshing timetables:', error);
                    // Show error feedback
                    setHasNewTimetables(true);
                    setTimeout(() => setHasNewTimetables(false), 3000);
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Time
                  </th>
                  {days.map((day, index) => {
                    const dayColors = [
                      'bg-red-500',      // Monday - Red
                      'bg-orange-500',   // Tuesday - Orange
                      'bg-yellow-500',   // Wednesday - Yellow
                      'bg-green-500',    // Thursday - Green
                      'bg-blue-500'      // Friday - Blue
                    ];
                    return (
                      <th key={day} className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider ${dayColors[index]}`}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((timeSlot, timeIndex) => (
                  <tr key={timeSlot} className={timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gradient-to-r from-gray-100 to-gray-200">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-600 mr-2" />
                      {timeSlot}
                      </div>
                    </td>
                    {days.map((day, dayIndex) => {
                      // Fixed time matching logic
                      const entry = filteredTimetable.find(e => {
                        // Day matching (case-insensitive)
                        const dayMatches = e.day.toLowerCase() === day.toLowerCase();
                        
                        // Time matching - convert frontend time to 24-hour format for comparison
                        const timeSlotHour = parseInt(timeSlot.split(':')[0]);
                        const timeSlotPeriod = timeSlot.split(' ')[1];
                        
                        // Convert to 24-hour format
                        let frontendHour = timeSlotHour;
                        if (timeSlotPeriod === 'PM' && timeSlotHour !== 12) {
                          frontendHour = timeSlotHour + 12;
                        }
                        if (timeSlotPeriod === 'AM' && timeSlotHour === 12) {
                          frontendHour = 0;
                        }
                        
                        // Backend time is already in 24-hour format (e.g., "08:00")
                        const backendHour = parseInt(e.startTime.split(':')[0]);
                        
                        return dayMatches && frontendHour === backendHour;
                      });
                      
                      if (!entry) {
                        return (
                          <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
                            <div className="flex items-center justify-center">
                              <span className="text-xs">-</span>
                            </div>
                          </td>
                        );
                      }

                      // Derive a gradient from the pie-inspired palette deterministically per cell
                      const gradientIndex = Math.abs((entry.subject?.length || 0) + dayIndex * 3 + timeIndex) % PIE_GRADIENTS.length;
                      const colorScheme = PIE_GRADIENTS[gradientIndex];

                      return (
                        <td key={day} className="px-6 py-4 whitespace-nowrap">
                          <div className={`bg-gradient-to-r ${colorScheme} rounded-lg p-4 text-white shadow-lg transform hover:scale-105 transition-transform duration-200`}> 
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <BookOpen className="h-5 w-5 text-white" />
                                  <span className="text-sm font-bold">
                                    {entry.subject}
                                  </span>
                                </div>
                                <div className="text-xs text-white/90 space-y-1">
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{entry.className} {entry.streamName}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{entry.room}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{entry.startTime} - {entry.endTime}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherScheduling; 