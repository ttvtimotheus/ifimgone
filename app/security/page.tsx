'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Key, Eye } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { SecurityDashboard } from '@/components/security-dashboard';
import { TwoFactorSetupComponent } from '@/components/two-factor-setup';

type SecurityView = 'dashboard' | 'setup-2fa';

export default function SecurityPage() {
  const [currentView, setCurrentView] = useState<SecurityView>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'setup-2fa':
        return (
          <TwoFactorSetupComponent
            onComplete={() => setCurrentView('dashboard')}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      default:
        return <SecurityDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'setup-2fa':
        return 'Two-Factor Authentication Setup';
      default:
        return 'Security Center';
    }
  };

  const getPageDescription = () => {
    switch (currentView) {
      case 'setup-2fa':
        return 'Secure your account with two-factor authentication';
      default:
        return 'Monitor and manage your account security';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20 max-w-6xl">
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                    <Shield className="w-8 h-8 mr-3 text-amber-500" />
                    {getPageTitle()}
                  </h1>
                  <p className="text-slate-400">{getPageDescription()}</p>
                </div>
                
                {currentView === 'dashboard' && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setCurrentView('setup-2fa')}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Setup 2FA
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}