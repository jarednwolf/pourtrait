-- Migration for data export and sharing functionality
-- This adds support for shared collections and export tracking

-- Create shared_collections table
CREATE TABLE IF NOT EXISTS shared_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    wines JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT false,
    share_token TEXT UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_collections_share_token ON shared_collections(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_collections_user_id ON shared_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_collections_is_public ON shared_collections(is_public);

-- Create export_logs table to track data exports (for analytics/compliance)
CREATE TABLE IF NOT EXISTS export_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json', 'pdf', 'backup')),
    export_options JSONB DEFAULT '{}'::jsonb,
    file_size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on export_logs for analytics
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON export_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_export_logs_export_type ON export_logs(export_type);

-- Row Level Security (RLS) policies

-- Enable RLS on shared_collections
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own shared collections
CREATE POLICY "Users can view own shared collections" ON shared_collections
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create their own shared collections
CREATE POLICY "Users can create own shared collections" ON shared_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own shared collections
CREATE POLICY "Users can update own shared collections" ON shared_collections
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own shared collections
CREATE POLICY "Users can delete own shared collections" ON shared_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Public access policy for shared collections (for viewing shared collections)
CREATE POLICY "Public can view shared collections by token" ON shared_collections
    FOR SELECT USING (true); -- This will be handled by application logic

-- Enable RLS on export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own export logs
CREATE POLICY "Users can view own export logs" ON export_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create their own export logs
CREATE POLICY "Users can create own export logs" ON export_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for shared_collections updated_at
CREATE TRIGGER update_shared_collections_updated_at
    BEFORE UPDATE ON shared_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON shared_collections TO authenticated;
GRANT ALL ON export_logs TO authenticated;

-- Create view for public shared collections (optional, for future public gallery)
CREATE OR REPLACE VIEW public_shared_collections AS
SELECT 
    id,
    title,
    description,
    wines,
    share_token,
    view_count,
    created_at,
    updated_at
FROM shared_collections 
WHERE is_public = true;

-- Grant select on public view
GRANT SELECT ON public_shared_collections TO anon, authenticated;