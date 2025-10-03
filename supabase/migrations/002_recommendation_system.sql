-- ============================================================================
-- Recommendation System Database Schema
-- Migration for personalized recommendation features
-- ============================================================================

-- ============================================================================
-- Recommendation Requests Table (for logging and analytics)
-- ============================================================================

CREATE TABLE recommendation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('tonight', 'purchase', 'contextual')),
  context JSONB DEFAULT '{}'::jsonb,
  recommendations_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Recommendation Feedback Table (for learning system)
-- ============================================================================

CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accepted', 'rejected', 'modified')),
  reason TEXT CHECK (length(reason) <= 500),
  modified_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI Interactions Table (enhanced for personalized recommendations)
-- ============================================================================

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('recommendation', 'chat', 'feedback')),
  query TEXT NOT NULL CHECK (length(query) > 0 AND length(query) <= 2000),
  context JSONB DEFAULT '{}'::jsonb,
  response_summary TEXT CHECK (length(response_summary) <= 1000),
  recommendations_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  response_time INTEGER DEFAULT 0, -- milliseconds
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4',
  cost DECIMAL(10,6) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- User Learning History Table (for taste profile evolution)
-- ============================================================================

CREATE TABLE user_learning_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  learning_type TEXT NOT NULL CHECK (learning_type IN ('consumption', 'feedback', 'rating', 'preference_update')),
  learning_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_impact DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_impact >= -1 AND confidence_impact <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Wine Similarity Scores Table (for recommendation engine)
-- ============================================================================

CREATE TABLE wine_similarity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_a_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  wine_b_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_factors JSONB DEFAULT '{}'::jsonb, -- region, varietal, style, etc.
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wine_a_id, wine_b_id)
);

-- ============================================================================
-- User Preference Patterns Table (for advanced personalization)
-- ============================================================================

CREATE TABLE user_preference_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('seasonal', 'occasion', 'food_pairing', 'price_sensitivity')),
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_type)
);

-- ============================================================================
-- Recommendation Performance Metrics Table
-- ============================================================================

CREATE TABLE recommendation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('accuracy', 'relevance', 'satisfaction', 'conversion')),
  metric_value DECIMAL(5,3) NOT NULL,
  measurement_context JSONB DEFAULT '{}'::jsonb,
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Recommendation requests indexes
CREATE INDEX idx_recommendation_requests_user_id ON recommendation_requests(user_id);
CREATE INDEX idx_recommendation_requests_type ON recommendation_requests(request_type);
CREATE INDEX idx_recommendation_requests_created_at ON recommendation_requests(created_at);

-- Recommendation feedback indexes
CREATE INDEX idx_recommendation_feedback_recommendation_id ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX idx_recommendation_feedback_type ON recommendation_feedback(feedback_type);
CREATE INDEX idx_recommendation_feedback_created_at ON recommendation_feedback(created_at);

-- AI interactions indexes
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX idx_ai_interactions_model ON ai_interactions(model);

-- User learning history indexes
CREATE INDEX idx_user_learning_history_user_id ON user_learning_history(user_id);
CREATE INDEX idx_user_learning_history_wine_id ON user_learning_history(wine_id);
CREATE INDEX idx_user_learning_history_type ON user_learning_history(learning_type);
CREATE INDEX idx_user_learning_history_created_at ON user_learning_history(created_at);

-- Wine similarity scores indexes
CREATE INDEX idx_wine_similarity_wine_a ON wine_similarity_scores(wine_a_id);
CREATE INDEX idx_wine_similarity_wine_b ON wine_similarity_scores(wine_b_id);
CREATE INDEX idx_wine_similarity_score ON wine_similarity_scores(similarity_score DESC);

-- User preference patterns indexes
CREATE INDEX idx_user_preference_patterns_user_id ON user_preference_patterns(user_id);
CREATE INDEX idx_user_preference_patterns_type ON user_preference_patterns(pattern_type);
CREATE INDEX idx_user_preference_patterns_updated ON user_preference_patterns(last_updated);

-- Recommendation metrics indexes
CREATE INDEX idx_recommendation_metrics_user_id ON recommendation_metrics(user_id);
CREATE INDEX idx_recommendation_metrics_recommendation_id ON recommendation_metrics(recommendation_id);
CREATE INDEX idx_recommendation_metrics_type ON recommendation_metrics(metric_type);
CREATE INDEX idx_recommendation_metrics_measured_at ON recommendation_metrics(measured_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE recommendation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_similarity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- Recommendation requests policies
CREATE POLICY "Users can view own recommendation requests" ON recommendation_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendation requests" ON recommendation_requests
  FOR INSERT WITH CHECK (true);

-- Recommendation feedback policies
CREATE POLICY "Users can manage own recommendation feedback" ON recommendation_feedback
  FOR ALL USING (auth.uid() = user_id);

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI interactions" ON ai_interactions
  FOR INSERT WITH CHECK (true);

-- User learning history policies
CREATE POLICY "Users can view own learning history" ON user_learning_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage learning history" ON user_learning_history
  FOR ALL WITH CHECK (true);

-- Wine similarity scores policies (read-only for users)
CREATE POLICY "Users can view wine similarity scores" ON wine_similarity_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage wine similarity scores" ON wine_similarity_scores
  FOR ALL WITH CHECK (true);

-- User preference patterns policies
CREATE POLICY "Users can view own preference patterns" ON user_preference_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage preference patterns" ON user_preference_patterns
  FOR ALL WITH CHECK (true);

-- Recommendation metrics policies
CREATE POLICY "Users can view own recommendation metrics" ON recommendation_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage recommendation metrics" ON recommendation_metrics
  FOR ALL WITH CHECK (true);

-- ============================================================================
-- Functions for Recommendation Analytics
-- ============================================================================

-- Function to calculate user recommendation analytics
CREATE OR REPLACE FUNCTION get_user_recommendation_analytics(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalRecommendations', (
      SELECT COUNT(*) FROM recommendations WHERE user_id = target_user_id
    ),
    'acceptanceRate', (
      SELECT COALESCE(
        COUNT(CASE WHEN user_feedback = 'accepted' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN user_feedback IS NOT NULL THEN 1 END), 0),
        0
      ) FROM recommendations WHERE user_id = target_user_id
    ),
    'rejectionRate', (
      SELECT COALESCE(
        COUNT(CASE WHEN user_feedback = 'rejected' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN user_feedback IS NOT NULL THEN 1 END), 0),
        0
      ) FROM recommendations WHERE user_id = target_user_id
    ),
    'modificationRate', (
      SELECT COALESCE(
        COUNT(CASE WHEN user_feedback = 'modified' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN user_feedback IS NOT NULL THEN 1 END), 0),
        0
      ) FROM recommendations WHERE user_id = target_user_id
    ),
    'pendingFeedback', (
      SELECT COUNT(*) FROM recommendations 
      WHERE user_id = target_user_id AND user_feedback IS NULL
    ),
    'averageConfidence', (
      SELECT COALESCE(AVG(confidence), 0) FROM recommendations WHERE user_id = target_user_id
    ),
    'typeBreakdown', (
      SELECT json_build_object(
        'inventory', COUNT(CASE WHEN type = 'inventory' THEN 1 END),
        'purchase', COUNT(CASE WHEN type = 'purchase' THEN 1 END),
        'pairing', COUNT(CASE WHEN type = 'pairing' THEN 1 END)
      ) FROM recommendations WHERE user_id = target_user_id
    ),
    'lastRecommendation', (
      SELECT created_at FROM recommendations 
      WHERE user_id = target_user_id 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user taste profile from feedback
CREATE OR REPLACE FUNCTION update_taste_profile_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert learning history record
  INSERT INTO user_learning_history (
    user_id,
    recommendation_id,
    learning_type,
    learning_data,
    confidence_impact
  ) VALUES (
    NEW.user_id,
    NEW.recommendation_id,
    'feedback',
    json_build_object(
      'feedback_type', NEW.feedback_type,
      'reason', NEW.reason,
      'modified_context', NEW.modified_context
    ),
    CASE 
      WHEN NEW.feedback_type = 'accepted' THEN 0.1
      WHEN NEW.feedback_type = 'rejected' THEN -0.05
      WHEN NEW.feedback_type = 'modified' THEN 0.05
      ELSE 0
    END
  );
  
  -- Update taste profile confidence score
  UPDATE taste_profiles 
  SET 
    confidence_score = LEAST(1.0, GREATEST(0.0, confidence_score + 
      CASE 
        WHEN NEW.feedback_type = 'accepted' THEN 0.02
        WHEN NEW.feedback_type = 'rejected' THEN -0.01
        WHEN NEW.feedback_type = 'modified' THEN 0.01
        ELSE 0
      END
    )),
    last_updated = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for taste profile updates
CREATE TRIGGER update_taste_profile_on_feedback
  AFTER INSERT ON recommendation_feedback
  FOR EACH ROW EXECUTE FUNCTION update_taste_profile_from_feedback();

-- Function to calculate wine similarity (simplified version)
CREATE OR REPLACE FUNCTION calculate_wine_similarity(wine_a_id UUID, wine_b_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  wine_a wines%ROWTYPE;
  wine_b wines%ROWTYPE;
  similarity DECIMAL := 0.0;
BEGIN
  SELECT * INTO wine_a FROM wines WHERE id = wine_a_id;
  SELECT * INTO wine_b FROM wines WHERE id = wine_b_id;
  
  IF NOT FOUND THEN
    RETURN 0.0;
  END IF;
  
  -- Same type bonus
  IF wine_a.type = wine_b.type THEN
    similarity := similarity + 0.3;
  END IF;
  
  -- Same region bonus
  IF wine_a.region = wine_b.region THEN
    similarity := similarity + 0.2;
  END IF;
  
  -- Same country bonus
  IF wine_a.country = wine_b.country THEN
    similarity := similarity + 0.1;
  END IF;
  
  -- Varietal overlap bonus
  IF wine_a.varietal && wine_b.varietal THEN
    similarity := similarity + 0.2;
  END IF;
  
  -- Vintage proximity bonus (within 3 years)
  IF ABS(wine_a.vintage - wine_b.vintage) <= 3 THEN
    similarity := similarity + 0.1;
  END IF;
  
  -- Same producer bonus
  IF wine_a.producer = wine_b.producer THEN
    similarity := similarity + 0.1;
  END IF;
  
  RETURN LEAST(1.0, similarity);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for recommendation analytics by user
CREATE VIEW user_recommendation_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_recommendations,
  COUNT(CASE WHEN user_feedback = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN user_feedback = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN user_feedback = 'modified' THEN 1 END) as modified_count,
  COUNT(CASE WHEN user_feedback IS NULL THEN 1 END) as pending_count,
  AVG(confidence) as average_confidence,
  MAX(created_at) as last_recommendation_date
FROM recommendations
GROUP BY user_id;

-- View for AI interaction metrics
CREATE VIEW ai_interaction_metrics AS
SELECT 
  user_id,
  interaction_type,
  COUNT(*) as interaction_count,
  AVG(response_time) as avg_response_time,
  AVG(confidence) as avg_confidence,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  DATE_TRUNC('day', created_at) as interaction_date
FROM ai_interactions
GROUP BY user_id, interaction_type, DATE_TRUNC('day', created_at);

-- ============================================================================
-- Sample Data for Development (Optional)
-- ============================================================================

-- This section can be uncommented for development/testing
/*
-- Insert sample recommendation request
INSERT INTO recommendation_requests (user_id, request_type, context, recommendations_count, confidence)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'tonight',
  '{"occasion": "dinner", "foodPairing": "steak"}'::jsonb,
  3,
  0.85
) ON CONFLICT DO NOTHING;

-- Insert sample AI interaction
INSERT INTO ai_interactions (user_id, interaction_type, query, context, recommendations_count, confidence, response_time, tokens_used, model)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'recommendation',
  'What wine should I drink tonight?',
  '{"occasion": "dinner"}'::jsonb,
  3,
  0.85,
  1500,
  250,
  'gpt-4'
) ON CONFLICT DO NOTHING;
*/