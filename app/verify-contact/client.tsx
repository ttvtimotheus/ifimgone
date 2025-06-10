'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyContactClient() {
  const { user, verifyEmail, verifyPhone, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const type = searchParams?.get('type') || 'email';
  const [verificationCode, setVerificationCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  // Check if we have a token in the URL for automatic verification
  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (code: string) => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (type === 'phone') {
        await verifyPhone(code);
        setSuccess('Phone number verified successfully');
      } else {
        await verifyEmail(code);
        setSuccess('Email address verified successfully');
      }
      
      // Redirect after successful verification
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } catch (err: any) {
      setError(err.message || `Failed to verify ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleVerify(verificationCode);
  };

  const handleResendCode = async () => {
    setError('');
    setSaving(true);
    
    try {
      // In a real app, this would call your backend to resend verification code
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setVerificationSent(true);
      setTimeout(() => {
        setVerificationSent(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || `Failed to resend verification code`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Verify Your {type === 'phone' ? 'Phone Number' : 'Email Address'}
        </h1>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <Link href="/profile" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
            
            <CardTitle className="text-white">
              {type === 'phone' ? 'Phone Verification' : 'Email Verification'}
            </CardTitle>
            <CardDescription>
              {type === 'phone' 
                ? 'Enter the verification code sent to your phone'
                : 'Enter the verification code sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-6">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <AlertDescription className="text-green-400">
                    {success}
                  </AlertDescription>
                </Alert>
                
                <p className="text-slate-300 text-center">
                  Redirecting you to your profile...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-slate-300">
                    Verification Code
                  </Label>
                  <div className="relative">
                    {type === 'phone' ? (
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    ) : (
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    )}
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white text-center tracking-widest"
                      placeholder="Enter code"
                      required
                      disabled={saving}
                      autoFocus
                    />
                  </div>
                </div>
                
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {verificationSent && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <AlertDescription className="text-green-400">
                      Verification code has been resent
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between items-center">
                  <Button 
                    type="button"
                    variant="outline"
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                    onClick={handleResendCode}
                    disabled={saving || verificationSent}
                  >
                    {saving && !verificationCode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Code'
                    )}
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                    disabled={saving || !verificationCode}
                  >
                    {saving && verificationCode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
