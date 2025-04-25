-- Drop existing admin user if exists
DELETE FROM admin_users WHERE email = 'admin@starterprint3d.fr';

-- Create fresh admin user with properly hashed password
INSERT INTO admin_users (
  id,
  email,
  password_hash,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@starterprint3d.fr',
  crypt('admin123', gen_salt('bf', 10)),
  now(),
  now()
);

-- Ensure the function exists
CREATE OR REPLACE FUNCTION verify_admin_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_admin_password TO authenticated;