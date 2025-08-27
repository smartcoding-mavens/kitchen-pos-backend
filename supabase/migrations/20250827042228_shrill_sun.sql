/*
  # Initial Kitchen POS Database Schema

  1. New Tables
    - `kitchen_owners` - Kitchen owner accounts with subscription details
    - `users` - Application users (kitchen owners, managers, staff)
    - `restaurants` - Restaurant information and settings
    - `revenue_centers` - Different areas of the restaurant (restaurant, bar, patio, etc.)
    - `menu_categories` - Menu category organization
    - `menu_items` - Individual menu items
    - `combo_meals` - Combo meal offerings
    - `daily_deals` - Special offers and promotions
    - `customers` - Customer information and order history
    - `orders` - Customer orders
    - `order_items` - Individual items within orders
    - `payments` - Payment transactions
    - `staff_assignments` - Staff assignments to revenue centers
    - `business_hours` - Operating hours for each revenue center
    - `barcodes` - QR codes for tables, counters, and menus
    - `golf_clubs` - Golf club partnerships

  2. Enums
    - `user_role` - User roles (super_admin, kitchen_owner, manager, staff)
    - `restaurant_status` - Restaurant status (active, inactive, suspended)
    - `revenue_center_type` - Revenue center types (restaurant, bar, patio, takeout)
    - `order_type` - Order types (dine_in, takeaway, delivery)
    - `order_status` - Order status (pending, preparing, ready, served, cancelled)
    - `payment_method` - Payment methods (cash, card, gift_card, online)
    - `payment_status` - Payment status (pending, completed, failed, refunded)
    - `golf_club_status` - Golf club status (active, inactive)

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user role
    - Ensure data isolation between restaurants
*/

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('super_admin', 'kitchen_owner', 'manager', 'staff');
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE revenue_center_type AS ENUM ('restaurant', 'bar', 'patio', 'takeout');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'gift_card', 'online');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE golf_club_status AS ENUM ('active', 'inactive');

-- Kitchen Owners table
CREATE TABLE IF NOT EXISTS kitchen_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  subscription_plan text DEFAULT 'basic',
  payment_id text NOT NULL,
  subscription_amount numeric(10,2) NOT NULL,
  subscription_expires_at timestamptz NOT NULL,
  password_hash text NOT NULL,
  is_setup_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'staff' NOT NULL,
  restaurant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES kitchen_owners(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  phone_number text NOT NULL,
  domain_name text UNIQUE NOT NULL,
  status restaurant_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Revenue Centers table
CREATE TABLE IF NOT EXISTS revenue_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type revenue_center_type NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menu Categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  revenue_center_id uuid REFERENCES revenue_centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  customizable_options jsonb DEFAULT '[]',
  allergen_info text,
  preparation_time integer DEFAULT 15,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Combo Meals table
CREATE TABLE IF NOT EXISTS combo_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  items jsonb DEFAULT '[]' NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily Deals table
CREATE TABLE IF NOT EXISTS daily_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_percentage numeric(5,2),
  discount_amount numeric(10,2),
  applicable_items jsonb DEFAULT '[]',
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  last_order_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  order_number text UNIQUE NOT NULL,
  type order_type NOT NULL,
  status order_status DEFAULT 'pending',
  table_number text,
  delivery_location text,
  subtotal numeric(10,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
  total_amount numeric(10,2) DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  combo_meal_id uuid REFERENCES combo_meals(id),
  revenue_center_id uuid REFERENCES revenue_centers(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  customizations jsonb DEFAULT '{}',
  special_instructions text,
  status order_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT order_items_item_check CHECK (
    (menu_item_id IS NOT NULL AND combo_meal_id IS NULL) OR 
    (menu_item_id IS NULL AND combo_meal_id IS NOT NULL)
  )
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Assignments table
CREATE TABLE IF NOT EXISTS staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  revenue_center_id uuid REFERENCES revenue_centers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, revenue_center_id)
);

-- Business Hours table
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  revenue_center_id uuid REFERENCES revenue_centers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, revenue_center_id, day_of_week)
);

-- Barcodes table
CREATE TABLE IF NOT EXISTS barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  type text NOT NULL,
  identifier text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Golf Clubs table
CREATE TABLE IF NOT EXISTS golf_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_owner_id uuid REFERENCES kitchen_owners(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'United States' NOT NULL,
  zipcode integer NOT NULL,
  status golf_club_status DEFAULT 'active' NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints that reference other tables
ALTER TABLE users ADD CONSTRAINT users_restaurant_id_fkey 
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL;

ALTER TABLE kitchen_owners ADD CONSTRAINT kitchen_owners_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_kitchen_owners_email ON kitchen_owners(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_domain_name ON restaurants(domain_name);
CREATE INDEX IF NOT EXISTS idx_revenue_centers_restaurant_id ON revenue_centers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_revenue_center_id ON order_items(revenue_center_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_kitchen_owner_id ON golf_clubs(kitchen_owner_id);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_status ON golf_clubs(status);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_created_at ON golf_clubs(created_at);

-- Enable Row Level Security
ALTER TABLE kitchen_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_clubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Kitchen Owners
CREATE POLICY "Kitchen owners can read their own data"
  ON kitchen_owners
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Super admin can manage all kitchen owners"
  ON kitchen_owners
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));

-- RLS Policies for Users
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Kitchen owners can manage their restaurant users"
  ON users
  FOR ALL
  TO authenticated
  USING (restaurant_id IN (
    SELECT r.id FROM restaurants r 
    JOIN kitchen_owners ko ON ko.id = r.owner_id 
    JOIN users u ON u.id = ko.user_id 
    WHERE u.auth_user_id = auth.uid()
  ));

CREATE POLICY "Super admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));

-- RLS Policies for Restaurants
CREATE POLICY "Kitchen owners can manage their restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (owner_id IN (
    SELECT ko.id FROM kitchen_owners ko 
    JOIN users u ON u.id = ko.user_id 
    WHERE u.auth_user_id = auth.uid()
  ));

CREATE POLICY "Restaurant staff can read their restaurant"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Super admin can manage all restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));

-- RLS Policies for Revenue Centers
CREATE POLICY "Restaurant users can manage their revenue centers"
  ON revenue_centers
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Menu Categories
CREATE POLICY "Restaurant users can manage their menu categories"
  ON menu_categories
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Menu Items
CREATE POLICY "Restaurant users can manage their menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Combo Meals
CREATE POLICY "Restaurant users can manage their combo meals"
  ON combo_meals
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Daily Deals
CREATE POLICY "Restaurant users can manage their daily deals"
  ON daily_deals
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Customers
CREATE POLICY "Restaurant users can manage their customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Orders
CREATE POLICY "Restaurant users can manage their orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Order Items
CREATE POLICY "Restaurant users can manage their order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o 
      JOIN users u ON u.restaurant_id = o.restaurant_id 
      WHERE u.auth_user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Payments
CREATE POLICY "Restaurant users can manage their payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o 
      JOIN users u ON u.restaurant_id = o.restaurant_id 
      WHERE u.auth_user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Staff Assignments
CREATE POLICY "Restaurant users can manage staff assignments"
  ON staff_assignments
  FOR ALL
  TO authenticated
  USING (
    revenue_center_id IN (
      SELECT rc.id FROM revenue_centers rc 
      JOIN users u ON u.restaurant_id = rc.restaurant_id 
      WHERE u.auth_user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Business Hours
CREATE POLICY "Restaurant users can manage their business hours"
  ON business_hours
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Barcodes
CREATE POLICY "Restaurant users can manage their barcodes"
  ON barcodes
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin')
  );

-- RLS Policies for Golf Clubs
CREATE POLICY "Kitchen owners can manage their own golf clubs"
  ON golf_clubs
  FOR ALL
  TO authenticated
  USING (kitchen_owner_id IN (
    SELECT ko.id FROM kitchen_owners ko 
    JOIN users u ON u.id = ko.user_id 
    WHERE u.auth_user_id = auth.uid()
  ))
  WITH CHECK (kitchen_owner_id IN (
    SELECT ko.id FROM kitchen_owners ko 
    JOIN users u ON u.id = ko.user_id 
    WHERE u.auth_user_id = auth.uid()
  ));

CREATE POLICY "Super admin can manage all golf clubs"
  ON golf_clubs
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid() AND u.role = 'super_admin'));