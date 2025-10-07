import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  getAllMessagingPrivileges,
  getDefaultMessagingPrivileges,
  getMessagingPrivilegeById,
  ROLE_DISPLAY_NAMES,
  MessagingPrivilege,
  UserPrivilegeAssignment
} from '../../config/messagePrivileges';
import { 
  Shield, 
  X, 
  Check, 
  Search, 
  Save, 
  Trash2, 
  User,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface PrivilegeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    role: string;
  };
  userPrivileges: string[];
  onSavePrivileges: (userId: string, privileges: string[]) => Promise<void>;
}

const PrivilegeManagementModal: React.FC<PrivilegeManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  userPrivileges,
  onSavePrivileges
}) => {
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>(userPrivileges);
  const [isSaving, setIsSaving] = useState(false);

  const allPrivileges = getAllMessagingPrivileges();
  const defaultPrivileges = getDefaultMessagingPrivileges();
  
  // If you want to include original privileges (146) + messaging privileges (9) = 155 total
  // const totalPrivilegeCount = 146 + getAllMessagingPrivileges().length; // 155 total

  // Filter privileges based on search term
  const filteredPrivileges = allPrivileges.filter(privilege =>
    privilege.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    privilege.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter messaging privileges based on search term
  const filteredMessagingPrivileges = getAllMessagingPrivileges().filter(privilege =>
    privilege.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    privilege.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count assigned vs total privileges
  const assignedCount = selectedPrivileges.length;
  const totalCount = 146 + getAllMessagingPrivileges().length; // 146 original + 9 messaging = 155 total

  useEffect(() => {
    if (isOpen) {
      setSelectedPrivileges(userPrivileges);
      setSearchTerm('');
    }
  }, [isOpen, userPrivileges]);

  const handlePrivilegeToggle = (privilegeId: string) => {
    setSelectedPrivileges(prev => 
      prev.includes(privilegeId)
        ? prev.filter(id => id !== privilegeId)
        : [...prev, privilegeId]
    );
  };

  const handleGrantAll = () => {
    setSelectedPrivileges(getAllMessagingPrivileges().map(p => p.id));
  };

  const handleAssignDefault = () => {
    setSelectedPrivileges(defaultPrivileges);
  };

  const handleRemoveAll = () => {
    setSelectedPrivileges([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePrivileges(user.id, selectedPrivileges);
      showSuccess(
        '✅ Privileges Updated',
        `Successfully updated messaging privileges for ${user.name}`
      );
      onClose();
    } catch (error) {
      console.error('Error saving privileges:', error);
      showError(
        '❌ Save Failed',
        'Failed to update privileges. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  Edit Privileges for {user.name}
                </h2>
                <p className="text-purple-100 text-sm">Manage user permissions and access rights</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Role Summary */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-sm">
                {assignedCount} Assigned
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-bold text-sm">
                {totalCount} Total
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-800">
                {ROLE_DISPLAY_NAMES[user.role] || user.role} Role
              </h3>
              <p className="text-sm text-gray-600">Current role privileges</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search privileges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-purple-500 px-3 py-2 text-gray-800 font-medium transition-all duration-200"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleGrantAll}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Check className="h-4 w-4" />
                <span>Grant All</span>
              </button>
              <button
                onClick={handleAssignDefault}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Shield className="h-4 w-4" />
                <span>Assign Default</span>
              </button>
              <button
                onClick={handleRemoveAll}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privilege List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {/* Messaging Privileges Section */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 text-purple-600 mr-2" />
                Messaging Privileges
              </h3>
              <div className="space-y-2">
                {filteredMessagingPrivileges.map((privilege) => (
                  <div
                    key={privilege.id}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrivileges.includes(privilege.id)}
                      onChange={() => handlePrivilegeToggle(privilege.id)}
                      className="accent-purple-600 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-800">{privilege.name}</span>
                        {privilege.isDefault && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{privilege.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Other Privileges Section */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                Other Privileges
              </h3>
              <div className="space-y-2">
                {filteredPrivileges.filter(p => p.category !== 'messaging').map((privilege) => (
                  <div
                    key={privilege.id}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrivileges.includes(privilege.id)}
                      onChange={() => handlePrivilegeToggle(privilege.id)}
                      className="accent-purple-600 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-800">{privilege.name}</span>
                        {privilege.isDefault && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{privilege.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Privileges</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivilegeManagementModal;
