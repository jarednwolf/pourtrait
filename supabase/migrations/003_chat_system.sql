-- ============================================================================
-- Chat System Database Schema
-- Migration for conversational AI sommelier interface
-- ============================================================================

-- ============================================================================
-- Chat Interactions Table
-- ============================================================================

CREATE TABLE chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL CHECK (length(user_message) > 0 AND length(user_message) <= 2000),
  ai_response TEXT NOT NULL CHECK (length(ai_response) > 0 AND length(ai_response) <= 5000),
  context JSONB DEFAULT '{}'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  response_time INTEGER DEFAULT 0, -- milliseconds
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4-turbo-preview',
  validation_passed BOOLEAN DEFAULT true,
  validation_errors TEXT[],
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Chat Conversations Table (for grouping related messages)
-- ============================================================================

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT CHECK (length(title) <= 200),
  context_summary JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Chat Feedback Table (for improving AI responses)
-- ============================================================================

CREATE TABLE chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_interaction_id UUID NOT NULL REFERENCES chat_interactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate', 'inaccurate')),
  feedback_details TEXT CHECK (length(feedback_details) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Chat interactions indexes
CREATE INDEX idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX idx_chat_interactions_conversation_id ON chat_interactions(conversation_id);
CREATE INDEX idx_chat_interactions_created_at ON chat_interactions(created_at);
CREATE INDEX idx_chat_interactions_confidence ON chat_interactions(confidence);
CREATE INDEX idx_chat_interactions_experience_level ON chat_interactions(experience_level);

-- Chat conversations indexes
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);
CREATE INDEX idx_chat_conversations_created_at ON chat_conversations(created_at);

-- Chat feedback indexes
CREATE INDEX idx_chat_feedback_interaction_id ON chat_feedback(chat_interaction_id);
CREATE INDEX idx_chat_feedback_user_id ON chat_feedback(user_id);
CREATE INDEX idx_chat_feedback_type ON chat_feedback(feedback_type);
CREATE INDEX idx_chat_feedback_created_at ON chat_feedback(created_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- Chat interactions policies
CREATE POLICY "Users can view own chat interactions" ON chat_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat interactions" ON chat_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat conversations policies
CREATE POLICY "Users can manage own chat conversations" ON chat_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Chat feedback policies
CREATE POLICY "Users can manage own chat feedback" ON chat_feedback
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Functions for Chat Management
-- ============================================================================

-- Function to update conversation metadata when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create conversation record
  INSERT INTO chat_conversations (id, user_id, message_count, last_message_at, updated_at)
  VALUES (NEW.conversation_id, NEW.user_id, 1, NEW.created_at, NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET
    message_count = chat_conversations.message_count + 1,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at;
  
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation metadata
CREATE TRIGGER update_conversation_on_chat_message
  AFTER INSERT ON chat_interactions
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Function to generate conversation title from first message
CREATE OR REPLACE FUNCTION generate_conversation_title(conversation_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  first_message TEXT;
  title TEXT;
BEGIN
  -- Get the first user message in the conversation
  SELECT user_message INTO first_message
  FROM chat_interactions
  WHERE conversation_id = conversation_uuid
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF first_message IS NULL THEN
    RETURN 'New Conversation';
  END IF;
  
  -- Generate a title from the first 50 characters
  title := LEFT(first_message, 50);
  
  -- Add ellipsis if truncated
  IF LENGTH(first_message) > 50 THEN
    title := title || '...';
  END IF;
  
RETURN title;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation history with context
CREATE OR REPLACE FUNCTION get_conversation_history(
  target_user_id UUID,
  conversation_uuid UUID,
  message_limit INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'user_message', user_message,
      'ai_response', ai_response,
      'confidence', confidence,
      'experience_level', experience_level,
      'created_at', created_at
    ) ORDER BY created_at ASC
  ) INTO result
  FROM (
    SELECT *
    FROM chat_interactions
    WHERE user_id = target_user_id 
      AND conversation_id = conversation_uuid
    ORDER BY created_at DESC
    LIMIT message_limit
  ) AS recent_messages;
  
RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent conversations
CREATE OR REPLACE FUNCTION get_user_conversations(
  target_user_id UUID,
  conversation_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'title', COALESCE(c.title, generate_conversation_title(c.id)),
      'message_count', c.message_count,
      'last_message_at', c.last_message_at,
      'created_at', c.created_at,
      'preview', (
        SELECT user_message
        FROM chat_interactions ci
        WHERE ci.conversation_id = c.id
        ORDER BY ci.created_at DESC
        LIMIT 1
      )
    ) ORDER BY c.last_message_at DESC
  ) INTO result
  FROM chat_conversations c
  WHERE c.user_id = target_user_id
  ORDER BY c.last_message_at DESC
  LIMIT conversation_limit;
  
RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- View for chat analytics by user
CREATE VIEW chat_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT conversation_id) as total_conversations,
  AVG(confidence) as average_confidence,
  AVG(response_time) as average_response_time,
  SUM(tokens_used) as total_tokens_used,
  COUNT(CASE WHEN validation_passed = false THEN 1 END) as validation_failures,
  DATE_TRUNC('day', created_at) as interaction_date
FROM chat_interactions
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- View for experience level distribution
CREATE VIEW chat_experience_distribution AS
SELECT 
  experience_level,
  COUNT(*) as interaction_count,
  AVG(confidence) as average_confidence,
  AVG(response_time) as average_response_time
FROM chat_interactions
WHERE experience_level IS NOT NULL
GROUP BY experience_level;

-- ============================================================================
-- Sample Data for Development (Optional)
-- ============================================================================

-- This section can be uncommented for development/testing
/*
-- Insert sample conversation
INSERT INTO chat_conversations (id, user_id, title, message_count, last_message_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'Wine recommendations for dinner',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert sample chat interaction
INSERT INTO chat_interactions (
  user_id, 
  conversation_id, 
  user_message, 
  ai_response, 
  confidence, 
  experience_level,
  tokens_used
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'What wine should I pair with grilled salmon?',
  'For grilled salmon, I recommend a crisp Sauvignon Blanc or a light Pinot Noir. The citrusy acidity of Sauvignon Blanc complements the fish beautifully, while a light Pinot Noir can enhance the smoky flavors from grilling.',
  0.87,
  'intermediate',
  145
) ON CONFLICT DO NOTHING;
*/