import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ClinicModalProvider } from './contexts/ClinicModalContext';
import { NotificationProvider } from './components/common/NotificationProvider';
import { AINotificationProvider } from './contexts/AINotificationContext';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';


// Import all components directly for instant loading
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';
import SponsorDashboard from './components/dashboard/SponsorDashboard';
import OPMDashboard from './components/dashboard/OPMDashboard';
import OPMBudgetManagement from './components/opm/OPMBudgetManagement';
import OPMExpenseManagement from './components/opm/OPMExpenseManagement';
import OPMPurchasingSystem from './components/opm/OPMPurchasingSystem';
import OPMTaskManagement from './components/opm/OPMTaskManagement';
import OPMFacilitiesManagement from './components/opm/OPMFacilitiesManagement';
import OPMInventoryManagement from './components/opm/OPMInventoryManagement';
import OPMContractorManagement from './components/opm/OPMContractorManagement';
import OPMOperationsReports from './components/opm/OPMOperationsReports';
import OPMOperationsSchedule from './components/opm/OPMOperationsSchedule';
import OPMLogisticsTransport from './components/opm/OPMLogisticsTransport';
import OPMConstructionRenovation from './components/opm/OPMConstructionRenovation';
import StudentList from './components/students/StudentList';
import SponsorshipManagement from './components/sponsorship/SponsorshipManagement';
import HRForms from './components/hr/HRForms';
import HRPolicy from './components/hr/HRPolicy';
import HRCustomise from './components/hr/HRCustomise';
import AvailableForSponsors from './components/sponsorship/AvailableForSponsors';
import MySponsoredChildren from './components/sponsorship/MySponsoredChildren';
import AdminSponsorshipApproval from './components/sponsorship/AdminSponsorshipApproval';
import EnrollFromOverseer from './components/sponsorship/EnrollFromOverseer';
import SponsorPendingRequests from './components/sponsorship/SponsorPendingRequests';
import UserManagement from './components/users/UserManagement';
import AttendancePage from './components/attendance/AttendancePage';
import MessagingSystem from './components/messaging/EnhancedMessagingSystem';
import ParentDashboard from './components/dashboard/ParentDashboard';
import NurseDashboard from './components/dashboard/NurseDashboard';
import SuperUserDashboard from './components/dashboard/SuperUserDashboard';
import SettingsPanel from './components/settings/SettingsPanel';
import ReportCards from './components/reports/ReportCards';
import ClassManagement from './components/classes/ClassManagement';
import SuperTeacherDashboard from './components/dashboard/SuperTeacherDashboard';
import SecretaryDashboard from './components/dashboard/SecretaryDashboard';
import CompleteTimetable from './components/timetable/CompleteTimetable';
import TeacherManagement from './components/teachers/TeacherManagement';
import ParentManagement from './components/users/ParentManagement';
import ClinicManagement from './components/clinic/ClinicManagement';
import OverseerDashboard from './components/dashboard/OverseerDashboard';
import CoordinatorDashboard from './components/dashboard/CoordinatorDashboard';
import ClassResources from './components/resources/ClassResources';
import FinancialManagement from './components/financial/FinancialManagement';
import StaffPaymentManagement from './components/staff/StaffPaymentManagement';
import AccountantDashboard from './components/dashboard/AccountantDashboard';
import SecretaryFeeBalances from './components/financial/SecretaryFeeBalances';
import CFODashboard from './components/dashboard/CFODashboard';
import HRDashboard from './components/dashboard/HRDashboard';
import FundAllocationManagement from './components/cfo/FundAllocationManagement';
import SchoolFundingManagement from './components/cfo/SchoolFundingManagement';
import FinancialStatementGeneration from './components/cfo/FinancialStatementGeneration';
import FinancialAnalytics from './components/cfo/FinancialAnalytics';
import FoundationFundingManagement from './components/cfo/FoundationFundingManagement';
import FarmIncomeManagement from './components/cfo/FarmIncomeManagement';
import ClinicIncomeManagement from './components/cfo/ClinicIncomeManagement';
import ExpenditureManagement from './components/cfo/ExpenditureManagement';
import SystemSettings from './components/settings/SystemSettings';
import TeacherScheduling from './components/timetable/TeacherScheduling';
import WeeklyReports from './components/reports/WeeklyReports';
import PhotoManagement from './components/photos/PhotoManagement';

import TeacherMarksEntry from './components/students/TeacherMarksEntry';
import FormsManagement from './components/forms/FormsManagement';
import StaffManagement from './components/hr/StaffManagement';

// No loading component - instant navigation

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  console.log('Dashboard: User data:', user);
  console.log('Dashboard: User role:', user?.role);
  
  const userRole = user?.role;
  
  // Add error handling
  if (!user) {
    console.log('Dashboard: No user found, redirecting to login');
    return <div>Loading...</div>;
  }
  
  console.log('Dashboard: Rendering dashboard for role:', userRole);
  
  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
    case 'CFO':
      // Redirect CFO to their own dashboard route
      return <CFODashboard />;
    case 'HR':
      return <HRDashboard />;
    case 'SECRETARY':
      return <SecretaryDashboard />;
    case 'SPONSOR':
      return <SponsorDashboard />;
    case 'SUPERUSER':
      return <SuperUserDashboard />;
    case 'SUPER_TEACHER':
      return <SuperTeacherDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    case 'NURSE':
      return <NurseDashboard />;
    case 'SPONSORSHIPS_OVERSEER':
    case 'sponsorships-overseer':
      return <OverseerDashboard />;
    case 'SPONSORSHIP_COORDINATOR':
      return <CoordinatorDashboard />;
    case 'TEACHER':
      return <UserDashboard />;
    case 'OPM':
      return <OPMDashboard />;
    default:
      console.log('Dashboard: Unknown role, defaulting to UserDashboard:', userRole);
      return <UserDashboard />;
  }
};

const AuthProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isLoggingOut } = useAuth();
  
  if (isLoggingOut) {
    return <Navigate to="/login" replace />;
  }
  
  if (isLoading) {
    // Show minimal loading - just a spinner, no full screen delay
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, isLoggingOut } = useAuth();
  
  // Add error boundary for debugging
  console.log('AppContent: User:', user);
  console.log('AppContent: isLoggingOut:', isLoggingOut);
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/">
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        {/* Default dashboard alias for direct loads of /dashboard */}
        <Route path="/dashboard" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/dashboard">
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        {/* OPM routes */}
        <Route path="/opm-budget-management" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMBudgetManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-expense-management" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMExpenseManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-purchasing" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMPurchasingSystem />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-tasks" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMTaskManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-construction" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMConstructionRenovation />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-facilities" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMFacilitiesManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-inventory" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMInventoryManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-contractors" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMContractorManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-reports" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMOperationsReports />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-schedule" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMOperationsSchedule />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/opm-logistics" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["OPM","ADMIN"]}>
                <OPMLogisticsTransport />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        {/* Payment Analysis standalone route (reuses FinancialManagement with the correct tab) */}
        <Route path="/payment-analysis" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["ADMIN","SUPERUSER","ACCOUNTANT","CFO"]}>
                <FinancialManagement initialTab="payment-system" />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        {/* Pay Staff - Accountant/HR (HR is view-only) */}
        <Route path="/pay-staff" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={["ADMIN","ACCOUNTANT","CFO","HR"]}>
                {/** Pass readOnly for HR role */}
                <StaffPaymentManagement readOnly={user?.role === 'HR'} />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        {/* Account Settings standalone for accountant/non-admins */}
        <Route path="/account-settings" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/account-settings">
                <SettingsPanel />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* Optimized routes with lazy loading */}
        <Route path="/dashboard" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/dashboard">
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        {/* CFO Dashboard (financial-only) */}
        <Route path="/cfo/dashboard" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/cfo/dashboard">
                <CFODashboard />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        {/* HR Routes */}
        <Route path="/hr/dashboard" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['HR','ADMIN']}>
                <HRDashboard />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/hr/staff" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['HR','ADMIN']}>
                <StaffManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/hr/forms" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['HR','ADMIN']}>
                <HRForms />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/hr/policy" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['HR','ADMIN']}>
                <HRPolicy />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />

        <Route path="/hr/customise" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['HR','ADMIN']}>
                <HRCustomise />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/students" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/students">
                <StudentList />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        
        <Route path="/sponsorships" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/sponsorships">
                <SponsorshipManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/available-for-sponsors" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/available-for-sponsors">
                <AvailableForSponsors />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/my-sponsored-children" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/my-sponsored-children">
                <MySponsoredChildren />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/admin-sponsorship-approval" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/admin-sponsorship-approval">
                <AdminSponsorshipApproval />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/enroll-from-overseer" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/enroll-from-overseer">
                <EnrollFromOverseer />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/sponsor-pending" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/sponsor-pending">
                <SponsorPendingRequests />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/users" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/users">
                <UserManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/attendance" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/attendance">
                <AttendancePage />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/messages" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/messages">
                <MessagingSystem />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/classes" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/classes">
                <ClassManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/timetable" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/timetable">
                <CompleteTimetable />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/teachers" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/teachers">
                <TeacherManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/parents" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/parents">
                <ParentManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/clinic" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/clinic">
                <ClinicManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/class-resources" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/class-resources">
                <ClassResources />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        
        <Route path="/teacher-scheduling" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/teacher-scheduling">
                <TeacherScheduling />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* Restrict report cards to non-secretary roles */}
        <Route path="/reports" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/reports" disallowRoles={['SECRETARY']}>
                <ReportCards />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* Allow weekly reports for Secretary (view-only) */}
        <Route path="/weekly-reports" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/weekly-reports">
                <WeeklyReports />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/photos" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/photos">
                <PhotoManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/teacher-marks" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/teacher-marks">
                <TeacherMarksEntry />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/settings">
                <SettingsPanel />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/system-settings" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute path="/system-settings">
                <SystemSettings />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        
        
        <Route path="/forms" element={
          <AuthProtectedRoute>
            <Layout>
                <ProtectedRoute path="/forms">
                  <FormsManagement />
                </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/financial-management" element={
          <AuthProtectedRoute>
            <Layout>
              {/* SECRETARY is view-only; ACCOUNTANT has full FinancialManagement */}
              {user?.role === 'SECRETARY' ? (
                <SecretaryFeeBalances />
              ) : (
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPERUSER', 'ACCOUNTANT']}>
                  <FinancialManagement />
                </ProtectedRoute>
              )}
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* CFO Routes */}
        <Route path="/cfo/school-funding" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <SchoolFundingManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/cfo/foundation-funding" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <FoundationFundingManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/cfo/farm-income" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <FarmIncomeManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/cfo/clinic-income" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <ClinicIncomeManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/cfo/expenditures" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <ExpenditureManagement />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* Fund Allocation removed as Expenditures covers the workflow */}
        
        <Route path="/cfo/financial-statements" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <FinancialStatementGeneration />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        <Route path="/cfo/analytics" element={
          <AuthProtectedRoute>
            <Layout>
              <ProtectedRoute allowedRoles={['CFO', 'ADMIN']}>
                <FinancialAnalytics />
              </ProtectedRoute>
            </Layout>
          </AuthProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  // Purge any legacy paymentSummary_* cache keys at app start to prevent stale dashboards
  useEffect(() => {
    // Removed localStorage cleanup: summaries are server-sourced now
    try {} catch (_err) {}
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ClinicModalProvider>
            <NotificationProvider>
              <AINotificationProvider>
                <AppContent />
              </AINotificationProvider>
            </NotificationProvider>
          </ClinicModalProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;