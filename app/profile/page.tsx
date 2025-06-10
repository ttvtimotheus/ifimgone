import { unstable_noStore as noStore } from 'next/cache';
import ProfilePageClient from './client';

export default function ProfilePage() {
  // Disable static generation for this route
  noStore();
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto py-8 px-4">
        <ProfilePageClient />
      </div>
    </div>
  );
}
