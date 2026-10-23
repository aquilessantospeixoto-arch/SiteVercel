import {json} from '../../../lib/core';
export async function POST(){const res=json({ok:true});res.headers.set('Set-Cookie','pxsession=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return res;}
