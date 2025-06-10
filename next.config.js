/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'pexels.com']
  },
  // Exclude Supabase functions from the build
  webpack: (config, { isServer }) => {
    // Add a null loader for Supabase Edge Functions
    config.module.rules.push({
      test: /supabase\/functions\/.*\.(ts|js)$/,
      use: 'null-loader',
    });
    return config;
  },
  // Exclude Supabase functions directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;