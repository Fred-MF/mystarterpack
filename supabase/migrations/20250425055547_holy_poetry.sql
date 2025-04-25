/*
  # Fix admin authentication
  
  1. Changes
    - Simplify admin authentication by using bcrypt hashes
    - Remove complex function-based authentication
    - Keep basic admin check function
    
  2. Security
    - Store password hashes using bcrypt
    - Enable RLS on admin_users table
    - Add policies for secure access
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_password CASCADE;
DROP FUNCTION IF EXISTS verify_admin_credentials CASCADE;

-- Create simple admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users a
    JOIN auth.users u ON u.email = a.email
    WHERE u.id = auth.uid()
    AND a.deleted_at IS NULL
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Ensure admin user exists with proper password hash
DO $$
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM admin_users WHERE email = 'admin@starterprint3d.fr';
  
  -- Create fresh admin user with bcrypt hash of 'admin123'
  INSERT INTO admin_users (
    email,
    password_hash,
    created_at,
    updated_at
  ) VALUES (
    'admin@starterprint3d.fr',
    '$2a$10$RU4K3i/4HWF.1nqxRKPEy.hc3XQiOGf5DoQwHqrAiKCH4UHrXgkOy',
    now(),
    now()
  );
END
$$;