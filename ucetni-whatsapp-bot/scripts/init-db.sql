-- PostgreSQL initialization script for ÚčetníBot
-- This script runs when the PostgreSQL container starts for the first time

-- Set timezone to Prague
SET timezone = 'Europe/Prague';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create a dedicated user for the application (if not using default postgres)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ucetni_app') THEN
--         CREATE ROLE ucetni_app WITH LOGIN PASSWORD 'your_app_password';
--         GRANT CONNECT ON DATABASE ucetni_bot TO ucetni_app;
--     END IF;
-- END
-- $$;

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log slow queries (>1s)

-- Czech language support
-- CREATE COLLATION IF NOT EXISTS czech (LOCALE = 'cs_CZ.UTF-8');

COMMENT ON DATABASE ucetni_bot IS 'Database for Czech WhatsApp Accounting Bot';