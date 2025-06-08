import { supabase } from './supabase';

export interface ProfileStats {
  profile_completion: number;
  is_complete: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  missing_fields: string[];
  account_age_days: number;
  last_active_days: number;
}

export class ProfileService {
  private static instance: ProfileService;

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getProfileStats(userId: string): Promise<ProfileStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile_stats', { user_id: userId });

      if (error) {
        console.error('Error fetching profile stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfileStats:', error);
      return null;
    }
  }

  async updateProfileCompletion(userId: string): Promise<boolean> {
    try {
      // Trigger the profile completion update
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile completion:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfileCompletion:', error);
      return false;
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
        return null;
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  }

  async verifyEmail(userId: string): Promise<boolean> {
    try {
      // Send verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: '' // Will use the current user's email
      });

      if (error) {
        console.error('Error sending verification email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      return false;
    }
  }

  async verifyPhone(userId: string, phone: string): Promise<boolean> {
    try {
      // In a real implementation, you would integrate with a service like:
      // - Twilio Verify
      // - AWS SNS
      // - Firebase Phone Auth
      // For now, we'll simulate the process

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          type: 'phone',
          code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      if (error) {
        console.error('Error creating phone verification request:', error);
        return false;
      }

      // In production, send SMS with verification code
      console.log(`Phone verification code for ${phone}: ${verificationCode}`);

      return true;
    } catch (error) {
      console.error('Error in verifyPhone:', error);
      return false;
    }
  }

  async confirmPhoneVerification(userId: string, code: string): Promise<boolean> {
    try {
      // Check if verification code is valid
      const { data: verification, error: fetchError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'phone')
        .eq('code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !verification || verification.length === 0) {
        console.error('Invalid or expired verification code');
        return false;
      }

      // Mark verification as verified
      const { error: updateVerificationError } = await supabase
        .from('verification_requests')
        .update({ status: 'verified' })
        .eq('id', verification[0].id);

      if (updateVerificationError) {
        console.error('Error updating verification status:', updateVerificationError);
        return false;
      }

      // Update profile to mark phone as verified
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ phone_verified: true })
        .eq('id', userId);

      if (updateProfileError) {
        console.error('Error updating profile phone verification:', updateProfileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in confirmPhoneVerification:', error);
      return false;
    }
  }

  async getRecommendations(userId: string): Promise<string[]> {
    try {
      const stats = await this.getProfileStats(userId);
      if (!stats) return [];

      const recommendations: string[] = [];

      if (!stats.email_verified) {
        recommendations.push('Verify your email address for account security');
      }

      if (!stats.phone_verified) {
        recommendations.push('Add and verify your phone number for better security');
      }

      if (stats.missing_fields.includes('emergency_contact')) {
        recommendations.push('Add an emergency contact for account recovery');
      }

      if (stats.missing_fields.includes('bio')) {
        recommendations.push('Add a bio to personalize your profile');
      }

      if (stats.profile_completion < 80) {
        recommendations.push('Complete your profile to unlock all features');
      }

      if (stats.last_active_days > 7) {
        recommendations.push('Review your inactivity settings to ensure proper message delivery');
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}