// Utilidades puras (sin DOM ni estado). Testeables con `node --test`.

// Recorta a [0,1].
export const cl=x=>Math.max(0,Math.min(1,x));

// Color de 6 dígitos + componente alfa (0..1) como 8º byte hexadecimal.
export const hexA=(hex,a)=>hex+Math.round(cl(a)*255).toString(16).padStart(2,'0');

// Luminancia percibida de un color hexadecimal (0..255).
export const luminance=hex=>{const n=parseInt(hex.slice(1),16);return (n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11};

// Aplica tinte de balance de blancos y exposición a un color.
export const adaptHex=(hex,tint,exp)=>{const n=parseInt(hex.slice(1),16);return '#'+[n>>16&255,n>>8&255,n&255].map((v,i)=>Math.max(0,Math.min(255,Math.round(v*tint[i]*exp))).toString(16).padStart(2,'0')).join('')};

// Traduce el nombre de un error de getUserMedia a una clave de i18n.
export const cameraErrorKey=name=>({UNSUPPORTED:'cam.unsupported',NotAllowedError:'cam.denied',NotFoundError:'cam.notfound',NotReadableError:'cam.busy',SecurityError:'cam.security'}[name]||'cam.generic');

// Índice del tono cuya luminancia se acerca más a la de la piel.
export const recommendedShadeIndex=(shades,target,getLum=luminance)=>{let bi=0,bd=Infinity;shades.forEach((s,k)=>{const d=Math.abs(getLum(s.hex)-target);if(d<bd){bd=d;bi=k}});return bi};

// Índice de colorete según subtono (diferencia rojo-azul de la piel).
export const blushIndex=(rgb,n)=>{const warm=rgb[0]-rgb[2];return Math.min(n-1,warm>32?1:warm<18?3:2)};
