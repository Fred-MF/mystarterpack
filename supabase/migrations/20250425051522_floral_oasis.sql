-- Drop dependent views first
DROP VIEW IF EXISTS admin_orders;
DROP VIEW IF EXISTS admin_customers;

-- Drop dependent policies
DROP POLICY IF EXISTS "Admins can view all orders" ON stripe_orders;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can view all tracking" ON order_tracking;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS verify_admin_credentials;
DROP FUNCTION IF EXISTS verify_admin_password;
DROP FUNCTION IF EXISTS is_admin;

-- Create simple admin session function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users
    WHERE id = auth.uid()
    AND deleted_at IS NULL
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Recreate admin orders view
CREATE OR REPLACE VIEW admin_orders WITH (security_invoker = true) AS
SELECT 
  o.id as order_id,
  o.checkout_session_id,
  o.payment_intent_id,
  o.customer_id,
  c.user_id,
  u.email as customer_email,
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
  o.uploaded_files
FROM stripe_orders o
LEFT JOIN stripe_customers c ON o.customer_id = c.customer_id
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN order_tracking t ON o.tracking_id = t.id
WHERE o.deleted_at IS NULL;

-- Recreate admin customers view
CREATE OR REPLACE VIEW admin_customers WITH (security_invoker = true) AS
SELECT 
  c.user_id,
  u.email,
  c.customer_id as stripe_customer_id,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.amount_total), 0) as total_spent,
  MAX(o.created_at) as last_order_date,
  s.subscription_id,
  s.status as subscription_status,
  s.current_period_end as subscription_renewal
FROM stripe_customers c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id AND s.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.user_id, u.email, c.customer_id, s.subscription_id, s.status, s.current_period_end;

-- Recreate policies
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