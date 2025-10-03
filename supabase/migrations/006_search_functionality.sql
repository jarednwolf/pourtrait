-- Migration for search functionality
-- Adds saved searches and search history tables

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_default ON saved_searches(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- Add full-text search indexes on wines table for better search performance
CREATE INDEX IF NOT EXISTS idx_wines_name_gin ON wines USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_wines_producer_gin ON wines USING gin(to_tsvector('english', producer));
CREATE INDEX IF NOT EXISTS idx_wines_region_gin ON wines USING gin(to_tsvector('english', region));
CREATE INDEX IF NOT EXISTS idx_wines_notes_gin ON wines USING gin(to_tsvector('english', COALESCE(personal_notes, '')));

-- Add composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_wines_user_type ON wines(user_id, type);
CREATE INDEX IF NOT EXISTS idx_wines_user_region ON wines(user_id, region);
CREATE INDEX IF NOT EXISTS idx_wines_user_vintage ON wines(user_id, vintage);
CREATE INDEX IF NOT EXISTS idx_wines_user_rating ON wines(user_id, personal_rating) WHERE personal_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wines_user_price ON wines(user_id, purchase_price) WHERE purchase_price IS NOT NULL;

-- Add GIN index for varietal array searches
CREATE INDEX IF NOT EXISTS idx_wines_varietal_gin ON wines USING gin(varietal);

-- Create a function to calculate drinking window status
CREATE OR REPLACE FUNCTION get_drinking_window_status(drinking_window JSONB)
RETURNS TEXT AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    earliest_date DATE;
    peak_start_date DATE;
    peak_end_date DATE;
    latest_date DATE;
BEGIN
    -- Extract dates from JSONB
    earliest_date := (drinking_window->>'earliestDate')::DATE;
    peak_start_date := (drinking_window->>'peakStartDate')::DATE;
    peak_end_date := (drinking_window->>'peakEndDate')::DATE;
    latest_date := (drinking_window->>'latestDate')::DATE;
    
    -- Return current status if already calculated
    IF drinking_window->>'currentStatus' IS NOT NULL THEN
        RETURN drinking_window->>'currentStatus';
    END IF;
    
    -- Calculate status based on dates
    IF earliest_date IS NULL OR peak_start_date IS NULL THEN
        RETURN 'ready'; -- Default status
    END IF;
    
    IF current_date < earliest_date THEN
        RETURN 'too_young';
    ELSIF current_date >= earliest_date AND current_date < peak_start_date THEN
        RETURN 'ready';
    ELSIF current_date >= peak_start_date AND (peak_end_date IS NULL OR current_date <= peak_end_date) THEN
        RETURN 'peak';
    ELSIF peak_end_date IS NOT NULL AND current_date > peak_end_date AND (latest_date IS NULL OR current_date <= latest_date) THEN
        RETURN 'declining';
    ELSIF latest_date IS NOT NULL AND current_date > latest_date THEN
        RETURN 'over_hill';
    ELSE
        RETURN 'ready';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view for wines with calculated drinking window status
CREATE OR REPLACE VIEW wines_with_search_data AS
SELECT 
    w.*,
    get_drinking_window_status(w.drinking_window) as calculated_status,
    to_tsvector('english', 
        COALESCE(w.name, '') || ' ' ||
        COALESCE(w.producer, '') || ' ' ||
        COALESCE(w.region, '') || ' ' ||
        COALESCE(w.country, '') || ' ' ||
        COALESCE(w.personal_notes, '') || ' ' ||
        COALESCE(array_to_string(w.varietal, ' '), '')
    ) as search_vector
FROM wines w;

-- Add RLS policies for saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches" ON saved_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON saved_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for search_history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to clean old search history (keep last 100 searches per user)
CREATE OR REPLACE FUNCTION cleanup_search_history()
RETURNS void AS $$
BEGIN
    DELETE FROM search_history 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY searched_at DESC) as rn
            FROM search_history
        ) ranked
        WHERE rn <= 100
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on saved_searches
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE saved_searches IS 'User-saved search filters for quick access';
COMMENT ON TABLE search_history IS 'History of user searches for analytics and suggestions';
COMMENT ON FUNCTION get_drinking_window_status IS 'Calculates current drinking window status from JSONB data';
COMMENT ON VIEW wines_with_search_data IS 'Wines with calculated search data and full-text search vectors';