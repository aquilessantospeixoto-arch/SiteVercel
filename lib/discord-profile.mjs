export function discordProfile(user) {
 if(!user||!/^[0-9]{17,20}$/.test(user.id||''))throw Error('Invalid identity');
 const raw=user.global_name||user.username;
 if(typeof raw!=='string'||!raw.trim())throw Error('Invalid name');
 const name=raw.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,128);
 let avatar_path;
 if(typeof user.avatar==='string'&&/^(a_)?[a-f0-9]{32}$/.test(user.avatar))avatar_path=`/avatars/${user.id}/${user.avatar}.png?size=128`;
 else if(user.avatar==null){
  const legacy=/^[0-9]{4}$/.test(user.discriminator||'')&&user.discriminator!=='0000';
  const n=legacy?Number(user.discriminator)%5:Number((BigInt(user.id)>>22n)%6n);
  avatar_path=`/embed/avatars/${n}.png`;
 }else throw Error('Invalid avatar');
 return {id:user.id,name,avatar_path};
}
