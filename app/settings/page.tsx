'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Users, Bell, Trash2, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    activityReminders: true,
    defaultInactivity: '6 months',
    twoFactorAuth: false,
  });

  const [trustedContacts, setTrustedContacts] = useState([
    { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', relationship: 'Sister' },
    { id: 2, name: 'Michael Thompson', email: 'michael@example.com', relationship: 'Best Friend' },
  ]);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

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
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-slate-400">Manage your account and privacy preferences</p>
            </div>

            <div className="space-y-8">
              {/* Account Information */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Account Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-slate-800 border-slate-700 text-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultInactivity" className="text-slate-300">Default Inactivity Period</Label>
                      <Input
                        id="defaultInactivity"
                        value={settings.defaultInactivity}
                        onChange={(e) => handleSettingChange('defaultInactivity', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trusted Contacts */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Trusted Contacts
                  </CardTitle>
                  <CardDescription>People who can help manage your messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trustedContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">{contact.name}</h4>
                          <p className="text-slate-400 text-sm">{contact.email}</p>
                          <p className="text-slate-500 text-xs">{contact.relationship}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button className="w-full border-dashed border-2 border-slate-600 bg-transparent hover:bg-slate-800 text-slate-400">
                      Add Trusted Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Configure how you receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-slate-400 text-sm">Receive important updates via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Activity Reminders</h4>
                      <p className="text-slate-400 text-sm">Get reminded to stay active</p>
                    </div>
                    <Switch
                      checked={settings.activityReminders}
                      onCheckedChange={(checked) => handleSettingChange('activityReminders', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription>Advanced security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                      <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    />
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="space-y-2">
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950">
                      <Download className="w-4 h-4 mr-2" />
                      Export All Messages
                    </Button>
                    <p className="text-slate-500 text-xs text-center">
                      Download a backup of all your messages
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-300/70">
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-red-300">
                      These actions cannot be undone. Please be certain before proceeding.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}