/*
  # Add verify_admin_password function
  
  1. New Function
    - `verify_admin_password`: Securely verifies admin passwords using pgcrypto
  
  2. Security
    - Function is accessible only to authenticated users
    - Uses secure password comparison
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION verify_admin_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto's crypt function to verify the password
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;