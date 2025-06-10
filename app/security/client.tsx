'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, Clock, Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SecurityPageClient() {
  const { user, updatePassword, setup2FA, disable2FA, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  // Sample login history data for demonstration
  const sampleLoginHistory = [
    { id: 1, date: '2025-06-10 10:15 AM', ip: '192.168.1.1', device: 'Chrome on macOS', status: 'success' },
    { id: 2, date: '2025-06-08 03:22 PM', ip: '192.168.1.1', device: 'Safari on iOS', status: 'success' },
    { id: 3, date: '2025-06-05 08:45 AM', ip: '192.168.1.1', device: 'Firefox on Windows', status: 'success' },
    { id: 4, date: '2025-06-01 11:30 AM', ip: '192.168.1.100', device: 'Unknown device', status: 'failed' },
  ];

  useEffect(() => {
    if (user) {
      // Check if 2FA is enabled for the user
      setTwoFactorEnabled(user.user_metadata?.two_factor_enabled || false);
      
      // Set login history (in a real app, this would come from an API)
      setLoginHistory(sampleLoginHistory);
    }
  }, [user]);

  useEffect(() => {
    // Set the active tab based on URL parameter
    if (tabParam) {
      document.querySelector(`[data-value="${tabParam}"]`)?.click();
    }
  }, [tabParam]);

  if (!user) {
    router.push('/auth');
    return null;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleSetup2FA = async () => {
    setError('');
    setSaving(true);

    try {
      // In a real app, this would call your backend to generate a 2FA secret and QR code
      const result = await setup2FA();
      setTwoFactorSecret(result.secret);
      setTwoFactorQrCode(result.qrCode);
    } catch (err: any) {
      setError(err.message || 'Failed to set up two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // In a real app, this would verify the code with your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Simulate successful verification
      setTwoFactorEnabled(true);
      setSuccess('Two-factor authentication enabled successfully');
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    setError('');
    setSaving(true);

    try {
      await disable2FA();
      setTwoFactorEnabled(false);
      setSuccess('Two-factor authentication disabled');
    } catch (err: any) {
      setError(err.message || 'Failed to disable two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Security Settings</h1>
      </div>

      <Tabs defaultValue="2fa" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="2fa" data-value="2fa" className="data-[state=active]:bg-slate-700">
            Two-Factor Authentication
          </TabsTrigger>
          <TabsTrigger value="password" data-value="password" className="data-[state=active]:bg-slate-700">
            Change Password
          </TabsTrigger>
          <TabsTrigger value="activity" data-value="activity" className="data-[state=active]:bg-slate-700">
            Login Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="2fa" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account by requiring a verification code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {twoFactorEnabled ? (
                <div className="space-y-6">
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <AlertDescription className="text-green-400 flex items-center">
                      Two-factor authentication is enabled for your account
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="destructive"
                      onClick={handleDisable2FA}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Disable 2FA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : twoFactorSecret ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">1. Scan QR Code</h3>
                    <p className="text-slate-400">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div className="flex justify-center p-4 bg-white rounded-md">
                      <img 
                        src={twoFactorQrCode} 
                        alt="QR Code for two-factor authentication" 
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">2. Manual Setup</h3>
                    <p className="text-slate-400">
                      If you can't scan the QR code, enter this code manually in your app:
                    </p>
                    <div className="bg-slate-800 p-3 rounded-md font-mono text-center text-amber-500 tracking-wider">
                      {twoFactorSecret}
                    </div>
                  </div>
                  
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode" className="text-slate-300">
                        3. Enter Verification Code
                      </Label>
                      <Input
                        id="verificationCode"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="bg-slate-800 border-slate-700 text-white text-center tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        required
                        disabled={saving}
                      />
                    </div>
                    
                    {error && (
                      <Alert className="border-red-500/50 bg-red-500/10">
                        <AlertDescription className="text-red-400">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                        disabled={saving || verificationCode.length !== 6}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Enable'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-slate-800 rounded-md">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Enhance Your Account Security</h3>
                      <p className="text-slate-400">
                        Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                      </p>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertDescription className="text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSetup2FA}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Set Up 2FA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                        placeholder="••••••••"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                        placeholder="••••••••"
                        required
                        disabled={saving}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Password must be at least 8 characters and include a mix of letters, numbers, and symbols
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                        placeholder="••••••••"
                        required
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
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Login Activity</CardTitle>
              <CardDescription>
                Review your recent account access history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Date & Time</TableHead>
                    <TableHead className="text-slate-400">IP Address</TableHead>
                    <TableHead className="text-slate-400">Device</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((login) => (
                    <TableRow key={login.id} className="border-slate-800">
                      <TableCell className="text-white">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          {login.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{login.ip}</TableCell>
                      <TableCell className="text-white">{login.device}</TableCell>
                      <TableCell>
                        {login.status === 'success' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            <X className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
