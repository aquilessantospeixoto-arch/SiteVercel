import {hash} from '../../../../lib/core';
import {discordConfig,discordDb,validTicket,resultPage} from '../../../../lib/discord';
import {discordProfile} from '../../../../lib/discord-profile.mjs';
export const runtime='nodejs';
export async function GET(req){
 const c=discordConfig();if(!c)return resultPage('Discord ainda nao configurado.',503);
 const query=new URL(req.url).searchParams,state=query.get('state');
 if(!validTicket(state))return resultPage('Estado OAuth invalido.',400);
 let accessToken='';
 try{
  const sql=await discordDb();
  const states=await sql`DELETE FROM discord_oauth_states WHERE state_hash=${hash('discord:'+state)} AND expires_at>now() RETURNING license_id,hwid_hash`;
  if(!states.length)return resultPage('Autorizacao expirada ou ja utilizada.',400);
  const code=query.get('code');if(query.has('error')||!code||code.length>4096)return resultPage('Autorizacao cancelada. Nenhum perfil foi alterado.',400);
  const tokenResponse=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.clientId,client_secret:c.secret,grant_type:'authorization_code',code,redirect_uri:c.redirect}),signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!tokenResponse.ok)return resultPage('O Discord recusou a autorizacao. Tente novamente.',502);
  const token=await tokenResponse.json();
  if(typeof token.access_token!=='string'||!token.access_token||!String(token.scope||'').split(' ').includes('identify'))return resultPage('Autorizacao incompleta.',502);
  accessToken=token.access_token;
  const response=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)return resultPage('Nao foi possivel obter o perfil do Discord.',502);
  const profile=discordProfile(await response.json()),binding=states[0];
  const saved=await sql`INSERT INTO discord_profiles(license_id,discord_id,display_name,avatar_path) SELECT l.id,${profile.id},${profile.name},${profile.avatar_path} FROM licenses l LEFT JOIN accounts a ON a.id=l.account_id WHERE l.id=${binding.license_id} AND l.hwid_hash=${binding.hwid_hash} AND l.status='active' AND l.redeemed_at IS NOT NULL AND COALESCE(a.banned,false)=false AND (l.expires_at IS NULL OR l.expires_at>now()) ON CONFLICT (license_id) DO UPDATE SET discord_id=EXCLUDED.discord_id,display_name=EXCLUDED.display_name,avatar_path=EXCLUDED.avatar_path,updated_at=now() RETURNING license_id`;
  if(!saved.length)return resultPage('Licenca revogada, expirada ou HWID alterado. Vinculo nao salvo.',403);
  return resultPage('Discord vinculado. Nome e avatar foram atualizados.');
 }catch{return resultPage('Falha ao concluir o vinculo. Tente novamente pelo loader.',500);}
 finally{if(accessToken)try{await fetch('https://discord.com/api/oauth2/token/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.clientId,client_secret:c.secret,token:accessToken,token_type_hint:'access_token'}),signal:AbortSignal.timeout(5000)});}catch{}}
}
