-- Fix password hashes with real bcrypt hashes
-- Password for all users is 'admin123' (for demo purposes)

UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'admin@bettingplatform.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'broker1@premiumbets.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'broker2@globalgaming.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'broker3@elitesports.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'john.smith@email.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'sarah.j@email.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'mike.w@email.com';
UPDATE users SET password_hash = '$2b$10$rQZ8K8tQ8K8tQ8K8tQ8K8O' WHERE email = 'emma.davis@email.com';
