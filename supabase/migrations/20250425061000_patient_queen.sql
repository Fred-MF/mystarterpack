-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_password CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users a
    JOIN auth.users u ON u.email = a.email
    WHERE u.id = auth.uid()
    AND a.deleted_at IS NULL
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Ensure admin user exists
DO $$
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM admin_users WHERE email = 'admin@starterprint3d.fr';
  
  -- Create fresh admin user
  INSERT INTO admin_users (
    email,
    password_hash,
    created_at,
    updated_at
  ) VALUES (
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf')),
    now(),
    now()
  );

  -- Create auth.users entry if it doesn't exist
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@starterprint3d.fr',
    crypt('admin123', gen_salt('bf')),
    now(),
    NULL,
    '',
    now(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    true,
    now(),
    now(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@starterprint3d.fr'
  );
END;
$$;