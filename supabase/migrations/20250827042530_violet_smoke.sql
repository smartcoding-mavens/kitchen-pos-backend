/*
  # Create default super admin user

  1. Purpose
    - Creates a default super admin user for initial system access
    - Provides secure credentials for system administration

  2. Security
    - Creates both auth user and database record
    - Sets up proper role and permissions
    - Email is pre-confirmed for immediate access

  3. Credentials
    - Email: admin@kitchenpos.com
    - Password: SuperAdmin123!
    - Role: super_admin
*/

-- Note: This migration creates the database record only
-- The auth user should be created using the create-super-admin.js script
-- This ensures proper password hashing and auth integration

-- Insert super admin user record (will be linked to auth user via script)
INSERT INTO users (
  id,
  auth_user_id,
  email,
  full_name,
  role,
  restaurant_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  NULL, -- Will be updated by the create-super-admin script
  'admin@kitchenpos.com',
  'Super Administrator',
  'super_admin',
  NULL,
  true,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a function to help with super admin setup
CREATE OR REPLACE FUNCTION create_super_admin_if_not_exists(
  admin_email text,
  admin_name text,
  auth_user_uuid uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Check if super admin already exists
  SELECT id INTO user_id
  FROM users
  WHERE email = admin_email AND role = 'super_admin';

  -- If not exists, create it
  IF user_id IS NULL THEN
    INSERT INTO users (
      auth_user_id,
      email,
      full_name,
      role,
      restaurant_id,
      is_active
    ) VALUES (
      auth_user_uuid,
      admin_email,
      admin_name,
      'super_admin',
      NULL,
      true
    ) RETURNING id INTO user_id;
  ELSE
    -- Update auth_user_id if provided and not set
    IF auth_user_uuid IS NOT NULL THEN
      UPDATE users 
      SET auth_user_id = auth_user_uuid
      WHERE id = user_id AND auth_user_id IS NULL;
    END IF;
  END IF;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;