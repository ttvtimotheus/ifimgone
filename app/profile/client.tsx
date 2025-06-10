'use client';

// Import the original profile page content here
// This is a placeholder - you'll need to move the client component code from the original profile page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, Shield, Key, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProfilePageClient() {
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setPhone(user.user_metadata?.phone || '');
      setBio(user.user_metadata?.bio || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  if (!user) {
    router.push('/auth');
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Handle avatar upload if there's a new file
      let finalAvatarUrl = user.user_metadata?.avatar_url || '';
      
      if (avatarFile) {
        setUploadingAvatar(true);
        // This would be replaced with your actual avatar upload logic
        // For example, uploading to Supabase Storage
        // const { data, error } = await supabase.storage.from('avatars').upload(...)
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Placeholder for actual upload result
        finalAvatarUrl = avatarUrl;
        setUploadingAvatar(false);
      }
      
      await updateProfile({
        full_name: fullName,
        phone,
        bio,
        avatar_url: finalAvatarUrl
      });
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700">
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            Security Settings
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-700">
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and how others will see you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-4 md:w-1/3">
                    <Avatar className="w-32 h-32 border-2 border-amber-500/50">
                      <AvatarImage src={avatarUrl} alt={fullName} />
                      <AvatarFallback className="bg-slate-800 text-amber-500 text-2xl">
                        {fullName ? fullName.charAt(0).toUpperCase() : <User />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="w-full">
                      <Label htmlFor="avatar" className="text-slate-300 block mb-2 text-center">
                        Profile Photo
                      </Label>
                      <div className="flex justify-center">
                        <div className="relative">
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="absolute inset-0 opacity-0 w-full cursor-pointer"
                            disabled={saving || uploadingAvatar}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            disabled={saving || uploadingAvatar}
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Change Photo
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:w-2/3">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white"
                          placeholder="Your full name"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          value={email}
                          className="pl-10 bg-slate-800 border-slate-700 text-white"
                          disabled={true}
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white"
                          placeholder="Your phone number"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                        placeholder="Tell us a little about yourself"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

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

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                    disabled={saving || uploadingAvatar}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                  <p className="text-slate-400 text-sm">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  onClick={() => router.push('/security')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-medium">Change Password</h3>
                  <p className="text-slate-400 text-sm">
                    Update your password regularly for better security
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  onClick={() => router.push('/security?tab=password')}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Login History</h3>
                  <p className="text-slate-400 text-sm">
                    View your recent login activity
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  onClick={() => router.push('/security?tab=activity')}
                >
                  View Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-slate-400 text-sm">
                    Receive updates and alerts via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-medium">SMS Notifications</h3>
                  <p className="text-slate-400 text-sm">
                    Get text messages for important alerts
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Marketing Communications</h3>
                  <p className="text-slate-400 text-sm">
                    Receive updates about new features and improvements
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
