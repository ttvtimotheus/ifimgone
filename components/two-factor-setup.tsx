'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Download,
  QrCode
} from 'lucide-react';
import { SecurityService, TwoFactorSetup } from '@/lib/security-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetupComponent({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { user, refreshTwoFactorStatus } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const securityService = SecurityService.getInstance();

  const handleSetup = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const setup = await securityService.enableTwoFactor(user.id);
      
      if (setup) {
        setSetupData(setup);
        setBackupCodes(setup.backup_codes);
        setStep('verify');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to set up two-factor authentication',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: 'Error',
        description: 'Failed to set up two-factor authentication',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!user || !verificationCode) return;

    try {
      setLoading(true);
      const isValid = await securityService.verifyTwoFactor(user.id, verificationCode);
      
      if (isValid) {
        setStep('backup');
        await refreshTwoFactorStatus(); // Update the auth context
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been enabled',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Invalid Code',
          description: 'Please check your authenticator app and try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify two-factor authentication',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
      toast({
        title: 'Copied',
        description: `${type === 'secret' ? 'Secret' : 'Backup codes'} copied to clipboard`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    const content = `If I'm Gone - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nUser: ${user?.email}\n\nBackup Codes:\n${backupCodes.join('\n')}\n\nImportant:\n- Each code can only be used once\n- Store these codes in a secure location\n- Use these codes if you lose access to your authenticator app`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'if-im-gone-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onComplete?.();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'setup' ? 'bg-amber-500 text-slate-950' : 'bg-green-500 text-white'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              ['verify', 'backup'].includes(step) ? 'bg-green-500' : 'bg-slate-600'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'verify' ? 'bg-amber-500 text-slate-950' : 
              step === 'backup' ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'
            }`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              step === 'backup' ? 'bg-green-500' : 'bg-slate-600'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'backup' ? 'bg-amber-500 text-slate-950' : 'bg-slate-600 text-slate-400'
            }`}>
              <Key className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Setup Step */}
        {step === 'setup' && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center">
                <Shield className="w-6 h-6 mr-2" />
                Enable Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-amber-300">
                  <strong>Important:</strong> You'll need an authenticator app like Google Authenticator, 
                  Authy, or 1Password to complete this setup.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="text-white font-medium">What you'll need:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    An authenticator app installed on your phone
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Access to your phone to scan a QR code
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    A secure place to store backup codes
                  </li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSetup}
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-slate-950 rounded-full border-t-transparent"></div>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Start Setup
                    </>
                  )}
                </Button>
                {onCancel && (
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verify Step */}
        {step === 'verify' && setupData && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center">
                <QrCode className="w-6 h-6 mr-2" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Use your authenticator app to scan the QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code)}`}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-slate-300">Can't scan? Enter this code manually:</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={setupData.secret}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    className="border-slate-600"
                  >
                    {copiedSecret ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Verification */}
              <div className="space-y-4">
                <Label htmlFor="verification-code" className="text-slate-300">
                  Enter the 6-digit code from your authenticator app:
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-slate-800 border-slate-700 text-white text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-slate-950 rounded-full border-t-transparent"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Enable
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('setup')}
                  className="border-slate-600 text-slate-300"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center">
                <Key className="w-6 h-6 mr-2" />
                Save Your Backup Codes
              </CardTitle>
              <CardDescription>
                Store these codes in a safe place - you'll need them if you lose your phone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-300">
                  <strong>Critical:</strong> These backup codes are your only way to access your account 
                  if you lose your authenticator device. Save them securely!
                </AlertDescription>
              </Alert>

              {/* Backup Codes Display */}
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-white bg-slate-700 p-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  {copiedBackup ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Codes
                </Button>
                <Button
                  onClick={downloadBackupCodes}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleComplete}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              </div>

              <div className="text-sm text-slate-400 space-y-2">
                <p><strong>Important reminders:</strong></p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Each backup code can only be used once</li>
                  <li>Store these codes in a password manager or secure location</li>
                  <li>Don't share these codes with anyone</li>
                  <li>You can generate new backup codes anytime from your security settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}