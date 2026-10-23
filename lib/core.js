import { neon } from '@neondatabase/serverless';
import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
export const runtime = 'nodejs';
export function db(){ if(!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL'); return neon(process.env.DATABASE_URL); }
export async function setup(){const sql=db(); await sql`CREATE TABLE IF NOT EXISTS licenses (id BIGSERIAL PRIMARY KEY, license_key TEXT NOT NULL UNIQUE, duration_days INTEGER, expires_at TIMESTAMPTZ, hwid_hash TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), redeemed_at TIMESTAMPTZ, note TEXT NOT NULL DEFAULT '')`; return sql; }
export function hash(value){return createHmac('sha256',process.env.SESSION_SECRET||'invalid').update(value).digest('hex')}
export function equal(a,b){if(!a||!b)return false; const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function isAdmin(req){ const val=req.cookies.get('pxsession')?.value||''; const [stamp,sig]=val.split('.'); if(!/^\d+$/.test(stamp||''))return false; if(Date.now()-Number(stamp)>86400000 || Number(stamp)>Date.now()+60000)return false; return equal(sig,hash('admin:'+stamp)); }
export function authorizePassword(value){const expected=process.env.ADMIN_PASSWORD||'';return expected.length>=12&&equal(hash(value||''),hash(expected));}
export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export function keygen(prefix='PX'){return prefix+'-'+Array.from({length:4},()=>randomBytes(3).toString('hex').toUpperCase()).join('-')}
export function validKey(k){return typeof k==='string'&&k.length>=8&&k.length<=150}
export function fail(){return json({error:'Não autorizado'},401)}
