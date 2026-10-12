import type { NextConfig } from 'next';

// Deploys as a fully static site (`out/`), the same as the old Vite build, so it
// can keep living on GitHub Pages. BASE_PATH sets a sub-path for project hosting,
// e.g. BASE_PATH=/immersive-panel-v2/arsenal npm run build.
// trailingSlash gives every route a directory index (connect-demo/index.html),
// which GitHub Pages serves without an SPA fallback.
const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
