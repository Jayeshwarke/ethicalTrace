-- Incident Reporting and Case Management System Database Schema
-- Generated from Drizzle ORM schema

-- Create custom types for enums
CREATE TYPE role AS ENUM ('admin', 'user');
CREATE TYPE status AS ENUM ('new', 'investigating', 'pending', 'resolved', 'closed');
CREATE TYPE category AS ENUM ('harassment', 'safety', 'ethics', 'fraud', 'other');

-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reports table
CREATE TABLE reports (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT NOT NULL UNIQUE,
    category category NOT NULL,
    description TEXT NOT NULL,
    reporter_name TEXT,
    reporter_email TEXT,
    anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    file_url TEXT,
    status status DEFAULT 'new' NOT NULL,
    assigned_to_id VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Case notes table
CREATE TABLE case_notes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR NOT NULL REFERENCES reports(id),
    note TEXT NOT NULL,
    added_by_id VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_reports_tracking_id ON reports(tracking_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_case_notes_report_id ON case_notes(report_id);
CREATE INDEX idx_case_notes_created_at ON case_notes(created_at);

-- Comments describing table purposes
COMMENT ON TABLE users IS 'System administrators who can manage cases and reports';
COMMENT ON TABLE reports IS 'Incident reports submitted by users, can be anonymous or named';
COMMENT ON TABLE case_notes IS 'Investigation notes added by administrators during case review';

COMMENT ON COLUMN reports.tracking_id IS 'Public tracking identifier in format SR-YYYY-XXXXXX';
COMMENT ON COLUMN reports.anonymous IS 'Whether the report was submitted anonymously';
COMMENT ON COLUMN reports.file_url IS 'Path to uploaded supporting documentation';
COMMENT ON COLUMN reports.assigned_to_id IS 'Administrator assigned to handle this case';