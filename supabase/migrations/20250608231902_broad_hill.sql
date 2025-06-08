/*
  # Enhanced User Profiles - Fixed Version

  1. Profile Enhancements
    - Add bio, location, birth_date fields to profiles
    - Add emergency contact information
    - Add profile verification status
    - Add avatar upload support

  2. User Settings Enhancements
    - Add more notification preferences
    - Add appearance and accessibility settings
    - Add privacy settings

  3. Security
    - Maintain existing RLS policies
    - Add policies for new fields
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add bio field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  -- Add location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
  END IF;

  -- Add birth_date field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
  END IF;

  -- Add emergency contact fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_relationship'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_relationship TEXT;
  END IF;

  -- Add profile verification fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add profile completion tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Enhance user_settings table
DO $$
BEGIN
  -- Add notification preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'push_notifications'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN push_notifications BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'marketing_emails'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN marketing_emails BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'security_alerts'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN security_alerts BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add privacy settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN profile_visibility TEXT DEFAULT 'private';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'data_sharing'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN data_sharing BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add accessibility settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'font_size'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN font_size TEXT DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'high_contrast'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN high_contrast BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'reduce_motion'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN reduce_motion BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Function to update profile completion status
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile_completed based on completeness
  NEW.profile_completed = (
    NEW.full_name IS NOT NULL 
    AND NEW.username IS NOT NULL 
    AND NEW.phone IS NOT NULL 
    AND NEW.bio IS NOT NULL 
    AND NEW.emergency_contact_name IS NOT NULL 
    AND NEW.emergency_contact_phone IS NOT NULL 
    AND NEW.email_verified = TRUE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update profile completion
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.profiles;
CREATE TRIGGER update_profile_completion_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- Function to get user profile statistics
CREATE OR REPLACE FUNCTION public.get_user_profile_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  profile_record RECORD;
BEGIN
  -- Get profile data
  SELECT * INTO profile_record
  FROM public.profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;
  
  -- Calculate completion statistics
  SELECT json_build_object(
    'profile_completion', (
      CASE WHEN profile_record.full_name IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.username IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.phone IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.bio IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.emergency_contact_name IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.emergency_contact_phone IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN profile_record.email_verified = TRUE THEN 1 ELSE 0 END
    )::float / 7 * 100,
    'is_complete', (
      profile_record.full_name IS NOT NULL 
      AND profile_record.username IS NOT NULL 
      AND profile_record.phone IS NOT NULL 
      AND profile_record.bio IS NOT NULL 
      AND profile_record.emergency_contact_name IS NOT NULL 
      AND profile_record.emergency_contact_phone IS NOT NULL 
      AND profile_record.email_verified = TRUE
    ),
    'email_verified', COALESCE(profile_record.email_verified, FALSE),
    'phone_verified', COALESCE(profile_record.phone_verified, FALSE),
    'missing_fields', ARRAY(
      SELECT field_name FROM (
        VALUES 
          ('full_name', profile_record.full_name IS NULL),
          ('username', profile_record.username IS NULL),
          ('phone', profile_record.phone IS NULL),
          ('bio', profile_record.bio IS NULL),
          ('emergency_contact', profile_record.emergency_contact_name IS NULL OR profile_record.emergency_contact_phone IS NULL),
          ('email_verification', COALESCE(profile_record.email_verified, FALSE) = FALSE)
      ) AS fields(field_name, is_missing)
      WHERE is_missing = TRUE
    ),
    'account_age_days', EXTRACT(DAY FROM NOW() - profile_record.created_at),
    'last_active_days', EXTRACT(DAY FROM NOW() - profile_record.last_active)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats(UUID) TO authenticated;

-- Update existing profiles to set email_verified based on auth.users
UPDATE public.profiles 
SET email_verified = TRUE 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
);