-- Drop existing policies first to avoid dependency issues
DROP POLICY IF EXISTS "Admins can view all orders" ON stripe_orders;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can view all tracking" ON order_tracking;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Now we can safely drop functions and views
DROP VIEW IF EXISTS admin_orders;
DROP VIEW IF EXISTS admin_customers;
DROP FUNCTION IF EXISTS is_admin;
DROP FUNCTION IF EXISTS get_user_email;
DROP FUNCTION IF EXISTS get_file_url;

-- Create more robust admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  -- Check if user exists and is an admin
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = v_user_id
    AND deleted_at IS NULL
  );
END;
$$;

-- Create secure function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  -- Only allow admin access
  IF NOT is_admin() THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN v_email;
END;
$$;

-- Create secure function to get file URL
CREATE OR REPLACE FUNCTION get_file_url(bucket text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_url text;
BEGIN
  -- Only allow admin access
  IF NOT is_admin() THEN
    RETURN NULL;
  END IF;

  -- Get the file URL
  SELECT storage.foldername(file_path) || '/' || storage.filename(file_path)
  INTO v_url;
  
  RETURN v_url;
END;
$$;

-- Recreate admin orders view with proper security
CREATE OR REPLACE VIEW admin_orders WITH (security_invoker = true) AS
SELECT 
  o.id as order_id,
  o.checkout_session_id,
  o.payment_intent_id,
  o.customer_id,
  c.user_id,
  get_user_email(c.user_id) as customer_email,
  o.amount_total,
  o.currency,
  o.payment_status,
  o.status as order_status,
  t.tracking_number,
  t.carrier,
  t.status as shipping_status,
  t.estimated_delivery,
  o.created_at as order_date,
  t.shipping_address,
  CASE 
    WHEN o.uploaded_files IS NOT NULL AND is_admin() THEN
      (SELECT jsonb_agg(
        jsonb_build_object(
          'name', (f->>'name'),
          'type', (f->>'type'),
          'path', (f->>'path'),
          'url', get_file_url('starter-pack-files', (f->>'path'))
        )
      )
      FROM jsonb_array_elements(to_jsonb(o.uploaded_files)) f)
    ELSE NULL
  END as uploaded_files
FROM stripe_orders o
LEFT JOIN stripe_customers c ON o.customer_id = c.customer_id
LEFT JOIN order_tracking t ON o.tracking_id = t.id
WHERE o.deleted_at IS NULL
  AND is_admin();

-- Recreate admin customers view with proper security
CREATE OR REPLACE VIEW admin_customers WITH (security_invoker = true) AS
SELECT 
  c.user_id,
  get_user_email(c.user_id) as email,
  c.customer_id as stripe_customer_id,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.amount_total), 0) as total_spent,
  MAX(o.created_at) as last_order_date,
  s.subscription_id,
  s.status as subscription_status,
  s.current_period_end as subscription_renewal
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id AND s.deleted_at IS NULL
WHERE c.deleted_at IS NULL
  AND is_admin()
GROUP BY c.user_id, c.customer_id, s.subscription_id, s.status, s.current_period_end;

-- Update RLS policies
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper checks
CREATE POLICY "Admins can view all orders"
ON stripe_orders
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all customers"
ON stripe_customers
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all subscriptions"
ON stripe_subscriptions
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all tracking"
ON order_tracking
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view admin users"
ON admin_users
FOR SELECT
TO authenticated
USING (is_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_url TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO authenticated;

-- Ensure admin role exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant admin role to authenticator
GRANT admin TO authenticator;