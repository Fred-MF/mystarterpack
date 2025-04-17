-- Add cart_items column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN cart_items jsonb[] DEFAULT '{}';

COMMENT ON COLUMN user_profiles.cart_items IS 'Array of cart items for the user';