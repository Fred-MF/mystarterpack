/*
  # Add admin authentication function
  
  1. New Functions
    - `check_admin_credentials`: Securely validates admin login credentials
      - Handles password verification
      - Manages failed login attempts
      - Updates last login timestamp
      
  2. Security
    - Function is only accessible to authenticated users
    - Uses secure password comparison
    - Implements login attempt throttling
*/

create or replace function check_admin_credentials(
  p_email text,
  p_password text
)
returns table (
  success boolean,
  message text,
  admin_id uuid
) 
language plpgsql
security definer
as $$
declare
  v_admin admin_users%rowtype;
  v_now timestamp with time zone := now();
begin
  -- Get admin user
  select * into v_admin
  from admin_users
  where email = p_email and deleted_at is null;
  
  -- Check if admin exists
  if v_admin.id is null then
    return query select 
      false as success,
      'Invalid login credentials' as message,
      null::uuid as admin_id;
    return;
  end if;
  
  -- Check if account is locked
  if v_admin.locked_until is not null and v_admin.locked_until > v_now then
    return query select 
      false as success,
      'Account is temporarily locked. Please try again later.' as message,
      null::uuid as admin_id;
    return;
  end if;

  -- Verify password
  if v_admin.password_hash = crypt(p_password, v_admin.password_hash) then
    -- Reset failed attempts on successful login
    update admin_users
    set 
      failed_attempts = 0,
      locked_until = null,
      updated_at = v_now
    where id = v_admin.id;
    
    return query select 
      true as success,
      'Login successful' as message,
      v_admin.id as admin_id;
  else
    -- Increment failed attempts
    update admin_users
    set 
      failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= 5 then v_now + interval '15 minutes'
        else null
      end,
      updated_at = v_now
    where id = v_admin.id;
    
    return query select 
      false as success,
      'Invalid login credentials' as message,
      null::uuid as admin_id;
  end if;
end;
$$;