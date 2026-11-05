import {heroTrucks} from '../../lib/hero-trucks.ts';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
// Read-only implementation import; write only approved QA evidence.
const source = new URL('../../lib/hero-trucks.ts', import.meta.url);
const path = new URL('../../docs/showroom-evidence/qa/carousel-contract.json', import.meta.url);
writeFileSync(path, JSON.stringify({utc: new Date().toISOString(), source: 'lib/hero-trucks.ts', sourceSha256: createHash('sha256').update(readFileSync(source)).digest('hex'), models: heroTrucks}, null, 2));
console.log(path.href);
