import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import Home from '../../app/page';
import {SharedFooter} from '../Primitives';
it('preserves the prominent hero first and useful range navigation immediately after it',()=>{
 // The dealership section (05) lives in the shared footer rendered by app/layout.tsx.
 const html=renderToStaticMarkup(<><Home/><SharedFooter/></>);
 const main=html.slice(html.indexOf('<main id="main">'));
 expect(main).toMatch(/^<main id="main"><section[^>]*id="top"/);
 expect(main.indexOf('id="top"')).toBeLessThan(main.indexOf('id="the-range"'));
 expect(html.match(/<h1\b/g)).toHaveLength(1);
 for(const label of ['01 The truck','02 The range','03 The engineering','04 Backed by service'])expect(html).toContain(`data-screen-label="${label}"`);
 expect(html.indexOf('id="the-range"')).toBeLessThan(html.indexOf('id="the-engineering"'));
 expect(html).toContain('href="/models/g7h/"');
 expect(html.match(/id="the-range"/g)).toHaveLength(1);
});
