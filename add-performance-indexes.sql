-- Performance indexes for E-Taca database
-- These indexes will improve query performance for admin endpoints

-- Index for Organizations status filtering
CREATE INDEX IF NOT EXISTS IX_Organizations_Status 
ON "Organizations" ("Status");

-- Index for Organizations created date sorting
CREATE INDEX IF NOT EXISTS IX_Organizations_CreatedAt 
ON "Organizations" ("CreatedAt" DESC);

-- Composite index for Organizations status and created date
CREATE INDEX IF NOT EXISTS IX_Organizations_Status_CreatedAt 
ON "Organizations" ("Status", "CreatedAt" DESC);

-- Index for Donations status filtering  
CREATE INDEX IF NOT EXISTS IX_Donations_Status 
ON "Donations" ("Status");

-- Index for Donations created date filtering
CREATE INDEX IF NOT EXISTS IX_Donations_CreatedAt 
ON "Donations" ("CreatedAt");

-- Composite index for Donations status and organization
CREATE INDEX IF NOT EXISTS IX_Donations_Status_OrganizationId 
ON "Donations" ("Status", "OrganizationId");

-- Index for Users role filtering
CREATE INDEX IF NOT EXISTS IX_Users_Role 
ON "Users" ("Role");

-- Index for Users active status
CREATE INDEX IF NOT EXISTS IX_Users_IsActive 
ON "Users" ("IsActive");

-- Index for DonationGoals active status
CREATE INDEX IF NOT EXISTS IX_DonationGoals_IsActive 
ON "DonationGoals" ("IsActive");

-- Index for DonationGoals created date sorting
CREATE INDEX IF NOT EXISTS IX_DonationGoals_CreatedAt 
ON "DonationGoals" ("CreatedAt" DESC);

-- Composite index for DonationGoals organization and active status
CREATE INDEX IF NOT EXISTS IX_DonationGoals_OrganizationId_IsActive 
ON "DonationGoals" ("OrganizationId", "IsActive");

-- Additional indexes for foreign key relationships (if not already created)
CREATE INDEX IF NOT EXISTS IX_Users_OrganizationId 
ON "Users" ("OrganizationId") 
WHERE "OrganizationId" IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE "Organizations";
ANALYZE "Donations";
ANALYZE "Users";
ANALYZE "DonationGoals";