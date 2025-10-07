import React, { useEffect, useRef } from 'react';
import { useRestrictedAccess } from '../../hooks/useRestrictedAccess';
import RestrictedAccess from './RestrictedAccess';
import { PrivilegeName } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface PrivilegeGuardProps {
  children: React.ReactNode;
  requiredPrivilege?: PrivilegeName;
  fallbackMessage?: string;
  fallbackDetails?: string;
}

const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({
  children,
  requiredPrivilege,
  fallbackMessage = "You don't have permission to access this feature.",
  fallbackDetails = "Please contact an administrator to request access."
}) => {
  const { shouldShowRestrictedAccess, hasSpecificPrivileges } = useRestrictedAccess();
  const { refreshCurrentUser } = useAuth();
  const triedRefreshRef = useRef(false);

  // If user has no privileges at all, show restricted access
  if (shouldShowRestrictedAccess) {
    return (
      <RestrictedAccess
        title="Access Restricted"
        message="You don't have any privileges assigned yet. Please contact an administrator to get access."
        details="An administrator needs to assign you specific privileges based on your role and responsibilities."
        severity="warning"
      />
    );
  }

  // If a specific privilege is required, check for it
  if (requiredPrivilege && !hasSpecificPrivileges([requiredPrivilege])) {
    // Attempt a one-time refresh to pull latest privileges (e.g., after Assign Default)
    if (!triedRefreshRef.current) {
      triedRefreshRef.current = true;
      try { refreshCurrentUser(); } catch { /* noop */ }
    }
    return (
      <RestrictedAccess
        title="Access Restricted"
        message={fallbackMessage}
        details={fallbackDetails}
        severity="error"
      />
    );
  }

  return <>{children}</>;
};

export default PrivilegeGuard;
