import {json,hash} from '../../../../lib/core';
import {clientDb} from '../../../../lib/client-auth';
import {validSessionToken,validClientHwid} from '../../../../lib/client-password.mjs';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));if(!validSessionToken(b.token)||!validClientHwid(b.hwid))return json({ok:false,error:'Sessao invalida.'},400);
 try{const sql=await clientDb();await sql`DELETE FROM client_sessions WHERE token_hash=${hash('client-session:'+b.token)} AND hwid_hash=${hash(b.hwid)}`;return json({ok:true});}
 catch{return json({ok:false,error:'Falha ao encerrar sessao no servidor.'},500);}
}
