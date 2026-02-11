-- Migration: Add role and campus_id columns to users table
-- Run this SQL script on your database to add the required columns

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20);
        -- Optionally set a default role for existing users
        -- UPDATE users SET role = 'technician' WHERE role IS NULL;
    END IF;
END $$;

-- Add campus_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'campus_id'
    ) THEN
        ALTER TABLE users ADD COLUMN campus_id VARCHAR(50);
    END IF;
END $$;
