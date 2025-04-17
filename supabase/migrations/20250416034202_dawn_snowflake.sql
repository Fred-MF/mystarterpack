-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_customers;

-- Recreate admin customers view with proper permissions
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

-- Grant necessary permissions
GRANT SELECT ON admin_customers TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create function to check admin access
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid()
  );
$$;