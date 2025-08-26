/*
  # Create Golf Clubs Table

  1. New Tables
    - `golf_clubs`
      - `id` (uuid, primary key)
      - `kitchen_owner_id` (uuid, foreign key to kitchen_owners.id)
      - `name` (text, required)
      - `description` (text, optional)
      - `address` (text, required)
      - `email` (text, required)
      - `phone_number` (text, required)
      - `city` (text, required)
      - `state` (text, required)
      - `country` (text, default 'United States')
      - `zipcode` (integer, required)
      - `status` (enum: active, inactive, default active)
      - `location` (text, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `golf_clubs` table
    - Add policy for kitchen owners to manage only their own golf clubs
    - Add policy for super admin to manage all golf clubs

  3. Enums
    - Create `golf_club_status` enum for status field
*/

-- Create enum for golf club status
CREATE TYPE golf_club_status AS ENUM ('active', 'inactive');

-- Create golf_clubs table
CREATE TABLE IF NOT EXISTS golf_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_owner_id uuid NOT NULL REFERENCES kitchen_owners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  zipcode integer NOT NULL,
  status golf_club_status NOT NULL DEFAULT 'active',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE golf_clubs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Kitchen owners can manage their own golf clubs"
  ON golf_clubs
  FOR ALL
  TO authenticated
  USING (
    kitchen_owner_id IN (
      SELECT ko.id 
      FROM kitchen_owners ko
      JOIN users u ON u.id = ko.user_id
      WHERE u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    kitchen_owner_id IN (
      SELECT ko.id 
      FROM kitchen_owners ko
      JOIN users u ON u.id = ko.user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Super admin can manage all golf clubs"
  ON golf_clubs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_golf_clubs_kitchen_owner_id ON golf_clubs(kitchen_owner_id);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_status ON golf_clubs(status);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_created_at ON golf_clubs(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_golf_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_golf_clubs_updated_at
  BEFORE UPDATE ON golf_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_golf_clubs_updated_at();