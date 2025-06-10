'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Heart, Loader2, UserCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { TrustedContactService } from '@/lib/trusted-contact-service';

function VerifyContactContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const trustedContactService = TrustedContactService.getInstance();

  useEffect(() => {
    if (token) {
      verifyContact();
    } else {
      setStatus('invalid');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyContact = async () => {
    try {
      setStatus('loading');
      
      const success = await trustedContactService.verifyContact(token!);
      
      if (success) {
        setStatus('success');
        setMessage('Your contact verification has been completed successfully!');
      } else {
        setStatus('error');
        setMessage('Verification failed. The token may be invalid or expired.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
      case 'invalid':
        return <AlertTriangle className="w-16 h-16 text-red-500" />;
      default:
        return <UserCheck className="w-16 h-16 text-slate-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500/50 bg-green-500/10';
      case 'error':
      case 'invalid':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-amber-500/50 bg-amber-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mb-6">
            <Heart className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Verification</h1>
          <p className="text-slate-400">If I'm Gone - Digital Legacy Platform</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {getStatusIcon()}
            </div>

            <h2 className="text-xl font-semibold text-white mb-4">
              {status === 'loading' && 'Verifying Contact...'}
              {status === 'success' && 'Verification Successful!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'invalid' && 'Invalid Request'}
            </h2>

            <Alert className={getStatusColor()}>
              <AlertDescription className={
                status === 'success' ? 'text-green-300' :
                status === 'error' || status === 'invalid' ? 'text-red-300' :
                'text-amber-300'
              }>
                {message}
              </AlertDescription>
            </Alert>

            {status === 'success' && (
              <div className="mt-6 space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">What happens next?</h3>
                  <ul className="text-slate-300 text-sm space-y-1 text-left">
                    <li>• You are now verified as a trusted contact</li>
                    <li>• You may receive notifications about account activity</li>
                    <li>• You can help verify inactivity when needed</li>
                    <li>• Your permissions are set by the account owner</li>
                  </ul>
                </div>
                
                <p className="text-slate-400 text-sm">
                  Thank you for being a trusted contact. Your role helps ensure digital legacies are preserved and delivered when needed.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6">
                <Button 
                  onClick={verifyContact}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-center space-x-2 text-amber-500 text-sm">
                <Heart className="w-4 h-4" />
                <span>Secured by If I'm Gone</span>
                <Heart className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading verification...</p>
        </div>
      </div>
    }>
      <VerifyContactContent />
    </Suspense>
  );
}