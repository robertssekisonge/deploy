import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './sidebars/AdminSidebar';
import UserSidebar from './sidebars/UserSidebar';
import SponsorSidebar from './sidebars/SponsorSidebar';
import ParentSidebar from './sidebars/ParentSidebar';
import NurseSidebar from './sidebars/NurseSidebar';
import OverseerSidebar from './sidebars/OverseerSidebar';
import CoordinatorSidebar from './sidebars/CoordinatorSidebar';
import SuperUserSidebar from './sidebars/SuperUserSidebar';
import SuperTeacherSidebar from './sidebars/SuperTeacherSidebar';
import SecretarySidebar from './sidebars/SecretarySidebar';
import AccountantSidebar from './sidebars/AccountantSidebar';
import CFOSidebar from './sidebars/CFOSidebar';
import HRSidebar from './sidebars/HRSidebar';
import OPMSidebar from './sidebars/OPMSidebar';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderRoleSpecificSidebar = () => {
    // Use uppercase roles for consistency
    const userRole = user?.role;
    
    switch (userRole) {
      case 'ADMIN':
        return <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'TEACHER':
        return <UserSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SECRETARY':
        return <SecretarySidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'ACCOUNTANT':
        return <AccountantSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'CFO':
        return <CFOSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'HR':
        return <HRSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SPONSOR':
        return <SponsorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'PARENT':
        return <ParentSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'NURSE':
        return <NurseSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SPONSORSHIPS_OVERSEER':
        return <OverseerSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SPONSORSHIP_COORDINATOR':
        return <CoordinatorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SUPERUSER':
        return <SuperUserSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'SUPER_TEACHER':
        return <SuperTeacherSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      case 'OPM':
        return <OPMSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
      default:
        return <UserSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    }
  };

  return renderRoleSpecificSidebar();
};

export default Sidebar;