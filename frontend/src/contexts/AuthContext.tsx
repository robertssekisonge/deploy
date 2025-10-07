import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPrivilege, PrivilegeName } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: (navigate?: (path: string) => void) => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  assignPrivilege: (userId: string, privilege: PrivilegeName, expiresAt?: Date) => Promise<void>;
  removePrivilege: (userId: string, privilege: PrivilegeName) => Promise<void>;
  hasPrivilege: (user: User | null, privilege: PrivilegeName) => boolean;
  fetchUsers: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

  const API_BASE_URL = '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    console.log('🔍 Fetching users from:', `${API_BASE_URL}/users`);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users fetched successfully:', data);
        console.log('✅ Number of users:', data.length);
        
        // Debug: Log all user roles to see what we're getting
        console.log('🔍 User roles found:', data.map((u: any) => ({ id: u.id, name: u.name, role: u.role })));
        
        setUsers(data);
      } else {
        console.error('❌ Failed to fetch users:', response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    }
  };

  useEffect(() => {
    // Don't restore user session if we're in the process of logging out
    if (isLoggingOut) {
      console.log('🚫 Logout in progress - skipping user session restoration');
      setIsLoading(false);
      return;
    }
    
    // Check for stored user data first (fallback)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔄 Restoring user session from localStorage:', parsedUser.name, 'Role:', parsedUser.role);
        setUser(parsedUser);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      console.log('📭 No stored user data found - user not logged in');
      setIsLoading(false);
    }
    
    // Fetch users from backend
    fetchUsers();
  }, [isLoggingOut]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Clear any existing user data first
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
    
      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 Login successful for user:', userData.name, 'Role:', userData.role);
        
        // Store token first if available
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
        
        // Immediately fetch full user with privileges to avoid missing permissions
        try {
          const enriched = await fetch(`${API_BASE_URL}/users/${userData.id}`);
          if (enriched.ok) {
            const fullUser = await enriched.json();
            console.log('🔍 AuthContext: Full user data loaded', { name: fullUser.name, role: fullUser.role, privilegeCount: fullUser.privileges?.length });
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
          } else {
            // Fallback to login payload
            console.log('🔍 AuthContext: Using login payload (fallback)', { name: userData.name, role: userData.role, privilegeCount: userData.privileges?.length });
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (_e) {
          console.log('🔍 AuthContext: Using login payload (error fallback)', { name: userData.name, role: userData.role, privilegeCount: userData.privileges?.length });
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setIsLoading(false);
        return true;
      } else {
        console.error('❌ Login failed:', response.status, response.statusText);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Fetch current user using JWT token
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('👤 Current user loaded:', userData.name, 'Role:', userData.role);
        return true;
      } else {
        console.log('❌ Token invalid, clearing...');
        localStorage.removeItem('token');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Error fetching current user:', error);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  };

  const logout = (navigate?: (path: string) => void) => {
    console.log('🚪 Logging out...');
    
    // Set logout flag immediately to prevent any further actions
    setIsLoggingOut(true);
    
    // Clear user state instantly
    setUser(null);
    
    // Clear both user data and token
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Reset loading state to ensure clean transition
    setIsLoading(false);
    
    // Use React Router navigation if available, otherwise fallback to window.location
    if (navigate) {
      console.log('✅ Using React Router navigation for logout');
      navigate('/login');
    } else {
      console.log('✅ Using window.location for logout');
      window.location.replace('/login');
    }
    console.log('✅ Logout complete - all data cleared, navigating to login...');
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        return newUser; // Return the result so frontend can access defaultPassword
      } else {
        console.error('Failed to add user:', response.statusText);
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(user => 
          user.id === id ? updatedUser : user
        ));
    
        // Update current user if it's the same user
        if (user?.id === id) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        console.error('Failed to update user:', response.statusText);
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
    setUsers(prev => prev.filter(user => user.id !== id));
      } else {
        console.error('Failed to delete user:', response.statusText);
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetPassword = async (id: string, newPassword: string) => {
    try {
      // Use the dedicated users endpoint which hashes and flags firstTimeLogin
      const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Password reset for user ${id} successful:`, result.message || result);
        return result;
      } else {
        let errorMessage = 'Failed to reset password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_) {}
        console.error('Failed to reset password:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const assignPrivilege = async (userId: string, privilege: PrivilegeName, expiresAt?: Date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/privileges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privilege, expiresAt }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        // If we updated the currently logged-in user, sync privileges immediately
        if (user && user.id === userId) {
          setUser(updatedUser as unknown as User);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        console.error('Failed to assign privilege:', response.statusText);
        throw new Error('Failed to assign privilege');
      }
    } catch (error) {
      console.error('Error assigning privilege:', error);
      throw error;
    }
  };

  const removePrivilege = async (userId: string, privilege: PrivilegeName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/privileges/${privilege}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        if (user && user.id === userId) {
          setUser(updatedUser as unknown as User);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        console.error('Failed to remove privilege:', response.statusText);
        throw new Error('Failed to remove privilege');
      }
    } catch (error) {
      console.error('Error removing privilege:', error);
      throw error;
    }
  };

  const hasPrivilege = (user: User | null, privilege: PrivilegeName) => {
    if (!user) return false;
    
    // NEW BEHAVIOR: Only check direct privileges, no role-based fallback
    // This ensures users with no privileges see "restricted access" until admin assigns them
    const hasDirectPrivilege = user.privileges?.some(p => 
      p.privilege === privilege && (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );
    
    return hasDirectPrivilege || false;
  };

  const refreshCurrentUser = async () => {
    // Don't refresh if we're logging out
    if (isLoggingOut || !user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`);
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        console.error('Failed to refresh current user:', response.statusText);
        throw new Error('Failed to refresh current user');
      }
    } catch (error) {
      console.error('Error refreshing current user:', error);
      throw error;
    }
  };

  const value = {
      user, 
      users, 
      login, 
      logout, 
      addUser, 
      updateUser, 
      deleteUser, 
      resetPassword, 
      isLoading,
      assignPrivilege,
      removePrivilege,
    hasPrivilege,
    fetchUsers,
    refreshCurrentUser,
    isLoggingOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
