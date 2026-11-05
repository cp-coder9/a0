#!/usr/bin/env node
// Generates docs/redirects/301-map.csv from the single source of truth.
// Run: node scripts/redirect-map.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {legacyRedirects} from '../lib/redirect-rules.ts';

const STATUS = 301;
const cols = ['source_url', 'destination_url', 'status', 'category', 'equivalence', 'old_page_title', 'note'];
const esc = (v) => '"' + String(v).replaceAll('"', '""') + '"';
const rows = legacyRedirects.map((r) => [
  'https://www.trukafrik.com' + r.source,
  'https://www.trukafrik.com' + r.destination,
  STATUS,
  r.category,
  r.equivalence,
  r.oldTitle,
  r.note,
]);
const csv = [cols, ...rows].map((r) => r.map(esc).join(',')).join('\n') + '\n';
mkdirSync('docs/redirects', {recursive: true});
writeFileSync('docs/redirects/301-map.csv', csv);
console.log('wrote docs/redirects/301-map.csv (' + legacyRedirects.length + ' rules)');
