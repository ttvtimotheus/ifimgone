/*
  # Trusted Contacts System

  1. New Tables
    - `trusted_contacts` - Store trusted contact information
    - `contact_verification_requests` - Track verification requests
    - `inactivity_verification_requests` - Handle inactivity verification
    - `message_release_requests` - Manage message release requests

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
    - Add verification and permission checks

  3. Functions
    - Contact management functions
    - Verification workflow functions
    - Emergency notification functions
*/

-- Create trusted_contacts table (enhanced version)
DO $$
BEGIN
  -- Drop existing table if it exists to recreate with new structure
  DROP TABLE IF EXISTS public.trusted_contacts CASCADE;
  
  CREATE TABLE public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    relationship TEXT,
    can_verify_inactivity BOOLEAN DEFAULT FALSE,
    can_release_messages BOOLEAN DEFAULT FALSE,
    can_manage_account BOOLEAN DEFAULT FALSE,
    emergency_contact BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'verified'
    verification_token TEXT,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email)
  );
END $$;

-- Create contact_verification_requests table
CREATE TABLE IF NOT EXISTS public.contact_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.trusted_contacts(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create inactivity_verification_requests table
CREATE TABLE IF NOT EXISTS public.inactivity_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.trusted_contacts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'denied', 'expired'
  message TEXT NOT NULL,
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create message_release_requests table
CREATE TABLE IF NOT EXISTS public.message_release_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.trusted_contacts(id) ON DELETE CASCADE NOT NULL,
  message_ids UUID[] NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS on all new tables
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inactivity_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_release_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trusted_contacts
CREATE POLICY "Users can manage own trusted contacts" 
ON public.trusted_contacts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for contact_verification_requests
CREATE POLICY "Users can view own verification requests" 
ON public.contact_verification_requests FOR SELECT 
TO authenticated 
USING (
  contact_id IN (
    SELECT id FROM public.trusted_contacts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage verification requests" 
ON public.contact_verification_requests FOR ALL 
TO authenticated 
USING (true);

-- RLS Policies for inactivity_verification_requests
CREATE POLICY "Users can view own inactivity verifications" 
ON public.inactivity_verification_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Contacts can respond to inactivity verifications" 
ON public.inactivity_verification_requests FOR UPDATE 
TO authenticated 
USING (
  contact_id IN (
    SELECT id FROM public.trusted_contacts 
    WHERE email = auth.email() AND verification_status = 'verified'
  )
);

-- RLS Policies for message_release_requests
CREATE POLICY "Users can view own release requests" 
ON public.message_release_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Contacts can manage release requests" 
ON public.message_release_requests FOR ALL 
TO authenticated 
USING (
  contact_id IN (
    SELECT id FROM public.trusted_contacts 
    WHERE email = auth.email() AND verification_status = 'verified'
  )
);

-- Functions for trusted contact management

-- Function to add trusted contact with validation
CREATE OR REPLACE FUNCTION public.add_trusted_contact(
  p_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_relationship TEXT DEFAULT NULL,
  p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  contact_id UUID;
  verification_token TEXT;
BEGIN
  -- Validate email format
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check if contact already exists
  IF EXISTS (
    SELECT 1 FROM public.trusted_contacts 
    WHERE user_id = p_user_id AND email = p_email
  ) THEN
    RAISE EXCEPTION 'Contact with this email already exists';
  END IF;
  
  -- Generate verification token
  verification_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert trusted contact
  INSERT INTO public.trusted_contacts (
    user_id,
    name,
    email,
    phone,
    relationship,
    can_verify_inactivity,
    can_release_messages,
    can_manage_account,
    emergency_contact,
    verification_token
  )
  VALUES (
    p_user_id,
    p_name,
    p_email,
    p_phone,
    p_relationship,
    COALESCE((p_permissions->>'can_verify_inactivity')::boolean, false),
    COALESCE((p_permissions->>'can_release_messages')::boolean, false),
    COALESCE((p_permissions->>'can_manage_account')::boolean, false),
    COALESCE((p_permissions->>'emergency_contact')::boolean, false),
    verification_token
  )
  RETURNING id INTO contact_id;
  
  RETURN contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify trusted contact
CREATE OR REPLACE FUNCTION public.verify_trusted_contact(
  p_verification_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  contact_record RECORD;
BEGIN
  -- Find contact by verification token
  SELECT * INTO contact_record
  FROM public.trusted_contacts
  WHERE verification_token = p_verification_token
    AND verification_status = 'unverified';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update contact as verified
  UPDATE public.trusted_contacts
  SET 
    verification_status = 'verified',
    last_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = contact_record.id;
  
  -- Log the verification
  INSERT INTO public.activity_logs (
    user_id,
    action,
    details
  )
  VALUES (
    contact_record.user_id,
    'trusted_contact_verified',
    jsonb_build_object(
      'contact_id', contact_record.id,
      'contact_email', contact_record.email
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get emergency contacts
CREATE OR REPLACE FUNCTION public.get_emergency_contacts(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.name,
    tc.email,
    tc.phone,
    tc.relationship
  FROM public.trusted_contacts tc
  WHERE tc.user_id = p_user_id
    AND tc.emergency_contact = true
    AND tc.verification_status = 'verified'
  ORDER BY tc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request inactivity verification
CREATE OR REPLACE FUNCTION public.request_inactivity_verification(
  p_user_id UUID,
  p_message TEXT DEFAULT 'Please confirm if this person is inactive or unreachable'
)
RETURNS INTEGER AS $$
DECLARE
  contact_record RECORD;
  requests_created INTEGER := 0;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set expiration to 3 days from now
  expires_at := NOW() + INTERVAL '3 days';
  
  -- Create verification requests for all eligible contacts
  FOR contact_record IN
    SELECT id, name, email
    FROM public.trusted_contacts
    WHERE user_id = p_user_id
      AND verification_status = 'verified'
      AND can_verify_inactivity = true
  LOOP
    INSERT INTO public.inactivity_verification_requests (
      user_id,
      contact_id,
      message,
      expires_at
    )
    VALUES (
      p_user_id,
      contact_record.id,
      p_message,
      expires_at
    );
    
    requests_created := requests_created + 1;
  END LOOP;
  
  -- Log the activity
  IF requests_created > 0 THEN
    INSERT INTO public.activity_logs (
      user_id,
      action,
      details
    )
    VALUES (
      p_user_id,
      'inactivity_verification_requested',
      jsonb_build_object(
        'requests_created', requests_created,
        'message', p_message
      )
    );
  END IF;
  
  RETURN requests_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to inactivity verification
CREATE OR REPLACE FUNCTION public.respond_inactivity_verification(
  p_request_id UUID,
  p_response TEXT, -- 'confirmed' or 'denied'
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Validate response
  IF p_response NOT IN ('confirmed', 'denied') THEN
    RAISE EXCEPTION 'Invalid response. Must be "confirmed" or "denied"';
  END IF;
  
  -- Get request details
  SELECT * INTO request_record
  FROM public.inactivity_verification_requests
  WHERE id = p_request_id
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request
  UPDATE public.inactivity_verification_requests
  SET 
    status = p_response,
    response_notes = p_notes,
    responded_at = NOW()
  WHERE id = p_request_id;
  
  -- Log the response
  INSERT INTO public.activity_logs (
    user_id,
    action,
    details
  )
  VALUES (
    request_record.user_id,
    'inactivity_verification_responded',
    jsonb_build_object(
      'request_id', p_request_id,
      'contact_id', request_record.contact_id,
      'response', p_response,
      'notes', p_notes
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has verified emergency contacts
CREATE OR REPLACE FUNCTION public.has_emergency_contacts(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trusted_contacts
    WHERE user_id = p_user_id
      AND emergency_contact = true
      AND verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_email ON public.trusted_contacts(email);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_verification_status ON public.trusted_contacts(verification_status);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_emergency ON public.trusted_contacts(user_id, emergency_contact) WHERE emergency_contact = true;

CREATE INDEX IF NOT EXISTS idx_contact_verification_token ON public.contact_verification_requests(verification_token);
CREATE INDEX IF NOT EXISTS idx_contact_verification_status ON public.contact_verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_inactivity_verification_user_id ON public.inactivity_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_verification_contact_id ON public.inactivity_verification_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_verification_status ON public.inactivity_verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_message_release_user_id ON public.message_release_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_message_release_contact_id ON public.message_release_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_message_release_status ON public.message_release_requests(status);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_trusted_contact(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_trusted_contact(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emergency_contacts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_inactivity_verification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_inactivity_verification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_emergency_contacts(UUID) TO authenticated;

-- Create triggers for updated_at
CREATE TRIGGER update_trusted_contacts_updated_at
BEFORE UPDATE ON public.trusted_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();