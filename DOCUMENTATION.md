# Harmony360 Compliance System - Documentation

## Overview

Harmony360 is a comprehensive healthcare compliance management system designed for NHS practices to track staff competencies, manage Harmony360 compliance requirements, and maintain audit trails.

## User Roles & Permissions

### Super Admin (`super_admin`)
- **Email**: `sage@myai.ad`
- **Access**: Full system access across all practices
- **Capabilities**:
  - View global statistics and metrics
  - Manage all practices in the system
  - User management across practices
  - System health monitoring
  - Debug mode toggle

### Practice Admin (`admin`)
- **Access**: Full access within their assigned practice
- **Capabilities**:
  - Manage staff within practice
  - Configure practice settings
  - View compliance reports
  - Import/export data

### Practice Manager (`manager`)
- **Access**: Management level access within practice
- **Capabilities**:
  - Assign tasks to staff
  - Review competency assessments
  - Generate reports

### Staff (`staff`)
- **Access**: Basic access within practice
- **Capabilities**:
  - View assigned tasks
  - Complete competency assessments
  - Update personal skills matrix

## Admin Dashboard Features

### ✅ Admin Dashboard (`/`)
- **Purpose**: Central hub for super admin oversight
- **Features**:
  - Global statistics (total practices, users, tasks, staff)
  - Practice overview with subscription tiers
  - System health indicators
  - Recent activity feed
  - Cross-practice analytics

### ✅ Manage Practices (`/admin/practices`)
- **Purpose**: Table view of all practices with subscription info
- **Features**:
  - Complete practice listing with search/filter
  - Subscription tier management (Free, Basic, Premium)
  - Practice creation and editing
  - Domain management
  - Creation date tracking
  - Quick action buttons (View, Edit)

### ✅ User Management (`/admin/users`)
- **Purpose**: User accounts across all practices with search
- **Features**:
  - Cross-practice user overview
  - Role-based filtering (Super Admin, Admin, Manager, Staff)
  - Search functionality (name, email, practice)
  - User statistics by role
  - Account creation and management
  - Practice assignment

### ✅ System Status (`/admin/system`)
- **Purpose**: Real-time health monitoring with performance metrics
- **Features**:
  - System health indicators (Database, Authentication, API, Storage)
  - Performance metrics (Uptime, Active Users, Response Time, Error Rate)
  - Storage usage monitoring with visual indicators
  - Real-time updates every 5 seconds
  - Recent system events log
  - Automated alerting for issues

## Core Application Features

### Dashboard
- Role-specific dashboard views
- Key performance indicators
- Compliance status overview
- Recent task updates

### Skills Matrix
- Comprehensive competency tracking
- Visual skills assessment grid
- Progress monitoring
- Compliance gap identification

### Task Management
- Assignment and tracking system
- Priority levels and due dates
- Status monitoring
- Automated notifications

### Staff Management
- Employee profile management
- Role assignments
- Training records
- Competency assessments

### Harmony360 Compliance
- Regulatory requirement tracking
- Compliance status reporting
- Audit trail maintenance
- Evidence management

### Policies & SOPs
- Document management system
- Version control
- Access permissions
- Review scheduling

### Import/Export
- Data migration tools
- Bulk operations
- CSV/Excel integration
- Backup functionality

### Settings
- Practice configuration
- User preferences
- Notification settings
- Debug mode (Super Admin only)

## Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Icons**: Lucide React

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### Security
- **Row Level Security (RLS)**: Practice-based data isolation
- **Role-based Access Control**: Hierarchical permission system
- **JWT Authentication**: Secure token-based auth
- **Email Domain Matching**: Automatic practice assignment

## Database Schema

### Key Tables
- `practices` - Healthcare practice information
- `users` - User accounts and roles
- `staff` - Staff member profiles
- `tasks` - Task assignments and tracking
- `competencies` - Skills and competency definitions

### Security Policies
- Practice-based data isolation
- Super admin override capabilities
- Role-based table access
- Secure function definitions

## Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Debug Mode
- **Access**: Super Admin only
- **Purpose**: Development and troubleshooting
- **Features**: 
  - Authentication state visibility
  - Database query debugging
  - Error state inspection
  - Performance monitoring

## Getting Started

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Harmony360
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Setup Database**
   - Run the SQL scripts in Supabase SQL Editor
   - Execute `admin-setup.sql` for initial data

## Support & Maintenance

### System Health Monitoring
- Automated health checks every 5 seconds
- Performance metric tracking
- Error rate monitoring
- Storage usage alerts

### Backup & Recovery
- Automated daily database backups
- Point-in-time recovery capability
- Data export functionality
- Configuration backup

### Updates & Maintenance
- Rolling updates with zero downtime
- Database migration scripts
- Feature flag system
- A/B testing capability

## Compliance & Audit

### Harmony360 Requirements
- Full audit trail maintenance
- Evidence documentation
- Compliance gap reporting
- Regulatory change tracking

### Data Protection
- GDPR compliance
- Data retention policies
- Secure data disposal
- Privacy controls

### Quality Assurance
- Automated testing suite
- Code review process
- Security vulnerability scanning
- Performance monitoring

---

*Last Updated: December 2024*
*Version: 1.0.0* 