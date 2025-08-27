/*
  # Add sample data for development and testing

  1. Sample Data
    - Sample subscription plan (if not exists)
    - Sample super admin user (if not exists)

  2. Notes
    - This migration is safe to run multiple times
    - Uses ON CONFLICT DO NOTHING to prevent duplicates
    - Provides realistic test data for development
*/

-- Ensure subscription plan exists
INSERT INTO subscription_plan (
  name,
  description,
  price,
  currency,
  billing_cycle,
  is_active
) VALUES (
  'Basic',
  'Essential features for small to medium restaurants including menu management, order tracking, staff management, and basic analytics.',
  99.99,
  'USD',
  'monthly',
  true
) ON CONFLICT (name) DO NOTHING;

-- Ensure super admin user exists in database (auth user created via script)
INSERT INTO users (
  auth_user_id,
  email,
  full_name,
  role,
  restaurant_id,
  is_active
) VALUES (
  NULL, -- Will be updated by create-super-admin script
  'admin@kitchenpos.com',
  'Super Administrator',
  'super_admin',
  NULL,
  true
) ON CONFLICT (email) DO NOTHING;

-- Create sample kitchen owner for testing (optional)
DO $$
BEGIN
  -- Only create if no kitchen owners exist
  IF NOT EXISTS (SELECT 1 FROM kitchen_owners LIMIT 1) THEN
    INSERT INTO kitchen_owners (
      email,
      full_name,
      subscription_plan,
      payment_id,
      subscription_amount,
      subscription_expires_at,
      password_hash,
      is_setup_completed
    ) VALUES (
      'demo@restaurant.com',
      'Demo Restaurant Owner',
      'Basic',
      'demo_payment_123',
      99.99,
      (now() + interval '1 year'),
      'demo_hash_managed_by_auth',
      false
    );
  END IF;
END $$;