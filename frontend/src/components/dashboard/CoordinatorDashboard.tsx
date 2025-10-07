import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  Heart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  UserPlus,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3
} from 'lucide-react';

const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, sponsorships, messages } = useData();

  // Mock data for sponsorship coordinator
  const totalSponsorships = sponsorships.length;
  const pendingSponsorships = sponsorships.filter(s => s.status === 'pending').length;
  const activeSponsorships = sponsorships.filter(s => s.status === 'active').length;
  const totalStudents = students.length;
  const sponsoredStudents = students.length > 0 ? Math.floor(students.length * 0.6) : 0;
  const totalRevenue = sponsorships.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
  const monthlyRevenue = sponsorships
    .filter((s: any) => new Date(s.date).getMonth() === new Date().getMonth())
    .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
  const unreadMessages = messages.filter(m => !m.read).length;

  const stats = [
    {
      title: 'Total Sponsorships',
      value: totalSponsorships,
      change: '+12%',
      icon: Heart,
      color: 'bg-pink-500',
      changeColor: 'text-green-600'
    },
    {
      title: 'Pending Requests',
      value: pendingSponsorships,
      change: '+5%',
      icon: Clock,
      color: 'bg-yellow-500',
      changeColor: 'text-yellow-600'
    },
    {
      title: 'Active Sponsorships',
      value: activeSponsorships,
      change: '+8%',
      icon: CheckCircle,
      color: 'bg-green-500',
      changeColor: 'text-green-600'
    },
    {
      title: 'Sponsored Students',
      value: sponsoredStudents,
      change: '+15%',
      icon: Users,
      color: 'bg-blue-500',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+22%',
      icon: DollarSign,
      color: 'bg-emerald-500',
      changeColor: 'text-emerald-600'
    },
    {
      title: 'Monthly Revenue',
      value: `$${monthlyRevenue.toLocaleString()}`,
      change: '+18%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      changeColor: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      title: 'Review Pending Requests',
      description: 'Review and approve new sponsorship applications',
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-800',
      href: '/sponsorships'
    },
    {
      title: 'Add New Sponsor',
      description: 'Register a new sponsor in the system',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-800',
      href: '/sponsorships'
    },
    {
      title: 'Generate Reports',
      description: 'Create sponsorship and financial reports',
      icon: FileText,
      color: 'bg-green-100 text-green-800',
      href: '/reports'
    },
    {
      title: 'View Calendar',
      description: 'Check upcoming sponsorship events',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-800',
      href: '/attendance'
    },
    {
      title: 'Messages',
      description: 'Check and respond to messages',
      icon: MessageSquare,
      color: 'bg-indigo-100 text-indigo-800',
      href: '/messages'
    },
    {
      title: 'Analytics',
      description: 'View sponsorship analytics and trends',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-800',
      href: '/analytics'
    }
  ];

  const recentSponsorships = sponsorships.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsorship Coordinator Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Here's what's happening with sponsorships.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Sponsorship Coordinator</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm font-medium ${stat.changeColor}`}>{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Sponsorships */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sponsorships</h2>
        <div className="space-y-4">
          {recentSponsorships.map((sponsorship, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                                 <div>
                   <h3 className="font-medium text-gray-900">{sponsorship.sponsorName || 'Unknown Sponsor'}</h3>
                   <p className="text-sm text-gray-600">Sponsored: {sponsorship.studentId || 'Unknown Student'}</p>
                 </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sponsorship.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : sponsorship.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {sponsorship.status}
                </span>
                <span className="text-sm text-gray-600">${sponsorship.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
        <div className="space-y-3">
          {pendingSponsorships > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{pendingSponsorships} pending sponsorship requests</p>
                <p className="text-sm text-yellow-700">Review and approve new applications</p>
              </div>
            </div>
          )}
          {unreadMessages > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">{unreadMessages} unread messages</p>
                <p className="text-sm text-blue-700">Check your inbox for updates</p>
              </div>
            </div>
          )}
          {monthlyRevenue < 10000 && (
            <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Monthly revenue below target</p>
                <p className="text-sm text-orange-700">Focus on new sponsorship opportunities</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard; 