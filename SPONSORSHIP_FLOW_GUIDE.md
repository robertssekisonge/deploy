# Sponsorship Flow Guide

## Overview
This document explains the complete sponsorship workflow implemented in the system. The flow ensures that students go through proper stages of approval before being sponsored.

## Complete Flow Diagram

```
Admin Admits Child
       ↓
   [Check Sponsorship Box]
       ↓
Student goes to "Check for Eligibility" box
       ↓
Sponsorship Overseer reviews & edits story
       ↓
Sponsorship Overseer approves → Student moves to "Eligible" box
       ↓
Sponsorship Overseer approves from "Eligible" → Student moves to "Pending for Sponsorships"
       ↓
Sponsor sees available children & requests sponsorship
       ↓
Sponsorship Overseer approves sponsor request → Sent to Admin for final approval
       ↓
Admin gives final approval → Child appears in Sponsor's "My Sponsored Children"
```

## Detailed Stage Breakdown

### 1. **Admin Admits Child** 
- **Location**: Student creation form
- **Action**: Check "This student needs sponsorship support" box
- **Result**: Student automatically gets `sponsorshipStatus: 'pending'`
- **Next Stage**: Student appears in "Check for Eligibility" box

### 2. **Check for Eligibility Box** (Pending Applications)
- **Location**: Sponsorship Management → "Pending/Coordinator-Approved Applications"
- **Who**: Sponsorship Overseer
- **Actions Available**:
  - ✅ **Edit**: Modify sponsorship story about the child
  - ✅ **View Details**: See full student information
  - ❌ **Disapprove**: Reject the application (stays in pending)
- **Purpose**: Initial review of sponsorship applications

### 3. **Eligible for Sponsorship Box**
- **Location**: Sponsorship Management → "Eligible for Sponsorship"
- **Who**: Sponsorship Overseer
- **Actions Available**:
  - ✅ **Edit**: Modify sponsorship story
  - ✅ **View Details**: See full student information
  - ✅ **Approve**: Move student to "Pending for Sponsorships"
- **Purpose**: Students approved for sponsorship, waiting to be made available to sponsors

### 4. **Pending for Sponsorships** (Available for Sponsors)
- **Location**: `/available-for-sponsors` route
- **Who**: Potential Sponsors
- **Actions Available**:
  - ✅ **View Details**: See full student information and story
  - ❤️ **Sponsor This Child**: Submit sponsorship request
- **Purpose**: Children visible to potential sponsors

### 5. **Sponsor Request Processing**
- **Location**: Sponsorship Management → "Pending Sponsorship Requests"
- **Who**: Sponsorship Overseer
- **Actions Available**:
  - ✅ **View Details**: See student information
  - ✅ **Approve**: Send to Admin for final approval
  - ❌ **Reject**: Return student to available for sponsors
- **Purpose**: Review sponsor applications

### 6. **Admin Final Approval**
- **Location**: `/admin-sponsorship-approval` route
- **Who**: Administrators
- **Actions Available**:
  - ✅ **View Details**: See student and sponsorship information
  - ✅ **Approve**: Finalize sponsorship (child becomes sponsored)
  - ❌ **Reject**: Return to available for sponsors
- **Purpose**: Final verification and approval

### 7. **My Sponsored Children**
- **Location**: `/my-sponsored-children` route
- **Who**: Sponsors
- **Content**: List of children currently being sponsored
- **Purpose**: Track active sponsorships

## User Roles and Permissions

### **Administrator**
- Can admit new students
- Can mark students for sponsorship
- Can give final approval to sponsorship requests
- **Routes**: `/admin-sponsorship-approval`

### **Sponsorship Overseer**
- Can review pending applications
- Can edit sponsorship stories
- Can approve students for sponsorship
- Can approve/reject sponsor requests
- **Routes**: `/sponsorships` (main management)

### **Sponsor**
- Can view available children
- Can request to sponsor children
- Can view their sponsored children
- **Routes**: `/available-for-sponsors`, `/my-sponsored-children`

## Database Status Flow

```
sponsorshipStatus: 'none' → 'pending' → 'eligible' → 'available-for-sponsors' → 'sponsored'
```

### Status Meanings:
- **`none`**: Student doesn't need sponsorship
- **`pending`**: Student needs sponsorship, awaiting overseer review
- **`eligible`**: Student approved for sponsorship, awaiting overseer approval to make available
- **`available-for-sponsors`**: Student visible to potential sponsors
- **`sponsored`**: Student has active sponsorship

## Sponsorship Request Status Flow

```
status: 'pending' → 'coordinator-approved' → 'pending-admin-approval' → 'sponsored'
```

### Status Meanings:
- **`pending`**: Sponsor request submitted, awaiting overseer review
- **`coordinator-approved`**: Overseer approved, sent to admin
- **`pending-admin-approval`**: Awaiting final admin approval
- **`sponsored`**: Final approval given, sponsorship active

## Key Components

### **SponsorshipManagement.tsx**
- Main dashboard for overseers
- Shows all three main sections
- Handles student status transitions

### **AvailableForSponsors.tsx**
- Shows children available for sponsorship
- Allows sponsors to request sponsorship
- Includes sponsorship request form

### **MySponsoredChildren.tsx**
- Shows sponsor's active sponsorships
- Displays sponsorship details and status

### **AdminSponsorshipApproval.tsx**
- Final approval interface for administrators
- Shows pending admin approvals

## API Endpoints

### **Backend Routes** (`/api/sponsorships`)
- `POST /` - Create sponsorship request
- `PUT /:id` - Update sponsorship
- `POST /:id/approve` - Approve sponsorship (coordinator)
- `POST /:id/reject` - Reject sponsorship
- `POST /:id/approve-sponsored` - Final admin approval
- `POST /student/:studentId/make-available` - Move to available for sponsors
- `POST /student/:studentId/make-eligible` - Move back to eligible

## Testing the Flow

1. **Create a test student** with sponsorship needed
2. **Verify student appears** in "Pending Applications"
3. **Edit and approve** student to move to "Eligible"
4. **Approve from eligible** to make available for sponsors
5. **Submit sponsorship request** as a sponsor
6. **Approve request** as overseer
7. **Give final approval** as admin
8. **Verify child appears** in sponsor's dashboard

## Troubleshooting

### **Student not appearing in expected box**
- Check `sponsorshipStatus` in database
- Verify `needsSponsorship` is true
- Check user permissions

### **Sponsorship request not working**
- Verify backend server is running
- Check API endpoints are accessible
- Verify student status is 'available-for-sponsors'

### **Status not updating**
- Check DataContext functions are properly connected
- Verify backend routes are working
- Check browser console for errors

## Security Notes

- All status changes require proper permissions
- Students can only be moved through proper workflow stages
- Sponsorship stories are locked after final approval
- All actions are logged and tracked

## Future Enhancements

- Email notifications for status changes
- Payment tracking integration
- Sponsorship renewal workflows
- Advanced reporting and analytics
- Mobile app support

