// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {createServer} from 'node:tls';
import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
const realCreateTransport=nodemailer.createTransport.bind(nodemailer);
const cert=readFileSync(new URL('./fixtures/smtp/cert.pem',import.meta.url));
const key=readFileSync(new URL('./fixtures/smtp/key.pem',import.meta.url));
async function capture(reject=false,trust=true){
 const commands:string[]=[];let message='';
 const server=createServer({cert,key},socket=>{
  socket.setEncoding('utf8');socket.write('220 localhost test SMTP\r\n');let pending='';let data=false;
  socket.on('data',(chunk:string)=>{pending+=chunk;let end:number;while((end=pending.indexOf('\r\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+2);if(data){if(line==='.'){data=false;socket.write('250 captured locally\r\n')}else message+=line+'\r\n';continue}commands.push(line);if(line.startsWith('EHLO'))socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');else if(line.startsWith('AUTH'))socket.write('235 authenticated\r\n');else if(line.startsWith('MAIL'))socket.write('250 sender ok\r\n');else if(line.startsWith('RCPT'))socket.write(reject?'550 rejected test recipient\r\n':'250 recipient ok\r\n');else if(line==='DATA'){data=true;socket.write('354 send data\r\n')}else if(line==='QUIT'){socket.end('221 bye\r\n')}else socket.write('250 ok\r\n')}});
 });server.on('tlsClientError',()=>{});server.listen(0,'127.0.0.1');await once(server,'listening');
 const address=server.address();if(!address||typeof address==='string')throw new Error('No test port');
 for(const [k,v]of Object.entries({SMTP_HOST:'localhost',SMTP_PORT:String(address.port),SMTP_USER:'test-user',SMTP_PASS:'test-only-password',SMTP_FROM:'authorized@example.com',SMTP_SECURE:'true'}))vi.stubEnv(k,v);
 if(trust)vi.spyOn(nodemailer,'createTransport').mockImplementation(((options:SMTPTransport.Options)=>realCreateTransport({...options,tls:{...options.tls,ca:cert}})) as typeof nodemailer.createTransport);
 return {commands,get message(){return message},close:()=>new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
import {smtpConfig} from '../lib/enquiry-mail';
import {createServer as createPlainServer} from 'node:net';
import {POST} from '../app/api/enquiries/route';
const details={name:'Test Operator',email:'visitor@example.com',phone:'0820748725',model:'SITRAK C7H',message:'Book a drive <script>not HTML</script>',consent:true};
const request=(body:unknown=details)=>new Request('http://localhost/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs()});
it('uses a real local TLS SMTP connection with fixed envelope, reply-to and plain text',async()=>{const smtp=await capture();try{const response=await POST(request({...details,to:'attacker@example.com',from:'spoof@example.com'}));expect(response.status).toBe(201);expect(await response.json()).toMatchObject({sent:true,delivery:'email',id:expect.any(String)});expect(smtp.commands.filter(c=>c.startsWith('RCPT'))).toEqual(['RCPT TO:<chris@trukafrik.com>']);expect(smtp.commands).toContain('MAIL FROM:<authorized@example.com>');expect(smtp.message).toContain('Reply-To: visitor@example.com');expect(smtp.message).toContain('Content-Type: text/plain');for(const value of [details.model,details.name,details.email,details.phone,details.message])expect(smtp.message).toContain(value);expect(smtp.message).not.toContain('text/html');expect(smtp.message).not.toContain('attacker@example.com')}finally{await smtp.close()}});
it('returns a safe 503 when the real local SMTP server rejects the recipient',async()=>{const smtp=await capture(true);try{const response=await POST(request());expect(response.status).toBe(503);expect(await response.json()).toMatchObject({sent:false,error:expect.any(String)});expect(smtp.message).toBe('')}finally{await smtp.close()}});
it('rejects an untrusted SMTP certificate rather than disabling verification',async()=>{const smtp=await capture(false,false);try{expect((await POST(request())).status).toBe(503);expect(smtp.message).toBe('')}finally{await smtp.close()}});
it('enforces the 16 KiB limit in bytes, including multi-byte text',async()=>{const response=await POST(request({...details,extra:'界'.repeat(6000)}));expect(response.status).toBe(413)});
it('rejects malformed SMTP configuration and keeps TLS verification required',()=>{const env={SMTP_HOST:'smtp.example.com',SMTP_PORT:'587',SMTP_USER:'authorized@example.com',SMTP_PASS:'test-only',SMTP_FROM:'authorized@example.com'};expect(smtpConfig(env).options).toMatchObject({secure:false,requireTLS:true,ignoreTLS:false,tls:{rejectUnauthorized:true,minVersion:'TLSv1.2'}});for(const change of [{SMTP_PORT:'587junk'},{SMTP_PORT:'0'},{SMTP_HOST:'smtp://bad'},{SMTP_HOST:'smtp..example.com'},{SMTP_FROM:'sender@example..com'},{SMTP_FROM:'sender@example.com\r\nBcc: other@example.com'},{SMTP_SECURE:'yes'},{SMTP_USER:''},{SMTP_PASS:''}])expect(()=>smtpConfig({...env,...change})).toThrow()});
it('does not send authentication or mail when STARTTLS is refused',async()=>{const commands:string[]=[];const server=createPlainServer(socket=>{socket.setEncoding('utf8');socket.write('220 localhost test SMTP\r\n');socket.on('data',(data:string)=>{for(const line of data.trim().split('\r\n')){commands.push(line);socket.write(line.startsWith('EHLO')?'250 localhost\r\n':'500 TLS unavailable\r\n')}})});server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw new Error('No test port');for(const [k,v]of Object.entries({SMTP_HOST:'localhost',SMTP_PORT:String(address.port),SMTP_USER:'test-user',SMTP_PASS:'test-only',SMTP_FROM:'authorized@example.com',SMTP_SECURE:'false'}))vi.stubEnv(k,v);try{expect((await POST(request())).status).toBe(503);expect(commands).toContain('STARTTLS');expect(commands.some(c=>/^(AUTH|MAIL|RCPT|DATA)/.test(c))).toBe(false)}finally{await new Promise<void>(resolve=>server.close(()=>resolve()))}});
it('rejects CRLF reply-to injection before SMTP sends',async()=>{const smtp=await capture();try{const response=await POST(request({...details,email:'visitor@example.com\r\nBcc: attacker@example.com'}));expect(response.status).toBe(400);expect(smtp.commands).toEqual([])}finally{await smtp.close()}});
it('fails closed without SMTP configuration instead of saving PII as success',async()=>{for(const key of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'])vi.stubEnv(key,'');const response=await POST(request());expect(response.status).toBe(503);expect(await response.json()).toMatchObject({sent:false,error:expect.any(String)});});
