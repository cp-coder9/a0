export type Enquiry={name:string;email:string;phone:string;model:string;message:string;consent:true};
export function validateEnquiry(input:unknown):{ok:true;data:Enquiry;errors:Record<string,string>}|{ok:false;errors:Record<string,string>;data?:never}{
 const o=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const str=(k:string)=>typeof o[k]==='string'?(o[k] as string).trim():'';
 const data={name:str('name'),email:str('email'),phone:str('phone'),model:str('model'),message:str('message'),consent:true as const};const errors:Record<string,string>={};
 if(!data.name||data.name.length>120)errors.name='Enter your name (up to 120 characters).';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>254)errors.email='Enter a valid email address.';
 if(data.phone&&(!/^[+()\d\s-]{7,30}$/.test(data.phone)))errors.phone='Enter a valid phone number.';
 if(data.model.length>120)errors.model='Select a truck.';
 if(data.message.length>2000)errors.message='Use no more than 2000 characters.';
 if(o.consent!==true)errors.consent='Consent is required.';
 return Object.keys(errors).length?{ok:false,errors}:{ok:true,data,errors};
}
