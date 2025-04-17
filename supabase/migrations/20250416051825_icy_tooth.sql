-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_orders;

-- Recreate admin orders view with proper permissions
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

-- Grant necessary permissions
GRANT SELECT ON admin_orders TO authenticated;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid()
    AND deleted_at IS NULL
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Create RLS policy on stripe_orders to allow admin access
CREATE POLICY "Admins can view all orders"
ON stripe_orders
FOR SELECT
TO authenticated
USING (is_admin());

-- Create RLS policy on order_tracking to allow admin access
CREATE POLICY "Admins can view all tracking"
ON order_tracking
FOR SELECT
TO authenticated
USING (is_admin());

-- Create RLS policy on stripe_customers to allow admin access
CREATE POLICY "Admins can view all customers"
ON stripe_customers
FOR SELECT
TO authenticated
USING (is_admin());