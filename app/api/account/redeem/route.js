import {validSessionToken,validClientHwid} from '../../../../lib/client-password.mjs';
import {json,hash,validKey,requestIp} from '../../../../lib/core';
import {clientDb,sessionAccount,accountProfile} from '../../../../lib/client-auth';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));if(!validSessionToken(b.token)||!validClientHwid(b.hwid))return json({ok:false,error:'Sessao expirada. Entre novamente.'},401);if(!validKey(b.key))return json({ok:false,error:'Informe uma key do Menu valida.'},400);
 try{
  const sql=await clientDb(),account=await sessionAccount(sql,b.token,b.hwid);if(!account)return json({ok:false,error:'Sessao expirada. Entre novamente.'},401);
  const hwid=hash(b.hwid),ip=requestIp(req);
  const rows=await sql`UPDATE licenses SET hwid_hash=COALESCE(hwid_hash,${hwid}),redeemed_at=COALESCE(redeemed_at,now()),expires_at=CASE WHEN redeemed_at IS NULL AND duration_days IS NOT NULL THEN now()+(duration_days * interval '1 day') ELSE expires_at END,activation_ip=CASE WHEN redeemed_at IS NULL THEN ${ip} ELSE activation_ip END,account_id=COALESCE(account_id,${account.id}) WHERE license_key=${b.key} AND product='menu' AND status='active' AND (hwid_hash IS NULL OR hwid_hash=${hwid}) AND (expires_at IS NULL OR expires_at>now()) AND (account_id IS NULL OR account_id=${account.id}) RETURNING id`;
  if(!rows.length)return json({ok:false,error:'Key do Menu invalida, de outro produto/usuario, expirada, revogada ou HWID divergente.'},403);
  return json(await accountProfile(sql,account,b.hwid));
 }catch{return json({ok:false,error:'Nao foi possivel resgatar a key.'},500);}
}
