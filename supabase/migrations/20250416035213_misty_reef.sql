/*
  # Add admin access policies

  1. Changes
    - Add RLS policies for admin access to orders and customers
    - Grant necessary permissions to admin role
    - Ensure proper access to related tables
*/

-- Enable RLS on all tables if not already enabled
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Add policies for admin access to orders
CREATE POLICY "Admins can view all orders"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (check_is_admin());

CREATE POLICY "Admins can update orders"
    ON stripe_orders
    FOR UPDATE
    TO authenticated
    USING (check_is_admin())
    WITH CHECK (check_is_admin());

-- Add policies for admin access to customers
CREATE POLICY "Admins can view all customers"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (check_is_admin());

-- Add policies for admin access to subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (check_is_admin());

-- Add policies for admin access to order tracking
CREATE POLICY "Admins can view all tracking"
    ON order_tracking
    FOR SELECT
    TO authenticated
    USING (check_is_admin());

CREATE POLICY "Admins can update tracking"
    ON order_tracking
    FOR UPDATE
    TO authenticated
    USING (check_is_admin())
    WITH CHECK (check_is_admin());

-- Add policies for admin access to user activity
CREATE POLICY "Admins can view all activity"
    ON user_activity
    FOR SELECT
    TO authenticated
    USING (check_is_admin());

-- Grant necessary permissions to authenticated role
GRANT EXECUTE ON FUNCTION check_is_admin TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON order_tracking TO authenticated;
GRANT UPDATE ON stripe_orders TO authenticated;