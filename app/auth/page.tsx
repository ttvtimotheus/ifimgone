import { unstable_noStore as noStore } from 'next/cache';
import AuthPageClient from './client';

export default function AuthPage() {
  // Disable static generation for this route
  noStore();
  
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AuthPageClient />
      </div>
    </div>
  );
}
