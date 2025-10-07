import React from 'react';
import { useLocation } from 'react-router-dom';
import PrivilegeGuard from './PrivilegeGuard';
import { getRoutePrivileges } from '../../utils/privilegeMapping';

interface ProtectedRouteProps {
  children: React.ReactNode;
  path?: string;
  allowedRoles?: string[];
}

import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, path, allowedRoles }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = path || location.pathname;
  // If role-based bypass is provided and user matches, render directly
  if (allowedRoles && user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }
  const requiredPrivileges = getRoutePrivileges(currentPath);
  
  // Get the first required privilege for the PrivilegeGuard
  const primaryPrivilege = requiredPrivileges[0];

  return (
    <PrivilegeGuard
      requiredPrivilege={primaryPrivilege}
      fallbackMessage={`You don't have permission to access ${currentPath}.`}
      fallbackDetails={`This feature requires the following privileges: ${requiredPrivileges.join(', ')}`}
    >
      {children}
    </PrivilegeGuard>
  );
};

export default ProtectedRoute;
