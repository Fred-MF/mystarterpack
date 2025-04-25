-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS verify_admin_credentials(text, text);
DROP FUNCTION IF EXISTS generate_admin_jwt(uuid, text);
DROP FUNCTION IF EXISTS is_admin();

-- Create function to generate JWT token for admin
CREATE FUNCTION generate_admin_jwt(
  admin_id UUID,
  admin_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate JWT with admin claims
  SELECT auth.sign(
    json_build_object(
      'role', 'authenticated',
      'aud', 'authenticated',
      'email', admin_email,
      'sub', admin_id::TEXT,
      'user_role', 'admin',
      'exp', extract(epoch from (now() + interval '1 hour'))::integer
    ),
    current_setting('app.jwt_secret')
  ) INTO token;
  
  RETURN token;
END;
$$;

-- Create verify_admin_credentials function
CREATE FUNCTION verify_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  token TEXT
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
      NULL::TEXT AS token;
    RETURN;
  END IF;

  -- Use crypt() for password comparison
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    -- Generate JWT token
    RETURN QUERY SELECT 
      true AS success,
      'Connexion réussie'::TEXT AS message,
      generate_admin_jwt(v_admin.id, v_admin.email) AS token;
  ELSE
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message,
      NULL::TEXT AS token;
  END IF;
END;
$$;

-- Create admin role check function
CREATE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM admin_users a
      WHERE a.id = auth.uid()
      AND a.deleted_at IS NULL
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION generate_admin_jwt TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;