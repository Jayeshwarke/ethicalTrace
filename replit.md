# Overview

This is a full-stack incident reporting system built for workplace safety and ethics violations. The application allows anonymous and authenticated users to submit reports about various workplace incidents (harassment, safety issues, ethics violations, fraud, etc.) and provides an admin dashboard for managing and tracking these reports. The system features a public-facing report submission form, secure authentication, case management with status tracking, and file upload capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, using a modern component-based architecture:
- **UI Framework**: React with Vite as the build tool for fast development and optimized builds
- **UI Components**: Shadcn/ui component library built on top of Radix UI primitives for consistent, accessible components
- **Styling**: TailwindCSS for utility-first styling with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management, providing caching, synchronization, and background updates
- **Form Handling**: React Hook Form with Zod for type-safe form validation
- **Authentication**: Context-based authentication system with protected routes

The frontend follows a feature-based folder structure with reusable UI components, custom hooks, and page components. The design system supports both light and dark themes with CSS custom properties.

## Backend Architecture
The server-side uses Node.js with Express in a RESTful API pattern:
- **Framework**: Express.js with TypeScript for type safety
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Management**: Express-session with PostgreSQL session store for persistence
- **Password Security**: Node.js crypto module with scrypt for secure password hashing
- **File Handling**: Multer middleware for file uploads with type and size restrictions
- **API Design**: RESTful endpoints with consistent JSON responses and proper HTTP status codes

The server implements middleware for request logging, error handling, and authentication requirements. Routes are organized by feature with clear separation of concerns.

## Database Architecture
The application uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **ORM**: Drizzle ORM provides compile-time type safety and excellent TypeScript integration
- **Schema Design**: Three main entities - users, reports, and case notes with proper foreign key relationships
- **Data Types**: Uses PostgreSQL enums for status and category fields to ensure data consistency
- **Migrations**: Drizzle Kit handles schema migrations with the migrations stored in a dedicated folder

The database schema supports user roles, anonymous reporting, file attachments, status tracking, and audit trails through case notes.

## Authentication & Authorization
The system implements a role-based authentication model:
- **Session-Based Auth**: Uses secure HTTP-only cookies for session management
- **Password Security**: Implements salted hashing with scrypt for password storage
- **Role System**: Supports admin and user roles with route-level protection
- **Anonymous Reporting**: Allows unauthenticated users to submit reports while protecting admin functions

## File Upload System
File handling is implemented with security considerations:
- **Storage**: Local file system storage with configurable upload directory
- **Validation**: File type restrictions (images and documents) and size limits (10MB)
- **Security**: File extension and MIME type validation to prevent malicious uploads

## External Dependencies
- **Database Provider**: Neon (serverless PostgreSQL) with connection pooling
- **UI Component Library**: Radix UI primitives for accessible, unstyled components
- **Icons**: Heroicons and Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and manipulation
- **Development Tools**: Replit-specific plugins for enhanced development experience in Replit environment