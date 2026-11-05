import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
it('excludes the removed equipment brand from page, footer and layout importer',()=>{const brand=['shan','tui'].join('');for(const file of ['app/page.tsx','components/Primitives.tsx','scripts/import-layout.py'])expect(readFileSync(file,'utf8').toLowerCase()).not.toContain(brand)});
