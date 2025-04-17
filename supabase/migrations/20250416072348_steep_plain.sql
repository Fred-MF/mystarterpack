-- Drop existing function
DROP FUNCTION IF EXISTS is_admin;

-- Create more robust admin check function with logging
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_admin_id uuid;
  v_admin_email text;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  -- Log the user ID
  RAISE NOTICE 'Checking admin status for user ID: %', v_user_id;
  
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users 
  WHERE id = v_user_id;
  
  -- Log the user email
  RAISE NOTICE 'User email: %', v_user_email;
  
  -- Get admin ID and email
  SELECT id, email INTO v_admin_id, v_admin_email
  FROM admin_users
  WHERE email = v_user_email
  AND deleted_at IS NULL;
  
  -- Log the admin check results
  RAISE NOTICE 'Admin check results - ID: %, Email: %', v_admin_id, v_admin_email;
  
  -- Return true if admin ID exists
  RETURN v_admin_id IS NOT NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Ensure admin exists with correct email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = 'admin@starterprint3d.fr'
  ) THEN
    INSERT INTO admin_users (email, password_hash)
    VALUES (
      'admin@starterprint3d.fr',
      crypt('admin123', gen_salt('bf'))
    );
    
    RAISE NOTICE 'Created default admin user: admin@starterprint3d.fr';
  END IF;
END
$$;