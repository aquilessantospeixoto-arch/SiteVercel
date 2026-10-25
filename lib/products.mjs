export const PRODUCTS={menu:{label:'Menu',prefix:'PXZX-Menu'},spoofer:{label:'Spoofer',prefix:'PXZX-Spoofer'}};
export function isProduct(value){return value==='menu'||value==='spoofer';}
export function productKeys(keys,product){return keys.filter(key=>key.product===product);}
export function unassignedKeys(keys){return keys.filter(key=>key.product==null);}
