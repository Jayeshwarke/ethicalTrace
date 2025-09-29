# EthicalTrace - User Manual
## Incident Reporting and Case Management System

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Public User Guide](#public-user-guide)
4. [Administrator Guide](#administrator-guide)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)
7. [Technical Support](#technical-support)

---

## 🎯 System Overview

EthicalTrace is a comprehensive workplace safety and ethics incident reporting system that enables organizations to:

- **Submit incident reports** anonymously or with contact information
- **Track report status** using unique tracking IDs
- **Manage cases** through a complete administrative dashboard
- **Upload supporting documents** for evidence
- **Maintain investigation records** with detailed notes and timelines

### Key Features
- ✅ Anonymous and named reporting options
- ✅ Multi-category incident classification
- ✅ File upload support (PDF, DOC, DOCX, JPG, PNG)
- ✅ Real-time case management dashboard
- ✅ Investigation workflow with status tracking
- ✅ Public report tracking interface
- ✅ Mobile-responsive design

---

## 🚀 Getting Started

### Accessing the System
1. **Open your web browser**
2. **Navigate to**: `http://localhost:5000`
3. **Bookmark the URL** for easy access

### System Requirements
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Required for system access
- **JavaScript**: Must be enabled in your browser

---

## 👥 Public User Guide

### Submitting an Incident Report

#### Step 1: Access the Report Form
1. Go to `http://localhost:5000`
2. You'll see the main reporting interface
3. Click **"Submit New Report"** or navigate to the report form

#### Step 2: Fill Out the Report
1. **Select Incident Category**:
   - Harassment or Discrimination
   - Safety Violations
   - Ethics Violations
   - Fraud or Financial Misconduct
   - Other

2. **Provide Incident Description**:
   - Be as detailed as possible
   - Include dates, times, and locations
   - Describe what happened and who was involved

3. **Choose Reporting Option**:
   - **Anonymous**: Submit without personal information
   - **Named**: Include your contact details for follow-up

4. **Contact Information** (if not anonymous):
   - Full Name
   - Email Address
   - Phone Number (optional)

5. **Upload Supporting Documents** (optional):
   - Supported formats: PDF, DOC, DOCX, JPG, PNG
   - Maximum file size: 10MB
   - Multiple files can be uploaded

#### Step 3: Submit the Report
1. Review all information carefully
2. Click **"Submit Report"**
3. **Save your Tracking ID** - you'll receive a unique tracking number (format: SR-YYYY-XXXXXX)

### Tracking Your Report

#### Using the Tracking System
1. Go to `http://localhost:5000`
2. Click **"Track Report"** or navigate to the tracking section
3. Enter your **Tracking ID** (SR-YYYY-XXXXXX)
4. Click **"Check Status"**

#### What You Can See
- Current status of your report
- Date submitted
- Last updated date
- General progress information

#### Report Statuses
- **New**: Report received and under initial review
- **Investigating**: Active investigation in progress
- **Pending**: Awaiting additional information or decisions
- **Resolved**: Investigation completed with resolution
- **Closed**: Case closed and archived

---

## 👨‍💼 Administrator Guide

### First-Time Setup

#### Creating an Admin Account
1. Go to `http://localhost:5000`
2. Click **"Admin Login"** or navigate to the admin section
3. Click **"Register New Account"**
4. Fill out the registration form:
   - Username (unique identifier)
   - Email address
   - Password (strong password recommended)
5. Click **"Create Account"**
6. You'll be automatically logged in

### Admin Dashboard

#### Accessing the Dashboard
1. Log in with your admin credentials
2. You'll be redirected to the main dashboard
3. The dashboard shows real-time statistics and case overview

#### Dashboard Overview
- **Total Cases**: All reports in the system
- **New Cases**: Recently submitted reports
- **Investigating**: Active investigations
- **Resolved**: Completed cases
- **This Month**: New reports in current month

### Case Management

#### Viewing All Cases
1. From the dashboard, click **"View All Cases"**
2. You'll see a comprehensive list of all reports
3. Use filters to narrow down results:
   - **Status Filter**: New, Investigating, Pending, Resolved, Closed
   - **Category Filter**: Harassment, Safety, Ethics, Fraud, Other
   - **Search**: Search through report descriptions

#### Case Details
1. Click on any case to view detailed information
2. You'll see:
   - Complete incident description
   - Reporter information (if not anonymous)
   - Submitted files and documents
   - Current status and assignment
   - Investigation timeline
   - All case notes and updates

#### Updating Case Status
1. Open the case details
2. Click **"Update Status"**
3. Select new status from dropdown:
   - New → Investigating
   - Investigating → Pending
   - Pending → Resolved
   - Resolved → Closed
4. Add optional notes explaining the status change
5. Click **"Update"**

#### Adding Investigation Notes
1. Open the case details
2. Scroll to the **"Investigation Notes"** section
3. Click **"Add Note"**
4. Enter your investigation findings or updates
5. Click **"Save Note"**
6. Notes are timestamped and attributed to you

#### Assigning Cases
1. Open case details
2. Click **"Assign Case"**
3. Select the admin user to assign the case to
4. Add assignment notes if needed
5. Click **"Assign"**

### Advanced Features

#### Filtering and Search
- **Status Filter**: Filter by case status
- **Category Filter**: Filter by incident type
- **Date Range**: Filter by submission date
- **Text Search**: Search through descriptions and notes
- **Assigned To**: Filter by case assignment

#### Bulk Operations
- Select multiple cases using checkboxes
- Perform bulk status updates
- Export case data (if available)

---

## 🔌 API Reference

### Public Endpoints

#### Submit Report
```
POST /api/reports
Content-Type: application/json

{
  "category": "harassment|safety|ethics|fraud|other",
  "description": "Detailed incident description",
  "reporterName": "John Doe (optional)",
  "reporterEmail": "john@example.com (optional)",
  "anonymous": true/false,
  "fileUrl": "path/to/uploaded/file (optional)"
}
```

#### Track Report
```
GET /api/reports/track/:trackingId
```

### Admin Endpoints (Authentication Required)

#### Authentication
```
POST /api/register - Admin registration
POST /api/login - Admin login
POST /api/logout - Admin logout
GET /api/user - Get current user info
```

#### Case Management
```
GET /api/cases - List all cases with filtering
GET /api/cases/stats - Dashboard statistics
GET /api/cases/:id - Get case details
PATCH /api/cases/:id/status - Update case status
POST /api/cases/:id/notes - Add case note
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot connect to server"
- **Check**: Ensure the server is running on port 5000
- **Solution**: Restart the development server
- **Command**: `$env:NODE_ENV="development"; npx tsx server/index.ts`

#### "Database connection error"
- **Check**: Verify PostgreSQL is running
- **Check**: Confirm database credentials in `.env` file
- **Solution**: Restart database service and server

#### "File upload failed"
- **Check**: File size (must be under 10MB)
- **Check**: File format (PDF, DOC, DOCX, JPG, PNG only)
- **Solution**: Compress file or convert to supported format

#### "Tracking ID not found"
- **Check**: Ensure tracking ID is entered correctly
- **Check**: Verify the format (SR-YYYY-XXXXXX)
- **Solution**: Contact administrator if issue persists

### Browser Compatibility
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Mobile Access
- The system is fully responsive
- Works on all mobile devices
- Touch-friendly interface
- Optimized for mobile reporting

---

## 📞 Technical Support

### For Users
- **Report Issues**: Use the incident reporting system
- **Technical Problems**: Contact your system administrator
- **General Questions**: Refer to this manual

### For Administrators
- **System Issues**: Check server logs
- **Database Problems**: Verify connection and schema
- **Performance Issues**: Monitor server resources

### Development Support
- **Server Restart**: `$env:NODE_ENV="development"; npx tsx server/index.ts`
- **Database Reset**: `npm run db:push`
- **Dependencies**: `npm install`

---

## 📚 Additional Resources

### File Formats Supported
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, PNG
- **Maximum Size**: 10MB per file

### Security Features
- **Anonymous Reporting**: No personal data required
- **Secure File Uploads**: Validated file types and sizes
- **Session Security**: HTTP-only cookies
- **Password Protection**: Salted password hashing

### Data Privacy
- **Anonymous Reports**: No personal information stored
- **Named Reports**: Contact information encrypted
- **File Security**: Secure file storage and access
- **Audit Trail**: Complete activity logging

---

## 🔄 System Updates

### Regular Maintenance
- **Database Backups**: Automated daily backups
- **Security Updates**: Regular security patches
- **Performance Monitoring**: Continuous system monitoring

### Version Information
- **Current Version**: 1.0.0
- **Last Updated**: September 2024
- **Next Update**: As needed

---

**© 2024 EthicalTrace - Incident Reporting and Case Management System**

*For technical support or questions about this manual, please contact your system administrator.*

