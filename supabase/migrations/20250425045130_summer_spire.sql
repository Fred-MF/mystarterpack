-- Drop existing function if it exists
DROP FUNCTION IF EXISTS verify_admin_credentials;

-- Create secure admin verification function
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
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
      'Identifiants invalides'::TEXT AS message;
    RETURN;
  END IF;

  -- Use crypt() for password comparison
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    -- Update auth.users if needed
    INSERT INTO auth.users (id, email, encrypted_password)
    VALUES (v_admin.id, v_admin.email, v_admin.password_hash)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password;

    RETURN QUERY SELECT 
      true AS success,
      'Connexion réussie'::TEXT AS message;
  ELSE
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO authenticated;