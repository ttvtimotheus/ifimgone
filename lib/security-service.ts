import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  resolved: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  failure_reason?: string;
  created_at: string;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export class SecurityService {
  private static instance: SecurityService;

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Two-Factor Authentication
  async enableTwoFactor(userId: string): Promise<TwoFactorSetup | null> {
    try {
      // Generate TOTP secret
      const secret = this.generateTOTPSecret();
      
      // Generate QR code URL
      const qrCode = this.generateQRCode(secret, userId);
      
      // Generate backup codes
      const { data: backupCodes, error: backupError } = await supabase
        .rpc('generate_backup_codes', { p_user_id: userId });

      if (backupError) throw backupError;

      // Store the secret (temporarily, until verified)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          two_factor_secret: secret,
          two_factor_enabled: false // Will be enabled after verification
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return {
        secret,
        qr_code: qrCode,
        backup_codes: backupCodes
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return null;
    }
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA secret
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_secret')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.two_factor_secret) return false;

      // Verify TOTP token
      const isValid = this.verifyTOTPToken(profile.two_factor_secret, token);

      if (isValid) {
        // Enable 2FA
        await supabase
          .from('profiles')
          .update({ two_factor_enabled: true })
          .eq('id', userId);

        // Log security event
        await this.logSecurityEvent(userId, '2fa_enabled', 'info');
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return false;
    }
  }

  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify current token before disabling
      const isValid = await this.verifyCurrentTwoFactor(userId, token);
      
      if (!isValid) return false;

      // Disable 2FA
      const { error } = await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: false,
          two_factor_secret: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Delete backup codes
      await supabase
        .from('backup_codes')
        .delete()
        .eq('user_id', userId);

      // Log security event
      await this.logSecurityEvent(userId, '2fa_disabled', 'warning');

      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  async verifyCurrentTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('two_factor_secret, two_factor_enabled')
        .eq('id', userId)
        .single();

      if (error || !profile?.two_factor_enabled || !profile?.two_factor_secret) {
        return false;
      }

      return this.verifyTOTPToken(profile.two_factor_secret, token);
    } catch (error) {
      console.error('Error verifying current 2FA:', error);
      return false;
    }
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data: isValid, error } = await supabase
        .rpc('verify_backup_code', { 
          p_user_id: userId, 
          p_code: code 
        });

      if (error) throw error;
      return isValid;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }

  // Security Event Logging
  async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: eventType,
        p_severity: severity,
        p_details: details,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_login_attempt', {
        p_email: email,
        p_success: success,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_failure_reason: failureReason
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }

  async logMessageAccess(
    messageId: string,
    accessedByEmail: string,
    accessType: 'view' | 'download' | 'share',
    accessGranted: boolean,
    ipAddress?: string,
    userAgent?: string,
    pinRequired: boolean = false,
    pinAttempts: number = 0
  ): Promise<void> {
    try {
      await supabase.rpc('log_message_access', {
        p_message_id: messageId,
        p_accessed_by_email: accessedByEmail,
        p_access_type: accessType,
        p_access_granted: accessGranted,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_pin_required: pinRequired,
        p_pin_attempts: pinAttempts
      });
    } catch (error) {
      console.error('Error logging message access:', error);
    }
  }

  // Security Monitoring
  async getSecurityEvents(userId: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  async getLoginAttempts(userId: string, limit: number = 20): Promise<LoginAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      return [];
    }
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_account_locked', { p_user_id: userId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }

  // Message Security
  async setMessagePIN(messageId: string, pin: string): Promise<boolean> {
    try {
      // Hash the PIN
      const pinHash = await this.hashPIN(pin);

      const { error } = await supabase
        .from('messages')
        .update({ pin_hash: pinHash })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting message PIN:', error);
      return false;
    }
  }

  async verifyMessagePIN(messageId: string, pin: string): Promise<boolean> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .select('pin_hash')
        .eq('id', messageId)
        .single();

      if (error || !message?.pin_hash) return false;

      return await this.verifyPIN(pin, message.pin_hash);
    } catch (error) {
      console.error('Error verifying message PIN:', error);
      return false;
    }
  }

  // Utility Methods
  private generateTOTPSecret(): string {
    // Generate a random 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateQRCode(secret: string, userId: string): string {
    const issuer = 'If I\'m Gone';
    const accountName = userId;
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    // In a real implementation, you would use a TOTP library like 'otplib'
    // For now, we'll simulate verification
    // This is a placeholder - implement proper TOTP verification
    return token.length === 6 && /^\d{6}$/.test(token);
  }

  private async hashPIN(pin: string): Promise<string> {
    // Use Web Crypto API to hash the PIN
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPIN(pin: string, hash: string): Promise<boolean> {
    const pinHash = await this.hashPIN(pin);
    return pinHash === hash;
  }

  // Device Fingerprinting
  getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return '';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  // IP Address Detection
  async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }
}