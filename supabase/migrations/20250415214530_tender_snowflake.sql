/*
  # Fix admin credentials check function

  1. Changes
    - Update check_admin_credentials function to remove deleted_at column check
    - Function now only checks email and password hash match

  2. Security
    - Maintains existing security by checking credentials
    - No changes to table structure or permissions
*/

CREATE OR REPLACE FUNCTION check_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  admin_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN a.id IS NULL THEN false
      WHEN a.locked_until IS NOT NULL AND a.locked_until > NOW() THEN false
      WHEN crypt(p_password, a.password_hash) = a.password_hash THEN true
      ELSE false
    END AS success,
    CASE 
      WHEN a.id IS NULL THEN 'Invalid email or password'
      WHEN a.locked_until IS NOT NULL AND a.locked_until > NOW() THEN 'Account is locked. Please try again later'
      WHEN crypt(p_password, a.password_hash) = a.password_hash THEN 'Login successful'
      ELSE 'Invalid email or password'
    END AS message,
    CASE 
      WHEN crypt(p_password, a.password_hash) = a.password_hash THEN a.id
      ELSE NULL
    END AS admin_id
  FROM admin_users a
  WHERE a.email = p_email
  LIMIT 1;

  -- Update failed attempts if login was unsuccessful
  UPDATE admin_users
  SET 
    failed_attempts = CASE 
      WHEN failed_attempts >= 4 THEN failed_attempts + 1
      ELSE COALESCE(failed_attempts, 0) + 1
    END,
    locked_until = CASE 
      WHEN failed_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
      ELSE locked_until
    END
  WHERE 
    email = p_email 
    AND id NOT IN (
      SELECT admin_id 
      FROM check_admin_credentials(p_email, p_password) 
      WHERE success = true
    );
END;
$$;