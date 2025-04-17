/*
  # Add admin authentication

  1. New Tables
    - `admin_users`: Stores admin credentials
      - `email` (text, unique)
      - `password_hash` (text)
      - `failed_attempts` (int)
      - `locked_until` (timestamp)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view admin users
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO admin
  USING (true);

-- Function to check and update login attempts
CREATE OR REPLACE FUNCTION check_admin_login_attempts(
  p_email text,
  p_success boolean
) RETURNS TABLE (
  allowed boolean,
  message text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Reset attempts if successful login
  IF p_success THEN
    UPDATE admin_users
    SET failed_attempts = 0,
        locked_until = NULL,
        updated_at = now()
    WHERE email = p_email;
    
    RETURN QUERY SELECT true::boolean, 'Login successful'::text;
    RETURN;
  END IF;

  -- Check if account is locked
  IF EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = p_email
    AND locked_until IS NOT NULL
    AND locked_until > now()
  ) THEN
    RETURN QUERY
    SELECT false::boolean,
           'Account locked. Please try again later.'::text;
    RETURN;
  END IF;

  -- Increment failed attempts
  UPDATE admin_users
  SET failed_attempts = CASE
      WHEN failed_attempts >= 4 THEN 0  -- Reset after locking
      ELSE failed_attempts + 1
    END,
    locked_until = CASE
      WHEN failed_attempts >= 4 THEN now() + interval '30 minutes'
      ELSE NULL
    END,
    updated_at = now()
  WHERE email = p_email;

  -- Get current attempts
  RETURN QUERY
  SELECT
    (failed_attempts < 5)::boolean,
    CASE
      WHEN failed_attempts >= 5 THEN 'Too many failed attempts. Account locked for 30 minutes.'
      ELSE 'Invalid credentials. ' || (5 - failed_attempts)::text || ' attempts remaining.'
    END
  FROM admin_users
  WHERE email = p_email;
END;
$$;