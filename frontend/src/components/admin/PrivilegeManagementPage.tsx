import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import PrivilegeManagementModal from './PrivilegeManagementModal';
import { 
  getAllMessagingPrivileges,
  getDefaultMessagingPrivileges,
  getMessagableRoles,
  ROLE_DISPLAY_NAMES,
  UserPrivilegeAssignment
} from '../../config/messagePrivileges';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Settings,
  Search,
  Filter,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const PrivilegeManagementPage: React.FC = () => {
  const { users } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [selectedUser, setSelectedUser] = useState<UserPrivilegeAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [userPrivileges, setUserPrivileges] = useState<Record<string, string[]>>({});

  // Initialize user privileges with defaults
  useEffect(() => {
    const defaultPrivileges = getDefaultMessagingPrivileges();
    const initialPrivileges: Record<string, string[]> = {};
    
    users.forEach(user => {
      // All users get default privileges (Message Admin)
      initialPrivileges[user.id] = [...defaultPrivileges];
    });
    
    setUserPrivileges(initialPrivileges);
  }, [users]);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleEditPrivileges = (user: any) => {
    setSelectedUser({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      assignedPrivileges: userPrivileges[user.id] || []
    });
    setIsModalOpen(true);
  };

  const handleSavePrivileges = async (userId: string, privileges: string[]) => {
    setUserPrivileges(prev => ({
      ...prev,
      [userId]: privileges
    }));
    
    // Here you would typically save to backend
    // await saveUserPrivileges(userId, privileges);
  };

  const getUserPrivilegeCount = (userId: string) => {
    return userPrivileges[userId]?.length || 0;
  };

  const getUserMessagableRoles = (userId: string) => {
    const privileges = userPrivileges[userId] || [];
    return getMessagableRoles(privileges);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🛡️ Messaging Privileges
              </h1>
              <p className="text-purple-100 text-sm">Manage who can send messages to whom</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-medium text-white">
              {users.length} Users • {146 + getAllMessagingPrivileges().length} Total Privileges
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-3 text-gray-800 font-medium transition-all duration-200"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-4 py-3 text-gray-800 font-medium transition-all duration-200"
            >
              <option value="all">All Roles</option>
              {Array.from(new Set(users.map(u => u.role))).map(role => (
                <option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role] || role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 border-2 border-indigo-200/50 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-t-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                👥 User Privileges
              </h2>
              <p className="text-indigo-100 text-sm">{filteredUsers.length} users found</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200/50">
          {filteredUsers.map((user) => {
            const privilegeCount = getUserPrivilegeCount(user.id);
            const messagableRoles = getUserMessagableRoles(user.id);
            
            return (
              <div key={user.id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">
                          {ROLE_DISPLAY_NAMES[user.role] || user.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-sm">
                        {privilegeCount} Privileges
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-sm">
                        Can Message: {messagableRoles.length} Roles
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {messagableRoles.map(role => (
                        <span
                          key={role}
                          className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-2 py-1 rounded text-xs font-medium border border-purple-200"
                        >
                          Message {ROLE_DISPLAY_NAMES[role] || role}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      onClick={() => handleEditPrivileges(user)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privilege Management Modal */}
      {selectedUser && (
        <PrivilegeManagementModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          userPrivileges={selectedUser.assignedPrivileges}
          onSavePrivileges={handleSavePrivileges}
        />
      )}
    </div>
  );
};

export default PrivilegeManagementPage;
