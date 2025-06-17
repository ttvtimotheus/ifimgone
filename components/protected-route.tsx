'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Heart } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only redirect to auth if we've finished loading AND there's no user
    if (!loading) {
      setHasCheckedAuth(true);
      if (!user) {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth or if we haven't checked yet
  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-8 h-8 text-amber-500" />
        </div>
      </div>
    );
  }

  // If we've checked auth and there's no user, show nothing (redirect is happening)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}