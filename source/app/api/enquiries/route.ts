import {sendEnquiry} from '../../../lib/enquiry-mail';
import {validateEnquiry} from '../../../lib/enquiry';
export const runtime='nodejs';
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin&&origin!==process.env.ENQUIRY_PUBLIC_ORIGIN)return Response.json({error:'Request origin not allowed.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>16384)return Response.json({error:'Enquiry too large.'},{status:413});
 let input:unknown;try{const text=await request.text();if(Buffer.byteLength(text,'utf8')>16384)return Response.json({error:'Enquiry too large.'},{status:413});input=JSON.parse(text)}catch{return Response.json({error:'Invalid JSON.'},{status:400})}
 const result=validateEnquiry(input);if(!result.ok)return Response.json({errors:result.errors},{status:400});
 try{const {id}=await sendEnquiry(result.data);return Response.json({sent:true,delivery:'email',id},{status:201,headers:{'Cache-Control':'no-store'}})}catch{return Response.json({sent:false,error:'Email is unavailable. Please call 0820748725 or try again later.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
