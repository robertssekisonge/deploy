# Photo System Guide for Overseer Account

## 🎯 Overview

This guide explains how the photo system works in your sponsorship management system. The system now ensures that **ALL uploaded photos are permanently stored and will never disappear** when you update student records or check eligibility.

## 📸 Three Photo Types for Sponsored Students

### 1. **Student Profile Picture** (`photo`)
- **Purpose**: Full picture of the student wanting sponsorship
- **When Required**: Always required for all students
- **Storage**: Stored in the `photo` field in the database
- **File Naming**: `student_{studentId}_{uuid}.jpg`

### 2. **Family Picture** (`familyPhoto`)
- **Purpose**: Photo with family for context and sponsorship appeal
- **When Required**: Required when `needsSponsorship` is true
- **Storage**: Stored in the `familyPhoto` field in the database
- **File Naming**: `family_{studentId}_{uuid}.jpg`

### 3. **Passport Photo** (`passportPhoto`)
- **Purpose**: Official passport-style photo for identification
- **When Required**: Required when `needsSponsorship` is true
- **Storage**: Stored in the `passportPhoto` field in the database
- **File Naming**: `passport_{studentId}_{uuid}.jpg`

## 🔒 Permanent Storage Guarantee

### What Was Fixed
- **Before**: Photos were being lost when updating `sponsorshipStatus` to 'eligible'
- **After**: Photos are now permanently stored and preserved during ALL updates

### How It Works
1. **Photo Upload**: Photos are immediately saved to the server's file system
2. **Database Storage**: Photo filenames are stored in the database
3. **Permanent Preservation**: Photos are never deleted unless explicitly removed
4. **Update Safety**: All student updates preserve existing photo fields

## 🚀 How to Use the Photo System

### Adding a New Student with Photos

1. **Fill Basic Information**
   - Name, age, class, stream, etc.
   - Check "Needs Sponsorship" if applicable

2. **Upload Student Profile Photo**
   - Click "Choose File" for the profile photo
   - Select a clear, full-body photo of the student

3. **Upload Family Photo** (if sponsorship needed)
   - Click "Choose File" for the family photo
   - Select a photo showing the student with family

4. **Upload Passport Photo** (if sponsorship needed)
   - Click "Choose File" for the passport photo
   - Select a clear, passport-style photo

5. **Save Student**
   - All photos are automatically uploaded and stored
   - Photos are permanently linked to the student

### Updating Student Information

1. **Edit Student**
   - Open the student record for editing
   - All existing photos remain visible

2. **Change Photos** (if needed)
   - Select new photo files to replace existing ones
   - Old photos are automatically replaced
   - New photos are permanently stored

3. **Update Other Fields**
   - Change sponsorship status, class, etc.
   - **Photos are automatically preserved**

### Checking Eligibility

1. **Review Student**
   - All three photos remain visible
   - Photos are permanently stored

2. **Update Sponsorship Status**
   - Change to 'eligible', 'sponsored', etc.
   - **Photos are automatically preserved**

3. **Sponsor View**
   - Sponsors can see all three photos
   - Photos are permanently accessible

## 📁 File Storage Structure

```
MINE/backend/uploads/
├── student_123_abc123.jpg      # Student profile photo
├── family_123_def456.jpg       # Family photo
├── passport_123_ghi789.jpg     # Passport photo
├── student_456_jkl012.jpg      # Another student's photo
└── ...
```

## 🔍 Photo Access URLs

### For Display in Frontend
- **Student Profile**: `/photos/student_123_abc123.jpg`
- **Family Photo**: `/photos/family_123_def456.jpg`
- **Passport Photo**: `/photos/passport_123_ghi789.jpg`

### Direct File Access
- **All Photos**: `/uploads/{filename}`

## 🛠️ Technical Details

### Photo Upload Endpoints
- `POST /api/photos/student-profile/{studentId}` - Student profile photo
- `POST /api/photos/family/{studentId}` - Family photo
- `POST /api/photos/passport/{studentId}` - Passport photo
- `POST /api/photos/student/{studentId}` - General student photo

### Photo Serving
- `GET /photos/{filename}` - Optimized photo serving with caching
- `GET /uploads/{filename}` - Direct file access

### Health Monitoring
- `GET /api/photos/health` - Check photo system status
- `GET /api/photos/list` - List all available photos

## ✅ Best Practices

### Photo Quality
- **Profile Photo**: Clear, full-body shot, good lighting
- **Family Photo**: Shows family context, student clearly visible
- **Passport Photo**: Professional, clear face, neutral background

### File Formats
- **Supported**: JPEG, PNG, GIF, WebP
- **Recommended**: JPEG for photos, PNG for graphics
- **Size Limit**: 50MB per photo

### Naming Convention
- Photos are automatically named with unique identifiers
- No need to rename files manually
- System handles all file management

## 🚨 Troubleshooting

### Photos Not Displaying
1. Check if photos were uploaded successfully
2. Verify photo filenames in the database
3. Check server logs for errors
4. Use `/api/photos/health` to diagnose issues

### Upload Failures
1. Check file size (max 50MB)
2. Verify file format (JPEG, PNG, GIF, WebP)
3. Check server disk space
4. Review server logs for errors

### Missing Photos After Update
1. Photos should never disappear - this indicates a bug
2. Check if photos were accidentally removed
3. Verify database photo fields are preserved
4. Contact system administrator

## 🔧 Testing the System

### Run Photo System Tests
```bash
cd MINE/backend
node test-photo-system.js
```

### Manual Testing
1. Upload photos for a test student
2. Update student information
3. Verify photos remain visible
4. Check sponsor view shows all photos

## 📊 Monitoring

### Health Check
- Regular monitoring via `/api/photos/health`
- Check photo count and storage status
- Monitor uploads directory size

### Logs
- Photo uploads are logged
- Photo serving is logged
- Errors are logged with details

## 🎉 Summary

The photo system now guarantees that:
- ✅ **All photos are permanently stored**
- ✅ **Photos never disappear during updates**
- ✅ **Three distinct photo types for sponsored students**
- ✅ **Automatic preservation during all operations**
- ✅ **Sponsors can always see the photos**
- ✅ **System is robust and reliable**

Your sponsored students' photos are now safe and will remain visible to sponsors throughout the entire sponsorship process!
















