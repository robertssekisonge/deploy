import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PrivilegeName } from '../../types';
import AccessDeniedNotification from './AccessDeniedNotification';

interface UsePrivilegeOptions {
  privilege: PrivilegeName;
  action?: string;
  severity?: 'warning' | 'error' | 'info';
  onDenied?: () => void;
}

export const usePrivilege = () => {
  const { user, hasPrivilege } = useAuth();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedPrivilege, setDeniedPrivilege] = useState<PrivilegeName | null>(null);
  const [deniedAction, setDeniedAction] = useState<string>('');
  const [deniedSeverity, setDeniedSeverity] = useState<'warning' | 'error' | 'info'>('error');

  const checkPrivilege = useCallback((options: UsePrivilegeOptions): boolean => {
    const { privilege, action, severity = 'error', onDenied } = options;
    
    if (!hasPrivilege(user, privilege)) {
      setDeniedPrivilege(privilege);
      setDeniedAction(action || '');
      setDeniedSeverity(severity);
      setShowAccessDenied(true);
      
      if (onDenied) {
        onDenied();
      }
      
      return false;
    }
    
    return true;
  }, [user, hasPrivilege]);

  const requirePrivilege = useCallback((privilege: PrivilegeName, action?: string): boolean => {
    return checkPrivilege({ privilege, action, severity: 'error' });
  }, [checkPrivilege]);

  const warnPrivilege = useCallback((privilege: PrivilegeName, action?: string): boolean => {
    return checkPrivilege({ privilege, action, severity: 'warning' });
  }, [checkPrivilege]);

  const infoPrivilege = useCallback((privilege: PrivilegeName, action?: string): boolean => {
    return checkPrivilege({ privilege, action, severity: 'info' });
  }, [checkPrivilege]);

  const closeAccessDenied = useCallback(() => {
    setShowAccessDenied(false);
    setDeniedPrivilege(null);
    setDeniedAction('');
  }, []);

  const AccessDeniedModal = () => (
    <AccessDeniedNotification
      isOpen={showAccessDenied}
      onClose={closeAccessDenied}
      privilege={deniedPrivilege || undefined}
      action={deniedAction || undefined}
      severity={deniedSeverity}
    />
  );

  return {
    checkPrivilege,
    requirePrivilege,
    warnPrivilege,
    infoPrivilege,
    hasPrivilege: (privilege: PrivilegeName) => hasPrivilege(user, privilege),
    AccessDeniedModal,
    closeAccessDenied
  };
};

export default usePrivilege;
