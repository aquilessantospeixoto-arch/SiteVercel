import {hash} from '../../../../lib/core';
import {discordConfig,discordDb,validTicket,resultPage} from '../../../../lib/discord';
export const runtime='nodejs';
export async function GET(req){
 const c=discordConfig();if(!c)return resultPage('Discord ainda nao configurado.',503);
 const ticket=new URL(req.url).searchParams.get('ticket');if(!validTicket(ticket))return resultPage('Vinculo invalido.',400);
 try{
  const sql=await discordDb(),rows=await sql`SELECT state_hash FROM discord_oauth_states WHERE state_hash=${hash('discord:'+ticket)} AND expires_at>now() LIMIT 1`;
  if(!rows.length)return resultPage('Vinculo expirado. Clique novamente em Vincular Discord.',400);
  const url=new URL('https://discord.com/oauth2/authorize');
  url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.redirect,response_type:'code',scope:'identify',state:ticket,prompt:'consent'}).toString();
  return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return resultPage('Falha ao iniciar autorizacao.',500);}
}
