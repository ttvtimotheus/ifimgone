-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up storage for message attachments
CREATE SCHEMA IF NOT EXISTS storage;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE message_status AS ENUM ('draft', 'scheduled', 'delivered', 'failed');
CREATE TYPE delivery_trigger AS ENUM ('manual', 'inactivity', 'date', 'location');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  inactivity_threshold INTEGER DEFAULT 30, -- Days of inactivity before triggering messages
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status message_status DEFAULT 'draft',
  trigger_type delivery_trigger DEFAULT 'inactivity',
  trigger_date TIMESTAMP WITH TIME ZONE,
  trigger_location POINT, -- Geographical coordinates
  trigger_location_radius FLOAT, -- Radius in meters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create recipients table
CREATE TABLE IF NOT EXISTS public.recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create message_recipients junction table
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.recipients(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, recipient_id)
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'email', 'phone', etc.
  status verification_status DEFAULT 'pending',
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trusted_contacts table
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  can_verify_inactivity BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inactivity_checks table
CREATE TABLE IF NOT EXISTS public.inactivity_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_required_by TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'responded', 'missed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security (RLS) policies

-- Profiles: Users can read all profiles but only update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Messages: Users can CRUD their own messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages" 
ON public.messages FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Recipients: Users can CRUD their own recipients
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own recipients" 
ON public.recipients FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Message Recipients: Users can CRUD their own message recipients
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own message recipients" 
ON public.message_recipients FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.messages WHERE id = message_id
  )
);

-- Attachments: Users can CRUD their own attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own attachments" 
ON public.attachments FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.messages WHERE id = message_id
  )
);

-- Verification Requests: Users can CRUD their own verification requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own verification requests" 
ON public.verification_requests FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Activity Logs: Users can read their own activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity logs" 
ON public.activity_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- User Settings: Users can CRUD their own settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own settings" 
ON public.user_settings FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Trusted Contacts: Users can CRUD their own trusted contacts
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trusted contacts" 
ON public.trusted_contacts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Inactivity Checks: Users can CRUD their own inactivity checks
ALTER TABLE public.inactivity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own inactivity checks" 
ON public.inactivity_checks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at
BEFORE UPDATE ON public.recipients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trusted_contacts_updated_at
BEFORE UPDATE ON public.trusted_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inactivity_checks_updated_at
BEFORE UPDATE ON public.inactivity_checks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_active = NOW()
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_active on activity
CREATE TRIGGER on_activity_log_created
AFTER INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

-- Function to check for messages that need to be delivered based on inactivity
CREATE OR REPLACE FUNCTION public.check_inactivity_messages()
RETURNS void AS $$
DECLARE
  inactive_user RECORD;
BEGIN
  -- Find users who have been inactive longer than their threshold
  FOR inactive_user IN
    SELECT p.id, p.inactivity_threshold, p.last_active
    FROM public.profiles p
    WHERE 
      NOW() - p.last_active > (p.inactivity_threshold * INTERVAL '1 day')
      AND NOT EXISTS (
        SELECT 1 FROM public.inactivity_checks ic
        WHERE ic.user_id = p.id
        AND ic.status = 'pending'
      )
  LOOP
    -- Create an inactivity check
    INSERT INTO public.inactivity_checks (
      user_id, 
      response_required_by
    )
    VALUES (
      inactive_user.id, 
      NOW() + INTERVAL '7 days'
    );
    
    -- Log the activity
    INSERT INTO public.activity_logs (
      user_id,
      action,
      details
    )
    VALUES (
      inactive_user.id,
      'inactivity_check_created',
      jsonb_build_object(
        'threshold', inactive_user.inactivity_threshold,
        'last_active', inactive_user.last_active
      )
    );
  END LOOP;
  
  -- Find inactivity checks that have expired without response
  FOR inactive_user IN
    SELECT ic.id, ic.user_id
    FROM public.inactivity_checks ic
    WHERE 
      ic.status = 'pending'
      AND NOW() > ic.response_required_by
  LOOP
    -- Update the inactivity check status
    UPDATE public.inactivity_checks
    SET status = 'missed', updated_at = NOW()
    WHERE id = inactive_user.id;
    
    -- Update messages to be delivered
    UPDATE public.messages
    SET 
      status = 'scheduled',
      updated_at = NOW()
    WHERE 
      user_id = inactive_user.user_id
      AND status = 'draft'
      AND trigger_type = 'inactivity';
    
    -- Log the activity
    INSERT INTO public.activity_logs (
      user_id,
      action,
      details
    )
    VALUES (
      inactive_user.user_id,
      'messages_scheduled_due_to_inactivity',
      jsonb_build_object(
        'inactivity_check_id', inactive_user.id
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for messages that need to be delivered based on date
CREATE OR REPLACE FUNCTION public.check_date_triggered_messages()
RETURNS void AS $$
BEGIN
  -- Update messages to be delivered if their trigger date has passed
  UPDATE public.messages
  SET 
    status = 'scheduled',
    updated_at = NOW()
  WHERE 
    status = 'draft'
    AND trigger_type = 'date'
    AND trigger_date <= NOW();
    
  -- Log the activity for each updated message
  INSERT INTO public.activity_logs (
    user_id,
    action,
    details
  )
  SELECT 
    m.user_id,
    'message_scheduled_by_date',
    jsonb_build_object(
      'message_id', m.id,
      'trigger_date', m.trigger_date
    )
  FROM public.messages m
  WHERE 
    m.status = 'scheduled'
    AND m.trigger_type = 'date'
    AND m.updated_at >= NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_trigger_type ON public.messages(trigger_type);
CREATE INDEX IF NOT EXISTS idx_messages_trigger_date ON public.messages(trigger_date);
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON public.recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_checks_user_id ON public.inactivity_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_checks_status ON public.inactivity_checks(status);
