import {validSessionToken,validClientHwid} from '../../../../../lib/client-password.mjs';
import {json} from '../../../../../lib/core';
import {discordConfig,newTicket} from '../../../../../lib/discord';
import {clientDb,sessionAccount,menuLicense} from '../../../../../lib/client-auth';
export const runtime='nodejs';
export async function POST(req){
 const config=discordConfig();if(!config)return json({ok:false,error:'Discord nao configurado.'},503);
 const b=await req.json().catch(()=>({}));if(!validSessionToken(b.token)||!validClientHwid(b.hwid))return json({ok:false,error:'Sessao expirada.'},401);
 try{const sql=await clientDb(),account=await sessionAccount(sql,b.token,b.hwid);if(!account)return json({ok:false,error:'Sessao expirada.'},401);const license=await menuLicense(sql,account,b.hwid);if(!license)return json({ok:false,error:'Resgate uma key do Menu para vincular Discord.'},403);const ticket=await newTicket(sql,license,b.hwid);return json({ok:true,url:config.origin+'/api/discord/authorize?ticket='+ticket});}
 catch{return json({ok:false,error:'Falha ao iniciar vinculo Discord.'},500);}
}
