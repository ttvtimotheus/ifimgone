'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heart, Mail, Lock, ArrowLeft, Chrome, Loader2, Shield, Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function AuthPageClient() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          return;
        }
        await signUp(email, password);
      } else {
        await signIn(email, password, twoFactorToken || undefined);
      }
    } catch (err: any) {
      if (err.message === 'Two-factor authentication required') {
        setNeedsTwoFactor(true);
        setError('Please enter your 6-digit authentication code');
      } else if (err.message === 'Invalid two-factor authentication code') {
        setError('Invalid authentication code. Please try again.');
        setTwoFactorToken('');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      // Note: The redirect will happen automatically, so we don't set loading to false here
      // unless there's an error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setNeedsTwoFactor(false);
    setTwoFactorToken('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
              x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
            
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mb-6 backdrop-blur-sm"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0 rgba(245, 158, 11, 0)",
                  "0 0 0 10px rgba(245, 158, 11, 0.1)",
                  "0 0 0 0 rgba(245, 158, 11, 0)"
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart className="w-10 h-10 text-amber-500" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {needsTwoFactor ? 'Two-Factor Authentication' : 
               isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400">
              {needsTwoFactor ? 'Enter your 6-digit authentication code' :
               isSignUp 
                ? 'Begin creating your digital legacy' 
                : 'Continue your journey of remembrance'
              }
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                {needsTwoFactor ? (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Verify Your Identity
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {needsTwoFactor 
                  ? 'Check your authentication app for the code' 
                  : 'Enter your details below to continue'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!needsTwoFactor && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          required
                          disabled={loading || googleLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          required
                          disabled={loading || googleLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isSignUp && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                            required
                            disabled={loading || googleLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Two-Factor Authentication Input */}
                {needsTwoFactor && (
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorToken" className="text-slate-300">Authentication Code</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="twoFactorToken"
                        type="text"
                        placeholder="000000"
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 text-center tracking-widest focus:border-amber-500 focus:ring-amber-500/20"
                        maxLength={6}
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                )}

                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  disabled={loading || googleLoading || (needsTwoFactor && twoFactorToken.length !== 6)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : needsTwoFactor ? (
                    'Verify Code'
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>

                {needsTwoFactor ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
                      disabled={loading}
                    >
                      Back to login
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
                      disabled={loading || googleLoading}
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in'
                        : "Don't have an account? Sign up"
                      }
                    </button>
                  </div>
                )}

                {!needsTwoFactor && !isSignUp && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all duration-300 hover:scale-[1.02]"
                      disabled={loading || googleLoading}
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to Google...
                        </>
                      ) : (
                        <>
                          <Chrome className="w-4 h-4 mr-2" />
                          Continue with Google
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security notice */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Protected by enterprise-grade security • Your data is encrypted
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}