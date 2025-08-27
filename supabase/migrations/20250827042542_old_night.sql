/*
  # Create helper functions and triggers

  1. Functions
    - set_updated_at() - Generic function to update updated_at timestamp
    - update_golf_clubs_updated_at() - Specific function for golf clubs
    - generate_order_number() - Function to generate unique order numbers

  2. Triggers
    - Auto-update updated_at for relevant tables
*/

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Specific function for golf clubs updated_at
CREATE OR REPLACE FUNCTION update_golf_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(restaurant_uuid uuid)
RETURNS text AS $$
DECLARE
  today_date text;
  order_count integer;
  order_number text;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Count orders for today for this restaurant
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE restaurant_id = restaurant_uuid
    AND DATE(created_at) = CURRENT_DATE;
  
  -- Generate order number
  order_number := today_date || '-' || LPAD((order_count + 1)::text, 4, '0');
  
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER trg_kitchen_owners_updated_at
  BEFORE UPDATE ON kitchen_owners
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_revenue_centers_updated_at
  BEFORE UPDATE ON revenue_centers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_combo_meals_updated_at
  BEFORE UPDATE ON combo_meals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_deals_updated_at
  BEFORE UPDATE ON daily_deals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_barcodes_updated_at
  BEFORE UPDATE ON barcodes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Golf clubs trigger is created separately in create_golf_club_triggers.sql