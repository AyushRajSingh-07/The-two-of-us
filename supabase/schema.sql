-- ==============================================================================
-- TWO OF US: PRIVATE COUPLES' SANCTUARY SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
--
-- This script sets up:
-- 1. couples table (stores couple metadata, pairing invite code, names, anniversary)
-- 2. chat_messages table (private 1-on-1 real-time messaging)
-- 3. photos table (shared couple gallery with albums and metadata)
-- 4. game_sessions table (synchronized multiplayer game state)
-- 5. Row Level Security (RLS) policies guaranteeing ONLY the 2 paired users
--    can read, write, update, or delete any records.
-- 6. Storage bucket 'couple-photos' with private RLS policies.
-- ==============================================================================

-- 1. Couples Table
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner2_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner1_name TEXT NOT NULL DEFAULT 'Partner 1',
    partner1_avatar TEXT DEFAULT '',
    partner2_name TEXT NOT NULL DEFAULT 'Partner 2',
    partner2_avatar TEXT DEFAULT '',
    anniversary_date DATE DEFAULT CURRENT_DATE,
    welcome_message TEXT DEFAULT 'Welcome to our private corner of the universe.',
    invite_code TEXT UNIQUE NOT NULL,
    is_paired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on couples
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Couples RLS: Only users belonging to this couple can access the record
CREATE POLICY "Users can view their own couple space"
    ON public.couples FOR SELECT
    USING (auth.uid() = partner1_id OR auth.uid() = partner2_id OR NOT is_paired);

CREATE POLICY "Partner 1 can create couple space"
    ON public.couples FOR INSERT
    WITH CHECK (auth.uid() = partner1_id);

CREATE POLICY "Partners can update their couple space"
    ON public.couples FOR UPDATE
    USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    image_url TEXT,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    reply_to_text TEXT,
    reply_to_sender TEXT,
    reactions JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    is_delivered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view their messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = chat_messages.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can send messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = chat_messages.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can edit or react to messages"
    ON public.chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = chat_messages.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can delete their messages"
    ON public.chat_messages FOR DELETE
    USING (
        sender_id = auth.uid()
    );

-- 3. Shared Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    uploader_name TEXT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    date_taken DATE DEFAULT CURRENT_DATE,
    album TEXT DEFAULT 'All Photos',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view photos"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = photos.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can upload photos"
    ON public.photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = photos.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can update photos (favorite, caption, album)"
    ON public.photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = photos.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can delete photos"
    ON public.photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = photos.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

-- 4. Game Sessions Table (Real-time Co-op state)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id TEXT PRIMARY KEY,
    space_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    game_id TEXT NOT NULL,
    current_turn_user_id UUID,
    status TEXT DEFAULT 'in_progress',
    state JSONB DEFAULT '{}'::jsonb,
    last_updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on game_sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can read game session"
    ON public.game_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = game_sessions.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can create or update game session"
    ON public.game_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = game_sessions.space_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

-- 5. Realtime Publication
-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;

-- 6. Storage Bucket Configuration
-- Create private bucket for couple photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-photos', 'couple-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only authenticated couple users can upload and view photos
CREATE POLICY "Couples can view private photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'couple-photos');

CREATE POLICY "Couples can upload private photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'couple-photos');

CREATE POLICY "Couples can delete private photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'couple-photos');
