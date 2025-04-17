/*
  # Implement secure password hashing for admin authentication
  
  1. Changes
    - Use pgcrypto for secure password hashing
    - Add helper function to hash new passwords
    - Update check_admin_credentials to use secure comparison
*/

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to hash new passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Update check_admin_credentials to use secure password comparison
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
DECLARE
  v_admin admin_users%ROWTYPE;
BEGIN
  -- Look up admin by email
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = p_email;
  
  -- Check if account is locked
  IF v_admin.id IS NOT NULL AND v_admin.locked_until IS NOT NULL AND v_admin.locked_until > now() THEN
    RETURN QUERY SELECT 
      false AS success,
      'Account is temporarily locked. Please try again later.' AS message,
      NULL::UUID AS admin_id;
    RETURN;
  END IF;

  -- Check if admin exists and password matches
  IF v_admin.id IS NULL OR v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
    -- Increment failed attempts if admin exists
    IF v_admin.id IS NOT NULL THEN
      UPDATE admin_users
      SET 
        failed_attempts = COALESCE(failed_attempts, 0) + 1,
        locked_until = CASE 
          WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN now() + interval '15 minutes'
          ELSE locked_until
        END,
        updated_at = now()
      WHERE id = v_admin.id;
    END IF;

    RETURN QUERY SELECT 
      false AS success,
      'Invalid email or password' AS message,
      NULL::UUID AS admin_id;
    RETURN;
  END IF;

  -- Success - reset failed attempts
  UPDATE admin_users
  SET 
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = now()
  WHERE id = v_admin.id;

  RETURN QUERY SELECT 
    true AS success,
    'Login successful' AS message,
    v_admin.id AS admin_id;
END;
$$;