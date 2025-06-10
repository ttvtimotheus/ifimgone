import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import VerifyContactClient from './client';

export default function VerifyContactPage() {
  // Disable static generation for this route
  noStore();
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto py-8 px-4">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        }>
          <VerifyContactClient />
        </Suspense>
      </div>
    </div>
  );
}
