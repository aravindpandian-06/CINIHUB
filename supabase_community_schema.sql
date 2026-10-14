-- ==============================================================================
-- CINIHUB Community Database Schema Migration
-- Features: Movie Discussions, Comments, Recommendations, and Likes
-- ==============================================================================

-- 1. Movie Discussions Table
CREATE TABLE IF NOT EXISTS public.movie_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Movie Talk',
    movie_id BIGINT,
    movie_title TEXT,
    movie_poster TEXT,
    movie_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Discussion Comments Table
CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES public.movie_discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Discussion Likes Table (Enforces unique user-discussion pairs)
CREATE TABLE IF NOT EXISTS public.discussion_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES public.movie_discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(discussion_id, user_id)
);

-- 4. Movie Recommendations Table
CREATE TABLE IF NOT EXISTS public.movie_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id BIGINT NOT NULL,
    movie_title TEXT NOT NULL,
    movie_poster TEXT,
    movie_year TEXT,
    category TEXT NOT NULL DEFAULT 'Underrated Gems',
    recommendation_text TEXT NOT NULL,
    mood TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Recommendation Likes Table (Enforces unique user-recommendation pairs)
CREATE TABLE IF NOT EXISTS public.recommendation_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.movie_recommendations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(recommendation_id, user_id)
);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================

-- Enable RLS on all community tables
ALTER TABLE public.movie_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_likes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. Read Policies: Publicly readable for all cinema enthusiasts
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on movie_discussions" ON public.movie_discussions;
CREATE POLICY "Allow public read on movie_discussions"
    ON public.movie_discussions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read on discussion_comments" ON public.discussion_comments;
CREATE POLICY "Allow public read on discussion_comments"
    ON public.discussion_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read on discussion_likes" ON public.discussion_likes;
CREATE POLICY "Allow public read on discussion_likes"
    ON public.discussion_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read on movie_recommendations" ON public.movie_recommendations;
CREATE POLICY "Allow public read on movie_recommendations"
    ON public.movie_recommendations FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read on recommendation_likes" ON public.recommendation_likes;
CREATE POLICY "Allow public read on recommendation_likes"
    ON public.recommendation_likes FOR SELECT
    USING (true);

-- ------------------------------------------------------------------------------
-- B. Insert Policies: Authenticated users can insert their own records
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.movie_discussions;
CREATE POLICY "Authenticated users can create discussions"
    ON public.movie_discussions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.discussion_comments;
CREATE POLICY "Authenticated users can create comments"
    ON public.discussion_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can like discussions" ON public.discussion_likes;
CREATE POLICY "Authenticated users can like discussions"
    ON public.discussion_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create recommendations" ON public.movie_recommendations;
CREATE POLICY "Authenticated users can create recommendations"
    ON public.movie_recommendations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can like recommendations" ON public.recommendation_likes;
CREATE POLICY "Authenticated users can like recommendations"
    ON public.recommendation_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- C. Update Policies: Only content owners can update their own content
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own discussions" ON public.movie_discussions;
CREATE POLICY "Users can update their own discussions"
    ON public.movie_discussions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.discussion_comments;
CREATE POLICY "Users can update their own comments"
    ON public.discussion_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.movie_recommendations;
CREATE POLICY "Users can update their own recommendations"
    ON public.movie_recommendations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- D. Delete Policies: Only content owners can delete their own records
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete their own discussions" ON public.movie_discussions;
CREATE POLICY "Users can delete their own discussions"
    ON public.movie_discussions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.discussion_comments;
CREATE POLICY "Users can delete their own comments"
    ON public.discussion_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own discussion likes" ON public.discussion_likes;
CREATE POLICY "Users can remove their own discussion likes"
    ON public.discussion_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.movie_recommendations;
CREATE POLICY "Users can delete their own recommendations"
    ON public.movie_recommendations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own recommendation likes" ON public.recommendation_likes;
CREATE POLICY "Users can remove their own recommendation likes"
    ON public.recommendation_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_movie_discussions_user_id ON public.movie_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_discussions_movie_id ON public.movie_discussions(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_discussions_category ON public.movie_discussions(category);
CREATE INDEX IF NOT EXISTS idx_movie_discussions_created_at ON public.movie_discussions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_disc_id ON public.discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON public.discussion_comments(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_discussion_likes_disc_id ON public.discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON public.discussion_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_recommendations_user_id ON public.movie_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_recommendations_movie_id ON public.movie_recommendations(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_recommendations_category ON public.movie_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_movie_recommendations_created_at ON public.movie_recommendations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_likes_rec_id ON public.recommendation_likes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_likes_user_id ON public.recommendation_likes(user_id);

-- ==============================================================================
-- FEATURE: COMMUNITY PICKS - MONTHLY CINEPHILE AWARDS
-- ==============================================================================

-- 6. Community Awards Table
CREATE TABLE IF NOT EXISTS public.community_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL, -- e.g. "October", "September"
    year INT NOT NULL DEFAULT 2026,
    category TEXT NOT NULL, -- e.g. "CINIHUB Movie of the Month", "Best Screenplay", etc.
    title TEXT NOT NULL,
    award_type TEXT NOT NULL DEFAULT 'community_voted', -- 'community_voted' or 'editorial_choice'
    recipient_type TEXT NOT NULL DEFAULT 'movie', -- 'movie', 'user', 'discussion', 'recommendation'
    movie_id BIGINT,
    movie_title TEXT,
    movie_poster TEXT,
    movie_year TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_avatar TEXT,
    criteria TEXT NOT NULL,
    reason TEXT,
    votes_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Community Award Votes Table (Enforces unique user-award vote pair)
CREATE TABLE IF NOT EXISTS public.community_award_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID NOT NULL REFERENCES public.community_awards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(award_id, user_id)
);

-- RLS for Awards & Votes
ALTER TABLE public.community_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_award_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on community_awards" ON public.community_awards;
CREATE POLICY "Allow public read on community_awards"
    ON public.community_awards FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read on community_award_votes" ON public.community_award_votes;
CREATE POLICY "Allow public read on community_award_votes"
    ON public.community_award_votes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote on awards" ON public.community_award_votes;
CREATE POLICY "Authenticated users can vote on awards"
    ON public.community_award_votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their award votes" ON public.community_award_votes;
CREATE POLICY "Users can remove their award votes"
    ON public.community_award_votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage awards" ON public.community_awards;
CREATE POLICY "Authenticated users can manage awards"
    ON public.community_awards FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_community_awards_month_year ON public.community_awards(month, year);
CREATE INDEX IF NOT EXISTS idx_community_awards_category ON public.community_awards(category);
CREATE INDEX IF NOT EXISTS idx_community_award_votes_award_id ON public.community_award_votes(award_id);
CREATE INDEX IF NOT EXISTS idx_community_award_votes_user_id ON public.community_award_votes(user_id);

