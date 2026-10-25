import {validSessionToken,validClientHwid} from '../../../../lib/client-password.mjs';
import {json} from '../../../../lib/core';
import {clientDb,sessionAccount,accountProfile} from '../../../../lib/client-auth';
export const runtime='nodejs';
export async function POST(req){
 const b=await req.json().catch(()=>({}));if(!validSessionToken(b.token)||!validClientHwid(b.hwid))return json({ok:false,error:'Sessao expirada. Entre novamente.'},401);
 try{const sql=await clientDb(),account=await sessionAccount(sql,b.token,b.hwid);if(!account)return json({ok:false,error:'Sessao expirada. Entre novamente.'},401);return json(await accountProfile(sql,account,b.hwid));}
 catch{return json({ok:false,error:'Falha ao consultar a conta.'},500);}
}
