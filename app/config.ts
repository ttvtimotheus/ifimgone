// This file contains configuration to ensure client components using searchParams
// are properly handled during build and runtime

import { unstable_noStore as noStore } from 'next/cache';

// Call this function at the top of any page that uses searchParams or other dynamic features
export function disableStaticGeneration() {
  // This prevents the page from being statically generated
  noStore();
}

// Export default configuration for the app
export const config = {
  // Add any app-wide configuration here
  dynamicParams: true,
};
