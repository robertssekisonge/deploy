import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { Heart, Users, DollarSign, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

const SponsorDashboard: React.FC = () => {
  const { sponsorships, students, forceRefresh } = useData();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
      showSuccess('🔄 Data Refreshed!', 'Dashboard data has been updated successfully!');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Debug: Log all data for verification
  console.log('🔍 SponsorDashboard Debug - All Sponsorships:', sponsorships.map(s => ({
    id: s.id,
    sponsorId: s.sponsorId,
    sponsorName: s.sponsorName,
    status: s.status,
    amount: s.amount
  })));
  
  console.log('🔍 SponsorDashboard Debug - Current User:', {
    id: user?.id,
    name: user?.name
  });

  const mySponshorships = sponsorships.filter(s => {
    const userIdStr = user?.id?.toString();
    const sponsorIdStr = s.sponsorId?.toString();
    const matchesById = sponsorIdStr && userIdStr ? sponsorIdStr === userIdStr : false;
    const matchesByName = s.sponsorName && user?.name ? s.sponsorName.toLowerCase() === user.name.toLowerCase() : false;
    return matchesById || matchesByName;
  });
  const totalDonated = mySponshorships.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  // More accurate status filtering
  const activeSponshorships = mySponshorships.filter(s => 
    s.status === 'active' || s.status === 'sponsored'
  ).length;
  
  const approvedSponshorships = mySponshorships.filter(s => 
    s.status === 'sponsored' || s.status === 'coordinator-approved'
  ).length;
  
  // Get students that are actually sponsored by this sponsor
  const sponsoredStudents = students.filter(s => {
    const hasActiveSponsorship = mySponshorships.some(sponsorship => 
      sponsorship.studentId === s.id && 
      (sponsorship.status === 'sponsored' || sponsorship.status === 'active')
    );
    return hasActiveSponsorship;
  });

  // Calculate impact score based on actual data
  const calculateImpactScore = () => {
    if (activeSponshorships === 0) return 0;
    if (activeSponshorships >= 5) return 100;
    if (activeSponshorships >= 3) return 85;
    if (activeSponshorships >= 2) return 70;
    return 50;
  };

  const impactScore = calculateImpactScore();

  // Available profiles for sponsors (students with status 'available-for-sponsors' AND no pending sponsorships)
  const blockedStatuses = new Set(['pending', 'coordinator-approved', 'sponsored']);
  const blockedStudentIds = new Set(
    sponsorships
      .filter(s => s.studentId && blockedStatuses.has(s.status))
      .map(s => s.studentId.toString())
  );
  const availableProfiles = students.filter(s => 
    s.sponsorshipStatus === 'available-for-sponsors' &&
    s.needsSponsorship &&
    !blockedStudentIds.has(String(s.id))
  );

  // Pending sponsorships for current sponsor only
  const myPendingSponsorships = sponsorships.filter(s => {
    const isPending = s.status === 'pending';
    const userIdStr = user?.id?.toString();
    const sponsorIdStr = s.sponsorId?.toString();
    const matchesById = sponsorIdStr && userIdStr ? sponsorIdStr === userIdStr : false;
    const matchesByName = s.sponsorName && user?.name ? s.sponsorName.toLowerCase() === user.name.toLowerCase() : false;
    return isPending && (matchesById || matchesByName);
  });

  // Debug: Log calculated metrics
  console.log('📊 SponsorDashboard Debug - My Sponsorships:', mySponshorships.map(s => ({
    id: s.id,
    status: s.status,
    amount: s.amount,
    sponsorId: s.sponsorId,
    sponsorName: s.sponsorName
  })));
  
  console.log('📊 SponsorDashboard Debug - Metrics:', {
    totalDonated,
    activeSponshorships,
    approvedSponshorships,
    sponsoredStudentsCount: sponsoredStudents.length,
    myPendingSponsorshipsCount: myPendingSponsorships.length
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sponsor Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 mb-4">
        <div className="bg-green-100 p-3 rounded-lg shadow-sm border border-green-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700">Total Donated</p>
              <p className="text-xl font-bold text-green-900">UGX {totalDonated.toLocaleString()}</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="bg-pink-100 p-3 rounded-lg shadow-sm border border-pink-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-pink-700">Active Sponsorships</p>
              <p className="text-xl font-bold text-pink-900">{activeSponshorships}</p>
            </div>
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
        </div>
        <div className="bg-blue-100 p-3 rounded-lg shadow-sm border border-blue-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700">Students Helped</p>
              <p className="text-xl font-bold text-blue-900">{sponsoredStudents.length}</p>
            </div>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg shadow-sm border border-yellow-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-700">Impact Score</p>
              <p className="text-xl font-bold text-yellow-900">{impactScore}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <div className="bg-purple-100 p-3 rounded-lg shadow-sm border border-purple-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700">Available Profiles</p>
              <p className="text-xl font-bold text-purple-900">{availableProfiles.length}</p>
            </div>
            <Heart className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <div className="bg-orange-100 p-3 rounded-lg shadow-sm border border-orange-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700">Pending</p>
              <p className="text-xl font-bold text-orange-900">{myPendingSponsorships.length}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
        </div>
        <div className="bg-lime-100 p-3 rounded-lg shadow-sm border border-lime-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lime-700">Approved</p>
              <p className="text-xl font-bold text-lime-900">{approvedSponshorships}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-lime-600" />
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default SponsorDashboard;