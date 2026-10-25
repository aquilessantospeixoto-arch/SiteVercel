import {json,safeUsername} from '../../../../lib/core';
import {clientDb,allowAttempt} from '../../../../lib/client-auth';
import {validPassword,passwordHash} from '../../../../lib/client-password.mjs';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));
 if(!safeUsername(b.username)||!validPassword(b.password))return json({ok:false,error:'Usuario: 3-32 caracteres sem espacos. Senha: 8-128 caracteres.'},400);
 try{
  const sql=await clientDb();if(!await allowAttempt(sql,req,'register'))return json({ok:false,error:'Muitas tentativas. Aguarde 15 minutos.'},429);
  const digest=await passwordHash(b.password);
  const rows=await sql`INSERT INTO accounts(username,password_hash) VALUES (${b.username},${digest}) ON CONFLICT (username) DO NOTHING RETURNING id`;
  if(!rows.length)return json({ok:false,error:'Usuario indisponivel. Se ja tinha uma conta antiga, peca ao administrador para definir sua senha.'},409);
  return json({ok:true});
 }catch{return json({ok:false,error:'Nao foi possivel cadastrar a conta.'},500);}
}
