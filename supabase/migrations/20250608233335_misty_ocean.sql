/*
  # Security Enhancements

  1. Two-Factor Authentication
    - Add 2FA settings to user profiles
    - Create 2FA backup codes table
    - Add 2FA verification tracking

  2. Enhanced Security Logging
    - Expand activity logs for security events
    - Add login attempt tracking
    - Add device fingerprinting

  3. Message Security
    - Add encryption status tracking
    - Add access control for sensitive messages
    - Add message viewing logs

  4. Security Policies
    - Enhanced RLS policies
    - Rate limiting preparation
    - Security event triggers
*/

-- Add 2FA fields to profiles
DO $$
BEGIN
  -- Add two-factor authentication fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_secret'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_secret TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'backup_codes_generated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN backup_codes_generated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add security tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_password_change'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_locked_until'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create 2FA backup codes table
CREATE TABLE IF NOT EXISTS public.backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create login attempts table for security monitoring
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  location_country TEXT,
  location_city TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'password_change', 'email_change', '2fa_enabled', 'suspicious_login', etc.
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message access logs table
CREATE TABLE IF NOT EXISTS public.message_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  accessed_by_email TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'download', 'share'
  ip_address INET,
  user_agent TEXT,
  pin_required BOOLEAN DEFAULT FALSE,
  pin_attempts INTEGER DEFAULT 0,
  access_granted BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add encryption and security fields to messages
DO $$
BEGIN
  -- Add message encryption status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_encrypted'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'encryption_key_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN encryption_key_id TEXT;
  END IF;

  -- Add PIN protection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'pin_hash'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN pin_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'max_pin_attempts'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN max_pin_attempts INTEGER DEFAULT 3;
  END IF;

  -- Add access control
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'requires_verification'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN requires_verification BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'self_destruct_after_read'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN self_destruct_after_read BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backup_codes
CREATE POLICY "Users can manage own backup codes" 
ON public.backup_codes FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for login_attempts
CREATE POLICY "Users can view own login attempts" 
ON public.login_attempts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for security_events
CREATE POLICY "Users can view own security events" 
ON public.security_events FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for message_access_logs
CREATE POLICY "Users can view access logs for own messages" 
ON public.message_access_logs FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.messages WHERE id = message_id
  )
);

-- Security Functions

-- Function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  attempt_id UUID;
  user_record RECORD;
BEGIN
  -- Get user info if login was successful
  IF p_success THEN
    SELECT id INTO user_record FROM public.profiles WHERE email = p_email;
  END IF;

  -- Insert login attempt
  INSERT INTO public.login_attempts (
    user_id,
    email,
    ip_address,
    user_agent,
    success,
    failure_reason
  )
  VALUES (
    user_record.id,
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason
  )
  RETURNING id INTO attempt_id;

  -- Update failed login attempts counter
  IF NOT p_success AND user_record.id IS NOT NULL THEN
    UPDATE public.profiles 
    SET 
      failed_login_attempts = failed_login_attempts + 1,
      account_locked_until = CASE 
        WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
        ELSE account_locked_until
      END
    WHERE id = user_record.id;
  ELSIF p_success AND user_record.id IS NOT NULL THEN
    -- Reset failed attempts on successful login
    UPDATE public.profiles 
    SET 
      failed_login_attempts = 0,
      account_locked_until = NULL,
      last_active = NOW()
    WHERE id = user_record.id;
  END IF;

  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log message access
CREATE OR REPLACE FUNCTION public.log_message_access(
  p_message_id UUID,
  p_accessed_by_email TEXT,
  p_access_type TEXT,
  p_access_granted BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_pin_required BOOLEAN DEFAULT FALSE,
  p_pin_attempts INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.message_access_logs (
    message_id,
    accessed_by_email,
    access_type,
    ip_address,
    user_agent,
    pin_required,
    pin_attempts,
    access_granted
  )
  VALUES (
    p_message_id,
    p_accessed_by_email,
    p_access_type,
    p_ip_address,
    p_user_agent,
    p_pin_required,
    p_pin_attempts,
    p_access_granted
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION public.generate_backup_codes(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  codes TEXT[];
  code TEXT;
  i INTEGER;
BEGIN
  -- Delete existing backup codes
  DELETE FROM public.backup_codes WHERE user_id = p_user_id;
  
  -- Generate 10 backup codes
  FOR i IN 1..10 LOOP
    -- Generate a random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    codes := array_append(codes, code);
    
    -- Store hashed version
    INSERT INTO public.backup_codes (user_id, code_hash)
    VALUES (p_user_id, crypt(code, gen_salt('bf')));
  END LOOP;
  
  -- Update backup codes generation timestamp
  UPDATE public.profiles 
  SET backup_codes_generated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify backup code
CREATE OR REPLACE FUNCTION public.verify_backup_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find matching unused backup code
  SELECT * INTO code_record
  FROM public.backup_codes
  WHERE 
    user_id = p_user_id
    AND used_at IS NULL
    AND code_hash = crypt(p_code, code_hash);
  
  IF FOUND THEN
    -- Mark code as used
    UPDATE public.backup_codes
    SET used_at = NOW()
    WHERE id = code_record.id;
    
    -- Log security event
    PERFORM public.log_security_event(
      p_user_id,
      'backup_code_used',
      'info',
      jsonb_build_object('code_id', code_record.id)
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT account_locked_until INTO profile_record
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF FOUND AND profile_record.account_locked_until IS NOT NULL THEN
    RETURN profile_record.account_locked_until > NOW();
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log profile changes as security events
CREATE OR REPLACE FUNCTION public.log_profile_security_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    PERFORM public.log_security_event(
      NEW.id,
      'email_changed',
      'warning',
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email
      )
    );
  END IF;
  
  -- Log 2FA status changes
  IF OLD.two_factor_enabled IS DISTINCT FROM NEW.two_factor_enabled THEN
    PERFORM public.log_security_event(
      NEW.id,
      CASE WHEN NEW.two_factor_enabled THEN '2fa_enabled' ELSE '2fa_disabled' END,
      'info',
      jsonb_build_object('enabled', NEW.two_factor_enabled)
    );
  END IF;
  
  -- Log phone changes
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    PERFORM public.log_security_event(
      NEW.id,
      'phone_changed',
      'info',
      jsonb_build_object(
        'old_phone', OLD.phone,
        'new_phone', NEW.phone
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile security logging
DROP TRIGGER IF EXISTS log_profile_security_changes_trigger ON public.profiles;
CREATE TRIGGER log_profile_security_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_security_changes();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_login_attempt(TEXT, BOOLEAN, INET, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, JSONB, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_message_access(UUID, TEXT, TEXT, BOOLEAN, INET, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_backup_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_account_locked(UUID) TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON public.backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used_at ON public.backup_codes(used_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_message_access_logs_message_id ON public.message_access_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_message_access_logs_accessed_by ON public.message_access_logs(accessed_by_email);