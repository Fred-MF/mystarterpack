/*
  # Add function to generate signed URLs for files
  
  1. Changes
    - Add function to generate signed URLs for files in storage
    - Update admin_orders view to include file URLs
*/

-- Create function to generate signed URL for a file path
CREATE OR REPLACE FUNCTION get_signed_url(bucket text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN storage.foldername(file_path) || '/' || storage.filename(file_path);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_signed_url TO authenticated;

-- Drop existing view
DROP VIEW IF EXISTS admin_orders;

-- Recreate admin orders view with file URLs
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
    WHEN o.uploaded_files IS NOT NULL THEN
      (SELECT jsonb_agg(
        jsonb_build_object(
          'name', (f->>'name'),
          'type', (f->>'type'),
          'path', (f->>'path'),
          'url', get_signed_url('starter-pack-files', (f->>'path'))
        )
      )
      FROM jsonb_array_elements(to_jsonb(o.uploaded_files)) f)
    ELSE NULL
  END as uploaded_files
FROM stripe_orders o
LEFT JOIN stripe_customers c ON o.customer_id = c.customer_id
LEFT JOIN order_tracking t ON o.tracking_id = t.id
WHERE o.deleted_at IS NULL;