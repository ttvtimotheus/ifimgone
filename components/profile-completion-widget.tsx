'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Shield,
  ArrowRight,
  X
} from 'lucide-react';
import Link from 'next/link';
import { ProfileService, ProfileStats } from '@/lib/profile-service';
import { useAuth } from '@/hooks/use-auth';
import { useSafeAnimation, SafeAnimationVariants } from '@/hooks/use-safe-animation';

interface ProfileCompletionWidgetProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function ProfileCompletionWidget({ onDismiss, showDismiss = false }: ProfileCompletionWidgetProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMounted } = useSafeAnimation();

  const fetchProfileData = useCallback(async () => {
    if (!user || !isMounted()) return;

    try {
      setLoading(true);
      const profileService = ProfileService.getInstance();
      
      const [profileStats, profileRecommendations] = await Promise.all([
        profileService.getProfileStats(user.id),
        profileService.getRecommendations(user.id)
      ]);

      if (isMounted()) {
        setStats(profileStats);
        setRecommendations(profileRecommendations);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [user, isMounted]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user, fetchProfileData]);

  if (loading || !stats) {
    return null;
  }

  // Don't show if profile is complete and no recommendations
  if (stats.is_complete && recommendations.length === 0) {
    return null;
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCompletionBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <motion.div
      {...SafeAnimationVariants.slideInFromBottom}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-800 bg-slate-900/50 relative">
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Completion
              </CardTitle>
              <CardDescription>
                Complete your profile to unlock all features
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={getCompletionBadgeColor(stats.profile_completion)}
            >
              {Math.round(stats.profile_completion)}%
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className={getCompletionColor(stats.profile_completion)}>
                {Math.round(stats.profile_completion)}% Complete
              </span>
            </div>
            <Progress 
              value={stats.profile_completion} 
              className="h-2"
            />
          </div>

          {/* Verification Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {stats.email_verified ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
              <span className="text-sm text-slate-300">Email</span>
            </div>
            <div className="flex items-center space-x-2">
              {stats.phone_verified ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
              <span className="text-sm text-slate-300">Phone</span>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Recommendations</h4>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400">{recommendation}</span>
                  </div>
                ))}
                {recommendations.length > 3 && (
                  <p className="text-xs text-slate-500">
                    +{recommendations.length - 3} more recommendations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Link href="/profile">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
              Complete Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}