import {describe, expect, it} from 'vitest';
import legacyPaths from './fixtures/legacy-paths.json';
import {legacyRedirects, liveRoutes, liveHomeFragments} from '../lib/redirect-rules';
import nextConfig from '../next.config';

const isPattern = (source: string) => source.includes(':');

/** Match an old path against a rule source, including Next.js :param / :param* patterns. */
function matches(source: string, path: string): boolean {
  if (!isPattern(source)) return path === source;
  const regex = source.replace(/:[a-zA-Z]+\*/g, '.*').replace(/:[a-zA-Z]+/g, '[^/]+');
  return new RegExp('^' + regex + '$').test(path);
}

describe('301 map integrity', () => {
  it('covers every legacy URL recovered from the live site and the archive', () => {
    const covered = (path: string) =>
      liveRoutes.includes(path) || legacyRedirects.some((rule) => matches(rule.source, path));
    const missing = legacyPaths.filter((path) => !covered(path));
    expect(missing).toEqual([]);
  });

  it('has no duplicate sources', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const {source} of legacyRedirects) {
      if (seen.has(source)) dupes.push(source);
      seen.add(source);
    }
    expect(dupes).toEqual([]);
  });

  it('uses well-formed lowercase sources that are not live routes', () => {
    for (const {source} of legacyRedirects) {
      expect(source.startsWith('/')).toBe(true);
      expect(source).toBe(source.toLowerCase());
      expect(source).not.toMatch(/[?#]/);
      expect(source.endsWith('/')).toBe(false);
      expect(liveRoutes).not.toContain(source);
    }
  });

  it('points every destination at a real route or a real home-page fragment', () => {
    for (const {source, destination} of legacyRedirects) {
      const [path, fragment] = destination.split('#');
      expect(liveRoutes, `${source} -> ${destination}`).toContain(path);
      if (fragment !== undefined) {
        expect(liveHomeFragments, `${source} -> ${destination}`).toContain('#' + fragment);
      }
    }
  });

  it('never chains redirects', () => {
    for (const {source, destination} of legacyRedirects) {
      const path = destination.split('#')[0];
      const chained = legacyRedirects.some((candidate) => candidate.source === path || matches(candidate.source, path));
      expect(chained, `${source} -> ${destination} is a second hop`).toBe(false);
    }
  });

  it('documents every lost or retired page', () => {
    for (const rule of legacyRedirects) {
      if (rule.equivalence === 'lost' || rule.equivalence === 'retired') {
        expect(rule.note.length, rule.source).toBeGreaterThan(40);
      }
    }
  });

  it('publishes a sitemap that lists exactly the live routes', async () => {
    const sitemap = (await import('../app/sitemap')).default;
    const robots = (await import('../app/robots')).default;
    const entries = sitemap();
    expect(entries.map((e) => new URL(e.url).pathname)).toEqual(liveRoutes);
    const rules = robots().rules;
    const first = Array.isArray(rules) ? rules[0] : rules;
    expect(first.userAgent).toBe('*');
    expect(first.allow).toBe('/');
    expect(first.disallow).toBe('/api/');
    expect(robots().sitemap).toBe('https://www.trukafrik.com/sitemap.xml');
  });

  it('wires every rule into next.config as a permanent redirect', async () => {
    const configured = await nextConfig.redirects!();
    expect(configured).toHaveLength(legacyRedirects.length);
    for (const rule of configured) {
      expect(rule.permanent).toBe(true);
      expect(legacyRedirects.some((r) => r.source === rule.source && r.destination === rule.destination)).toBe(true);
    }
  });
});
