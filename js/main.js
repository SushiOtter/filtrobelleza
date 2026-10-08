import {CATALOG,CAT_LABEL,LOOKS} from "./product-data.js";
import {faceSVG} from "./face-art.js";

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const S={cat:'base',look:{}};let landmarker=null,stream=null,LM=null,cur=0,done=false,okSince=0;
let cameraEpoch=0,exportUrl=null;
const findProd=id=>Object.values(CATALOG).flat().find(p=>p.id===id);
const activeLook=()=>{const o={};for(const k in S.look)if(S.look[k].on)o[k]=S.look[k];return o};
const pos=v=>{$('#stage').style.setProperty('--pos',v+'%');$('#divider').setAttribute('aria-valuenow',Math.round(v))};

/* ---------- Cámara + detección (todo en el dispositivo, nada se sube ni se guarda) ---------- */
async function startCamera(){
 const epoch=++cameraEpoch;
 $('#scanRetry').hidden=true;
 try{
  $('#scanTitle').textContent='Preparando la cámara';
  $('#scanSub').textContent='Acepta el permiso del navegador para continuar.';
  if(!navigator.mediaDevices?.getUserMedia){const error=new Error('UNSUPPORTED');error.name='UNSUPPORTED';throw error}
  if(!stream){const candidate=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:720}},audio:false});
   if(epoch!==cameraEpoch){candidate.getTracks().forEach(t=>t.stop());return}stream=candidate}
  $$('video').forEach(video=>{video.pause();video.srcObject=stream});
  for(const track of stream.getVideoTracks())track.addEventListener('ended',()=>{
   if(!stream?.getTracks().includes(track))return;
   LM=null;
   const message='La cámara se ha desconectado. Comprueba el dispositivo y vuelve a intentarlo.';
   if($('#scan').classList.contains('on')){$('#scanTitle').textContent='Se ha perdido la cámara';$('#scanSub').textContent=message;$('#scanRetry').hidden=false}
   else if($('#mirror').classList.contains('on'))hint(message);
  },{once:true});
  const video=$('#scan').classList.contains('on')?$('#vScan'):$('#vMain');await video.play();
  if(epoch!==cameraEpoch)return;
  $('#scanTitle').textContent='Coloca tu rostro aquí';
  $('#scanSub').textContent='Mirando a la cámara';
  if(!landmarker){
   $('#scanSub').textContent='Cargando detección facial…';
   const {FaceLandmarker,FilesetResolver}=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs");
   if(epoch!==cameraEpoch)return;
   const fs=await FilesetResolver.forVisionTasks(WASM);
   if(epoch!==cameraEpoch)return;
   const options={baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.45,minFacePresenceConfidence:.45,minTrackingConfidence:.45};
   let detector;
   try{detector=await FaceLandmarker.createFromOptions(fs,options)}
   catch(gpuError){if(epoch!==cameraEpoch)return;detector=await FaceLandmarker.createFromOptions(fs,{...options,baseOptions:{modelAssetPath:MODEL,delegate:'CPU'}})}
   if(epoch!==cameraEpoch){detector.close();return}
   landmarker=detector;
  }
  if(epoch!==cameraEpoch)return;
  $('#scanTitle').textContent='Coloca tu rostro aquí';
  $('#scanSub').textContent='Mirando a la cámara';
 }catch(err){
  if(epoch!==cameraEpoch)return;
  stopCamera();
  const messages={UNSUPPORTED:'Este navegador no ofrece acceso a la cámara. Prueba con Chrome o Edge.',NotAllowedError:'No se concedió permiso para la cámara. Actívalo en el navegador y vuelve a intentarlo.',NotFoundError:'No se encontró ninguna cámara conectada.',NotReadableError:'La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentarlo.',SecurityError:'Abre la aplicación desde localhost o una conexión HTTPS para usar la cámara.'};
  const message=messages[err.name]||'No se pudo cargar la cámara o la detección facial. Comprueba tu conexión y vuelve a intentarlo.';
  $('#scanTitle').textContent='No se pudo iniciar la prueba';
  $('#scanSub').textContent=message;
  $('#scanRetry').hidden=false;
  if($('#mirror').classList.contains('on'))hint(message);
  console.error('Error al iniciar la cámara o la detección facial:',err);
 }
}
function stopCamera(){
 cameraEpoch++;
 if(stream){stream.getTracks().forEach(track=>track.stop());stream=null}
 $$('video').forEach(video=>{video.pause();video.srcObject=null});
 LM=null;SM=null;lostAt=0;last=-1;
 if(landmarker){landmarker.close();landmarker=null}
}
const bc=document.createElement('canvas');bc.width=bc.height=24;const bx=bc.getContext('2d',{willReadFrequently:true});
function scanStep(v){
 const c=[false,false,false];
 if(LM){c[0]=true;bx.drawImage(v,0,0,24,24);const d=bx.getImageData(0,0,24,24).data;let s=0;
  for(let i=0;i<d.length;i+=4)s+=d[i]*.3+d[i+1]*.59+d[i+2]*.11;s/=576;c[1]=s>55&&s<225;
  let mn=1,mx=0;for(const p of LM){if(p.x<mn)mn=p.x;if(p.x>mx)mx=p.x}
  c[2]=Math.abs((mn+mx)/2-.5)<.2&&(mx-mn)>.2&&(mx-mn)<.85}
 $$('.checks li').forEach((l,i)=>l.classList.toggle('ok',c[i]));
 if(c.every(Boolean)){okSince||=performance.now();
  if(!done&&performance.now()-okSince>1200){done=true;$('#scanTitle').textContent='Perfecto.';$('#scanSub').textContent='Estamos preparando tu experiencia.';setTimeout(()=>{if($('#scan').classList.contains('on'))go('mirror')},900)}}
 else okSince=0;
}

/* ---------- Motor de maquillaje sobre landmarks ---------- */
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const LEYE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7],REYE=[362,398,384,385,386,387,388,466,263,249,390,373,374,380,381,382];
const LIPO=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185],LIPI=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
const LBROW=[70,63,105,66,107,55,65,52,53,46],RBROW=[300,293,334,296,336,285,295,282,283,276];
const LLID=[33,246,161,160,159,158,157,173,133],LBR=[70,63,105,66,107],RLID=[263,466,388,387,386,385,384,398,362],RBR=[300,293,334,296,336];
const FOPT={base:[['matte','Mate'],['glow','Luminoso']],blush:[['matte','Mate'],['satin','Satinado']],lips:[['matte','Mate'],['satin','Satinado'],['gloss','Brillo']],eyes:[['matte','Mate'],['satin','Satinado'],['glitter','Glitter']],liner:[['thin','Fino'],['classic','Clásico'],['wing','Alado']],lash:[['natural','Natural'],['volume','Volumen']],brow:[['natural','Natural'],['defined','Definida']]};
const FDEF={base:'matte',blush:'matte',lips:'satin',eyes:'matte',liner:'classic',lash:'natural',brow:'natural'};
const cv=$('#cv'),cx=cv.getContext('2d'),cvB=$('#cvB'),cxB=cvB.getContext('2d');
const pigmentCanvas=document.createElement('canvas'),pigmentCtx=pigmentCanvas.getContext('2d');

/* Luz y calibración: la calibración (?calibrar) mide una tarjeta gris con la luz real del kiosco */
const CAL=(()=>{try{return JSON.parse(localStorage.getItem('kiosco.cal'))}catch(e){return null}})();
const ENV={tint:[1,1,1],exp:1,dark:false};
const lc=document.createElement('canvas');lc.width=32;lc.height=24;const lx=lc.getContext('2d',{willReadFrequently:true});let lfr=0;
function sense(v){
 if(++lfr%8)return;lx.drawImage(v,0,0,32,24);const d=lx.getImageData(0,0,32,24).data;
 let r=0,g=0,b=0,n=0;for(let y=0;y<24;y++)for(const x of [0,1,2,3,28,29,30,31]){const k=(y*32+x)*4;r+=d[k];g+=d[k+1];b+=d[k+2];n++}
 r/=n;g/=n;b/=n;const avg=((r+g+b)/3)||1;
 let tint=[r,g,b].map(q=>1+(Math.min(1.25,Math.max(.8,q/avg))-1)*.35);if(CAL?.tint)tint=CAL.tint;
 let fl=0,fn=0;if(LM)[151,205,425].forEach(i=>{const x=Math.min(31,Math.max(0,Math.round(LM[i].x*31))),y=Math.min(23,Math.max(0,Math.round(LM[i].y*23))),k=(y*32+x)*4;fl+=d[k]*.3+d[k+1]*.59+d[k+2]*.11;fn++});
 const luma=fn?fl/fn:avg;ENV.tint=ENV.tint.map((q,i)=>q+(tint[i]-q)*.2);ENV.exp+=(Math.min(1.08,Math.max(.6,luma/125))-ENV.exp)*.2;
 if(luma<70)ENV.dark=true;else if(luma>90)ENV.dark=false;
}
const adapt=hex=>{const n=parseInt(hex.slice(1),16);return '#'+[n>>16&255,n>>8&255,n&255].map((v,i)=>Math.max(0,Math.min(255,Math.round(v*ENV.tint[i]*ENV.exp))).toString(16).padStart(2,'0')).join('')};
const dc=document.createElement('canvas'),dx=dc.getContext('2d');let lastTs=0;
function detect(v){ // con poca luz se aclara la imagen antes de detectar
 let src=v;if(ENV.dark&&v.videoWidth){dc.width=640;dc.height=Math.round(640*v.videoHeight/v.videoWidth);dx.filter='brightness(1.9) contrast(1.15)';dx.drawImage(v,0,0,dc.width,dc.height);src=dc}
 const ts=Math.max(lastTs+1,performance.now());lastTs=ts;
 return landmarker.detectForVideo(src,ts).faceLandmarks[0]||null}
let SM=null,lostAt=0;
function smooth(raw){const now=performance.now();
 if(!raw){if(SM){if(!lostAt)lostAt=now;if(now-lostAt>500){SM=null;lostAt=0}}return SM}
 lostAt=0;if(!SM||SM.length!==raw.length)SM=raw.map(p=>({x:p.x,y:p.y}));
 else raw.forEach((p,i)=>{const q=SM[i],a=Math.min(.9,.3+Math.hypot(p.x-q.x,p.y-q.y)*30);q.x+=(p.x-q.x)*a;q.y+=(p.y-q.y)*a});
 return SM}
let hintMsg='';const hint=m=>{if(m!==hintMsg){hintMsg=m;const h=$('#hint');h.textContent=m;h.style.opacity=m?1:0}};

/* Geometría del ojo: línea de pestañas, pliegue adaptado al ojo y a la ceja, invariante a la inclinación de la cabeza */
function eyeGeom(lid,brow,P){
 const pts=lid.map(i=>P(i)),first=pts[0],last=pts[pts.length-1],W=Math.hypot(last[0]-first[0],last[1]-first[1])||1,u=[(last[0]-first[0])/W,(last[1]-first[1])/W];
 const bp=brow.map(i=>P(i)),bc=[bp.reduce((s,p)=>s+p[0],0)/bp.length,bp.reduce((s,p)=>s+p[1],0)/bp.length],ec=[(first[0]+last[0])/2,(first[1]+last[1])/2];
 let n=[-u[1],u[0]];if(n[0]*(bc[0]-ec[0])+n[1]*(bc[1]-ec[1])<0)n=[-n[0],-n[1]];
 const crease=pts.map((p,k)=>{const t=Math.min(.98,Math.max(.02,k/(pts.length-1))),b=bp[Math.round(t*(bp.length-1))],room=Math.max(W*.12,(b[0]-p[0])*n[0]+(b[1]-p[1])*n[1]);
  const h=Math.min(W*.34*Math.pow(Math.sin(Math.PI*t),.8),room*.7);return[p[0]+n[0]*h,p[1]+n[1]*h]});
 return{pts,crease,n,u,W}}
const curve=(a,p=new Path2D(),move=true)=>{move?p.moveTo(a[0][0],a[0][1]):p.lineTo(a[0][0],a[0][1]);for(let k=1;k<a.length-1;k++)p.quadraticCurveTo(a[k][0],a[k][1],(a[k][0]+a[k+1][0])/2,(a[k][1]+a[k+1][1])/2);p.lineTo(a[a.length-1][0],a[a.length-1][1]);return p};
const cl=x=>Math.max(0,Math.min(1,x));

function draw(v){
 const st=$('#stage'),W=st.clientWidth,H=st.clientHeight,dpr=devicePixelRatio||1;
 for(const c of [cv,cvB,pigmentCanvas])if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}
 for(const c of [cx,cxB]){c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H)}
 if(!v.videoWidth)return;
 const vw=v.videoWidth,vh=v.videoHeight,sc=Math.max(W/vw,H/vh),ox=(W-vw*sc)/2,oy=(H-vh*sc)/2;
 const f0=ENV.dark?'brightness(1.6) contrast(1.1)':'none';cxB.filter=cx.filter=f0;
 cxB.drawImage(v,ox,oy,vw*sc,vh*sc);cx.drawImage(v,ox,oy,vw*sc,vh*sc);cxB.filter=cx.filter='none';
 const L0=activeLook();
 if(!LM){hint(Object.keys(L0).length?'No vemos tu rostro. Mira a la cámara.':'');return}
 const yaw=(()=>{const dl=LM[1].x-LM[234].x,dr=LM[454].x-LM[1].x;return(dl-dr)/((dl+dr)||1)})();
 const fL=cl(1-(-yaw-.3)/.3),fR=cl(1-(yaw-.3)/.3),tf=lostAt?cl(1-(performance.now()-lostAt)/500):1,F=cl(1-(Math.abs(yaw)-.55)/.2)*tf;
 hint(!Object.keys(L0).length?'':ENV.dark?'Poca luz: acércate a una zona más iluminada.':Math.abs(yaw)>.35?'Mira a la cámara para ver el resultado completo.':'');
 const L={};for(const k in L0){const o=L0[k];L[k]={...o,hex:adapt(o.hex),i:Math.min(1,o.i*F*(findProd(o.pid)?.cov??1))}}
 if(!Object.keys(L).length)return;
 const P=i=>[LM[i].x*vw*sc+ox,LM[i].y*vh*sc+oy];
 const path=(idx,p=new Path2D())=>{idx.forEach((i,k)=>{const [x,y]=P(i);k?p.lineTo(x,y):p.moveTo(x,y)});p.closePath();return p};
 const fw=Math.hypot(...P(234).map((a,k)=>a-P(454)[k]));
 const facePoints=OVAL.map(P),faceBounds=facePoints.reduce((b,p)=>({left:Math.min(b.left,p[0]),top:Math.min(b.top,p[1]),right:Math.max(b.right,p[0]),bottom:Math.max(b.bottom,p[1])}),{left:W,top:H,right:0,bottom:0});
 const pad=fw*.04,x0=Math.max(0,faceBounds.left-pad),y0=Math.max(0,faceBounds.top-pad),x1=Math.min(W,faceBounds.right+pad),y1=Math.min(H,faceBounds.bottom+pad);
 const outW=Math.max(1,Math.ceil((x1-x0)*dpr)),outH=Math.max(1,Math.ceil((y1-y0)*dpr));
 if(pigmentCanvas.width!==outW||pigmentCanvas.height!==outH){pigmentCanvas.width=outW;pigmentCanvas.height=outH}
 const pigment=(shape,hex,alpha,blend,blur=0,clipShape=null,rule='nonzero')=>{
  pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.clearRect(0,0,outW,outH);
  pigmentCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);pigmentCtx.save();
  pigmentCtx.filter=blur?`blur(${blur}px)`:'none';pigmentCtx.fillStyle=hex;pigmentCtx.fill(shape,rule);pigmentCtx.restore();
  cx.save();if(clipShape)cx.clip(clipShape,'evenodd');cx.globalCompositeOperation=blend;cx.globalAlpha=alpha;cx.drawImage(pigmentCanvas,x0,y0,x1-x0,y1-y0);cx.restore();
 };
 const spotXY=(x,y,r,hex,a,mode)=>{const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hex);g.addColorStop(1,hex+'00');
  cx.save();cx.globalCompositeOperation=mode;cx.globalAlpha=Math.min(1,Math.max(0,a));cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();cx.restore()};
 const spot=(i,r,hex,a,mode)=>{const [x,y]=P(i);spotXY(x,y,r,hex,a,mode)};
 const spotY=(i,r,hex,a,mode,dy)=>{const [x,y]=P(i);spotXY(x,y+dy,r,hex,a,mode)};
 const geoms=[[eyeGeom(LLID,LBR,P),fL],[eyeGeom(RLID,RBR,P),fR]];

 if(L.base){const b=L.base,i=b.i,p=new Path2D();[OVAL,LEYE,REYE,LIPO,LBROW,RBROW].forEach(x=>path(x,p));
  pigment(p,b.hex,.36*i,'soft-light',fw*.008,p,'evenodd');
  pigment(p,b.hex,.24*i,'multiply',fw*.003,p,'evenodd');
  if(b.f==='glow')[[151,.08],[205,.09],[425,.09],[168,.05]].forEach(([k,r])=>spot(k,fw*r,'#FFF6E8',.18*i,'screen'))}
 if(L.blush){const b=L.blush;[[205,fL],[425,fR]].forEach(([i,f])=>{
  spot(i,fw*.145,b.hex,.34*b.i*f,'soft-light');
  spot(i,fw*.095,b.hex,.15*b.i*f,'multiply');
  if(b.f==='satin')spot(i,fw*.065,'#FFF4EC',.09*b.i*f,'screen')
 })}
 if(L.glow){const g=L.glow;[[117,fL],[346,fR]].forEach(([i,f])=>spot(i,fw*.075,g.hex,.31*g.i*f,'screen'));spot(168,fw*.045,g.hex,.28*g.i*F,'screen')}
 if(L.brow){const b=L.brow,i=b.i,def=b.f==='defined';[[LBROW,fL],[RBROW,fR]].forEach(([idx,f])=>{if(f<.02)return;const p=path(idx);
  pigment(p,b.hex,(.3*i+(def?.06*i:0))*f,'multiply',fw*.003,p);
  pigment(p,b.hex,.17*i*f,'soft-light',fw*.002,p);
 })}
 if(L.eyes){const e=L.eyes,i=e.i,hole=new Path2D();hole.rect(0,0,W,H);path(LEYE,hole);path(REYE,hole);
  cx.save();cx.clip(hole,'evenodd');
  for(const [g,f] of geoms){if(f<.02)continue;
   const p=curve(g.pts);curve(g.crease.slice().reverse(),p,false);p.closePath();
   pigment(p,e.hex,.46*i*f,'soft-light',g.W*.035,hole);
   pigment(p,e.hex,.24*i*f,'multiply',g.W*.012,hole);
   cx.save();cx.strokeStyle=e.hex;cx.globalCompositeOperation='multiply';
   cx.globalAlpha=.15*i*f;cx.lineWidth=g.W*.035;cx.lineCap='round';cx.stroke(curve(g.crease));cx.restore();
   spotXY((g.pts[1][0]+g.crease[2][0])/2,(g.pts[1][1]+g.crease[2][1])/2,g.W*.16,e.hex,.18*i*f,'multiply');
   if(e.f==='satin'||e.f==='glitter')spotXY(g.pts[4][0]+g.n[0]*g.W*.07,g.pts[4][1]+g.n[1]*g.W*.07,g.W*.14,'#FFF4E5',.15*i*f,'screen');
   if(e.f==='glitter'){cx.save();cx.clip(p);cx.globalCompositeOperation='screen';let r=49297;const rnd=()=>(r=(r*9301+49297)%233280)/233280;
    for(let n=0;n<10;n++){const k=Math.floor(rnd()*g.pts.length),q=rnd(),size=Math.max(.8,g.W*.018);cx.globalAlpha=(.08+.22*rnd())*i*f;cx.fillStyle='#FFF4D6';
     cx.beginPath();cx.arc(g.pts[k][0]+(g.crease[k][0]-g.pts[k][0])*q,g.pts[k][1]+(g.crease[k][1]-g.pts[k][1])*q,size*.5,0,Math.PI*2);cx.fill()}cx.restore()}}
  cx.restore()}
 if(L.liner){const l=L.liner,i=l.i;for(const [g,f] of geoms){if(f<.02)continue;
  const w=g.W*({thin:.016,classic:.028,wing:.028}[l.f]||.028),up=g.pts.map(q=>[q[0]+g.n[0]*w*.35,q[1]+g.n[1]*w*.35]);
  cx.save();cx.filter='blur(.5px)';cx.strokeStyle=cx.fillStyle=l.hex;cx.globalAlpha=Math.min(1,(.5+.5*i)*f);cx.lineWidth=w;cx.lineCap=cx.lineJoin='round';
  cx.stroke(curve(up));
  if(l.f==='wing'){const o=[-g.u[0],-g.u[1]],e=[up[0][0]+(o[0]*.8+g.n[0]*.55)*g.W*.26,up[0][1]+(o[1]*.8+g.n[1]*.55)*g.W*.26];
   cx.beginPath();cx.moveTo(up[0][0],up[0][1]);cx.lineTo(e[0],e[1]);cx.lineTo(up[1][0]+g.n[0]*w*.6,up[1][1]+g.n[1]*w*.6);cx.lineTo(up[2][0],up[2][1]);cx.closePath();cx.fill()}
  cx.restore()}}
 if(L.lash){const m=L.lash,i=m.i,vol=m.f==='volume',N=vol?26:16;for(const [g,f] of geoms){if(f<.02)continue;
  cx.save();cx.strokeStyle=m.hex;cx.lineCap='round';cx.globalAlpha=Math.min(.82,.8*i*f);
  for(let j=0;j<N;j++){const t=j/(N-1),s=t*(g.pts.length-1),k=Math.min(g.pts.length-2,Math.floor(s)),q=s-k;
   const x=g.pts[k][0]+(g.pts[k+1][0]-g.pts[k][0])*q,y=g.pts[k][1]+(g.pts[k+1][1]-g.pts[k][1])*q;
   const lean=.75*(1-t)-.15*t,dx=g.n[0]-g.u[0]*lean,dy=g.n[1]-g.u[1]*lean,dl=Math.hypot(dx,dy)||1;
   const len=g.W*(vol?.14:.105)*(.55+.45*Math.pow(Math.sin(Math.PI*(.08+.84*t)),.8));
   cx.lineWidth=g.W*(vol?.014:.01)*(.7+.3*Math.sin(Math.PI*t));
   cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+dx/dl*len*.55-g.u[0]*len*.15,y+dy/dl*len*.55-g.u[1]*len*.15,x+dx/dl*len,y+dy/dl*len);cx.stroke()}
  cx.restore()}}
 if(L.lips){const l=L.lips,i=l.i,p=new Path2D();path(LIPO,p);path(LIPI,p);
  pigment(p,l.hex,.4*i,'soft-light',fw*.003,p,'evenodd');
  pigment(p,l.hex,.34*i,'multiply',fw*.0015,p,'evenodd');
  cx.save();cx.clip(p,'evenodd');
  if(l.f==='gloss'){spotY(17,fw*.038,'#FFF8F4',.26*i,'screen',-fw*.012);spotY(0,fw*.032,'#FFF8F4',.16*i,'screen',fw*.01)}
  else if(l.f==='satin')spotY(17,fw*.045,'#FFF4EC',.1*i,'screen',-fw*.01);
  cx.restore()}
}
function loop(){
 const onScan=$('#scan').classList.contains('on'),onMir=$('#mirror').classList.contains('on');
 if(onScan||onMir){const v=onScan?$('#vScan'):$('#vMain');
  if(v.readyState>=2){sense(v);
   if(landmarker&&v.currentTime!==last&&performance.now()-lastDetectAt>=33){
    last=v.currentTime;lastDetectAt=performance.now();
    try{LM=smooth(detect(v))}
    catch(err){LM=null;hint('La detección facial se ha interrumpido. Vuelve a iniciar la prueba.');console.error('Error durante la detección facial:',err)}
   }
   if(onScan){if(landmarker)scanStep(v)}else draw(v)}}
 requestAnimationFrame(loop);
}
let last=-1,lastDetectAt=0;loop();

/* ---------- Interfaz ---------- */
function go(id){
 $$('.screen').forEach(s=>s.classList.toggle('on',s.id===id));
 if(id==='scan'){done=false;okSince=0;$('#scanTitle').textContent='Coloca tu rostro aquí';$('#scanSub').textContent='Mirando a la cámara';$$('.checks li').forEach(l=>l.classList.remove('ok'));startCamera()}
 if(id==='mirror'){render();if(!stream)startCamera();else{$('#vScan').pause();$('#vScan').srcObject=null;$('#vMain').srcObject=stream;$('#vMain').play().catch(err=>{hint('No se pudo reanudar la cámara. Vuelve al inicio para intentarlo de nuevo.');console.error('No se pudo reanudar la cámara:',err)})}}
 if(id==='welcome'){
  stopCamera();S.look={};S.cat='base';$('#lookPanel').classList.remove('open');
  if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null}
  $('#lookPreview').removeAttribute('src');$('#lookPreview').hidden=true;$('#previewPlaceholder').hidden=false;$('#downloadLook').disabled=true;
  $('#exportStatus').textContent='La imagen se prepara en este dispositivo. No se envía a ningún servidor.';
 }
 if(id==='save')stopCamera();
}
function render(){refresh();renderCats();renderProducts();renderShades()}
function refresh(){$('#tag').style.opacity=Object.keys(S.look).length?0:1;renderLook()}
function renderCats(){$('#cats').innerHTML=Object.keys(CAT_LABEL).map(k=>`<button class="${k===S.cat?'sel':''}" data-c="${k}">${CAT_LABEL[k]}</button>`).join('')}
function renderProducts(){$('#products').innerHTML=CATALOG[S.cat].map(p=>`<button class="prod ${S.look[S.cat]?.pid===p.id?'sel':''}" data-p="${p.id}" style="--c:${p.shades[0].hex}"><div class="ph"></div><span>${p.brand}</span><b>${p.name}</b><span>${p.price}</span><em>Probar</em></button>`).join('')}
function renderShades(){const c=S.look[S.cat];$('.intensity').hidden=!c;if(!c){$('#shades').innerHTML='';renderFin();return}const p=findProd(c.pid);
 $('#shades').innerHTML=p.shades.map((s,i)=>`<button class="shade ${i===c.s?'sel':''}" data-s="${i}" style="background:${s.hex}" aria-label="${s.n}"></button>`).join('')+`<span style="margin-left:8px;white-space:nowrap">${p.shades[c.s].n} · Tu selección</span>`;renderFin();
 $('#intensity').value=Math.round(c.i*100)}
function renderFin(){const o=FOPT[S.cat],c=S.look[S.cat];
 $('#fin').innerHTML=(o&&c)?o.map(([k,n])=>`<button class="${c.f===k?'sel':''}" data-f="${k}">${n}</button>`).join(''):''}
function apply(cat,pid,s,i){const p=findProd(pid);S.look[cat]={pid,s,i,hex:p.shades[s].hex,on:S.look[cat]?.on??true,f:S.look[cat]?.f??FDEF[cat]}}
const suggest=()=>Object.entries(CATALOG).filter(([k])=>!S.look[k]).map(([,v])=>v[0]).slice(0,3);
function renderLook(){const it=Object.entries(S.look),ideas=suggest();
 $('#lookList').innerHTML=it.length?it.map(([k,v])=>{const p=findProd(v.pid);return `<li><label><input type="checkbox" data-t="${k}" ${v.on?'checked':''}><span>${CAT_LABEL[k]}<small>${p.name} · ${p.shades[v.s].n}</small></span></label><button class="link" data-store="${v.pid}">Ver ubicación de ejemplo</button></li>`}).join(''):'<li class="rec">Aún no has probado nada.</li>';
 $('#recs').innerHTML=it.length>1&&ideas.length?'<p class="rec">Ideas de combinación del catálogo de demostración: '+ideas.map(p=>p.name).join(', ')+'.</p>':'';
 $('#looksRow').innerHTML=Object.keys(LOOKS).map(n=>`<button data-look="${n}">${n}</button>`).join('')}
document.addEventListener('click',e=>{const t=e.target;let b;
 if(b=t.closest('[data-go]'))go(b.dataset.go);
 else if(t.closest('#scanRetry'))startCamera();
 else if(b=t.closest('[data-c]')){S.cat=b.dataset.c;renderCats();renderProducts();renderShades()}
 else if(b=t.closest('[data-p]')){apply(S.cat,b.dataset.p,0,S.look[S.cat]?.i??.6);renderProducts();renderShades();refresh()}
 else if(b=t.closest('[data-s]')){const c=S.look[S.cat];apply(S.cat,c.pid,+b.dataset.s,c.i);renderShades();refresh()}
 else if(b=t.closest('[data-f]')){S.look[S.cat].f=b.dataset.f;renderFin()}
 else if(b=t.closest('[data-look]')){S.look={};for(const [k,[pi,s,i]] of Object.entries(LOOKS[b.dataset.look]))apply(k,CATALOG[k][pi].id,s,i);S.cat=Object.keys(S.look)[0];renderCats();renderProducts();renderShades();refresh()}
 else if(b=t.closest('[data-store]'))showStore(b.dataset.store);
 else if(b=t.closest('[data-ba]')){$('#stage').classList.add('cmp');anim(+b.dataset.ba)}});
document.addEventListener('change',e=>{const c=e.target.closest('[data-t]');if(c){S.look[c.dataset.t].on=c.checked;refresh()}});
$('#intensity').addEventListener('input',e=>{const c=S.look[S.cat];if(c)c.i=e.target.value/100});
$('#btnLook').onclick=e=>{const open=$('#lookPanel').classList.toggle('open');e.currentTarget.classList.toggle('act',open);e.currentTarget.setAttribute('aria-pressed',open)};
$('#btnCompare').onclick=e=>{const st=$('#stage');st.classList.toggle('cmp');e.currentTarget.setAttribute('aria-pressed',st.classList.contains('cmp'));st.classList.contains('cmp')?anim(50):(cur=0,pos(0))};
if(/calibrar/.test(location.search))$('#btnCal').hidden=false;
$('#btnCal').onclick=()=>{const v=$('#vMain');if(!v.videoWidth||!confirm('Coloca una tarjeta gris o blanca en el centro de la imagen. ¿Calibrar ahora?'))return;
 const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),s=Math.min(v.videoWidth,v.videoHeight)*.12;
 x.drawImage(v,(v.videoWidth-s)/2,(v.videoHeight-s)/2,s,s,0,0,48,48);const d=x.getImageData(0,0,48,48).data;let r=0,g=0,b=0;
 for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}const n=d.length/4,a=(r+g+b)/(3*n);
 try{localStorage.setItem('kiosco.cal',JSON.stringify({tint:[r/n,g/n,b/n].map(q=>Math.min(1.3,Math.max(.75,q/a))),date:Date.now()}));location.reload()}
 catch(err){hint('No se pudo guardar la calibración en este navegador.');console.error('No se pudo guardar la calibración:',err)}};
$('#btnSave').onclick=saveLook;
$('#downloadLook').onclick=()=>{
 if(!exportUrl)return;
 const a=document.createElement('a');a.href=exportUrl;a.download='mi-look-virtual.png';document.body.append(a);a.click();a.remove();
};
$('#finish').onclick=()=>{
 go('welcome')
};
function anim(to){const from=cur,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/450);cur=from+(to-from)*(1-Math.pow(1-k,3));pos(cur);if(k<1)requestAnimationFrame(f)})(t0)}
const dv=$('#divider');
dv.addEventListener('pointerdown',e=>{dv.setPointerCapture(e.pointerId);dv.onpointermove=ev=>{const r=$('#stage').getBoundingClientRect();cur=Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100));pos(cur)}});
dv.addEventListener('pointerup',()=>dv.onpointermove=null);
dv.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();cur=Math.max(0,Math.min(100,cur+(e.key==='ArrowRight'?5:-5)));pos(cur)});
function showStore(id){const p=findProd(id);
 $('#storeBody').innerHTML=`<b>${p.brand} · ${p.name}</b><p>Pasillo de ejemplo ${p.aisle} · Sección ${p.section}</p><p class="rec">El catálogo y la ubicación son datos ficticios de demostración; no representan existencias reales.</p><div class="map" aria-label="Mapa de ejemplo">${Array.from({length:8},(_,i)=>`<i class="${i+1===+p.aisle?'hit':''}"></i>`).join('')}</div>`;$('#storeModal').classList.add('on')}
$('#closeModal').onclick=()=>$('#storeModal').classList.remove('on');
$('#storeModal').addEventListener('click',e=>{if(e.target===$('#storeModal'))$('#storeModal').classList.remove('on')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#storeModal').classList.remove('on')});
function exportBlob(){
 return new Promise((resolve,reject)=>{
  const source=$('#cv'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!source.width||!source.height||!ctx){reject(new Error('No hay una imagen de cámara disponible para exportar.'));return}
  const items=Object.entries(activeLook()).slice(0,8),photoY=238,photoH=Math.round(940*source.height/source.width);
  canvas.width=1080;canvas.height=photoY+photoH+60+40+30+Math.ceil(items.length/2)*78+110;
  ctx.fillStyle='#f5f5f3';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#111111';ctx.fillRect(0,0,canvas.width,150);
  ctx.fillStyle='#c8102e';ctx.fillRect(64,53,8,48);
  ctx.fillStyle='#ffffff';ctx.font='700 30px Montserrat, Arial, sans-serif';ctx.fillText('ESPEJO VIRTUAL',92,87);
  ctx.fillStyle='#c8102e';ctx.font='700 18px Montserrat, Arial, sans-serif';ctx.fillText('TU LOOK',70,207);
  const box={x:70,y:photoY,w:940,h:photoH};
  ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();
  ctx.translate(box.x+box.w,box.y);ctx.scale(-1,1);
  ctx.drawImage(source,0,0,box.w,box.h);ctx.restore();
  ctx.strokeStyle='#d7d7d4';ctx.lineWidth=2;ctx.strokeRect(box.x,box.y,box.w,box.h);
  const listTitleY=photoY+photoH+60;
  ctx.fillStyle='#151515';ctx.font='700 25px Montserrat, Arial, sans-serif';ctx.fillText('PRODUCTOS PROBADOS',70,listTitleY);
  const colW=470,rowH=78;
  items.forEach(([cat,item],i)=>{
   const x=70+(i%2)*colW,y=listTitleY+45+Math.floor(i/2)*rowH;
   const product=findProd(item.pid),shade=product.shades[item.s];
   ctx.fillStyle=shade.hex;ctx.beginPath();ctx.arc(x+13,y+13,10,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#151515';ctx.font='700 17px Montserrat, Arial, sans-serif';ctx.fillText(`${CAT_LABEL[cat]} · ${product.name}`,x+34,y+18);
   ctx.fillStyle='#737373';ctx.font='400 15px Montserrat, Arial, sans-serif';ctx.fillText(`${shade.n} · ${product.price}`,x+34,y+44);
  });
  ctx.fillStyle='#737373';ctx.font='400 13px Montserrat, Arial, sans-serif';
  ctx.fillText('Vista previa orientativa. El resultado puede variar según la luz y la pantalla.',70,canvas.height-42);
  canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('El navegador no pudo crear la imagen.')),'image/png');
 });
}
async function saveLook(){
 if(!Object.keys(activeLook()).length){hint('Prueba al menos un producto antes de guardar tu look.');return}
 if(!LM||$('#vMain').readyState<2){hint('Alinea tu rostro con la cámara antes de guardar.');return}
 $('#btnSave').disabled=true;
 $('#exportStatus').textContent='Preparando la imagen…';
 try{
  const blob=await exportBlob();
  if(exportUrl)URL.revokeObjectURL(exportUrl);
  exportUrl=URL.createObjectURL(blob);
  $('#lookPreview').src=exportUrl;$('#lookPreview').hidden=false;$('#previewPlaceholder').hidden=true;
  $('#downloadLook').disabled=false;
  $('#exportStatus').textContent='Imagen creada en este dispositivo. Descárgala para guardarla; no se ha subido a ningún servidor.';
  go('save');
 }catch(err){
  $('#exportStatus').textContent='No se pudo preparar la imagen. Vuelve al espejo e inténtalo de nuevo.';
  hint('No se pudo preparar la imagen.');
  console.error('Error al crear la imagen del look:',err);
 }finally{$('#btnSave').disabled=false}
}
$('#welcomeFace').innerHTML=faceSVG({lips:{hex:'#A33F4B',i:.8},blush:{hex:'#E58C8A',i:.5}});
window.addEventListener('pagehide',()=>{stopCamera();if(exportUrl)URL.revokeObjectURL(exportUrl)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if($('#scan').classList.contains('on')||$('#mirror').classList.contains('on'))startCamera()});
