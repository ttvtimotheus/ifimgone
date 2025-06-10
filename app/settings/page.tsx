import { unstable_noStore as noStore } from 'next/cache';
import SettingsPageClient from './client';

export default function SettingsPage() {
  // Disable static generation for this route
  noStore();
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto py-8 px-4">
        <SettingsPageClient />
      </div>
    </div>
  );
}
