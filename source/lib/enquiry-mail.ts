import nodemailer from 'nodemailer';
import type {Enquiry} from './enquiry';

export const ENQUIRY_RECIPIENT = 'chris@trukafrik.com';
const mailbox = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const hostname = /^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
export function smtpConfig(env:Record<string,string|undefined>=process.env) {
 const {SMTP_HOST:host,SMTP_PORT:portText,SMTP_USER:user,SMTP_PASS:pass,SMTP_FROM:from}=env;
 if(!host||host.length>253||!hostname.test(host)||!portText||!/^\d+$/.test(portText)||!user||/[\r\n\x00]/.test(user)||!pass||!from||!mailbox.test(from))throw new Error('SMTP configuration unavailable');
 const port=Number(portText);if(port<1||port>65535)throw new Error('Invalid SMTP port');
 if(env.SMTP_SECURE!==undefined&&!['true','false'].includes(env.SMTP_SECURE))throw new Error('Invalid SMTP TLS mode');
 const secure=env.SMTP_SECURE===undefined?port===465:env.SMTP_SECURE==='true';
 return {from,options:{host,port,secure,requireTLS:!secure,ignoreTLS:false,auth:{user,pass},tls:{rejectUnauthorized:true,minVersion:'TLSv1.2' as const},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true,logger:false as const,debug:false}};
}
export async function sendEnquiry(data:Enquiry) {
 const {from,options}=smtpConfig();
 if(!mailbox.test(data.email))throw new Error('Invalid reply mailbox');
 const transport=nodemailer.createTransport(options);
 try {
  const info=await transport.sendMail({from:{address:from,name:'SITRAK website'},to:{address:ENQUIRY_RECIPIENT,name:''},replyTo:{address:data.email,name:''},envelope:{from,to:[ENQUIRY_RECIPIENT]},subject:'SITRAK website enquiry',text:`New website enquiry\n\nSelected model: ${data.model||'Not selected'}\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone||'Not provided'}\n\nMessage:\n${data.message||'Not provided'}\n\nConsent to contact: Yes\n`,disableFileAccess:true,disableUrlAccess:true});
  if(!info.accepted.some(address=>String(address).toLowerCase()===ENQUIRY_RECIPIENT)||info.rejected.length)throw new Error('Recipient not accepted');
  return {id:info.messageId};
 } finally {transport.close();}
}
