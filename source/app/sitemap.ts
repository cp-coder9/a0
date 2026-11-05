import type {MetadataRoute} from 'next';

// Required when the same route is built with output: 'export' (PHP hosting).
export const dynamic = 'force-static';

// Canonical host for the new site. Keep in sync with lib/redirect-rules.ts and the
// host-level canonicalisation described in docs/redirects/301-map.md.
const ORIGIN = 'https://www.trukafrik.com';

const routes: {path: string; priority: number; changeFrequency: 'weekly' | 'monthly'}[] = [
  {path: '/', priority: 1, changeFrequency: 'weekly'},
  {path: '/models/g7h', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/models/g7s', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/models/howo-tapa', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/models/howo-max', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/models/howo-64330-tipper', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/range', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/about', priority: 0.7, changeFrequency: 'monthly'},
  {path: '/finance', priority: 0.7, changeFrequency: 'monthly'},
  {path: '/parts', priority: 0.8, changeFrequency: 'monthly'},
  {path: '/pre-owned', priority: 0.8, changeFrequency: 'monthly'},
  {path: '/privacy-policy', priority: 0.3, changeFrequency: 'monthly'},
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({path, priority, changeFrequency}) => ({
    url: ORIGIN + path,
    lastModified,
    changeFrequency,
    priority,
  }));
}
