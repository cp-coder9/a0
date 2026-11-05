// @vitest-environment node
import {it,expect,vi,afterEach} from 'vitest';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {POST} from '../app/api/enquiries/route';
afterEach(()=>vi.unstubAllEnvs());
it('validates submissions and leaves private records untouched when mail is unavailable',async()=>{const dir=await mkdtemp(join(process.env.TMPDIR||process.cwd(),'sitrak-test-'));vi.stubEnv('ENQUIRY_DATA_DIR',dir);for(const key of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'])vi.stubEnv(key,'');const previous='existing private record';await writeFile(join(dir,'existing.json'),previous);try{const bad=await POST(new Request('http://localhost/api/enquiries',{method:'POST',body:'{}'}));expect(bad.status).toBe(400);const good=await POST(new Request('http://localhost/api/enquiries',{method:'POST',body:JSON.stringify({name:'Test Operator',email:'test@example.com',consent:true})}));expect(good.status).toBe(503);expect(await good.json()).toMatchObject({sent:false,error:expect.any(String)});expect(await readdir(dir)).toEqual(['existing.json']);expect(await readFile(join(dir,'existing.json'),'utf8')).toBe(previous);}finally{await rm(dir,{recursive:true,force:true})}});
