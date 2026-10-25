import {setup,hash,validKey,json,safeUsername,requestIp} from '../../../lib/core';
export async function POST(req){
 const b=await req.json().catch(()=>({}));
 if(!validKey(b.key)||typeof b.hwid!=='string'||b.hwid.length<8||b.hwid.length>256)return json({ok:false,error:'Key ou HWID inválido'},400);
 if(b.username!==undefined && !safeUsername(b.username))return json({ok:false,error:'Nome de usuário inválido (3-32 caracteres, sem espaços)'},400);
 try{
  const sql=await setup();const h=hash(b.hwid);const ip=requestIp(req);
  // Existing integrations may not yet send username; use the explicit "not informed" value until client is updated.
  const username=b.username||null;
  if(username){const acc=await sql`SELECT id,banned,ban_reason FROM accounts WHERE username=${username} LIMIT 1`;
   if(acc[0]?.banned)return json({ok:false,error:'Conta banida: '+(acc[0].ban_reason||'Sem motivo informado')},403);
   await sql`INSERT INTO accounts(username) VALUES (${username}) ON CONFLICT (username) DO NOTHING`;
  }
  const rows=await sql`UPDATE licenses SET hwid_hash=COALESCE(hwid_hash,${h}),redeemed_at=COALESCE(redeemed_at,now()),expires_at=CASE WHEN redeemed_at IS NULL AND duration_days IS NOT NULL THEN now()+(duration_days * interval '1 day') ELSE expires_at END,activation_ip=CASE WHEN redeemed_at IS NULL THEN ${ip} ELSE activation_ip END,account_id=COALESCE(account_id,(SELECT id FROM accounts WHERE username=${username})) WHERE license_key=${b.key} AND status='active' AND (hwid_hash IS NULL OR hwid_hash=${h}) AND (expires_at IS NULL OR expires_at>now()) AND (account_id IS NULL OR account_id=(SELECT id FROM accounts WHERE username=${username})) RETURNING expires_at,hwid_hash`;
  if(rows.length)return json({ok:true,expires_at:rows[0].expires_at,lifetime:rows[0].expires_at===null});
  return json({ok:false,error:'Key inválida, expirada, revogada, pertencente a outro usuário ou vinculada a outro computador'},403);
 }catch(e){console.error('redeem error:',e);return json({ok:false,error:'Erro no servidor'},500)}
}
