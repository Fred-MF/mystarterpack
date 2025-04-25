-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_credentials;
DROP FUNCTION IF EXISTS verify_admin_password;
DROP FUNCTION IF EXISTS is_admin;

-- Create simple admin session function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users
    WHERE id = auth.uid()
    AND deleted_at IS NULL
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;