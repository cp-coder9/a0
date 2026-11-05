import type {NextConfig} from 'next';
import {legacyRedirects} from './lib/redirect-rules';

// Two deployment targets share this app:
//  - Node host (default): next.config redirects() answers 308 for legacy URLs.
//  - PHP shared hosting (NEXT_EXPORT=1): a fully static export; legacy redirects and the
//    enquiry endpoint are served by Apache/.htaccess and PHP (see scripts/build-php.mjs).
// Keep dev artifacts away from production output. Several sessions/builds can run against
// this checkout; `next build` clears `.next`, which crashes a running `next dev` that shares it.
const isDev = process.env.NODE_ENV === 'development';
const isExport = process.env.NEXT_EXPORT === '1';
const distDir = process.env.NEXT_DIST_DIR || (isDev ? '.next-dev' : '.next');

const nextConfig = isExport
  ? {
      distDir,
      output: 'export' as const,
      trailingSlash: false,
      images: {unoptimized: true as const},
    }
  : {
      distDir,
      async redirects() {
        return legacyRedirects.map(({source, destination}) => ({
          source,
          destination,
          permanent: true,
        }));
      },
    };

export default nextConfig as NextConfig;
