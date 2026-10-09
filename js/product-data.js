// Catálogo de demostración (ficticio). Sustituir por API de catálogo/inventario real.
const sh=a=>a.map((h,i)=>({n:'Tono 0'+(i+1),hex:h}));
export const CATALOG={
 base:[{id:'b1',brand:'Maison Aube',name:'Skin Veil Foundation',price:'42 €',aisle:'02',section:'Complexion',shades:sh(['#F6D9C0','#F1D3B8','#E6BF9C','#D9A97F','#C28E64','#A87249','#8A5A38','#6E4526','#54341B','#3F2713'])},
       {id:'b2',brand:'Maison Aube',name:'Second Skin Tint',price:'34 €',aisle:'02',section:'Complexion',shades:sh(['#F4D8BD','#EFCFB4','#E2B691','#CF9C72','#B6805A','#9C6746'])}],
 blush:[{id:'c1',brand:'Lumen',name:'Soft Flush',price:'28 €',aisle:'03',section:'Cheeks',shades:sh(['#E9A5A0','#E58C8A','#D77A7A','#C46A6A','#B5605F'])}],
 lips:[{id:'l1',brand:'Aube',name:'Velvet Lip',price:'26 €',aisle:'04',section:'Lips',shades:sh(['#D9B8A0','#C98B84','#B9626A','#A33F4B','#8C2D3A','#6E2731','#D9A58F','#C48A72'])}],
 eyes:[{id:'e1',brand:'Lumen',name:'Veil Shadow',price:'31 €',aisle:'05',section:'Eyes',shades:sh(['#C9A58C','#B38672','#8E6A5C','#6E5148'])}],
 glow:[{id:'g1',brand:'Lumen',name:'Halo Highlighter',price:'36 €',aisle:'03',section:'Cheeks',shades:sh(['#F3E2BE','#EBD3A0','#E0BF8A'])}],
 contour:[{id:'k1',brand:'Aube',name:'Sculpt Contour',price:'30 €',aisle:'02',section:'Complexion',shades:sh(['#A98A73','#93745E','#7C5E4B','#64483A'])}],
 // cov = cobertura real del producto (1 = normal). hex = color MEDIDO del producto físico (no el de la web).
 liner:[{id:'i1',brand:'Lumen',name:'Line Precision Liner',price:'22 €',aisle:'05',section:'Eyes',cov:1,shades:sh(['#1A1412','#3A2A22','#2B3A55'])}],
 lash:[{id:'m1',brand:'Lumen',name:'Lift Mascara',price:'24 €',aisle:'05',section:'Eyes',cov:1,shades:sh(['#14100E','#3A2A22'])}],
 brow:[{id:'w1',brand:'Aube',name:'Brow Sculpt Pencil',price:'20 €',aisle:'06',section:'Brows',cov:1,shades:sh(['#CBB08A','#8A6A4C','#5B4333','#2E221B'])}]
};
export const CAT_LABEL={base:'Base',blush:'Colorete',lips:'Labios',eyes:'Ojos',glow:'Iluminador',contour:'Contorno',liner:'Delineador',lash:'Pestañas',brow:'Cejas'};
// cat: [producto, tono, intensidad]
export const LOOKS={
 Natural:{base:[0,0,.35],blush:[0,0,.35],lips:[0,4,.4],brow:[0,1,.35]},
 'Efecto glow':{base:[0,1,.4],blush:[0,1,.5],glow:[0,0,.7]},
 Noche:{base:[0,2,.6],eyes:[0,3,.8],lips:[0,3,.85],blush:[0,4,.5],liner:[0,0,.8],lash:[0,0,.7]},
 'Glam suave':{base:[0,1,.5],blush:[0,2,.6],eyes:[0,0,.6],lips:[0,1,.6],glow:[0,1,.5],brow:[0,1,.5],lash:[0,0,.45]}
};
