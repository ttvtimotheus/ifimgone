/*
  # Expand Message Types

  1. Enhanced Message Support
    - Add support for file attachments
    - Add media recording capabilities
    - Add message templates
    - Add rich text formatting

  2. File Management
    - Create file storage buckets
    - Add file type validation
    - Add file size limits
    - Add virus scanning preparation

  3. Media Recording
    - Add audio recording metadata
    - Add video recording metadata
    - Add recording quality settings
    - Add transcription support

  4. Security
    - File access controls
    - Media encryption options
    - Content moderation flags
*/

-- Add enhanced message fields
DO $$
BEGIN
  -- Add rich content support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN content_type TEXT DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'rich_content'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN rich_content JSONB;
  END IF;

  -- Add media metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'media_duration'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN media_duration INTEGER; -- in seconds
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'media_quality'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN media_quality TEXT DEFAULT 'standard';
  END IF;

  -- Add transcription support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'has_transcription'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN has_transcription BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'transcription_text'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN transcription_text TEXT;
  END IF;

  -- Add template support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN template_id UUID;
  END IF;

  -- Add content moderation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN moderation_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'moderation_flags'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN moderation_flags JSONB;
  END IF;
END $$;

-- Enhance attachments table
DO $$
BEGIN
  -- Add file metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'file_hash'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN file_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN mime_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'thumbnail_path'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN thumbnail_path TEXT;
  END IF;

  -- Add security fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'is_encrypted'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'virus_scan_status'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN virus_scan_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'virus_scan_result'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN virus_scan_result JSONB;
  END IF;

  -- Add access control
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'access_level'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN access_level TEXT DEFAULT 'private';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN download_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attachments' AND column_name = 'last_accessed'
  ) THEN
    ALTER TABLE public.attachments ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create message templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'farewell', 'birthday', 'anniversary', 'advice', 'love', 'apology'
  content_template TEXT NOT NULL,
  rich_content_template JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recording sessions table
CREATE TABLE IF NOT EXISTS public.recording_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'audio', 'video', 'screen'
  status TEXT DEFAULT 'recording', -- 'recording', 'processing', 'completed', 'failed'
  duration INTEGER, -- in seconds
  file_size INTEGER, -- in bytes
  quality_settings JSONB,
  processing_progress INTEGER DEFAULT 0,
  error_message TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file upload sessions table
CREATE TABLE IF NOT EXISTS public.file_upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_status TEXT DEFAULT 'pending', -- 'pending', 'uploading', 'processing', 'completed', 'failed'
  upload_progress INTEGER DEFAULT 0,
  chunk_count INTEGER,
  chunks_uploaded INTEGER DEFAULT 0,
  storage_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_upload_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_templates
CREATE POLICY "Users can view public templates and own templates" 
ON public.message_templates FOR SELECT 
TO authenticated 
USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create own templates" 
ON public.message_templates FOR INSERT 
TO authenticated 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" 
ON public.message_templates FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" 
ON public.message_templates FOR DELETE 
TO authenticated 
USING (created_by = auth.uid());

-- RLS Policies for recording_sessions
CREATE POLICY "Users can manage own recording sessions" 
ON public.recording_sessions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for file_upload_sessions
CREATE POLICY "Users can manage own file upload sessions" 
ON public.file_upload_sessions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Functions for file management

-- Function to validate file type
CREATE OR REPLACE FUNCTION public.is_allowed_file_type(mime_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN mime_type IN (
    -- Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
    -- Video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    -- Documents
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file size limit by type
CREATE OR REPLACE FUNCTION public.get_file_size_limit(mime_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE 
    WHEN mime_type LIKE 'image/%' THEN RETURN 10 * 1024 * 1024; -- 10MB for images
    WHEN mime_type LIKE 'audio/%' THEN RETURN 100 * 1024 * 1024; -- 100MB for audio
    WHEN mime_type LIKE 'video/%' THEN RETURN 500 * 1024 * 1024; -- 500MB for video
    WHEN mime_type LIKE 'application/%' OR mime_type LIKE 'text/%' THEN RETURN 25 * 1024 * 1024; -- 25MB for documents
    ELSE RETURN 5 * 1024 * 1024; -- 5MB default
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create file upload session
CREATE OR REPLACE FUNCTION public.create_file_upload_session(
  p_message_id UUID,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  size_limit INTEGER;
BEGIN
  -- Validate file type
  IF NOT public.is_allowed_file_type(p_mime_type) THEN
    RAISE EXCEPTION 'File type not allowed: %', p_mime_type;
  END IF;
  
  -- Check file size
  size_limit := public.get_file_size_limit(p_mime_type);
  IF p_file_size > size_limit THEN
    RAISE EXCEPTION 'File size exceeds limit. Max size: % bytes', size_limit;
  END IF;
  
  -- Create upload session
  INSERT INTO public.file_upload_sessions (
    user_id,
    message_id,
    file_name,
    file_size,
    mime_type,
    chunk_count
  )
  VALUES (
    auth.uid(),
    p_message_id,
    p_file_name,
    p_file_size,
    p_mime_type,
    CEIL(p_file_size::float / (1024 * 1024))::integer -- 1MB chunks
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start recording session
CREATE OR REPLACE FUNCTION public.start_recording_session(
  p_message_id UUID,
  p_session_type TEXT,
  p_quality_settings JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Validate session type
  IF p_session_type NOT IN ('audio', 'video', 'screen') THEN
    RAISE EXCEPTION 'Invalid session type: %', p_session_type;
  END IF;
  
  -- Create recording session
  INSERT INTO public.recording_sessions (
    user_id,
    message_id,
    session_type,
    quality_settings
  )
  VALUES (
    auth.uid(),
    p_message_id,
    p_session_type,
    p_quality_settings
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete recording session
CREATE OR REPLACE FUNCTION public.complete_recording_session(
  p_session_id UUID,
  p_duration INTEGER,
  p_file_size INTEGER,
  p_storage_path TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.recording_sessions
  SET 
    status = 'completed',
    duration = p_duration,
    file_size = p_file_size,
    storage_path = p_storage_path,
    processing_progress = 100,
    updated_at = NOW()
  WHERE 
    id = p_session_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default message templates
INSERT INTO public.message_templates (name, description, category, content_template, is_public) VALUES
('Farewell Letter', 'A heartfelt goodbye message', 'farewell', 
'My dearest {recipient_name},

If you''re reading this, it means I''m no longer with you. I want you to know that every moment we shared was precious to me.

{personal_message}

Please remember me with joy, not sorrow. Live your life to the fullest, and know that I''ll always be watching over you.

With all my love,
{sender_name}', TRUE),

('Birthday Wishes', 'Future birthday message', 'birthday',
'Happy Birthday, {recipient_name}!

Even though I can''t be there to celebrate with you, I wanted to make sure you knew how much this day means to me.

{birthday_message}

I hope your day is filled with joy, laughter, and all the things that make you happy.

Love always,
{sender_name}', TRUE),

('Words of Wisdom', 'Life advice and guidance', 'advice',
'Dear {recipient_name},

I wanted to share some thoughts and wisdom that I hope will guide you through life.

{wisdom_content}

Remember: you are stronger than you know, braver than you feel, and more loved than you can imagine.

With love and pride,
{sender_name}', TRUE),

('Love Declaration', 'Expression of deep love', 'love',
'My beloved {recipient_name},

I need you to know how deeply and completely I love you. You have been the light of my life, my greatest joy, and my most treasured blessing.

{love_message}

This love will never fade, never diminish, and never end. It will live on in every sunset, every song, and every moment of beauty you encounter.

Forever yours,
{sender_name}', TRUE);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON public.message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_public ON public.message_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_user_id ON public.recording_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_message_id ON public.recording_sessions(message_id);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_status ON public.recording_sessions(status);
CREATE INDEX IF NOT EXISTS idx_file_upload_sessions_user_id ON public.file_upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_sessions_message_id ON public.file_upload_sessions(message_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_sessions_status ON public.file_upload_sessions(upload_status);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_allowed_file_type(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_size_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_file_upload_session(UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_recording_session(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_recording_session(UUID, INTEGER, INTEGER, TEXT) TO authenticated;

-- Update triggers
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recording_sessions_updated_at
BEFORE UPDATE ON public.recording_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_upload_sessions_updated_at
BEFORE UPDATE ON public.file_upload_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();