import {randomBytes} from 'node:crypto';
import {setup,hash} from './core';
export function discordConfig(){
 if(process.env.DISCORD_ENABLED!=='true')return null;
 try{
  const u=new URL(process.env.APP_ORIGIN),clientId=process.env.DISCORD_CLIENT_ID||'',secret=process.env.DISCORD_CLIENT_SECRET||'';
  if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!/^[0-9]{17,20}$/.test(clientId)||!secret||!process.env.SESSION_SECRET)return null;
  return {origin:u.origin,clientId,secret,redirect:u.origin+'/api/discord/callback'};
 }catch{return null;}
}
export async function discordDb(){
 const sql=await setup();
 await sql`CREATE TABLE IF NOT EXISTS discord_profiles (license_id BIGINT PRIMARY KEY REFERENCES licenses(id) ON DELETE CASCADE,discord_id TEXT NOT NULL,display_name TEXT NOT NULL,avatar_path TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
 await sql`CREATE TABLE IF NOT EXISTS discord_oauth_states (state_hash TEXT PRIMARY KEY,license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,hwid_hash TEXT NOT NULL,expires_at TIMESTAMPTZ NOT NULL)`;
 return sql;
}
export async function activeLicense(sql,key,hwid){
 const rows=await sql`SELECT l.id,l.expires_at,a.username FROM licenses l LEFT JOIN accounts a ON a.id=l.account_id WHERE l.license_key=${key} AND l.hwid_hash=${hash(hwid)} AND l.redeemed_at IS NOT NULL AND l.status='active' AND COALESCE(a.banned,false)=false AND (l.expires_at IS NULL OR l.expires_at>now()) LIMIT 1`;
 return rows[0]||null;
}
export async function newTicket(sql,license,hwid){
 const ticket=randomBytes(32).toString('hex');
 await sql`DELETE FROM discord_oauth_states WHERE expires_at<=now() OR license_id=${license.id}`;
 await sql`INSERT INTO discord_oauth_states(state_hash,license_id,hwid_hash,expires_at) VALUES (${hash('discord:'+ticket)},${license.id},${hash(hwid)},now()+interval '5 minutes')`;
 return ticket;
}
export function validTicket(v){return typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);}
export function resultPage(message,status=200){
 // Messages are application constants, never user or Discord input.
 return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PeixotoXzxMenu</title><body style="background:#111;color:#eee;font:18px system-ui;max-width:620px;margin:15vh auto;padding:24px"><h1>PeixotoXzxMenu</h1><p>${message}</p><p>Volte ao loader e atualize Minha conta.</p></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"}});
}
