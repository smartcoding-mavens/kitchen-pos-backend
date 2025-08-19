/*
  # Create Super Admin User - Brendan

  1. New User Creation
    - Creates auth user with email brendan@teqmavens.com
    - Creates corresponding user record in public.users table
    - Sets role as 'super_admin'
    - Ensures proper authentication flow

  2. Security
    - User has super_admin role for full system access
    - No restaurant_id association (super admin oversees all)
    - Email confirmed for immediate login access
*/

-- Create the auth user first
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'brendan@teqmavens.com',
  crypt('admin@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Brendan Super Admin", "role": "super_admin"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the auth user ID for the user we just created
DO $$
DECLARE
  auth_user_uuid uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_uuid 
  FROM auth.users 
  WHERE email = 'brendan@teqmavens.com';

  -- Create the corresponding user record in public.users
  INSERT INTO public.users (
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
    auth_user_uuid,
    'brendan@teqmavens.com',
    'Brendan Super Admin',
    'super_admin',
    NULL,
    true,
    now(),
    now()
  ) ON CONFLICT (email) DO NOTHING;
END $$;