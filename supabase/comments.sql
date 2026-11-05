-- Run this in Supabase SQL Editor to create the comments table

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL,
    user_id UUID,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Index for faster queries by movie
CREATE INDEX IF NOT EXISTS idx_comments_movie_id ON comments (movie_id);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

-- RLS policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY IF NOT EXISTS "comments_select_all" ON comments
    FOR SELECT
    USING (true);

-- Authenticated users can insert comments
CREATE POLICY IF NOT EXISTS "comments_insert_auth" ON comments
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update their own comments
CREATE POLICY IF NOT EXISTS "comments_update_own" ON comments
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own comments
CREATE POLICY IF NOT EXISTS "comments_delete_own" ON comments
    FOR DELETE
    USING (auth.uid() = user_id);