-- Initialize AI Solution Center Database
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create additional databases if needed
-- CREATE DATABASE ai_solution_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for different services (optional)
-- CREATE SCHEMA IF NOT EXISTS auth;
-- CREATE SCHEMA IF NOT EXISTS services;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ai_solution TO developer;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'AI Solution Center Database initialized successfully';
END $$;