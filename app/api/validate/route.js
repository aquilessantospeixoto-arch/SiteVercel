import {validKey,json} from '../../../lib/core';
import {discordConfig,discordDb,activeLicense} from '../../../lib/discord';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));
 if(!validKey(b.key)||typeof b.hwid!=='string'||b.hwid.length<8||b.hwid.length>256)return json({valid:false},400);
 try{
  const sql=await discordDb(),license=await activeLicense(sql,b.key,b.hwid);
  if(!license)return json({valid:false,expires_at:null});
  const profiles=await sql`SELECT discord_id,display_name,avatar_path FROM discord_profiles WHERE license_id=${license.id} LIMIT 1`,p=profiles[0],expiry=license.expires_at;
  return json({valid:true,username:license.username||'',expires_at:expiry,expires_at_unix:expiry?Math.floor(new Date(expiry).getTime()/1000):null,server_time:Math.floor(Date.now()/1000),plan:expiry?'licensed':'lifetime',discord_available:!!discordConfig(),discord:p?{id:p.discord_id,name:p.display_name,avatar_path:p.avatar_path}:null});
 }catch{return json({valid:false,error:'Erro no servidor'},500);}
}
