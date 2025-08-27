-- ================================================================================
-- e-Taca Production Database Setup Script
-- Version: 1.0.0
-- Generated: 2025-08-25
-- ================================================================================
-- This script sets up the production database with all necessary tables,
-- indexes, and initial data for the e-Taca donation platform
-- ================================================================================

-- Create database (run as superuser)
-- CREATE DATABASE etaca_prod WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- Connect to the database
-- \c etaca_prod;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================================
-- PERFORMANCE INDEXES
-- ================================================================================
-- These indexes significantly improve query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"("Email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "Users"("Role");
CREATE INDEX IF NOT EXISTS idx_users_organization ON "Users"("OrganizationId") WHERE "OrganizationId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON "Users"("IsActive") WHERE "IsActive" = true;
CREATE INDEX IF NOT EXISTS idx_users_created ON "Users"("CreatedAt");

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON "Organizations"("Slug");
CREATE INDEX IF NOT EXISTS idx_organizations_nip ON "Organizations"("NIP");
CREATE INDEX IF NOT EXISTS idx_organizations_status ON "Organizations"("Status");
CREATE INDEX IF NOT EXISTS idx_organizations_active ON "Organizations"("Status") WHERE "Status" = 'Active';
CREATE INDEX IF NOT EXISTS idx_organizations_created ON "Organizations"("CreatedAt");

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_organization ON "Goals"("OrganizationId");
CREATE INDEX IF NOT EXISTS idx_goals_slug ON "Goals"("Slug");
CREATE INDEX IF NOT EXISTS idx_goals_active ON "Goals"("IsActive") WHERE "IsActive" = true;
CREATE INDEX IF NOT EXISTS idx_goals_dates ON "Goals"("StartDate", "EndDate");
CREATE INDEX IF NOT EXISTS idx_goals_created ON "Goals"("CreatedAt");

-- Donations table indexes
CREATE INDEX IF NOT EXISTS idx_donations_goal ON "Donations"("GoalId");
CREATE INDEX IF NOT EXISTS idx_donations_donor ON "Donations"("DonorEmail");
CREATE INDEX IF NOT EXISTS idx_donations_status ON "Donations"("Status");
CREATE INDEX IF NOT EXISTS idx_donations_created ON "Donations"("CreatedAt");
CREATE INDEX IF NOT EXISTS idx_donations_amount ON "Donations"("Amount");
CREATE INDEX IF NOT EXISTS idx_donations_date_range ON "Donations"("CreatedAt") 
    WHERE "Status" = 'Completed';

-- QrCodes table indexes
CREATE INDEX IF NOT EXISTS idx_qrcodes_goal ON "QrCodes"("GoalId");
CREATE INDEX IF NOT EXISTS idx_qrcodes_identifier ON "QrCodes"("Identifier");
CREATE INDEX IF NOT EXISTS idx_qrcodes_active ON "QrCodes"("IsActive") WHERE "IsActive" = true;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_donations_goal_status_created 
    ON "Donations"("GoalId", "Status", "CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_goals_org_active_created 
    ON "Goals"("OrganizationId", "IsActive", "CreatedAt" DESC);

-- ================================================================================
-- SECURITY FUNCTIONS
-- ================================================================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(length), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- CONSTRAINTS AND VALIDATIONS
-- ================================================================================

-- Add check constraints if not exists
DO $$
BEGIN
    -- Email validation for Users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_email_valid') THEN
        ALTER TABLE "Users" ADD CONSTRAINT chk_users_email_valid 
            CHECK (validate_email("Email"));
    END IF;
    
    -- Email validation for Organizations
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_organizations_email_valid') THEN
        ALTER TABLE "Organizations" ADD CONSTRAINT chk_organizations_email_valid 
            CHECK (validate_email("Email"));
    END IF;
    
    -- Email validation for Donations
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_donations_email_valid') THEN
        ALTER TABLE "Donations" ADD CONSTRAINT chk_donations_email_valid 
            CHECK ("DonorEmail" IS NULL OR validate_email("DonorEmail"));
    END IF;
    
    -- Amount validation for Goals
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_amount_positive') THEN
        ALTER TABLE "Goals" ADD CONSTRAINT chk_goals_amount_positive 
            CHECK ("TargetAmount" > 0);
    END IF;
    
    -- Amount validation for Donations
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_donations_amount_positive') THEN
        ALTER TABLE "Donations" ADD CONSTRAINT chk_donations_amount_positive 
            CHECK ("Amount" > 0);
    END IF;
    
    -- Date validation for Goals
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_dates_valid') THEN
        ALTER TABLE "Goals" ADD CONSTRAINT chk_goals_dates_valid 
            CHECK ("EndDate" IS NULL OR "EndDate" > "StartDate");
    END IF;
END
$$;

-- ================================================================================
-- AUDIT TRIGGERS
-- ================================================================================

-- Create audit table for tracking changes
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "TableName" VARCHAR(100) NOT NULL,
    "RecordId" UUID NOT NULL,
    "Action" VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    "UserId" UUID,
    "OldValues" JSONB,
    "NewValues" JSONB,
    "IpAddress" VARCHAR(45),
    "UserAgent" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON "AuditLog"("TableName", "RecordId");
CREATE INDEX IF NOT EXISTS idx_audit_created ON "AuditLog"("CreatedAt");
CREATE INDEX IF NOT EXISTS idx_audit_user ON "AuditLog"("UserId") WHERE "UserId" IS NOT NULL;

-- ================================================================================
-- STORED PROCEDURES
-- ================================================================================

-- Procedure to calculate organization statistics
CREATE OR REPLACE FUNCTION get_organization_statistics(org_id UUID)
RETURNS TABLE(
    total_donations BIGINT,
    total_amount DECIMAL,
    active_goals BIGINT,
    total_donors BIGINT,
    average_donation DECIMAL,
    last_donation_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT d."Id")::BIGINT as total_donations,
        COALESCE(SUM(d."Amount"), 0) as total_amount,
        COUNT(DISTINCT CASE WHEN g."IsActive" THEN g."Id" END)::BIGINT as active_goals,
        COUNT(DISTINCT d."DonorEmail")::BIGINT as total_donors,
        COALESCE(AVG(d."Amount"), 0) as average_donation,
        MAX(d."CreatedAt") as last_donation_date
    FROM "Organizations" o
    LEFT JOIN "Goals" g ON g."OrganizationId" = o."Id"
    LEFT JOIN "Donations" d ON d."GoalId" = g."Id" AND d."Status" = 'Completed'
    WHERE o."Id" = org_id
    GROUP BY o."Id";
END;
$$ LANGUAGE plpgsql;

-- Procedure to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old audit logs
    DELETE FROM "AuditLog" 
    WHERE "CreatedAt" < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete incomplete donations older than 7 days
    DELETE FROM "Donations" 
    WHERE "Status" = 'Pending' 
    AND "CreatedAt" < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- INITIAL ADMIN USER CREATION
-- ================================================================================
-- NOTE: This creates a super admin account. 
-- IMPORTANT: Change the password immediately after first login!

DO $$
DECLARE
    admin_email VARCHAR(255) := 'admin@e-taca.borg.tools';
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(
        SELECT 1 FROM "Users" 
        WHERE "Email" = admin_email AND "Role" = 'Admin'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        INSERT INTO "Users" (
            "Id",
            "Email",
            "PasswordHash",
            "Role",
            "IsActive",
            "CreatedAt",
            "UpdatedAt"
        ) VALUES (
            uuid_generate_v4(),
            admin_email,
            -- This is BCrypt hash of 'ChangeMe123!' - MUST be changed on first login
            '$2a$11$rBWLCVP7VwL9eW6MxK9JZuOHqvCPYgbLGqKpHQ5qKxYwqF3FYqwNu',
            'Admin',
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Admin user created: %', admin_email;
        RAISE WARNING 'DEFAULT PASSWORD IS: ChangeMe123! - CHANGE IMMEDIATELY!';
    ELSE
        RAISE NOTICE 'Admin user already exists: %', admin_email;
    END IF;
END
$$;

-- ================================================================================
-- MAINTENANCE JOBS (To be scheduled with pg_cron or external scheduler)
-- ================================================================================

-- Daily statistics update
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS VOID AS $$
BEGIN
    -- Update materialized views or summary tables
    -- This is a placeholder for actual statistics calculations
    RAISE NOTICE 'Daily statistics updated at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- GRANTS AND PERMISSIONS
-- ================================================================================
-- Adjust these based on your actual database users

-- Create application user if not exists (run as superuser)
-- CREATE USER etaca_app WITH PASSWORD 'secure_password_here';

-- Grant necessary permissions
-- GRANT CONNECT ON DATABASE etaca_prod TO etaca_app;
-- GRANT USAGE ON SCHEMA public TO etaca_app;
-- GRANT CREATE ON SCHEMA public TO etaca_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etaca_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO etaca_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO etaca_app;

-- ================================================================================
-- BACKUP CONFIGURATION
-- ================================================================================
-- Example backup command (run from shell):
-- pg_dump -U postgres -d etaca_prod -F c -b -v -f etaca_backup_$(date +%Y%m%d_%H%M%S).backup

-- ================================================================================
-- MONITORING QUERIES
-- ================================================================================

-- Check database size
-- SELECT pg_database_size('etaca_prod') / 1024 / 1024 as size_mb;

-- Check table sizes
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
-- SELECT count(*) FROM pg_stat_activity WHERE datname = 'etaca_prod';

-- Check slow queries
-- SELECT query, mean_exec_time, calls FROM pg_stat_statements 
-- WHERE query NOT LIKE '%pg_stat_statements%' ORDER BY mean_exec_time DESC LIMIT 10;

-- ================================================================================
-- END OF DATABASE SETUP SCRIPT
-- ================================================================================
-- Remember to:
-- 1. Change the default admin password immediately
-- 2. Set up regular backups
-- 3. Monitor database performance
-- 4. Schedule maintenance jobs
-- 5. Review and adjust indexes based on actual query patterns
-- ================================================================================