import type {MetadataRoute} from 'next';

// Required when the same route is built with output: 'export' (PHP hosting).
export const dynamic = 'force-static';

// Replaces the Duda robots.txt. The old file also carried a `Content-Signal` line
// (search=yes, ai-input=yes, ai-train=yes); that is a content-licensing decision for the
// owner, not something this map should silently reassert. See docs/redirects/301-map.md.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://www.trukafrik.com/sitemap.xml',
    host: 'https://www.trukafrik.com',
  };
}
