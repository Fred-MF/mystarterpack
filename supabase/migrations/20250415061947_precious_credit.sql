/*
  # Add tracking and admin features

  1. New Tables
    - `order_tracking`: Stores shipping tracking information
      - `order_id` (references stripe_orders)
      - `tracking_number` (text)
      - `carrier` (text)
      - `status` (enum)
      - Timestamps and soft delete

    - `user_activity`: Tracks customer activity
      - `user_id` (references auth.users)
      - `activity_type` (enum)
      - `details` (jsonb)
      - Timestamps

  2. Changes
    - Add `tracking_id` to `stripe_orders`
    - Add admin-only views for order and customer management

  3. Security
    - Add admin role and policies
    - Enable RLS on new tables
*/

-- Create admin role
CREATE ROLE admin;
GRANT admin TO authenticator;

-- Add tracking number support
CREATE TYPE shipping_status AS ENUM (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'returned'
);

CREATE TABLE IF NOT EXISTS order_tracking (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id bigint REFERENCES stripe_orders(id) NOT NULL,
  tracking_number text,
  carrier text,
  status shipping_status NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  estimated_delivery timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone DEFAULT null
);

ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Add tracking reference to orders
ALTER TABLE stripe_orders 
ADD COLUMN tracking_id bigint REFERENCES order_tracking(id);

-- Create activity tracking
CREATE TYPE activity_type AS ENUM (
  'login',
  'order_placed',
  'subscription_updated',
  'profile_updated'
);

CREATE TABLE IF NOT EXISTS user_activity (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  activity_type activity_type NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Admin views
CREATE VIEW admin_orders WITH (security_invoker = true) AS
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
  t.shipping_address
FROM stripe_orders o
LEFT JOIN stripe_customers c ON o.customer_id = c.customer_id
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN order_tracking t ON o.tracking_id = t.id
WHERE o.deleted_at IS NULL;

CREATE VIEW admin_customers WITH (security_invoker = true) AS
SELECT 
  c.user_id,
  u.email,
  c.customer_id as stripe_customer_id,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.amount_total) as total_spent,
  MAX(o.created_at) as last_order_date,
  s.subscription_id,
  s.status as subscription_status,
  s.current_period_end as subscription_renewal
FROM stripe_customers c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.user_id, u.email, c.customer_id, s.subscription_id, s.status, s.current_period_end;

-- Security policies
CREATE POLICY "Admins can view all order tracking"
  ON order_tracking
  FOR SELECT
  TO admin
  USING (true);

CREATE POLICY "Admins can update order tracking"
  ON order_tracking
  FOR UPDATE
  TO admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all user activity"
  ON user_activity
  FOR SELECT
  TO admin
  USING (true);

GRANT SELECT ON admin_orders TO admin;
GRANT SELECT ON admin_customers TO admin;
GRANT SELECT, UPDATE ON order_tracking TO admin;
GRANT SELECT ON user_activity TO admin;