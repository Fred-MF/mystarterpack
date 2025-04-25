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

-- Ensure admin user exists in both tables
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- First ensure the admin exists in auth.users
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    role
  )
  VALUES (
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf')),
    now(),
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE
  SET encrypted_password = EXCLUDED.encrypted_password
  RETURNING id INTO v_admin_id;

  -- Then ensure admin exists in admin_users
  INSERT INTO admin_users (
    id,
    email,
    password_hash,
    created_at,
    updated_at
  )
  VALUES (
    v_admin_id,
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf')),
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    password_hash = EXCLUDED.password_hash,
    updated_at = now(),
    deleted_at = NULL;
END
$$;