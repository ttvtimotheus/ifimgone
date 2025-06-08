'use client';

import { useState, useEffect } from 'react';
import { SecurityService, SecurityEvent, LoginAttempt } from '@/lib/security-service';
import { useAuth } from '@/hooks/use-auth';

export function useSecurity() {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const securityService = SecurityService.getInstance();

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [events, attempts] = await Promise.all([
        securityService.getSecurityEvents(user.id),
        securityService.getLoginAttempts(user.id)
      ]);

      setSecurityEvents(events);
      setLoginAttempts(attempts);

      // Check 2FA status from profile
      // This would be fetched from the user profile in a real implementation
      setTwoFactorEnabled(false); // Placeholder
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (
    eventType: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    details?: any
  ) => {
    if (!user) return;

    try {
      const ipAddress = await securityService.getClientIP();
      const userAgent = navigator.userAgent;

      await securityService.logSecurityEvent(
        user.id,
        eventType,
        severity,
        details,
        ipAddress || undefined,
        userAgent
      );

      // Refresh security data
      await fetchSecurityData();
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const enableTwoFactor = async () => {
    if (!user) return null;

    try {
      const setup = await securityService.enableTwoFactor(user.id);
      if (setup) {
        await logSecurityEvent('2fa_setup_initiated', 'info');
      }
      return setup;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return null;
    }
  };

  const verifyTwoFactor = async (token: string) => {
    if (!user) return false;

    try {
      const isValid = await securityService.verifyTwoFactor(user.id, token);
      if (isValid) {
        setTwoFactorEnabled(true);
        await logSecurityEvent('2fa_enabled', 'info');
      }
      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return false;
    }
  };

  const disableTwoFactor = async (token: string) => {
    if (!user) return false;

    try {
      const success = await securityService.disableTwoFactor(user.id, token);
      if (success) {
        setTwoFactorEnabled(false);
        await logSecurityEvent('2fa_disabled', 'warning');
      }
      return success;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  };

  const checkAccountLocked = async () => {
    if (!user) return false;

    try {
      return await securityService.isAccountLocked(user.id);
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  };

  return {
    securityEvents,
    loginAttempts,
    loading,
    twoFactorEnabled,
    fetchSecurityData,
    logSecurityEvent,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    checkAccountLocked,
  };
}