-- Migration: Insert test users for development
-- Run this SQL script to create test users for login

-- Insert Administrator test user
-- Email: admin@test.com
-- Password: admin123
-- Campus ID: CAMPUS001
INSERT INTO users (id, email, password, name, role, campus_id, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'admin@test.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- This is a placeholder, will be updated below
    'Test Administrator',
    'administrator',
    'CAMPUS001',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@test.com'
);

-- Insert Technician test user
-- Email: tech@test.com
-- Password: tech123
INSERT INTO users (id, email, password, name, role, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000002',
    'tech@test.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- This is a placeholder, will be updated below
    'Test Technician',
    'technician',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'tech@test.com'
);

-- Note: The password hashes above are placeholders. 
-- You need to run the Node.js script below to generate proper bcrypt hashes.
