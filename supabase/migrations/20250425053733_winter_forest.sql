-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_password CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user exists in admin_users table
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

-- Ensure admin user exists in admin_users
DO $$
BEGIN
  INSERT INTO admin_users (
    email,
    password_hash,
    created_at,
    updated_at
  )
  VALUES (
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf')),
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = now(),
    deleted_at = NULL;
END
$$;