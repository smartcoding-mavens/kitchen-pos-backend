/*
  # Create golf club triggers

  1. Triggers
    - Auto-update updated_at timestamp for golf_clubs table

  2. Functions
    - update_golf_clubs_updated_at() - Function to update timestamp
*/

-- Create function to update golf_clubs updated_at
CREATE OR REPLACE FUNCTION update_golf_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for golf_clubs
CREATE TRIGGER trg_golf_clubs_updated_at
  BEFORE UPDATE ON golf_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_golf_clubs_updated_at();