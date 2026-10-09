// Índices de landmarks faciales (MediaPipe FaceMesh) y geometría pura del ojo.
export const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
export const LEYE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7],REYE=[362,398,384,385,386,387,388,466,263,249,390,373,374,380,381,382];
export const LIPO=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185],LIPI=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
export const LBROW=[70,63,105,66,107,55,65,52,53,46],RBROW=[300,293,334,296,336,285,295,282,283,276];
export const LLID=[33,246,161,160,159,158,157,173,133],LBR=[70,63,105,66,107],RLID=[263,466,388,387,386,385,384,398,362],RBR=[300,293,334,296,336];
export const FOPT={base:[['matte','Mate'],['glow','Luminoso']],blush:[['matte','Mate'],['satin','Satinado']],lips:[['matte','Mate'],['satin','Satinado'],['gloss','Brillo']],eyes:[['matte','Mate'],['satin','Satinado'],['glitter','Glitter']],contour:[['soft','Suave'],['defined','Definido']],liner:[['thin','Fino'],['classic','Clásico'],['wing','Alado']],lash:[['natural','Natural'],['volume','Volumen']],brow:[['natural','Natural'],['defined','Definida']]};
export const FDEF={base:'matte',blush:'matte',lips:'satin',eyes:'matte',contour:'soft',liner:'classic',lash:'natural',brow:'natural'};

// Geometría del ojo: línea de pestañas, pliegue adaptado al ojo y a la ceja, invariante a la inclinación de la cabeza.
// `lid`/`brow`: índices de landmarks; `P`: función índice->[x,y] en pantalla.
export function eyeGeom(lid,brow,P){
 const pts=lid.map(i=>P(i)),first=pts[0],last=pts[pts.length-1],W=Math.hypot(last[0]-first[0],last[1]-first[1])||1,u=[(last[0]-first[0])/W,(last[1]-first[1])/W];
 const bp=brow.map(i=>P(i)),bc=[bp.reduce((s,p)=>s+p[0],0)/bp.length,bp.reduce((s,p)=>s+p[1],0)/bp.length],ec=[(first[0]+last[0])/2,(first[1]+last[1])/2];
 let n=[-u[1],u[0]];if(n[0]*(bc[0]-ec[0])+n[1]*(bc[1]-ec[1])<0)n=[-n[0],-n[1]];
 const crease=pts.map((p,k)=>{const t=Math.min(.98,Math.max(.02,k/(pts.length-1))),b=bp[Math.round(t*(bp.length-1))],room=Math.max(W*.12,(b[0]-p[0])*n[0]+(b[1]-p[1])*n[1]);
  const h=Math.min(W*.34*Math.pow(Math.sin(Math.PI*t),.8),room*.7);return[p[0]+n[0]*h,p[1]+n[1]*h]});
 return{pts,crease,n,u,W}}
