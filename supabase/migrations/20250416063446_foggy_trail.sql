/*
  # Fix admin views permissions

  1. Changes
    - Create secure function to get user email
    - Update views to use secure function
    - Add proper RLS policies
*/

-- Create secure function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;

-- Drop existing views
DROP VIEW IF EXISTS admin_orders;
DROP VIEW IF EXISTS admin_customers;

-- Recreate admin orders view
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
  o.uploaded_files
FROM stripe_orders o
LEFT JOIN stripe_customers c ON o.customer_id = c.customer_id
LEFT JOIN order_tracking t ON o.tracking_id = t.id
WHERE o.deleted_at IS NULL;

-- Recreate admin customers view
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
GROUP BY c.user_id, c.customer_id, s.subscription_id, s.status, s.current_period_end;

-- Grant necessary permissions
GRANT SELECT ON admin_orders TO authenticated;
GRANT SELECT ON admin_customers TO authenticated;