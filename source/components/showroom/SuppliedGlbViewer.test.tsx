import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';

// The approved model renders only when the preview flag is set (and never in production).
vi.hoisted(()=>{process.env.NEXT_PUBLIC_SITRAK_PREVIEW_3D='1';});

import {suppliedModelFor,suppliedModels} from './supplied-models';
import {SuppliedGlbViewer} from './SuppliedGlbViewer';

afterEach(cleanup);

// A fully consistent approval used to exercise the loader path (record + hash + URL).
const approvedEntry=()=>({...suppliedModels[0],approvalRecord:'test-approval',browserUrl:'/approved/c7h.glb'});

describe('supplied GLB identity registry',()=>{
 it('registers exactly the seven supplied files and only serves an approval-backed URL',()=>{
  expect(suppliedModels).toHaveLength(7);
  // A served URL only exists behind an approval record (and the build-time flag).
  const served=suppliedModels.filter(m=>m.approvalRecord&&m.browserUrl);
  for(const entry of served)expect(entry.approvalRecord!.length).toBeGreaterThan(0);
  for(const model of suppliedModels)expect(model.sha256).toMatch(/^[0-9a-f]{64}$/);
 });
 it('records user-designated identities against catalog models',()=>{
  // C-series retired by user ruling: the c7h file stays, but it is bound to no live catalog model.
  const c7h=suppliedModels.find(model=>model.literalFilename==='c7h.glb');
  expect(c7h?.catalogModelId).toBeNull();
  expect(suppliedModelFor('sitrak-c7h')).toBeNull();
  expect(suppliedModelFor('howo-max')?.literalFilename).toBe('c7_max.glb');
  expect(suppliedModelFor('howo-tapa')?.literalFilename).toBe('-HOWO-T7S-6X4-TIPPER-.glb');
  const tipper=suppliedModels.find(m=>m.literalFilename==='SITRACK G7S TIPPER 6X4.glb');
  expect(tipper?.userDesignatedName).toBe('SITRAK G7S 6×4 tipper');
  expect(tipper?.catalogModelId).toBeNull(); // distinct from price-sheet G7S tractor
 });

 it('never returns another truck asset for an unmapped model',()=>{
  for(const id of['sitrak-g7s-tractor','unmapped-model'])expect(suppliedModelFor(id)).toBeNull();
 });
});

describe('SuppliedGlbViewer fail-closed behavior',()=>{
 it('shows an explicit model-specific unavailable state with no viewer or substitute',()=>{
  render(<SuppliedGlbViewer modelId="howo-7" modelName="HOWO 7"/>);
  const status=screen.getByRole('status');
  expect(status).toHaveTextContent('HOWO 7');
  expect(status).toHaveTextContent(/no matching supplied model|not available/i);
  expect(screen.queryByTestId('supplied-glb-stage')).toBeNull();
  expect(screen.queryByRole('button',{name:/rotate|orbit|zoom/i})).toBeNull();
 });
 it('does not activate a candidate that has no approved served URL',()=>{
  const load=vi.fn();
  render(<SuppliedGlbViewer modelId="sitrak-c7h" modelName="SITRAK C7H" loadModel={load}
   entry={{...approvedEntry(),renderApproved:false,browserUrl:null}}/>);
  expect(load).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent(/not available yet|does not yet have an approved, served 3D model/i);
  expect(screen.queryByTestId('supplied-glb-stage')).toBeNull();
 });
 it('renders only mesh-supported controls for an approved served asset',async()=>{
  const dispose=vi.fn();
  const load=vi.fn(async()=>({dispose,triangles:1000}));
  render(<SuppliedGlbViewer modelId="sitrak-c7h" modelName="SITRAK C7H" loadModel={load} entry={approvedEntry()}/>);
  const stage=await screen.findByTestId('supplied-glb-stage');
  expect(stage).toBeTruthy();
  expect(await screen.findByText(/Loaded 3D model/i)).toBeTruthy();
  const call=(load.mock.calls as unknown[][])[0];
  expect(call[0]).toBe('/approved/c7h.glb');
  expect(typeof call[1]).toBe('function');
  expect(typeof call[4]).toBe('function'); // context-loss terminal hook
  expect(typeof call[5]).toBe('object'); // AbortSignal for cancel
  expect(screen.getByRole('button',{name:/zoom in/i})).toBeTruthy();
  expect(screen.getByRole('button',{name:/reset/i})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/open (left|right) door/i})).toBeNull();
  expect(screen.queryByRole('button',{name:/reveal engine/i})).toBeNull();
 });
 it('routes a missing WebGL context to the photo fallback with a distinct no-GPU message',async()=>{
 const load=vi.fn().mockRejectedValueOnce(Object.assign(new Error('3D graphics are unavailable in this browser.'),{code:'no-gpu'}));
 render(<SuppliedGlbViewer modelId="sitrak-c7h" modelName="SITRAK C7H" loadModel={load} entry={approvedEntry()}/>);
 expect(await screen.findByText(/cannot create a WebGL context/i)).toBeTruthy();
 expect(screen.getByRole('button',{name:/retry 3d model/i})).toBeTruthy();
});
it('notes zoom and reset are inert until a model is actually resident',async()=>{
 const load=vi.fn().mockRejectedValueOnce(new Error('decode failed'));
 render(<SuppliedGlbViewer modelId="sitrak-c7h" modelName="SITRAK C7H" loadModel={load} entry={approvedEntry()}/>);
 await screen.findByRole('button',{name:/retry 3d model/i});
 expect((screen.getByRole('button',{name:/zoom in on the supplied model/i}) as HTMLButtonElement).disabled).toBe(true);
 expect((screen.getByRole('button',{name:/reset view/i}) as HTMLButtonElement).disabled).toBe(true);
});
it('reports a load failure and retries only on request',async()=>{
  const load=vi.fn().mockRejectedValueOnce(new Error('decode failed')).mockResolvedValueOnce({dispose:vi.fn(),triangles:10});
  render(<SuppliedGlbViewer modelId="sitrak-c7h" modelName="SITRAK C7H" loadModel={load} entry={approvedEntry()}/>);
  // Wait for the SETTLED failure state, not the transient loading status.
  const retry=await screen.findByRole('button',{name:/retry 3d model/i});
  await waitFor(()=>expect(screen.getByText(/could not load/i)).toBeTruthy());
  expect(screen.queryByText(/loading 3d model/i)).toBeNull();
  expect(retry).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:/retry 3d model/i}));
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(2));
 });
});
