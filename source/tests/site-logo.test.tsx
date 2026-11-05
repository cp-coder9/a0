import {render,screen,cleanup,within} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {Header} from '../components/Header';
import {Footer} from '../components/Primitives';
afterEach(cleanup);
it('uses the actual intro artwork as a white transparent header logo',()=>{render(<Header/>);const logo=within(screen.getByRole('banner')).getByRole('img',{name:'SITRAK Truk Afrik'});expect(logo).toHaveAttribute('src','/intro/sitrak-truk-afrik-white.png');expect(screen.getByRole('link',{name:'SITRAK Truk Afrik home'})).toContainElement(logo)});
it('uses the same white artwork in the footer rather than the old separate mark',()=>{render(<Footer/>);const logo=within(screen.getByRole('contentinfo')).getByRole('img',{name:'SITRAK Truk Afrik'});expect(logo).toHaveAttribute('src','/intro/sitrak-truk-afrik-white.png');expect(logo).toHaveClass('footer-logo')});
