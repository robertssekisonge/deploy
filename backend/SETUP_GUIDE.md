# School Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git (for version control)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd school-management-system

# Install dependencies
npm install
cd backend && npm install && cd ..

# Setup database
cd backend
npx prisma migrate dev
npm run seed
cd ..

# Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🔐 Login Credentials

### Admin Users
- **Email**: `superadmin@school.com`
- **Password**: `password`

- **Email**: `robs@school.com`
- **Password**: `hub h@11`

### Teacher Users
- **Email**: `teacher1@school.com`
- **Password**: `password`

- **Email**: `teacher2@school.com`
- **Password**: `password`

### Other Users
- **Parent**: `parent1@school.com` / `password`
- **Nurse**: `nurse@school.com` / `password`
- **Sponsor**: `sponsor@school.com` / `password`

## 📁 Project Structure

```
school-management-system/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── students/      # Student management
│   │   ├── teachers/      # Teacher management
│   │   ├── payments/      # Payment system
│   │   ├── attendance/    # Attendance management
│   │   ├── messaging/     # Messaging system
│   │   ├── resources/     # Resource management
│   │   ├── reports/       # Reports and analytics
│   │   ├── settings/      # System settings
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── types/             # TypeScript definitions
│   └── App.tsx            # Main app component
├── backend/               # Backend Node.js server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── students.ts
│   │   │   ├── teachers.ts
│   │   │   ├── payments.ts
│   │   │   ├── attendance.ts
│   │   │   ├── messages.ts
│   │   │   ├── resources.ts
│   │   │   ├── reports.ts
│   │   │   ├── settings.ts
│   │   │   ├── notifications.ts
│   │   │   └── clinic.ts
│   │   ├── middleware/    # Express middleware
│   │   └── server.ts      # Main server file
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # Database migrations
│   │   └── seed.ts        # Database seeding
│   └── package.json
├── package.json           # Frontend dependencies
├── README.md              # Project documentation
├── .gitignore            # Git ignore rules
├── deploy.ps1            # Deployment script
├── backup.ps1            # Backup script
└── SETUP_GUIDE.md        # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🗄️ Database Management

### Prisma Commands
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset --force

# Seed database
npm run seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Database Schema
The system uses SQLite with the following main models:
- **User** - All system users (admin, teachers, parents, etc.)
- **Student** - Student information and profiles
- **Class** - Class management
- **Attendance** - Daily attendance records
- **Payment** - Payment tracking
- **Message** - Internal messaging
- **Resource** - File management
- **WeeklyReport** - Weekly reports from users
- **ClinicRecord** - Health records
- **Notification** - System notifications
- **BillingType** - Billing configurations

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Start backend
cd backend && npm start
```

### Using Deployment Script
```powershell
# Run the deployment script
.\deploy.ps1
```

## 💾 Backup and Restore

### Create Backup
```powershell
# Run backup script
.\backup.ps1

# Or manually
Compress-Archive -Path "backup_*" -DestinationPath "backup.zip"
```

### Restore from Backup
1. Extract backup files
2. Copy to project directory
3. Run: `cd backend && npm install`
4. Run: `npm install` (from root)
5. Run: `cd backend && npx prisma generate`
6. Start servers

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process-id> /F
```

#### 2. Database Issues
```bash
cd backend
npx prisma migrate reset --force
npm run seed
```

#### 3. Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### 4. Prisma Issues
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Error Logs
- **Frontend**: Check browser console
- **Backend**: Check terminal output
- **Database**: Use `npx prisma studio`

## 📞 Support

### Developer Contact
- **Name**: Roberts Sekisonge
- **Email**: robertssekisonge1147@gmail.com

### System Information
- **Version**: 1.0.0
- **Last Updated**: August 4, 2025
- **Database**: SQLite
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma

## 🔄 Updates and Maintenance

### Regular Maintenance
1. **Weekly**: Check for updates
2. **Monthly**: Database backup
3. **Quarterly**: Security review

### Update Process
1. Pull latest changes: `git pull`
2. Install dependencies: `npm install && cd backend && npm install`
3. Run migrations: `cd backend && npx prisma migrate dev`
4. Restart servers

### Security Best Practices
1. Change default passwords
2. Keep dependencies updated
3. Regular backups
4. Monitor logs
5. Use HTTPS in production

## 📋 Feature Checklist

### ✅ Completed Features
- [x] User authentication and authorization
- [x] Multi-role user system
- [x] Student management
- [x] Teacher management
- [x] Attendance tracking
- [x] Payment system
- [x] Messaging system
- [x] Resource management
- [x] Weekly reports
- [x] Clinic records
- [x] Notifications
- [x] Night mode
- [x] Database persistence
- [x] File upload/download
- [x] Search functionality
- [x] Conduct notes
- [x] Student flagging
- [x] Backup system

### 🔄 Future Enhancements
- [ ] Email notifications
- [ ] SMS integration
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Calendar integration
- [ ] Parent portal
- [ ] Online payments
- [ ] Document generation
- [ ] API documentation
- [ ] Unit tests 

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git (for version control)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd school-management-system

# Install dependencies
npm install
cd backend && npm install && cd ..

# Setup database
cd backend
npx prisma migrate dev
npm run seed
cd ..

# Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🔐 Login Credentials

### Admin Users
- **Email**: `superadmin@school.com`
- **Password**: `password`

- **Email**: `robs@school.com`
- **Password**: `hub h@11`

### Teacher Users
- **Email**: `teacher1@school.com`
- **Password**: `password`

- **Email**: `teacher2@school.com`
- **Password**: `password`

### Other Users
- **Parent**: `parent1@school.com` / `password`
- **Nurse**: `nurse@school.com` / `password`
- **Sponsor**: `sponsor@school.com` / `password`

## 📁 Project Structure

```
school-management-system/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── students/      # Student management
│   │   ├── teachers/      # Teacher management
│   │   ├── payments/      # Payment system
│   │   ├── attendance/    # Attendance management
│   │   ├── messaging/     # Messaging system
│   │   ├── resources/     # Resource management
│   │   ├── reports/       # Reports and analytics
│   │   ├── settings/      # System settings
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── types/             # TypeScript definitions
│   └── App.tsx            # Main app component
├── backend/               # Backend Node.js server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── students.ts
│   │   │   ├── teachers.ts
│   │   │   ├── payments.ts
│   │   │   ├── attendance.ts
│   │   │   ├── messages.ts
│   │   │   ├── resources.ts
│   │   │   ├── reports.ts
│   │   │   ├── settings.ts
│   │   │   ├── notifications.ts
│   │   │   └── clinic.ts
│   │   ├── middleware/    # Express middleware
│   │   └── server.ts      # Main server file
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # Database migrations
│   │   └── seed.ts        # Database seeding
│   └── package.json
├── package.json           # Frontend dependencies
├── README.md              # Project documentation
├── .gitignore            # Git ignore rules
├── deploy.ps1            # Deployment script
├── backup.ps1            # Backup script
└── SETUP_GUIDE.md        # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🗄️ Database Management

### Prisma Commands
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset --force

# Seed database
npm run seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Database Schema
The system uses SQLite with the following main models:
- **User** - All system users (admin, teachers, parents, etc.)
- **Student** - Student information and profiles
- **Class** - Class management
- **Attendance** - Daily attendance records
- **Payment** - Payment tracking
- **Message** - Internal messaging
- **Resource** - File management
- **WeeklyReport** - Weekly reports from users
- **ClinicRecord** - Health records
- **Notification** - System notifications
- **BillingType** - Billing configurations

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Start backend
cd backend && npm start
```

### Using Deployment Script
```powershell
# Run the deployment script
.\deploy.ps1
```

## 💾 Backup and Restore

### Create Backup
```powershell
# Run backup script
.\backup.ps1

# Or manually
Compress-Archive -Path "backup_*" -DestinationPath "backup.zip"
```

### Restore from Backup
1. Extract backup files
2. Copy to project directory
3. Run: `cd backend && npm install`
4. Run: `npm install` (from root)
5. Run: `cd backend && npx prisma generate`
6. Start servers

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process-id> /F
```

#### 2. Database Issues
```bash
cd backend
npx prisma migrate reset --force
npm run seed
```

#### 3. Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### 4. Prisma Issues
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Error Logs
- **Frontend**: Check browser console
- **Backend**: Check terminal output
- **Database**: Use `npx prisma studio`

## 📞 Support

### Developer Contact
- **Name**: Roberts Sekisonge
- **Email**: robertssekisonge1147@gmail.com

### System Information
- **Version**: 1.0.0
- **Last Updated**: August 4, 2025
- **Database**: SQLite
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma

## 🔄 Updates and Maintenance

### Regular Maintenance
1. **Weekly**: Check for updates
2. **Monthly**: Database backup
3. **Quarterly**: Security review

### Update Process
1. Pull latest changes: `git pull`
2. Install dependencies: `npm install && cd backend && npm install`
3. Run migrations: `cd backend && npx prisma migrate dev`
4. Restart servers

### Security Best Practices
1. Change default passwords
2. Keep dependencies updated
3. Regular backups
4. Monitor logs
5. Use HTTPS in production

## 📋 Feature Checklist

### ✅ Completed Features
- [x] User authentication and authorization
- [x] Multi-role user system
- [x] Student management
- [x] Teacher management
- [x] Attendance tracking
- [x] Payment system
- [x] Messaging system
- [x] Resource management
- [x] Weekly reports
- [x] Clinic records
- [x] Notifications
- [x] Night mode
- [x] Database persistence
- [x] File upload/download
- [x] Search functionality
- [x] Conduct notes
- [x] Student flagging
- [x] Backup system

### 🔄 Future Enhancements
- [ ] Email notifications
- [ ] SMS integration
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Calendar integration
- [ ] Parent portal
- [ ] Online payments
- [ ] Document generation
- [ ] API documentation
- [ ] Unit tests 