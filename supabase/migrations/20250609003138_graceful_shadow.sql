-- Create storage buckets for the application
-- This migration creates the necessary storage buckets for file uploads

-- Create message-media bucket for audio/video recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media',
  'message-media',
  false,
  524288000, -- 500MB
  ARRAY[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/webm',
    'video/mp4',
    'video/quicktime',
    'video/ogg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create attachments bucket for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for message-media bucket
CREATE POLICY "Users can upload own media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own media files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for attachments bucket
CREATE POLICY "Users can upload own attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);