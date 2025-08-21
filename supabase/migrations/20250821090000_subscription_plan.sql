-- Create subscription_plan table
CREATE TABLE IF NOT EXISTS public.subscription_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plan_name_fixed CHECK (name = 'Basic'),
  CONSTRAINT subscription_plan_billing_cycle_fixed CHECK (billing_cycle = 'monthly')
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_plan_updated_at ON public.subscription_plan;
CREATE TRIGGER trg_subscription_plan_updated_at
BEFORE UPDATE ON public.subscription_plan
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.subscription_plan ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_plan' AND policyname = 'Allow read to authenticated'
  ) THEN
    CREATE POLICY "Allow read to authenticated"
      ON public.subscription_plan
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_plan' AND policyname = 'Allow super_admin to modify'
  ) THEN
    CREATE POLICY "Allow super_admin to modify"
      ON public.subscription_plan
      FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_plan' AND policyname = 'Allow super_admin to insert'
  ) THEN
    CREATE POLICY "Allow super_admin to insert"
      ON public.subscription_plan
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'
      ));
  END IF;
END
$$;

-- Seed default Basic plan if not exists
INSERT INTO public.subscription_plan (name, description, price, currency, billing_cycle, is_active)
SELECT 'Basic', 'Starter plan with essential features', 99.99, 'USD', 'monthly', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plan WHERE name = 'Basic'
); 