-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_credentials(text, text);
DROP FUNCTION IF EXISTS verify_admin_password(text, text);

-- Create function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(admin_email text, admin_password text)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = admin_email
    AND password_hash = crypt(admin_password, password_hash)
    AND deleted_at IS NULL
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_password TO authenticated;

-- Ensure admin user exists with correct password
DO $$
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM admin_users WHERE email = 'admin@starterprint3d.fr';
  
  -- Create fresh admin user
  INSERT INTO admin_users (email, password_hash)
  VALUES (
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf'))
  );
END
$$;