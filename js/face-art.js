/* Cara de demostración (SVG). Punto de conexión: vídeo de cámara + landmarks + segmentación */
const SKIN='#E3B896';
export function faceSVG(L){
 const o=(k,a,b)=>L&&L[k]?(a+(b-a)*L[k].i):0, col=k=>L&&L[k]?L[k].hex:'none';
 return `<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg">
 <defs><filter id="bl"><feGaussianBlur stdDeviation="14"/></filter><filter id="bs"><feGaussianBlur stdDeviation="5"/></filter></defs>
 <path d="M70 330C40 150 110 60 200 60s160 90 130 270c-20-70-30-120-130-130S90 260 70 330Z" fill="#2A1E19"/>
 <rect x="170" y="360" width="60" height="110" fill="#D4A481"/><path d="M60 520c10-70 70-95 140-95s130 25 140 95Z" fill="#EDE3D6"/>
 <ellipse cx="200" cy="255" rx="112" ry="150" fill="${SKIN}"/>
 <ellipse cx="200" cy="255" rx="112" ry="150" fill="${col('base')}" opacity="${o('base',.25,.8)}" style="mix-blend-mode:multiply"/>
 <g filter="url(#bl)" opacity="${o('blush',.15,.85)}"><circle cx="138" cy="300" r="34" fill="${col('blush')}"/><circle cx="262" cy="300" r="34" fill="${col('blush')}"/></g>
 <g filter="url(#bl)" opacity="${o('glow',.2,.9)}"><ellipse cx="132" cy="268" rx="22" ry="12" fill="${col('glow')}"/><ellipse cx="268" cy="268" rx="22" ry="12" fill="${col('glow')}"/><ellipse cx="200" cy="270" rx="6" ry="38" fill="${col('glow')}"/></g>
 <g filter="url(#bs)" opacity="${o('eyes',.2,.85)}"><ellipse cx="158" cy="222" rx="30" ry="13" fill="${col('eyes')}"/><ellipse cx="242" cy="222" rx="30" ry="13" fill="${col('eyes')}"/></g>
 <path d="M126 205q32-18 64-4M210 201q32-14 64 4" stroke="#3A2A22" stroke-width="7" fill="none" stroke-linecap="round"/>
 <g fill="#FBF6EE"><ellipse cx="158" cy="234" rx="21" ry="9"/><ellipse cx="242" cy="234" rx="21" ry="9"/></g>
 <g fill="#4A3126"><circle cx="158" cy="234" r="8"/><circle cx="242" cy="234" r="8"/></g>
 <path d="M200 250q-14 40-8 62q8 8 16 0" stroke="#B98A68" stroke-width="3" fill="none" stroke-linecap="round"/>
 <path d="M152 362Q176 346 200 356Q224 346 248 362Q224 394 200 396Q176 394 152 362Z" fill="#C0846F"/>
 <path d="M152 362Q176 346 200 356Q224 346 248 362Q224 394 200 396Q176 394 152 362Z" fill="${col('lips')}" opacity="${o('lips',.3,.95)}"/>
 </svg>`;
}
