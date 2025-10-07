import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './headers/AdminHeader';
import UserHeader from './headers/UserHeader';
import SponsorHeader from './headers/SponsorHeader';
import ParentHeader from './headers/ParentHeader';
import NurseHeader from './headers/NurseHeader';
import OverseerHeader from './headers/OverseerHeader';
import CoordinatorHeader from './headers/CoordinatorHeader';
import SuperUserHeader from './headers/SuperUserHeader';
import SuperTeacherHeader from './headers/SuperTeacherHeader';
import HRHeader from './headers/HRHeader';

const Header: React.FC = () => {
  const { user } = useAuth();

  const renderHeader = () => {
    if (!user) return null;

    // Normalize role to lowercase to handle case sensitivity from backend
    const normalizedRole = user.role?.toLowerCase();

    switch (normalizedRole) {
      case 'admin':
        return <AdminHeader />;
      case 'user':
        return <UserHeader />;
      case 'sponsor':
        return <SponsorHeader />;
      case 'parent':
        return <ParentHeader />;
      case 'nurse':
        return <NurseHeader />;
      case 'sponsorships-overseer':
      case 'sponsorships_overseer':
        return <OverseerHeader />;
      case 'sponsorship-coordinator':
      case 'sponsorship_coordinator':
        return <CoordinatorHeader />;
      case 'superuser':
        return <SuperUserHeader />;
      case 'super-teacher':
        return <SuperTeacherHeader />;
      case 'hr':
        return <HRHeader />;
      default:
        console.log('Unknown role:', user.role, 'normalized to:', normalizedRole);
        return <UserHeader />;
    }
  };

  return renderHeader();
};

export default Header;