/*
  # Create subscription plan table

  1. New Tables
    - `subscription_plan` - Single subscription plan configuration

  2. Security
    - Enable RLS on subscription_plan table
    - Allow authenticated users to read plan
    - Only super admin can modify plan

  3. Constraints
    - Only one plan named 'Basic' allowed
    - Price must be positive
    - Billing cycle fixed to 'monthly'

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create subscription plan table
CREATE TABLE IF NOT EXISTS subscription_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price > 0),
  currency text DEFAULT 'USD' NOT NULL,
  billing_cycle text DEFAULT 'monthly' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT subscription_plan_name_fixed CHECK (name = 'Basic'),
  CONSTRAINT subscription_plan_billing_cycle_fixed CHECK (billing_cycle = 'monthly')
);

-- Enable RLS
ALTER TABLE subscription_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read to authenticated"
  ON subscription_plan
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow super_admin to insert"
  ON subscription_plan
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));

CREATE POLICY "Allow super_admin to modify"
  ON subscription_plan
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription_plan
CREATE TRIGGER trg_subscription_plan_updated_at
  BEFORE UPDATE ON subscription_plan
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert default subscription plan
INSERT INTO subscription_plan (name, description, price, currency, billing_cycle, is_active)
VALUES (
  'Basic',
  'Starter plan with essential features for small to medium restaurants',
  99.99,
  'USD',
  'monthly',
  true
) ON CONFLICT (name) DO NOTHING;