import { unstable_noStore as noStore } from 'next/cache';
import SecurityPageClient from './client';

export default function SecurityPage() {
  // Disable static generation for this route
  noStore();
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto py-8 px-4">
        <SecurityPageClient />
      </div>
    </div>
  );
}
