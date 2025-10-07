# School Management System (SMS) - Complete Flow Chart

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[Login Page] --> B[AuthContext]
        B --> C{Role-Based Dashboard}
        
        C -->|ADMIN| D[Admin Dashboard]
        C -->|TEACHER| E[Teacher Dashboard]
        C -->|SUPER_TEACHER| F[Super Teacher Dashboard]
        C -->|PARENT| G[Parent Dashboard]
        C -->|NURSE| H[Nurse Dashboard]
        C -->|SPONSOR| I[Sponsor Dashboard]
        C -->|SUPERUSER| J[Super User Dashboard]
        C -->|SPONSORSHIPS_OVERSEER| K[Overseer Dashboard]
        C -->|SPONSORSHIP_COORDINATOR| L[Coordinator Dashboard]
        
        D --> M[Student Management]
        D --> N[User Management]
        D --> O[Financial Management]
        D --> P[System Settings]
        
        E --> Q[Attendance Management]
        E --> R[Student Marks Entry]
        E --> S[Class Resources]
        
        F --> T[Multi-Stream Management]
        F --> U[Teacher Analytics]
        
        G --> V[Child Information]
        G --> W[Payment Status]
        G --> X[Messages]
        
        H --> Y[Clinic Records]
        H --> Z[Health Analytics]
        
        I --> AA[Available Students]
        I --> BB[My Sponsored Children]
        I --> CC[Sponsorship Requests]
        
        J --> DD[System Analytics]
        J --> EE[Advanced Settings]
        
        K --> FF[Student Enrollment]
        K --> GG[Sponsorship Oversight]
        
        L --> HH[Sponsorship Coordination]
        L --> II[Approval Management]
    end
    
    subgraph "Backend (Node.js + Express)"
        JJ[Express Server :5000] --> KK[API Routes]
        KK --> LL[Authentication Middleware]
        KK --> MM[Privilege System]
        KK --> NN[Database Layer]
        
        LL --> OO[JWT Token Validation]
        MM --> PP[Role-Based Access Control]
        MM --> QQ[Granular Privileges]
        
        NN --> RR[Prisma ORM]
        RR --> SS[PostgreSQL Database]
    end
    
    subgraph "Database Schema"
        SS --> TT[Users Table]
        SS --> UU[Students Table]
        SS --> VV[Teachers Table]
        SS --> WW[Classes Table]
        SS --> XX[Attendance Table]
        SS --> YY[Payments Table]
        SS --> ZZ[Sponsorships Table]
        SS --> AAA[Clinic Records Table]
        SS --> BBB[Messages Table]
        SS --> CCC[UserPrivileges Table]
        SS --> DDD[Academic Records Table]
        SS --> EEE[Financial Records Table]
        SS --> FFF[TimeTable Table]
        SS --> GGG[Resources Table]
        SS --> HHH[Weekly Reports Table]
        SS --> III[Settings Table]
    end
    
    subgraph "File Storage"
        JJJ[Uploads Directory] --> KKK[Student Photos]
        JJJ --> LLL[Family Photos]
        JJJ --> MMM[Passport Photos]
        JJJ --> NNN[Resource Files]
        JJJ --> OOO[Teacher CVs]
    end
    
    A -.->|HTTP Requests| JJ
    M -.->|API Calls| KK
    N -.->|API Calls| KK
    O -.->|API Calls| KK
    Q -.->|API Calls| KK
    R -.->|API Calls| KK
    Y -.->|API Calls| KK
    AA -.->|API Calls| KK
    DD -.->|API Calls| KK
    FF -.->|API Calls| KK
    HH -.->|API Calls| KK
    
    JJ -.->|File Uploads| JJJ
    JJ -.->|File Serving| JJJ
```

## User Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    
    U->>F: Enter credentials
    F->>B: POST /api/auth/login
    B->>D: Validate user credentials
    D-->>B: User data + privileges
    B->>B: Generate JWT token
    B-->>F: User data + token
    F->>F: Store in localStorage
    F->>F: Redirect to role-based dashboard
    
    Note over F,D: User session management
    F->>B: API requests with JWT
    B->>B: Validate token
    B->>D: Check user privileges
    D-->>B: Privilege status
    B-->>F: Authorized response or 403
    
    Note over F,D: Logout process
    U->>F: Click logout
    F->>F: Clear localStorage
    F->>F: Redirect to login
```

## Student Management Flow

```mermaid
flowchart TD
    A[Student Registration] --> B{Admission Source}
    B -->|Admin| C[Direct Admission]
    B -->|Overseer| D[Overseer Enrollment]
    
    C --> E[Generate Access Number]
    D --> E
    E --> F[Create Student Record]
    F --> G[Assign to Class/Stream]
    G --> H[Set Fee Structure]
    H --> I[Upload Photos]
    I --> J[Parent Information]
    J --> K[Student Active]
    
    K --> L[Academic Tracking]
    K --> M[Attendance Management]
    K --> N[Financial Management]
    K --> O[Health Records]
    K --> P[Sponsorship Process]
    
    L --> Q[Report Cards]
    M --> R[Attendance Analytics]
    N --> S[Payment Tracking]
    O --> T[Clinic Visits]
    P --> U[Sponsor Matching]
```

## Sponsorship Management Flow

```mermaid
flowchart TD
    A[Student Needs Sponsorship] --> B[Eligibility Check]
    B --> C{Student Eligible?}
    C -->|No| D[Student Not Eligible]
    C -->|Yes| E[Mark as Available]
    
    E --> F[Sponsor Views Available Students]
    F --> G[Sponsor Requests Sponsorship]
    G --> H[Overseer Review]
    H --> I{Overseer Approval?}
    
    I -->|No| J[Request Rejected]
    I -->|Yes| K[Coordinator Review]
    K --> L{Coordinator Approval?}
    
    L -->|No| M[Request Rejected]
    L -->|Yes| N[Admin Final Approval]
    N --> O{Admin Approval?}
    
    O -->|No| P[Request Rejected]
    O -->|Yes| Q[Sponsorship Active]
    
    Q --> R[Payment Processing]
    Q --> S[Progress Tracking]
    Q --> T[Communication System]
    
    R --> U[Financial Records]
    S --> V[Academic Progress]
    T --> W[Messages & Updates]
```

## Financial Management Flow

```mermaid
flowchart TD
    A[Fee Structure Setup] --> B[Class-Based Fees]
    B --> C[Student Fee Assignment]
    C --> D[Payment Due Dates]
    
    D --> E[Payment Processing]
    E --> F{Payment Method}
    F -->|Cash| G[Cash Payment]
    F -->|Mobile Money| H[Mobile Payment]
    F -->|Bank Transfer| I[Bank Payment]
    
    G --> J[Record Payment]
    H --> J
    I --> J
    
    J --> K[Update Student Balance]
    K --> L[Generate Receipt]
    L --> M[Send Notification]
    
    M --> N[Financial Analytics]
    N --> O[Payment Reports]
    O --> P[Overdue Tracking]
    P --> Q[Late Fee Calculation]
```

## Attendance Management Flow

```mermaid
flowchart TD
    A[Teacher Login] --> B[Select Class/Stream]
    B --> C[View Student List]
    C --> D[Mark Attendance]
    D --> E{Student Present?}
    
    E -->|Yes| F[Mark Present]
    E -->|No| G[Mark Absent]
    E -->|Late| H[Mark Late]
    
    F --> I[Save Attendance]
    G --> I
    H --> I
    
    I --> J[Generate Attendance Report]
    J --> K[Parent Notification]
    K --> L[Attendance Analytics]
    
    L --> M[Attendance Trends]
    L --> N[Student Performance Correlation]
    L --> O[Teacher Analytics]
```

## Messaging System Flow

```mermaid
flowchart TD
    A[User Login] --> B[Check Message Privileges]
    B --> C{Can Send Messages?}
    C -->|No| D[Restricted Access]
    C -->|Yes| E[Compose Message]
    
    E --> F[Select Recipient Type]
    F --> G{Recipient Selection}
    G -->|Admin| H[Admin Messages]
    G -->|Teacher| I[Teacher Messages]
    G -->|Parent| J[Parent Messages]
    G -->|Nurse| K[Nurse Messages]
    G -->|Sponsor| L[Sponsor Messages]
    
    H --> M[Send Message]
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Message Stored]
    N --> O[Recipient Notification]
    O --> P[Message Read Tracking]
    P --> Q[Reply System]
    Q --> R[Message Analytics]
```

## Privilege System Architecture

```mermaid
graph TB
    subgraph "User Roles"
        A[ADMIN] --> A1[Full System Access]
        B[SUPERUSER] --> B1[System Analytics]
        C[SUPER_TEACHER] --> C1[Multi-Stream Management]
        D[TEACHER] --> D1[Class Management]
        E[PARENT] --> E1[Child Information]
        F[NURSE] --> F1[Health Records]
        G[SPONSOR] --> G1[Sponsorship Management]
        H[SPONSORSHIPS_OVERSEER] --> H1[Student Enrollment]
        I[SPONSORSHIP_COORDINATOR] --> I1[Approval Process]
    end
    
    subgraph "Granular Privileges"
        J[view_students] --> J1[Student List Access]
        K[add_student] --> K1[Create New Students]
        L[edit_student] --> L1[Modify Student Data]
        M[delete_student] --> M1[Remove Students]
        N[view_attendance] --> N1[Attendance Records]
        O[mark_attendance] --> O1[Record Attendance]
        P[view_financial] --> P1[Financial Data]
        Q[add_financial_record] --> Q1[Create Financial Records]
        R[view_sponsorships] --> R1[Sponsorship Data]
        S[manage_sponsorships] --> S1[Sponsorship Operations]
        T[view_messages] --> T1[Message Access]
        U[send_message] --> U1[Send Messages]
        V[view_clinic_records] --> V1[Health Records]
        W[add_clinic_record] --> W1[Create Health Records]
    end
    
    subgraph "Time-Limited Privileges"
        X[Privilege Assignment] --> Y[Expiration Date]
        Y --> Z[Automatic Revocation]
        Z --> AA[Access Denied]
    end
    
    A1 -.-> J
    A1 -.-> K
    A1 -.-> L
    A1 -.-> M
    D1 -.-> N
    D1 -.-> O
    F1 -.-> V
    F1 -.-> W
    G1 -.-> R
    G1 -.-> S
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Frontend Layer"
        A[React Components] --> B[Context Providers]
        B --> C[API Services]
        C --> D[State Management]
    end
    
    subgraph "API Layer"
        E[Express Routes] --> F[Middleware]
        F --> G[Authentication]
        G --> H[Authorization]
        H --> I[Validation]
    end
    
    subgraph "Business Logic"
        J[Service Layer] --> K[Data Processing]
        K --> L[Business Rules]
        L --> M[Error Handling]
    end
    
    subgraph "Data Layer"
        N[Prisma ORM] --> O[Database Queries]
        O --> P[PostgreSQL]
        P --> Q[Data Persistence]
    end
    
    subgraph "File System"
        R[File Uploads] --> S[Image Processing]
        S --> T[File Storage]
        T --> U[Static Serving]
    end
    
    C --> E
    I --> J
    M --> N
    Q --> R
    U --> A
```

## System Components Overview

### Core Modules:
1. **Authentication & Authorization** - JWT-based with granular privileges
2. **Student Management** - Complete student lifecycle management
3. **Teacher Management** - Teacher assignments and analytics
4. **Class & Stream Management** - Academic structure organization
5. **Attendance System** - Real-time attendance tracking
6. **Financial Management** - Fee structure and payment processing
7. **Sponsorship System** - Multi-stage approval process
8. **Health Records** - Clinic management and tracking
9. **Messaging System** - Role-based communication
10. **Resource Management** - File uploads and sharing
11. **Analytics & Reporting** - Comprehensive data insights
12. **System Administration** - Settings and maintenance

### Key Features:
- **Role-Based Access Control** with 9 different user roles
- **Granular Privilege System** with 200+ specific permissions
- **Time-Limited Privileges** with automatic expiration
- **Multi-Stage Sponsorship Process** with overseer and coordinator approval
- **Real-Time Messaging** with role-based restrictions
- **Comprehensive Analytics** across all modules
- **File Management** for photos, documents, and resources
- **Academic Tracking** with report cards and progress monitoring
- **Financial Tracking** with payment methods and overdue management
- **Health Management** with clinic records and follow-up tracking

### Technology Stack:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local file system with static serving
- **API**: RESTful API with comprehensive error handling
- **Security**: CORS, input validation, privilege-based access control

This system provides a comprehensive school management solution with robust security, flexible user roles, and extensive functionality for managing all aspects of school operations.



## Grading and Student Positioning

### Grade Bands
- A: 80–100
- B+: 75–79
- B: 70–74
- C+: 65–69
- C: 60–64
- D+: 55–59
- D: 50–54
- F: 0–49

These bands are editable in Settings ➜ System ➜ Grade System. Each band carries a comment that can be printed on reports.

### Computation
For each term and student:
1. For every subject, compute subject total = sum of all assessed components for the term.
2. Compute overall totals:
   - totalMarks = sum(subject total for all subjects attempted)
   - subjectsCount = number of subjects with a valid score
   - average = round(totalMarks ÷ subjectsCount, 2)
   - grade = band where average falls

### Positioning Algorithm
Positioning is done at three levels: class, stream, and overall (whole school for the term).

Sort students within each cohort using the comparator below, then assign 1, 2, 3, …; students with identical metrics share a position and the next position is skipped accordingly (1, 2, 2, 4 …).

Comparator (in priority order):
1. Higher average first
2. If tie, higher totalMarks
3. If tie, more subjectsCount (attempted subjects)
4. If tie, higher weighted core-subject score (Math + English + Science + Social Studies if available)
5. If tie, higher attendance rate for the term
6. If tie, alphabetical order by lastName, firstName (stable)

### Stored Fields (per student, per term)
- totalMarks
- average
- grade
- positionClass
- positionStream
- positionOverall
- tieBreakMeta: { coreScore, attendanceRate, subjectsCount }

### Recompute Triggers
- On score entry/update/deletion
- On grade band changes in Settings
- On subject enrollment changes

The recompute job updates the stored fields and emits events for report generation and analytics.