-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing views that depend on is_admin()
DROP VIEW IF EXISTS admin_orders;
DROP VIEW IF EXISTS admin_customers;

-- Drop existing policies that depend on is_admin()
DROP POLICY IF EXISTS "Admins can view all orders" ON stripe_orders;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admins can view all tracking" ON order_tracking;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS verify_admin_credentials(text, text);
DROP FUNCTION IF EXISTS generate_admin_jwt(uuid, text);
DROP FUNCTION IF EXISTS is_admin();

-- Create function to generate JWT token for admin
CREATE FUNCTION generate_admin_jwt(
  admin_id UUID,
  admin_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate JWT with admin claims
  SELECT auth.sign(
    json_build_object(
      'role', 'authenticated',
      'aud', 'authenticated',
      'email', admin_email,
      'sub', admin_id::TEXT,
      'user_role', 'admin',
      'exp', extract(epoch from (now() + interval '1 hour'))::integer
    ),
    current_setting('app.jwt_secret')
  ) INTO token;
  
  RETURN token;
END;
$$;

-- Create verify_admin_credentials function
CREATE FUNCTION verify_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
BEGIN
  -- Get admin user
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = p_email
  AND deleted_at IS NULL;
  
  -- Check if admin exists and password matches
  IF v_admin.id IS NULL THEN
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message,
      NULL::TEXT AS token;
    RETURN;
  END IF;

  -- Use crypt() for password comparison
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    -- Generate JWT token
    RETURN QUERY SELECT 
      true AS success,
      'Connexion réussie'::TEXT AS message,
      generate_admin_jwt(v_admin.id, v_admin.email) AS token;
  ELSE
    RETURN QUERY SELECT 
      false AS success,
      'Identifiants invalides'::TEXT AS message,
      NULL::TEXT AS token;
  END IF;
END;
$$;

-- Create admin role check function
CREATE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM admin_users a
      WHERE a.id = auth.uid()
      AND a.deleted_at IS NULL
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION generate_admin_jwt TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Recreate admin orders view
CREATE VIEW admin_orders WITH (security_invoker = true) AS
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
WHERE o.deleted_at IS NULL
  AND is_admin();

-- Recreate admin customers view
CREATE VIEW admin_customers WITH (security_invoker = true) AS
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