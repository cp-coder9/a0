import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Home from '../app/page';
it('includes a floating social rail with the confirmed WhatsApp number and profile links',()=>{
 const html=renderToStaticMarkup(<Home/>);
 expect(html).toContain('aria-label="Social media"');
 expect(html).toContain('https://wa.me/27609412357');
 expect(html).toContain('https://www.facebook.com/trukafrik');
 expect(html).toContain('https://www.instagram.com/trukafrik');
 expect(html).not.toContain('https://wa.me/270609412357');
});
