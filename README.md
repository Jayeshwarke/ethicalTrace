# Incident Reporting and Case Management System

A comprehensive web application for workplace safety and ethics incident reporting, similar to NAVEX EthicsPoint. This system enables anonymous and authenticated incident reporting with a complete case management dashboard for administrators.

## 🚀 Features Implemented

### 📝 **Report Submission System**
- **Anonymous Reporting**: Users can submit reports without providing personal information
- **Named Reporting**: Option to include contact details for follow-up communications
- **Multi-Category Support**: 
  - Harassment or Discrimination
  - Safety Violations
  - Ethics Violations
  - Fraud or Financial Misconduct
  - Other incidents
- **File Upload Support**: Attach supporting documents (PDF, DOC, DOCX, JPG, PNG up to 10MB)
- **Tracking ID Generation**: Unique tracking numbers in format "SR-YYYY-XXXXXX" for each report

### 🔒 **Authentication & Authorization**
- **Admin Registration & Login**: Secure account creation and session management
- **Session-Based Authentication**: HTTP-only cookies for enhanced security
- **Protected Routes**: Admin-only access to case management features
- **Password Security**: Salted hashing using Node.js scrypt algorithm

### 📊 **Admin Dashboard**
- **Real-time Statistics**: Live counts of open, investigating, resolved cases
- **Case Overview**: Complete list of all submitted reports with key details
- **Advanced Filtering**: Filter by status, category, and search through descriptions
- **Monthly Metrics**: Track new reports by time period

### 🔍 **Case Management**
- **Case Detail View**: Comprehensive information about each incident
- **Status Management**: Update case status (New → Investigating → Pending → Resolved → Closed)
- **Investigation Notes**: Add timestamped notes with user attribution
- **Case Timeline**: Visual timeline showing all case activities and updates
- **Assignment Tracking**: Automatically track which admin is handling each case

### 📱 **Public Features**
- **Report Tracking**: Public interface to check report status using tracking ID
- **Status Transparency**: View current status and submission date
- **Mobile Responsive**: Works seamlessly on all device sizes

## 🛠 Technical Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for modern, responsive styling
- **Shadcn/UI** component library built on Radix UI primitives
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod for robust form validation

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for full-stack type safety
- **Passport.js** with local strategy for authentication
- **Express Session** with PostgreSQL store for session persistence
- **Multer** for secure file upload handling
- **RESTful API** design with proper HTTP status codes

### Database
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Relationship Management**: Proper foreign key constraints and joins
- **Enum Types**: Database-level validation for status and category fields

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components and routes
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions and helpers
├── server/                 # Express.js backend application
│   ├── auth.ts            # Authentication configuration
│   ├── db.ts              # Database connection setup
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Database operations interface
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
├── database-schema.sql     # SQL schema documentation
└── uploads/               # File upload storage directory
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository>
   cd incident-reporting-system
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Set up your environment variables
   export DATABASE_URL="postgresql://username:password@localhost:5432/incident_db"
   export SESSION_SECRET="your-secure-session-secret"
   ```

3. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📊 API Endpoints

### Public Routes
- `POST /api/reports` - Submit new incident report
- `GET /api/reports/track/:trackingId` - Check report status

### Admin Routes (Authentication Required)
- `POST /api/register` - Admin registration
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/user` - Get current user info
- `GET /api/cases` - List all cases with filtering
- `GET /api/cases/stats` - Dashboard statistics
- `GET /api/cases/:id` - Get case details
- `PATCH /api/cases/:id/status` - Update case status
- `POST /api/cases/:id/notes` - Add case note

## 🔮 Future Enhancements

### Phase 1: Communication & Notifications
- **Email Notifications**: Automatic alerts for new reports and status updates
- **SMS Integration**: Optional text message notifications for urgent cases
- **In-App Notifications**: Real-time updates for administrators
- **Automated Escalation**: Automatic status updates based on time thresholds

### Phase 2: Advanced Case Management
- **Multi-Admin Assignment**: Support for multiple administrators per case
- **Case Templates**: Predefined investigation workflows for different incident types
- **Bulk Operations**: Mass status updates and case assignments
- **Advanced Search**: Full-text search with filters and saved searches
- **Case Merging**: Combine related reports into single cases

### Phase 3: Analytics & Reporting
- **Dashboard Analytics**: Trend analysis and incident pattern recognition
- **Custom Reports**: Generate detailed reports for compliance and management
- **Data Export**: Export case data in various formats (CSV, PDF, Excel)
- **Compliance Tracking**: Meet regulatory reporting requirements
- **Anonymous Survey Integration**: Collect workplace culture feedback

### Phase 4: Advanced Features
- **Multi-language Support**: Internationalization for global organizations
- **Integration APIs**: Connect with HR systems, HRIS, and other enterprise tools
- **Mobile Application**: Native iOS/Android apps for on-the-go reporting
- **Advanced File Management**: Document versioning and secure file viewing
- **Audit Trail**: Comprehensive logging of all system activities

### Phase 5: Enterprise Features
- **Single Sign-On (SSO)**: Integration with enterprise identity providers
- **Advanced Role Management**: Granular permissions and role-based access
- **Multi-tenant Architecture**: Support for multiple organizations
- **API Rate Limiting**: Enterprise-grade API security and throttling
- **White-label Solutions**: Customizable branding for different organizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the existing documentation and API endpoints
- Review the database schema for data structure questions

---

**Built with ❤️ for workplace safety and ethical transparency**