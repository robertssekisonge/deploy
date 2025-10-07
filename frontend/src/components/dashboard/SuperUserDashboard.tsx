import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, Users, DollarSign, Heart, FileText, Shield, BarChart3, Calendar } from 'lucide-react';

const SuperUserDashboard: React.FC = () => {
  const { students, financialRecords, sponsorships, attendanceRecords } = useData();
  const { users } = useAuth();

  const totalStudents = students.length;
  const totalUsers = users.length;
  const totalRevenue = financialRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const activeSponshorships = sponsorships.filter(s => s.status === 'active').length;
  const todayAttendance = attendanceRecords.filter(a => 
    a.date.toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super User Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete system overview - View only access</p>
        </div>
        <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-lg">
          <Eye className="h-5 w-5 text-purple-600" />
          <span className="text-purple-800 font-medium">View Only Mode</span>
        </div>
      </div>

      {/* Add overseer-specific sponsorship stats row at the top */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        <div className="bg-purple-100 p-3 rounded-lg shadow-sm border border-purple-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer" title="Students who are waiting for a sponsor (pending and need sponsorship)">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700">Available Sponsorships</p>
              <p className="text-xl font-bold text-purple-900">{students.filter(s => s.sponsorshipStatus === 'pending' && s.needsSponsorship).length}</p>
            </div>
            <Heart className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <div className="bg-orange-100 p-3 rounded-lg shadow-sm border border-orange-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer" title="Sponsorship requests that are pending approval or action">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700">Pending</p>
              <p className="text-xl font-bold text-orange-900">{sponsorships.filter(s => s.status === 'pending').length}</p>
            </div>
            <Heart className="h-5 w-5 text-orange-600" />
          </div>
        </div>
        <div className="bg-cyan-100 p-3 rounded-lg shadow-sm border border-cyan-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer" title="Students who are eligible for sponsorship but not yet sponsored">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-cyan-700">Eligible</p>
              <p className="text-xl font-bold text-cyan-900">{students.filter(s => s.sponsorshipStatus === 'eligible').length}</p>
            </div>
            <Users className="h-5 w-5 text-cyan-600" />
          </div>
        </div>
        <div className="bg-lime-100 p-3 rounded-lg shadow-sm border border-lime-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer" title="Sponsorships that are currently active (approved and ongoing)">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lime-700">Approved</p>
              <p className="text-xl font-bold text-lime-900">{sponsorships.filter(s => s.status === 'active').length}</p>
            </div>
            <Heart className="h-5 w-5 text-lime-600" />
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-purple-100 p-6 rounded-xl shadow-sm border border-purple-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Students</p>
              <p className="text-3xl font-bold text-purple-900">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-purple-600">Across all classes</span>
          </div>
        </div>
        <div className="bg-blue-100 p-6 rounded-xl shadow-sm border border-blue-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">System Users</p>
              <p className="text-3xl font-bold text-blue-900">{totalUsers}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-blue-600">All user roles</span>
          </div>
        </div>
        <div className="bg-green-100 p-6 rounded-xl shadow-sm border border-green-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900">
                UGX {totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">All payments</span>
          </div>
        </div>
        <div className="bg-pink-100 p-6 rounded-xl shadow-sm border border-pink-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-700">Active Sponsorships</p>
              <p className="text-3xl font-bold text-pink-900">{activeSponshorships}</p>
            </div>
            <Heart className="h-8 w-8 text-pink-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-pink-600">Currently active</span>
          </div>
        </div>
      </div>

      {/* System Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['admin', 'user', 'sponsor', 'parent', 'nurse', 'superuser'].map(role => {
                const count = users.filter(u => u.role === role).length;
                const percentage = (count / totalUsers) * 100;
                return (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        role === 'admin' ? 'bg-red-500' :
                        role === 'user' ? 'bg-blue-500' :
                        role === 'sponsor' ? 'bg-purple-500' :
                        role === 'parent' ? 'bg-green-500' :
                        role === 'nurse' ? 'bg-pink-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {role === 'user' ? 'Teachers' : role + 's'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            role === 'admin' ? 'bg-red-500' :
                            role === 'user' ? 'bg-blue-500' :
                            role === 'sponsor' ? 'bg-purple-500' :
                            role === 'parent' ? 'bg-green-500' :
                            role === 'nurse' ? 'bg-pink-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Statistics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{todayAttendance}</p>
                <p className="text-sm text-gray-600">Today's Attendance</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{financialRecords.length}</p>
                <p className="text-sm text-gray-600">Financial Records</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {financialRecords.filter(r => r.status === 'paid').length}
                </p>
                <p className="text-sm text-gray-600">Paid Records</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {financialRecords.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending Payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent System Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {financialRecords.slice(0, 5).map((record) => {
            const student = students.find(s => s.id === record.studentId);
            return (
              <div key={record.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {record.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Student: {student?.name} | {record.date.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      UGX {record.amount.toLocaleString()}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'paid' ? 'bg-green-100 text-green-800' :
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View Only Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Eye className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Super User Access</h3>
            <p className="text-purple-700 mt-1">
              You have read-only access to all system data. You can view all information but cannot make changes or edits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperUserDashboard;