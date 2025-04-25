-- Drop existing function first
DROP FUNCTION IF EXISTS verify_admin_credentials(text, text);

-- Create function with new return type
CREATE OR REPLACE FUNCTION verify_admin_credentials(p_email text, p_password text)
RETURNS TABLE (success boolean)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
    AND deleted_at IS NULL
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO authenticated;