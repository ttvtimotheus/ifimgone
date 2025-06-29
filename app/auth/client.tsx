'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heart, Mail, Lock, ArrowLeft, Chrome, Loader2, Shield, Sparkles, Eye, EyeOff, Star, Feather } from 'lucide-react';
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
  const [isClient, setIsClient] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        {/* Floating particles */}
        {isClient && [...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-amber-400/40 to-rose-400/40 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth]
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Constellation background */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={`constellation-${i}`}
              className="absolute w-0.5 h-0.5 bg-white/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.6, 0.1],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 8
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Return to reflection</span>
            </Link>
            
            <motion.div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mb-8 backdrop-blur-sm relative"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart className="w-12 h-12 text-amber-500" />
              
              {/* Orbital elements */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400/60 rounded-full"
                  style={{
                    top: `${50 + Math.sin(i * 120 * Math.PI / 180) * 40}%`,
                    left: `${50 + Math.cos(i * 120 * Math.PI / 180) * 40}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.7,
                  }}
                />
              ))}
            </motion.div>
            
            <h1 className="text-4xl font-bold text-white mb-3 font-serif">
              {needsTwoFactor ? 'Secure Verification' : 
               isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 leading-relaxed">
              {needsTwoFactor ? 'Enter your authentication code to continue' :
               isSignUp 
                ? 'Create an account to preserve your legacy' 
                : 'Continue your journey of remembrance'
              }
            </p>
          </div>

          <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-white flex items-center justify-center">
                {needsTwoFactor ? (
                  <>
                    <Shield className="w-5 h-5 mr-2 text-amber-500" />
                    Two-Factor Authentication
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {needsTwoFactor 
                  ? 'Check your authentication app for the verification code' 
                  : 'Enter your details to continue your digital legacy journey'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {!needsTwoFactor ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300 font-medium">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                            required
                            disabled={loading || googleLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
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
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="confirmPassword" className="text-slate-300 font-medium">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-10 pr-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
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
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="twoFactorToken" className="text-slate-300 font-medium">Authentication Code</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input
                            id="twoFactorToken"
                            type="text"
                            placeholder="000000"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 text-center tracking-widest focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                            maxLength={6}
                            required
                            disabled={loading}
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          Enter the 6-digit code from your authenticator app
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg"
                  >
                    <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                      <AlertDescription className="text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25 py-6"
                  disabled={loading || googleLoading || (needsTwoFactor && twoFactorToken.length !== 6)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : needsTwoFactor ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Code
                    </>
                  ) : (
                    <>
                      <Feather className="w-4 h-4 mr-2" />
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </Button>

                {needsTwoFactor ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-amber-400 hover:text-amber-300 text-sm transition-colors font-medium"
                      disabled={loading}
                    >
                      ← Back to login
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-amber-400 hover:text-amber-300 text-sm transition-colors font-medium"
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
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full border-slate-700/50" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-900 px-4 text-slate-500 font-medium">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-700/50 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm py-6"
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
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-slate-500 leading-relaxed">
              <Shield className="w-3 h-3 inline mr-1" />
              Protected by enterprise-grade security • Your legacy is encrypted and sacred
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}