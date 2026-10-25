import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
const options={N:16384,r:8,p:1,maxmem:64*1024*1024};
export const validPassword=p=>typeof p==='string'&&p.length>=8&&p.length<=128&&Buffer.byteLength(p,'utf8')<=512;
export async function passwordHash(password){
 if(!validPassword(password))throw Error('A senha deve ter entre 8 e 128 caracteres.');
 const salt=randomBytes(16).toString('hex'),digest=await derive(password,salt,32,options);
 return `scrypt-v1$${salt}$${digest.toString('hex')}`;
}
export async function passwordMatches(password,stored){
 if(typeof password!=='string'||password.length>128)return false;
 const match=/^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(stored||'');
 // Missing and unclaimed accounts pay the same KDF cost as a failed login.
 const digest=await derive(password,match?match[1]:'0'.repeat(32),32,options);
 return match!==null&&timingSafeEqual(digest,Buffer.from(match[2],'hex'));
}
export const validSessionToken=t=>typeof t==='string'&&/^pxs_[a-f0-9]{64}$/.test(t);
export const newSessionToken=()=> 'pxs_'+randomBytes(32).toString('hex');
export const validClientHwid=h=>typeof h==='string'&&h.length>=8&&h.length<=256;
