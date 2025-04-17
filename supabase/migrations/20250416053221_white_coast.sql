/*
  # Add cart items column to user profiles

  1. Changes
    - Add `cart_items` column to `user_profiles` table
      - Type: JSONB array to store cart items
      - Default: Empty array
      - Nullable: true (allows users to have an empty cart)

  2. Notes
    - Using JSONB[] type for flexible cart item storage
    - Default empty array ensures new profiles always have a valid cart
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'cart_items'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN cart_items JSONB[] DEFAULT '{}'::jsonb[];
  END IF;
END $$;