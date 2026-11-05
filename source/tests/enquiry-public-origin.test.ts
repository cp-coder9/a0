// @vitest-environment node
import {afterEach,it,expect,vi} from 'vitest';
import {POST} from '../app/api/enquiries/route';
afterEach(()=>vi.unstubAllEnvs());
function request(origin:string){return new Request('http://127.0.0.1:3100/api/enquiries',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})}
it('rejects a public origin unless explicitly configured',async()=>{vi.stubEnv('ENQUIRY_PUBLIC_ORIGIN','');expect((await POST(request('https://preview.example'))).status).toBe(403)});
it('accepts the exact configured public origin and still validates the request',async()=>{vi.stubEnv('ENQUIRY_PUBLIC_ORIGIN','https://preview.example');expect((await POST(request('https://preview.example'))).status).toBe(400)});
it('does not trust a different origin or a configured-domain suffix lookalike',async()=>{vi.stubEnv('ENQUIRY_PUBLIC_ORIGIN','https://preview.example');for(const origin of ['https://unrelated.example','https://preview.example.evil.invalid'])expect((await POST(request(origin))).status).toBe(403)});
