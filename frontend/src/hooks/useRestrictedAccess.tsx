import { useAuth } from '../contexts/AuthContext';

export const useRestrictedAccess = () => {
  const { user } = useAuth();

  // Check if user has any privileges at all
  const hasAnyPrivileges = () => {
    if (!user || !user.privileges) {
      console.log('🔍 useRestrictedAccess: No user or privileges', { user: user?.name, hasPrivileges: !!user?.privileges, privilegeCount: user?.privileges?.length });
      return false;
    }
    const hasPrivileges = user.privileges.length > 0;
    console.log('🔍 useRestrictedAccess: User has privileges', { user: user.name, privilegeCount: user.privileges.length, hasPrivileges });
    return hasPrivileges;
  };

  // Check if user has specific privileges
  const hasSpecificPrivileges = (privileges: string[]) => {
    if (!user || !user.privileges) return false;
    return privileges.some(privilege => 
      user.privileges?.some(p => p.privilege === privilege)
    );
  };

  // Check if user should see restricted access message
  const shouldShowRestrictedAccess = () => {
    const shouldShow = !hasAnyPrivileges();
    console.log('🔍 useRestrictedAccess: shouldShowRestrictedAccess', { user: user?.name, shouldShow });
    return shouldShow;
  };

  return {
    hasAnyPrivileges: hasAnyPrivileges(),
    hasSpecificPrivileges,
    shouldShowRestrictedAccess: shouldShowRestrictedAccess(),
    user
  };
};
