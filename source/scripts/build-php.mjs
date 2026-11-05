#!/usr/bin/env node
// Builds a PHP-shared-hosting package: static export + PHP enquiry endpoint + .htaccess routing.
// Usage: node scripts/build-php.mjs
import {cp, mkdir, readFile, writeFile, rename, rm, readdir, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join, relative, sep} from 'node:path';
import {legacyRedirects} from '../lib/redirect-rules.ts';

const ROOT = process.cwd();
const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-').slice(0,19);
const OUT = join('E:/Sitrak-php-deploy', stamp);
const ROUTE = join(ROOT, 'app/api/enquiries/route.ts');
const ROUTE_OFF = ROUTE + '.off';

const sha256 = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
async function walk(dir, out = []) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

// .htaccess: canonical host, enquiry endpoint, the 72 legacy redirects, clean URLs, security.
const esc = (path) => path.replace(/\./g, '\\.');
const ruleLines = legacyRedirects.map(({source, destination}) => {
  const regex = source.startsWith('/') ? source.slice(1) : source;
  const pattern = regex.includes(':slug*')
    ? '^' + esc(regex.replace(':slug*', '')) + '(.*)$'
    : '^' + esc(regex) + '/?$';
  return `RewriteRule ${pattern} ${destination} [R=301,L,NE]`;
});

const htaccess = `# Truk Afrik — PHP shared-hosting build (${stamp})
# Static Next.js export + PHP enquiry endpoint. Do not serve source or private files.
Options -Indexes
DirectoryIndex index.html
<IfModule mod_dir.c>
  # Export output contains sibling directories (RSC payloads) for every page; without this Apache
  # would 301 /about to /about/ instead of serving about.html.
  DirectorySlash Off
</IfModule>

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# 1. Canonical host: apex and http both 301 to https://www.trukafrik.com
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^trukafrik\\.com$ [NC]
RewriteRule ^(.*)$ https://www.trukafrik.com/$1 [R=301,L]

# 2. Enquiry endpoint (the client still POSTs to /api/enquiries)
RewriteRule ^api/enquiries/?$ api/enquiries.php [L]

# 3. Legacy URLs recovered from three previous site generations (see docs/redirects/301-map.md)
${ruleLines.join('\n')}

# 4. Canonical URLs: no trailing slash (the RSC payload directories are removed)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.+)/$ /$1 [R=301,L]

# 5. Static export: /about -> /about.html, /models/g7h -> /models/g7h.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}\\.html -f
RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>

ErrorDocument 404 /404.html

# Never serve the private configuration or deploy notes
<FilesMatch "(^|/)(enquiry-config\\.php|enquiry-config\\.sample\\.php|deployment-manifest\\.json|README\\.md|DEPLOYMENT\\.md)$">
  Require all denied
</FilesMatch>
RedirectMatch 404 /(private|php)/

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  <FilesMatch "\\.(png|jpe?g|webp|avif|svg|glb|gltf|ktx2|hdr|exr|mp4|webm|pdf|woff2?)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
`;

// Temporarily hide the Node-only route so the static export does not see a POST handler.
// Tests import that route, so they are excluded from the export type-check too.
console.log('disabling app/api route for export…');
const TSCONFIG = join(ROOT, 'tsconfig.json');
let tsconfigOriginal;
await rename(ROUTE, ROUTE_OFF);
try {
  tsconfigOriginal = await readFile(TSCONFIG, 'utf8');
  // Next rewrites tsconfig.json and can leave trailing commas, which JSON.parse rejects.
  const tsconfig = JSON.parse(tsconfigOriginal.replace(/,\s*([}\]])/g, '$1'));
  tsconfig.exclude = [...new Set([...(tsconfig.exclude || []), 'tests', '**/*.test.ts', '**/*.test.tsx', 'backups', '.next-dev'])];
  await writeFile(TSCONFIG, JSON.stringify(tsconfig, null, 2) + '\n');
  console.log('running static export…');
  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    cwd: ROOT,
    env: {...process.env, NEXT_EXPORT: '1', NEXT_DIST_DIR: ''},
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('next build (export) failed with code ' + result.status);
} finally {
  if (existsSync(ROUTE_OFF) && !existsSync(ROUTE)) await rename(ROUTE_OFF, ROUTE);
  if (tsconfigOriginal !== undefined) await writeFile(TSCONFIG, tsconfigOriginal);
}

const OUTDIR = join(ROOT, 'out');
if (!existsSync(OUTDIR)) throw new Error('expected static export in ./out');

await rm(OUT, {recursive: true, force: true});
await mkdir(OUT, {recursive: true});
await cp(OUTDIR, OUT, {recursive: true});
await writeFile(join(OUT, '.htaccess'), htaccess);

// Next's static export writes a sibling directory of RSC payload files next to each page.
// Apache/mod_dir would answer /about with a 301 to /about/ instead of serving about.html, so
// those payload-only directories are removed from the deployable package.
async function stripPayloadDirs(dir, rel = '') {
  for (const entry of await readdir(join(dir, rel), {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.name === 'private') continue;
    const childRel = rel ? rel + '/' + entry.name : entry.name;
    const entries = await readdir(join(dir, childRel));
    if (entries.length > 0 && entries.every((name) => name.startsWith('__next.'))) {
      await rm(join(dir, childRel), {recursive: true, force: true});
    } else {
      await stripPayloadDirs(dir, childRel);
    }
  }
}
await stripPayloadDirs(OUT);

// PHP endpoint
await mkdir(join(OUT, 'api'), {recursive: true});
await cp(join(ROOT, 'php/enquiries.php'), join(OUT, 'api/enquiries.php'));
await cp(join(ROOT, 'php/enquiry-mail.php'), join(OUT, 'api/enquiry-mail.php'));

// Private SMTP config generated from .env.local (never inside the web root once deployed)
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env.local'), 'utf8'))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      return [line.slice(0, index), value];
    }),
);
const secure = String(env.SMTP_SECURE || '').toLowerCase() === 'true' || String(env.SMTP_PORT) === '465';
function phpString(value) {
  return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const config = [
  '<?php',
  '// Generated by scripts/build-php.mjs from .env.local. Upload ONE LEVEL ABOVE public_html.',
  'return [',
  "    'smtp_host'   => " + phpString(env.SMTP_HOST || 'mail.trukafrik.com') + ',',
  "    'smtp_port'   => " + (Number(env.SMTP_PORT) || (secure ? 465 : 587)) + ',',
  "    'smtp_mode'   => '" + (secure ? 'ssl' : 'starttls') + "',",
  "    'smtp_user'   => " + phpString(env.SMTP_USER || '') + ',',
  "    'smtp_pass'   => " + phpString(env.SMTP_PASS || '') + ',',
  "    'smtp_from'   => " + phpString(env.SMTP_FROM || env.SMTP_USER || '') + ',',
  "    'enquiry_to'  => 'chris@trukafrik.com',",
  "    'allowed_origins' => ['https://www.trukafrik.com', 'https://trukafrik.com'],",
  '    \'rate_limit\'  => 5,',
  '    \'rate_window_minutes\' => 10,',
  '];',
  '',
].join('\n');
await mkdir(join(OUT, 'private'), {recursive: true});
await writeFile(join(OUT, 'private/enquiry-config.php'), config);
await cp(join(ROOT, 'php/enquiry-config.sample.php'), join(OUT, 'private/enquiry-config.sample.php'));

await writeFile(join(OUT, 'DEPLOYMENT.md'), `# PHP shared-hosting package — ${stamp}

Static Next.js export + PHP enquiry endpoint. No Node.js required on the server.

## Upload layout
- Everything in this folder (except \`private/\`) → the site document root, e.g. \`/home/<cpanel-user>/public_html/\`.
- \`private/enquiry-config.php\` → **one level above** the document root, e.g. \`/home/<cpanel-user>/enquiry-config.php\`.
  It contains the SMTP credentials and must never sit inside the web root. The endpoint looks for it there.

## Verify after upload
1. \`https://www.trukafrik.com/\` renders; \`/range\`, \`/about\`, \`/finance\`, \`/parts\`, \`/pre-owned\`, \`/privacy-policy\` render.
2. \`/sitemap.xml\` and \`/robots.txt\` return 200, and the five model showrooms render: \`/models/g7h\`, \`/models/g7s\`, \`/models/howo-tapa\`, \`/models/howo-max\`, \`/models/howo-64330-tipper\`.
3. \`/about-us\` → 301 \`/about\`; \`/parts---nelspruit\` → 301 \`/parts\`; \`/shantui\` → 301 \`/\`.
4. Submit the enquiry form: expect a 201 JSON response and an email at \`chris@trukafrik.com\`.
   Invalid submission must return 400 and must not send mail.
5. \`/private/...\`, \`/enquiry-config.php\`, \`/deployment-manifest.json\` must return 403/404.
6. Confirm HTTPS and the apex→www redirect.

## Notes
- No Node, npm or server process is needed: Apache serves the static files, PHP handles the form.
- The 3D models, carousels, popups, intro, annotated carousel and all interactions are client-side
  JavaScript and work unchanged from the static export.
- If the host blocks PHP outbound SMTP, use the cPanel mail settings: same host/user/password as
  \`SMTP_*\` in \`.env.local\`, usually port 587 with STARTTLS (or 465 with SSL).
`);

const files = await walk(OUT);
const manifest = [];
for (const file of files) {
  if (file.endsWith('deployment-manifest.json')) continue;
  manifest.push({path: relative(OUT, file).split(sep).join('/'), bytes: (await stat(file)).size, sha256: await sha256(file)});
}
await writeFile(join(OUT, 'deployment-manifest.json'), JSON.stringify({generated: new Date().toISOString(), root: OUT, files: manifest}, null, 1));
console.log('package:', OUT);
console.log('files:', manifest.length, 'bytes:', manifest.reduce((sum, f) => sum + f.bytes, 0));
