-- ============================================================================
-- Palate Profile Schema (Long-term profile + context + aromas)
-- Adds structured tables to capture stable palate traits, aroma affinities,
-- context weights, food profile, style affinities, and interaction events.
-- ============================================================================

-- ============================================================================
-- Palate Profiles (1–1 with user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS palate_profiles (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  -- Stable palate tolerances (0.0–1.0)
  sweetness DECIMAL(3,2) CHECK (sweetness >= 0 AND sweetness <= 1),
  acidity DECIMAL(3,2) CHECK (acidity >= 0 AND acidity <= 1),
  tannin DECIMAL(3,2) CHECK (tannin >= 0 AND tannin <= 1),
  bitterness DECIMAL(3,2) CHECK (bitterness >= 0 AND bitterness <= 1),
  body DECIMAL(3,2) CHECK (body >= 0 AND body <= 1),
  alcohol_warmth DECIMAL(3,2) CHECK (alcohol_warmth >= 0 AND alcohol_warmth <= 1),
  sparkle_intensity DECIMAL(3,2) CHECK (sparkle_intensity >= 0 AND sparkle_intensity <= 1),

  -- Style levers (0.0–1.0)
  oak DECIMAL(3,2) CHECK (oak >= 0 AND oak <= 1),
  malolactic_butter DECIMAL(3,2) CHECK (malolactic_butter >= 0 AND malolactic_butter <= 1),
  oxidative DECIMAL(3,2) CHECK (oxidative >= 0 AND oxidative <= 1),
  minerality DECIMAL(3,2) CHECK (minerality >= 0 AND minerality <= 1),
  fruit_ripeness DECIMAL(3,2) CHECK (fruit_ripeness >= 0 AND fruit_ripeness <= 1),

  sparkling_dryness TEXT CHECK (sparkling_dryness IN (
    'Brut Nature','Extra Brut','Brut','Extra Dry','Sec','Demi-Sec','Doux'
  )),

  wine_knowledge TEXT CHECK (wine_knowledge IN ('novice','intermediate','expert')),
  novelty DECIMAL(3,2) CHECK (novelty >= 0 AND novelty <= 1),
  budget_tier TEXT CHECK (budget_tier IN ('weeknight','weekend','celebration')),
  dislikes TEXT[] DEFAULT '{}',
  flavor_maps JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_palate_profiles_updated_at ON palate_profiles(updated_at);

-- RLS
ALTER TABLE palate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own palate profile" ON palate_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_palate_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_palate_profiles_updated_at
      BEFORE UPDATE ON palate_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- Aroma Preferences (per-family affinity, -1.0..1.0)
-- ============================================================================

CREATE TABLE IF NOT EXISTS aroma_preferences (
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family TEXT NOT NULL CHECK (family IN (
    'citrus','stone_fruit','tropical','red_fruit','black_fruit',
    'floral','herbal_green','pepper_spice','earth_mineral',
    'oak_vanilla_smoke','dairy_butter','honey_oxidative'
  )),
  affinity DECIMAL(3,2) NOT NULL CHECK (affinity >= -1 AND affinity <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, family)
);

CREATE INDEX IF NOT EXISTS idx_aroma_preferences_user_id ON aroma_preferences(user_id);

ALTER TABLE aroma_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own aroma preferences" ON aroma_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Context Preferences (occasion → weight vector)
-- ============================================================================

CREATE TABLE IF NOT EXISTS context_preferences (
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  occasion TEXT NOT NULL CHECK (occasion IN (
    'everyday','hot_day_patio','cozy_winter','spicy_food_night',
    'steak_night','seafood_sushi','pizza_pasta','celebration_toast',
    'dessert_night','aperitif'
  )),
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, occasion)
);

CREATE INDEX IF NOT EXISTS idx_context_preferences_user_id ON context_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_context_preferences_occasion ON context_preferences(occasion);
CREATE INDEX IF NOT EXISTS idx_context_preferences_weights_gin ON context_preferences USING GIN (weights);

ALTER TABLE context_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own context preferences" ON context_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Food Profiles (optional 1–1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_profiles (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  heat_level INT CHECK (heat_level >= 0 AND heat_level <= 5),
  salt DECIMAL(3,2) CHECK (salt >= 0 AND salt <= 1),
  fat DECIMAL(3,2) CHECK (fat >= 0 AND fat <= 1),
  sauce_sweetness DECIMAL(3,2) CHECK (sauce_sweetness >= 0 AND sauce_sweetness <= 1),
  sauce_acidity DECIMAL(3,2) CHECK (sauce_acidity >= 0 AND sauce_acidity <= 1),
  cuisines TEXT[] DEFAULT '{}',
  proteins TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_profiles_user_id ON food_profiles(user_id);

ALTER TABLE food_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own food profile" ON food_profiles
  FOR ALL USING (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_food_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_food_profiles_updated_at
      BEFORE UPDATE ON food_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- Style Likes (grape/region/style affinities with confidence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS style_likes (
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('grape','region','style')),
  key TEXT NOT NULL,
  affinity DECIMAL(3,2) NOT NULL CHECK (affinity >= -1 AND affinity <= 1),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, type, key)
);

CREATE INDEX IF NOT EXISTS idx_style_likes_user_id ON style_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_style_likes_type ON style_likes(type);
CREATE INDEX IF NOT EXISTS idx_style_likes_key ON style_likes(key);

ALTER TABLE style_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own style likes" ON style_likes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Interaction Events (ongoing learning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  ts TIMESTAMPTZ DEFAULT NOW(),
  context JSONB DEFAULT '{}'::jsonb, -- occasion, meal, weather, mood
  rating INT CHECK (rating >= 1 AND rating <= 10),
  reasons TEXT[] DEFAULT '{}',
  notes TEXT CHECK (length(notes) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interaction_events_user_id ON interaction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_wine_id ON interaction_events(wine_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_ts ON interaction_events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_events_context_gin ON interaction_events USING GIN (context);

ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own interaction events" ON interaction_events
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Views (optional future): none in this migration
-- ============================================================================


