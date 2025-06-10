'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell, Moon, Sun, Trash2, Download, Languages } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPageClient() {
  const { user, loading, deleteAccount } = useAuth();
  const router = useRouter();
  
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      // Load user preferences from metadata if available
      setEmailNotifications(user.user_metadata?.email_notifications !== false);
      setPushNotifications(user.user_metadata?.push_notifications !== false);
      setMarketingEmails(user.user_metadata?.marketing_emails === true);
      setTheme(user.user_metadata?.theme || 'dark');
      setLanguage(user.user_metadata?.language || 'en');
    }
  }, [user]);

  if (!user) {
    router.push('/auth');
    return null;
  }

  const handleSavePreferences = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // In a real app, this would update user preferences in the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setError('');
    setSaving(true);

    try {
      // In a real app, this would generate and download user data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Simulate data download
      const userData = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        // Add other user data here
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', 'user_data.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Data exported successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setSaving(true);

    try {
      await deleteAccount();
      router.push('/auth');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-700">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-slate-700">
            Account
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Display Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Theme</Label>
                    <p className="text-sm text-slate-400">
                      Choose between light and dark mode
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-slate-400" />
                    <Switch 
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                    <Moon className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-white">Language</Label>
                  <div className="flex items-center space-x-2">
                    <Languages className="w-4 h-4 text-slate-400" />
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSavePreferences}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-slate-400">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <Label className="text-white">Push Notifications</Label>
                    <p className="text-sm text-slate-400">
                      Receive alerts on your device
                    </p>
                  </div>
                  <Switch 
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Marketing Emails</Label>
                    <p className="text-sm text-slate-400">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch 
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>
              </div>
              
              {(error || success) && (
                <div className="pt-4">
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertDescription className="text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <AlertDescription className="text-green-400">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSavePreferences}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Data & Privacy</CardTitle>
              <CardDescription>
                Manage your account data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-white font-medium">Export Your Data</h3>
                      <p className="text-sm text-slate-400">
                        Download a copy of your personal data
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                      onClick={handleExportData}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-800/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-white font-medium">Delete Account</h3>
                        <p className="text-sm text-slate-400">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || showDeleteConfirm}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    
                    {showDeleteConfirm && (
                      <div className="space-y-4 pt-2">
                        <Alert className="border-red-500/50 bg-red-500/10">
                          <AlertDescription className="text-red-400">
                            This action cannot be undone. All your data will be permanently deleted.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          
                          <Button 
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Confirm Delete'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
