-- Add profile enrichment columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname   TEXT,
  ADD COLUMN IF NOT EXISTS job_title  TEXT,
  ADD COLUMN IF NOT EXISTS theme      TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{}';

-- Storage bucket for avatars (run once, idempotent via insert on conflict)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
