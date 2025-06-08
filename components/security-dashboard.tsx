'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Smartphone,
  Key,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { SecurityService, SecurityEvent, LoginAttempt } from '@/lib/security-service';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeTime } from '@/lib/utils';

interface SecurityDashboardProps {
  onSetup2FA?: () => void;
}

export function SecurityDashboard({ onSetup2FA }: SecurityDashboardProps) {
  const { user, twoFactorEnabled, refreshTwoFactorStatus } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      // Refresh 2FA status
      await refreshTwoFactorStatus();
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case '2fa_enabled':
      case '2fa_disabled':
      case '2fa_setup_initiated':
      case '2fa_login_success':
        return <Key className="w-4 h-4" />;
      case 'password_change':
        return <Shield className="w-4 h-4" />;
      case 'email_changed':
      case 'phone_changed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-slate-800 rounded-lg mb-4"></div>
          <div className="h-64 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Two-Factor Auth</p>
                <p className="text-lg font-semibold text-white">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {twoFactorEnabled ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Recent Logins</p>
                <p className="text-lg font-semibold text-white">
                  {loginAttempts.filter(a => a.success).length}
                </p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Security Events</p>
                <p className="text-lg font-semibold text-white">
                  {securityEvents.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {!twoFactorEnabled && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-yellow-300">
            <strong>Recommendation:</strong> Enable two-factor authentication to secure your account and protect your digital legacy messages.
          </AlertDescription>
        </Alert>
      )}

      {securityEvents.some(e => e.severity === 'critical' && !e.resolved) && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-300">
            You have unresolved critical security events that require your attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Events
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSecurityData}
                className="text-slate-400"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Recent security-related activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityEvents.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No security events recorded</p>
            ) : (
              securityEvents.slice(0, 10).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <Badge variant="outline" className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {formatRelativeTime(event.created_at)}
                    </p>
                    {event.ip_address && (
                      <p className="text-slate-500 text-xs flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.ip_address}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Login History */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Login History
            </CardTitle>
            <CardDescription>Recent login attempts and sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginAttempts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No login attempts recorded</p>
            ) : (
              loginAttempts.slice(0, 10).map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {attempt.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">
                        {attempt.success ? 'Successful Login' : 'Failed Login'}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={attempt.success 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {attempt.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {formatRelativeTime(attempt.created_at)}
                    </p>
                    {attempt.ip_address && (
                      <p className="text-slate-500 text-xs flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {attempt.ip_address}
                      </p>
                    )}
                    {!attempt.success && attempt.failure_reason && (
                      <p className="text-red-400 text-xs mt-1">
                        Reason: {attempt.failure_reason}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Actions */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Security Actions</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onSetup2FA}
              className={twoFactorEnabled 
                ? "bg-green-500 hover:bg-green-600 text-white font-semibold"
                : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
              }
            >
              <Key className="w-4 h-4 mr-2" />
              {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
            </Button>
            
            <Button variant="outline" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export Security Log
            </Button>
          </div>
          
          <Separator className="bg-slate-700" />
          
          <div className="text-sm text-slate-400">
            <p className="mb-2"><strong>Security Tips:</strong></p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Enable two-factor authentication for enhanced security</li>
              <li>Use a strong, unique password for your account</li>
              <li>Regularly review your login history for suspicious activity</li>
              <li>Keep your recovery information up to date</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}