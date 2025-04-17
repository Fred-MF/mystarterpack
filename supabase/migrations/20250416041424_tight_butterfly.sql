-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing function
DROP FUNCTION IF EXISTS verify_admin_credentials;

-- Create secure admin verification function
CREATE OR REPLACE FUNCTION verify_admin_credentials(
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
  -- Get admin user
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = p_email
  AND deleted_at IS NULL;
  
  -- Check if admin exists and password matches
  IF v_admin.id IS NULL THEN
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message,
      NULL::UUID AS admin_id;
    RETURN;
  END IF;

  -- Use crypt() for password comparison
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    RETURN QUERY SELECT 
      true AS success,
      'Connexion réussie'::TEXT AS message,
      v_admin.id AS admin_id;
  ELSE
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message,
      NULL::UUID AS admin_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO authenticated;

-- Create a test admin user if none exists (using hashed password)
INSERT INTO admin_users (email, password_hash)
SELECT 
  'admin@starterprint3d.fr',
  crypt('admin123', gen_salt('bf'))
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'admin@starterprint3d.fr'
);