-- Initialize Hypertube database
-- This file is executed when PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database (this is handled by POSTGRES_DB env var, but keeping for reference)
-- CREATE DATABASE hypertube;

-- Grant permissions to user (this is handled by POSTGRES_USER env var)
-- GRANT ALL PRIVILEGES ON DATABASE hypertube TO hypertube_user;

-- Additional setup can be added here
SELECT 'Hypertube database initialized successfully' AS message;
