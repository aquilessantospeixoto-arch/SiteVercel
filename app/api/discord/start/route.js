import {validKey,json} from '../../../../lib/core';
import {discordConfig,discordDb,activeLicense,newTicket} from '../../../../lib/discord';
export const runtime='nodejs';
export async function POST(req){
 const config=discordConfig();if(!config)return json({ok:false,error:'Discord ainda nao configurado no servidor.'},503);
 const b=await req.json().catch(()=>({}));
 if(!validKey(b.key)||typeof b.hwid!=='string'||b.hwid.length<8||b.hwid.length>256)return json({ok:false,error:'Key ou HWID invalido.'},400);
 try{
  const sql=await discordDb(),license=await activeLicense(sql,b.key,b.hwid);
  if(!license)return json({ok:false,error:'Licenca invalida para vincular Discord.'},403);
  const ticket=await newTicket(sql,license,b.hwid);
  return json({ok:true,url:config.origin+'/api/discord/authorize?ticket='+ticket});
 }catch{return json({ok:false,error:'Falha ao iniciar vinculo Discord.'},500);}
}
