import {json,safeUsername} from '../../../../lib/core';
import {clientDb,allowAttempt,createSession,accountProfile} from '../../../../lib/client-auth';
import {passwordMatches,validPassword,validClientHwid} from '../../../../lib/client-password.mjs';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));
 if(!safeUsername(b.username)||!validPassword(b.password)||!validClientHwid(b.hwid))return json({ok:false,error:'Usuario, senha ou computador invalido.'},400);
 try{
  const sql=await clientDb();if(!await allowAttempt(sql,req,'login',b.username))return json({ok:false,error:'Muitas tentativas. Aguarde 15 minutos.'},429);
  const rows=await sql`SELECT id,username,password_hash,banned,auth_version FROM accounts WHERE username=${b.username} LIMIT 1`,account=rows[0];
  const correct=await passwordMatches(b.password,account?.password_hash);
  if(!correct||!account||account.banned)return json({ok:false,error:'Usuario ou senha incorretos, conta sem senha configurada ou acesso indisponivel.'},401);
  const profile=await accountProfile(sql,account,b.hwid),token=await createSession(sql,account,b.hwid);
  return json({...profile,token});
 }catch{return json({ok:false,error:'Nao foi possivel entrar na conta.'},500);}
}
