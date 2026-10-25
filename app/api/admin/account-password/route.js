import {isAdmin,json,safeUsername} from '../../../../lib/core';
import {clientDb} from '../../../../lib/client-auth';
import {validPassword,passwordHash} from '../../../../lib/client-password.mjs';
export const runtime='nodejs';
export async function POST(req){
 if(!isAdmin(req))return json({error:'Nao autorizado'},401);
 const b=await req.json().catch(()=>({}));if(!safeUsername(b.username)||!validPassword(b.password))return json({error:'Usuario invalido ou senha fora de 8-128 caracteres.'},400);
 try{const sql=await clientDb(),digest=await passwordHash(b.password);const rows=await sql`WITH updated AS (UPDATE accounts SET password_hash=${digest},auth_version=auth_version+1 WHERE username=${b.username} RETURNING id), revoked AS (DELETE FROM client_sessions WHERE account_id IN (SELECT id FROM updated)) SELECT id FROM updated`;if(!rows.length)return json({error:'Usuario nao encontrado'},404);return json({ok:true});}
 catch{return json({error:'Nao foi possivel definir a senha.'},500);}
}
