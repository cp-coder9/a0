import {describe,it,expect} from 'vitest';
import {createTruckModel,truckIllustrations,initialView,viewReducer} from '../lib/truck-3d';
describe('reference-based truck illustrations',()=>{
 it.each(['g7h','g7s','howo-tapa','howo-max'])('builds articulated geometry and cockpit for %s',id=>{const m=createTruckModel(id);expect(m.root.getObjectByName('engine')).toBeTruthy();expect(m.root.getObjectByName('steering-wheel')).toBeTruthy();expect(m.root.getObjectByName('dashboard')).toBeTruthy();expect(m.doors).toHaveLength(2);expect(m.root.getObjectByName('tipper-body')!==undefined).toBe(id==='howo-tapa');expect(truckIllustrations[id].steering).toBe(id==='g7h'?'right':'illustrative');});
 it('toggles controls independently and pauses on cockpit entry',()=>{let s=initialView(false);s=viewReducer(s,'left');expect(s.left).toBe(true);s=viewReducer(s,'right');s=viewReducer(s,'service');expect(s.right&&s.service).toBe(true);s=viewReducer(s,'cockpit');expect(s.cockpit).toBe(true);expect(s.rotating).toBe(false);s=viewReducer(s,'exterior');expect(s.cockpit).toBe(false);});
 it('motion preference initialization is idempotent under strict effect replay',()=>{const s=initialView(true);const on=viewReducer(viewReducer(s,'motion-on'),'motion-on');expect(on.rotating).toBe(true);expect(viewReducer(on,'motion-off').rotating).toBe(false)});
 it('starts paused for reduced motion and allows explicit rotation',()=>{const s=initialView(true);expect(s.rotating).toBe(false);expect(viewReducer(s,'rotate').rotating).toBe(true)});
});
