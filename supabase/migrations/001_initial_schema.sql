-- ============================================================================
-- Pourtrait Database Schema
-- Initial migration for core data models
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- User Profiles Table (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferences JSONB DEFAULT '{
    "language": "en",
    "notifications": {
      "drinkingWindowAlerts": true,
      "recommendations": true,
      "email": true,
      "push": false
    },
    "privacy": {
      "shareData": false,
      "analytics": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Taste Profiles Table
-- ============================================================================

CREATE TABLE taste_profiles (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  red_wine_preferences JSONB DEFAULT '{
    "fruitiness": 5,
    "earthiness": 5,
    "oakiness": 5,
    "acidity": 5,
    "tannins": 5,
    "sweetness": 5,
    "body": "medium",
    "preferredRegions": [],
    "preferredVarietals": [],
    "dislikedCharacteristics": []
  }'::jsonb,
  white_wine_preferences JSONB DEFAULT '{
    "fruitiness": 5,
    "earthiness": 5,
    "oakiness": 5,
    "acidity": 5,
    "tannins": 5,
    "sweetness": 5,
    "body": "medium",
    "preferredRegions": [],
    "preferredVarietals": [],
    "dislikedCharacteristics": []
  }'::jsonb,
  sparkling_preferences JSONB DEFAULT '{
    "fruitiness": 5,
    "earthiness": 5,
    "oakiness": 5,
    "acidity": 5,
    "tannins": 5,
    "sweetness": 5,
    "body": "medium",
    "preferredRegions": [],
    "preferredVarietals": [],
    "dislikedCharacteristics": []
  }'::jsonb,
  general_preferences JSONB DEFAULT '{
    "priceRange": {
      "min": 0,
      "max": 100,
      "currency": "USD"
    },
    "occasionPreferences": [],
    "foodPairingImportance": 5
  }'::jsonb,
  learning_history JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Wines Table
-- ============================================================================

CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 200),
  producer TEXT NOT NULL CHECK (length(producer) > 0 AND length(producer) <= 200),
  vintage INTEGER NOT NULL CHECK (vintage >= 1800 AND vintage <= EXTRACT(YEAR FROM NOW()) + 5),
  region TEXT NOT NULL CHECK (length(region) > 0 AND length(region) <= 100),
  country TEXT NOT NULL CHECK (length(country) > 0 AND length(country) <= 100),
  varietal TEXT[] NOT NULL CHECK (array_length(varietal, 1) > 0),
  type TEXT NOT NULL CHECK (type IN ('red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified')),
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  purchase_price DECIMAL(10,2) CHECK (purchase_price >= 0),
  purchase_date DATE,
  drinking_window JSONB NOT NULL DEFAULT '{
    "earliestDate": null,
    "peakStartDate": null,
    "peakEndDate": null,
    "latestDate": null,
    "currentStatus": "ready"
  }'::jsonb,
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 10),
  personal_notes TEXT CHECK (length(personal_notes) <= 1000),
  image_url TEXT,
  external_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Consumption History Table
-- ============================================================================

CREATE TABLE consumption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  consumed_at TIMESTAMPTZ NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT CHECK (length(notes) <= 500),
  occasion TEXT CHECK (length(occasion) <= 100),
  companions TEXT[] DEFAULT '{}',
  food_pairing TEXT CHECK (length(food_pairing) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Drinking Partners Table
-- ============================================================================

CREATE TABLE drinking_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  taste_profile JSONB DEFAULT '{}'::jsonb,
  notes TEXT CHECK (length(notes) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Recommendations Table
-- ============================================================================

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inventory', 'purchase', 'pairing')),
  wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  suggested_wine JSONB,
  context JSONB DEFAULT '{}'::jsonb,
  reasoning TEXT NOT NULL CHECK (length(reasoning) > 0 AND length(reasoning) <= 1000),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  user_feedback TEXT CHECK (user_feedback IN ('accepted', 'rejected', 'modified')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Notifications Table
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('drinking_window', 'recommendation', 'system')),
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 1000),
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_experience_level ON user_profiles(experience_level);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Wines indexes
CREATE INDEX idx_wines_user_id ON wines(user_id);
CREATE INDEX idx_wines_type ON wines(type);
CREATE INDEX idx_wines_vintage ON wines(vintage);
CREATE INDEX idx_wines_region ON wines(region);
CREATE INDEX idx_wines_country ON wines(country);
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_drinking_window ON wines USING GIN (drinking_window);
CREATE INDEX idx_wines_search ON wines USING GIN (to_tsvector('english', name || ' ' || producer || ' ' || region));

-- Consumption history indexes
CREATE INDEX idx_consumption_user_id ON consumption_history(user_id);
CREATE INDEX idx_consumption_wine_id ON consumption_history(wine_id);
CREATE INDEX idx_consumption_date ON consumption_history(consumed_at);

-- Recommendations indexes
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinking_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Taste profiles policies
CREATE POLICY "Users can manage own taste profile" ON taste_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Wines policies
CREATE POLICY "Users can manage own wines" ON wines
  FOR ALL USING (auth.uid() = user_id);

-- Consumption history policies
CREATE POLICY "Users can manage own consumption history" ON consumption_history
  FOR ALL USING (auth.uid() = user_id);

-- Drinking partners policies
CREATE POLICY "Users can manage own drinking partners" ON drinking_partners
  FOR ALL USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendation feedback" ON recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations" ON recommendations
  FOR INSERT WITH CHECK (true); -- Allow system to create recommendations

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- ============================================================================
-- Triggers for Updated At Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wines_updated_at 
  BEFORE UPDATE ON wines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drinking_partners_updated_at 
  BEFORE UPDATE ON drinking_partners 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Functions for Business Logic
-- ============================================================================

-- Function to automatically create taste profile when user profile is created
CREATE OR REPLACE FUNCTION create_taste_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO taste_profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_taste_profile_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_taste_profile_for_user();

-- Function to update wine quantity when consumed
CREATE OR REPLACE FUNCTION update_wine_quantity_on_consumption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wines 
  SET quantity = GREATEST(0, quantity - 1),
      updated_at = NOW()
  WHERE id = NEW.wine_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wine_quantity_trigger
  AFTER INSERT ON consumption_history
  FOR EACH ROW EXECUTE FUNCTION update_wine_quantity_on_consumption();

-- Function to calculate drinking window status
CREATE OR REPLACE FUNCTION calculate_drinking_window_status(
  earliest_date DATE,
  peak_start_date DATE,
  peak_end_date DATE,
  latest_date DATE
) RETURNS TEXT AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
BEGIN
  IF current_date < earliest_date THEN
    RETURN 'too_young';
  ELSIF current_date >= earliest_date AND current_date < peak_start_date THEN
    RETURN 'ready';
  ELSIF current_date >= peak_start_date AND current_date <= peak_end_date THEN
    RETURN 'peak';
  ELSIF current_date > peak_end_date AND current_date <= latest_date THEN
    RETURN 'declining';
  ELSE
    RETURN 'over_hill';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for wines with calculated drinking window status
CREATE VIEW wines_with_status AS
SELECT 
  w.*,
  calculate_drinking_window_status(
    (w.drinking_window->>'earliestDate')::DATE,
    (w.drinking_window->>'peakStartDate')::DATE,
    (w.drinking_window->>'peakEndDate')::DATE,
    (w.drinking_window->>'latestDate')::DATE
  ) as calculated_status
FROM wines w;

-- View for user wine statistics
CREATE VIEW user_wine_stats AS
SELECT 
  user_id,
  COUNT(*) as total_wines,
  SUM(quantity) as total_bottles,
  COUNT(CASE WHEN personal_rating IS NOT NULL THEN 1 END) as rated_wines,
  AVG(personal_rating) as average_rating,
  COUNT(CASE WHEN type = 'red' THEN 1 END) as red_wines,
  COUNT(CASE WHEN type = 'white' THEN 1 END) as white_wines,
  COUNT(CASE WHEN type = 'sparkling' THEN 1 END) as sparkling_wines
FROM wines
GROUP BY user_id;

-- ============================================================================
-- Sample Data for Development (Optional)
-- ============================================================================

-- This section can be uncommented for development/testing
/*
-- Insert sample user profile (requires existing auth user)
INSERT INTO user_profiles (id, name, experience_level) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'intermediate')
ON CONFLICT (id) DO NOTHING;

-- Insert sample wine
INSERT INTO wines (user_id, name, producer, vintage, region, country, varietal, type, quantity)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Château Margaux',
  'Château Margaux',
  2015,
  'Margaux',
  'France',
  ARRAY['Cabernet Sauvignon', 'Merlot', 'Petit Verdot', 'Cabernet Franc'],
  'red',
  1
) ON CONFLICT DO NOTHING;
*/