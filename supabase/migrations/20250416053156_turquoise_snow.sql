-- Create storage bucket for starter pack files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'starter-pack-files'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('starter-pack-files', 'starter-pack-files', false);
  END IF;
END
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create policies for file access
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'starter-pack-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'starter-pack-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'starter-pack-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add uploaded_files column to stripe_orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'stripe_orders' 
    AND column_name = 'uploaded_files'
  ) THEN
    ALTER TABLE stripe_orders
    ADD COLUMN uploaded_files jsonb[];

    COMMENT ON COLUMN stripe_orders.uploaded_files IS 'Array of uploaded files metadata for the order';
  END IF;
END
$$;