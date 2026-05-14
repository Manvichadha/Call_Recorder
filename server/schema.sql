-- CallVault Supabase Schema
-- Paste this into your Supabase SQL Editor and click "Run"

-- 1. Create Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Recordings Table
CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT, -- In case contact is deleted or unknown
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    duration_seconds INTEGER,
    file_url TEXT,
    file_size_bytes BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transcribed', 'analyzed', 'error')),
    transcript_text TEXT,
    summary TEXT,
    sentiment TEXT,
    action_items JSONB,
    topics JSONB,
    assembly_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS)

-- Enable RLS on both tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Policies for Contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their own contacts" 
ON public.contacts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
CREATE POLICY "Users can insert their own contacts" 
ON public.contacts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their own contacts" 
ON public.contacts FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their own contacts" 
ON public.contacts FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for Recordings
DROP POLICY IF EXISTS "Users can view their own recordings" ON public.recordings;
CREATE POLICY "Users can view their own recordings" 
ON public.recordings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recordings" ON public.recordings;
CREATE POLICY "Users can insert their own recordings" 
ON public.recordings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recordings" ON public.recordings;
CREATE POLICY "Users can update their own recordings" 
ON public.recordings FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recordings" ON public.recordings;
CREATE POLICY "Users can delete their own recordings" 
ON public.recordings FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Storage Bucket Policy (Requires 'recordings' bucket to exist)
-- IMPORTANT: Make sure you created a public bucket named 'recordings' in the Supabase Dashboard.
-- These policies allow authenticated users to upload and read their own files.

DROP POLICY IF EXISTS "Give users access to own folder 1qazxsw" ON storage.objects;
CREATE POLICY "Give users access to own folder 1qazxsw" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Give users upload access to own folder 1qazxsw" ON storage.objects;
CREATE POLICY "Give users upload access to own folder 1qazxsw" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Give users update access to own folder 1qazxsw" ON storage.objects;
CREATE POLICY "Give users update access to own folder 1qazxsw" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Give users delete access to own folder 1qazxsw" ON storage.objects;
CREATE POLICY "Give users delete access to own folder 1qazxsw" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
