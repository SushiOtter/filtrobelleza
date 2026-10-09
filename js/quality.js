// Calidad adaptativa: detección de dispositivo y perfiles por nivel. Sin DOM. Testeable.
export const clampLevel=l=>Math.max(0,Math.min(2,l));

// ¿Es un dispositivo táctil/móvil? `coarse` = matchMedia('(pointer:coarse)').matches
export const detectMobile=(coarse,ua)=>!!coarse||/Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua||'');

// Parámetros de render para cada nivel (0 fluida, 1 media, 2 alta).
export function levelConfig(l){l=clampLevel(l);return {
 level:l,
 dpr:l>=2?2:l===1?1.5:1.25,
 smooth:l>=2,
 seg:l>=1,
 segEvery:l>=2?200:l===1?300:99999,
 detEvery:l>=2?33:l===1?50:66,
 renderEvery:l>=2?0:l===1?33:50,
 passes:l>=2?1:l===1?.85:.62
}}

// Nivel por defecto según el equipo.
export const defaultLevel=({cpu,lowEnd,mobile})=>cpu||lowEnd?0:mobile?1:2;

export const MODES=['auto','high','fluid'];
export const nextMode=m=>MODES[(MODES.indexOf(m)+1)%MODES.length];
