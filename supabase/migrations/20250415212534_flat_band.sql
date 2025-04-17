/*
  # Admin Users Schema Update

  1. Changes
    - Add admin users table if not exists
    - Add RLS policy if not exists
    - Add login attempts check function

  2. Security
    - Enable RLS on admin_users table
    - Add policy for admin role to view admin users
    - Add function to manage login attempts
*/

-- Create admin users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DO $$ 
BEGIN
  -- Drop the policy if it exists
  DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
  
  -- Create the policy
  CREATE POLICY "Admins can view admin users"
    ON admin_users
    FOR SELECT
    TO admin
    USING (true);
END
$$;

-- Function to check and update login attempts
CREATE OR REPLACE FUNCTION check_admin_login_attempts(
  p_email text,
  p_success boolean
) RETURNS TABLE (
  allowed boolean,
  message text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_failed_attempts integer;
  v_locked_until timestamp with time zone;
BEGIN
  -- Get current attempts and lock status
  SELECT failed_attempts, locked_until
  INTO v_failed_attempts, v_locked_until
  FROM admin_users
  WHERE email = p_email;

  -- If user doesn't exist, return generic message
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, 'Identifiants invalides'::text;
    RETURN;
  END IF;

  -- Reset attempts if successful login
  IF p_success THEN
    UPDATE admin_users
    SET failed_attempts = 0,
        locked_until = NULL,
        updated_at = now()
    WHERE email = p_email;
    
    RETURN QUERY SELECT true::boolean, 'Connexion réussie'::text;
    RETURN;
  END IF;

  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN QUERY
    SELECT false::boolean,
           'Compte verrouillé. Veuillez réessayer dans quelques minutes.'::text;
    RETURN;
  END IF;

  -- If previously locked but lock period has expired, reset attempts
  IF v_locked_until IS NOT NULL AND v_locked_until <= now() THEN
    v_failed_attempts := 0;
  END IF;

  -- Increment failed attempts
  v_failed_attempts := v_failed_attempts + 1;

  -- Update attempts and maybe lock account
  UPDATE admin_users
  SET failed_attempts = v_failed_attempts,
      locked_until = CASE
        WHEN v_failed_attempts >= 5 THEN now() + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = now()
  WHERE email = p_email;

  -- Return status
  RETURN QUERY
  SELECT
    (v_failed_attempts < 5)::boolean,
    CASE
      WHEN v_failed_attempts >= 5 THEN 'Trop de tentatives échouées. Compte verrouillé pour 15 minutes.'
      ELSE 'Identifiants invalides. Il vous reste ' || (5 - v_failed_attempts)::text || ' tentative(s).'
    END;
END;
$$;