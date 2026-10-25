import {hash,requestIp} from './core';
import {discordDb,discordConfig} from './discord';
import {newSessionToken,validSessionToken,validClientHwid} from './client-password.mjs';
let preparedSchema;
export async function clientDb(){
 if(!preparedSchema)preparedSchema=prepareClientDb().catch(error=>{preparedSchema=undefined;throw error;});
 return preparedSchema;
}
async function prepareClientDb(){
 const sql=await discordDb();
 await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT`;
 await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0`;
 await sql`CREATE TABLE IF NOT EXISTS client_sessions (token_hash TEXT PRIMARY KEY,account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,hwid_hash TEXT NOT NULL,auth_version INTEGER NOT NULL,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
 await sql`CREATE INDEX IF NOT EXISTS client_sessions_account_idx ON client_sessions(account_id)`;
 await sql`CREATE TABLE IF NOT EXISTS client_auth_limits (bucket_hash TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_start TIMESTAMPTZ NOT NULL)`;
 return sql;
}
export async function allowAttempt(sql,req,action,username=''){
 const ip=requestIp(req)||'unknown';
 const buckets=[[hash('auth-ip:'+action+':'+ip),action==='register'?10:60]];
 if(username)buckets.push([hash('auth-user:'+action+':'+username),20]);
 for(const [bucket,max] of buckets){
  const rows=await sql`INSERT INTO client_auth_limits(bucket_hash,attempts,window_start) VALUES (${bucket},1,now()) ON CONFLICT (bucket_hash) DO UPDATE SET attempts=CASE WHEN client_auth_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE client_auth_limits.attempts+1 END,window_start=CASE WHEN client_auth_limits.window_start<now()-interval '15 minutes' THEN now() ELSE client_auth_limits.window_start END RETURNING attempts`;
  if(rows[0].attempts>max)return false;
 }
 await sql`DELETE FROM client_auth_limits WHERE window_start<now()-interval '1 day'`;
 return true;
}
export async function sessionAccount(sql,token,hwid){
 if(!validSessionToken(token)||!validClientHwid(hwid))return null;
 const rows=await sql`SELECT a.id,a.username FROM client_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=${hash('client-session:'+token)} AND s.hwid_hash=${hash(hwid)} AND s.expires_at>now() AND a.banned=false AND s.auth_version=a.auth_version AND a.password_hash IS NOT NULL LIMIT 1`;
 return rows[0]||null;
}
export async function createSession(sql,account,hwid){
 const token=newSessionToken();
 await sql`DELETE FROM client_sessions WHERE expires_at<=now()`;
 const inserted=await sql`INSERT INTO client_sessions(token_hash,account_id,hwid_hash,auth_version,expires_at) SELECT ${hash('client-session:'+token)},id,${hash(hwid)},auth_version,now()+interval '24 hours' FROM accounts WHERE id=${account.id} AND auth_version=${account.auth_version} AND password_hash=${account.password_hash} AND banned=false RETURNING token_hash`;
 if(!inserted.length)throw Error('Conta alterada durante login');
 return token;
}
export async function menuLicense(sql,account,hwid){
 const rows=await sql`SELECT id,expires_at FROM licenses WHERE account_id=${account.id} AND product='menu' AND hwid_hash=${hash(hwid)} AND status='active' AND redeemed_at IS NOT NULL AND (expires_at IS NULL OR expires_at>now()) ORDER BY expires_at DESC NULLS FIRST,id DESC LIMIT 1`;
 return rows[0]||null;
}
export async function accountProfile(sql,account,hwid){
 const license=await menuLicense(sql,account,hwid);
 let discord=null;
 if(license){const rows=await sql`SELECT discord_id,display_name,avatar_path FROM discord_profiles WHERE license_id=${license.id} LIMIT 1`;const p=rows[0];if(p)discord={id:p.discord_id,name:p.display_name,avatar_path:p.avatar_path};}
 const expiry=license?.expires_at||null;
 return {ok:true,username:account.username,valid:!!license,license_active:!!license,expires_at:expiry,expires_at_unix:expiry?Math.floor(new Date(expiry).getTime()/1000):null,server_time:Math.floor(Date.now()/1000),plan:license?(expiry?'licensed':'lifetime'):'none',discord_available:!!license&&!!discordConfig(),discord};
}
