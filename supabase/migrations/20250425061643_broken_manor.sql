-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all orders" ON stripe_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON stripe_orders;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can view all tracking" ON order_tracking;
DROP POLICY IF EXISTS "Admins can update tracking" ON order_tracking;

-- Create policies for stripe_orders
CREATE POLICY "Admins can view all orders"
ON stripe_orders
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update orders"
ON stripe_orders
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create policies for stripe_customers
CREATE POLICY "Admins can view all customers"
ON stripe_customers
FOR SELECT
TO authenticated
USING (is_admin());

-- Create policies for stripe_subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON stripe_subscriptions
FOR SELECT
TO authenticated
USING (is_admin());

-- Create policies for order_tracking
CREATE POLICY "Admins can view all tracking"
ON order_tracking
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update tracking"
ON order_tracking
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant necessary permissions to auth.users
GRANT SELECT ON auth.users TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;