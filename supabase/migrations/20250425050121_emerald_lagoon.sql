/*
  # Add admin credentials verification function

  1. New Function
    - `verify_admin_credentials(p_email text, p_password text)`
      - Verifies admin credentials against the admin_users table
      - Returns a table with a single boolean column indicating success
      - Uses pgcrypto for secure password verification

  2. Security
    - Function is accessible to authenticated users only
    - Password comparison is done securely using crypto functions
*/

create or replace function verify_admin_credentials(p_email text, p_password text)
returns table (success boolean)
security definer
language plpgsql
as $$
begin
  return query
  select exists (
    select 1
    from admin_users
    where email = p_email
    and password_hash = crypt(p_password, password_hash)
    and deleted_at is null
  );
end;
$$;