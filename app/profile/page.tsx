'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Camera, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  inactivity_threshold: number;
  bio: string;
  location: string;
  birth_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  created_at: string;
  last_active: string;
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    theme: 'dark',
    language: 'en',
    timezone: 'UTC'
  });
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user settings
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!settingsError && userSettings) {
        setSettings(userSettings);
      }

      setProfileData(profile || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          phone: profileData.phone,
          inactivity_threshold: profileData.inactivity_threshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (settingsError) throw settingsError;

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'profile_updated',
          details: {
            updated_fields: Object.keys(profileData),
            timestamp: new Date().toISOString()
          }
        });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || ''
      });

      if (error) throw error;

      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email for verification instructions',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification email',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-950">
          <Navigation />
          <div className="container mx-auto px-4 py-8 pt-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
              <p className="text-slate-400">Manage your personal information and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Overview */}
              <div className="lg:col-span-1">
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader className="text-center">
                    <div className="relative mx-auto mb-4">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileData.avatar_url} />
                        <AvatarFallback className="bg-amber-500 text-slate-950 text-2xl">
                          {profileData.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-amber-500 hover:bg-amber-600"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-white">
                      {profileData.full_name || 'Your Name'}
                    </CardTitle>
                    <CardDescription>
                      @{profileData.username || 'username'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Verification Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300">Verification Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Email</span>
                          {user?.email_confirmed_at ? (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        {!user?.email_confirmed_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={sendVerificationEmail}
                            className="w-full text-xs"
                          >
                            Send Verification Email
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    {/* Account Stats */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300">Account Info</h4>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-2" />
                          Joined {new Date(profileData.created_at || '').toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2" />
                          Last active {new Date(profileData.last_active || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name || ''}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username" className="text-slate-300">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username || ''}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Choose a username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-slate-800 border-slate-700 text-slate-400"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Legacy Settings */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Digital Legacy Settings
                    </CardTitle>
                    <CardDescription>Configure how your digital legacy is managed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="inactivity_threshold" className="text-slate-300">
                        Inactivity Threshold (days)
                      </Label>
                      <Input
                        id="inactivity_threshold"
                        type="number"
                        min="1"
                        max="365"
                        value={profileData.inactivity_threshold || 30}
                        onChange={(e) => handleInputChange('inactivity_threshold', parseInt(e.target.value))}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Number of days of inactivity before triggering message delivery checks
                      </p>
                    </div>

                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-amber-300">
                        <strong>Important:</strong> If you're inactive for this period, we'll send you warnings 
                        before potentially delivering your messages to recipients.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      Emergency Contact
                    </CardTitle>
                    <CardDescription>Someone who can be contacted in case of emergency</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name" className="text-slate-300">Contact Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={profileData.emergency_contact_name || ''}
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_relationship" className="text-slate-300">Relationship</Label>
                        <Input
                          id="emergency_contact_relationship"
                          value={profileData.emergency_contact_relationship || ''}
                          onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="e.g., Spouse, Parent, Sibling"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone" className="text-slate-300">Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        type="tel"
                        value={profileData.emergency_contact_phone || ''}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">Preferences</CardTitle>
                    <CardDescription>Customize your app experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language" className="text-slate-300">Language</Label>
                        <Select value={settings.language} onValueChange={(value) => handleSettingsChange('language', value)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timezone" className="text-slate-300">Timezone</Label>
                        <Select value={settings.timezone} onValueChange={(value) => handleSettingsChange('timezone', value)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}