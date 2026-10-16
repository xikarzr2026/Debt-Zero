import type { NextConfig } from 'next';

// Set NEXT_PUBLIC_BASE_PATH when the site is served from a sub-path (GitHub Pages sets "/Debt-Zero" in CI).
// Leave it unset for local builds, Vercel, or any host that serves the app from the domain root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
