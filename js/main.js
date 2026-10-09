import {CATALOG,CAT_LABEL,LOOKS} from "./product-data.js";
import {faceSVG} from "./face-art.js";

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SEGMODEL="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";
const FACE_SKIN=3,BODY_SKIN=2;
const S={cat:'base',look:{}};let landmarker=null,segmenter=null,stream=null,LM=null,cur=0,done=false,okSince=0;
let segData=null,segW=0,segH=0,skinReady=false,lastSegAt=0,skinLum=132,skinRGB=[220,185,160],segUnavailable=false,segVersion=0,segBuiltV=-1,skinQX=-1,skinQY=-1,skinW=0,skinH=0,skinV=-1;
let cameraEpoch=0,exportUrl=null;
const findProd=id=>Object.values(CATALOG).flat().find(p=>p.id===id);
const activeLook=()=>{const o={};for(const k in S.look)if(S.look[k].on)o[k]=S.look[k];return o};
const pos=v=>{$('#stage').style.setProperty('--pos',v+'%');$('#divider').setAttribute('aria-valuenow',Math.round(v))};

/* ---------- Idioma (ES/EN) y textos de la interfaz ---------- */
const I18N={
es:{
 'welcome.eyebrow':'Belleza profesional · Experiencia virtual','welcome.h1':'Tu belleza.<br>A tu manera.','welcome.p':'Descubre cómo podrían quedarte nuestros productos.','welcome.start':'Comenzar','welcome.small':'Una experiencia de belleza · Sin compromiso',
 'consent.eyebrow':'Tu privacidad es lo primero','consent.h2':'Utilizaremos tu cámara para crear esta experiencia de prueba virtual.','consent.p':'El vídeo se procesa en este dispositivo; no se envía ni se guarda. Solo se guarda una imagen si la descargas. Si calibras el color, la calibración queda guardada en este navegador. La cámara se apaga al salir.','consent.accept':'Aceptar y continuar','consent.no':'Ahora no',
 'scan.eyebrow':'Prueba virtual','scan.cancel':'Cancelar','scan.retry':'Reintentar cámara','scan.c0':'Rostro detectado','scan.c1':'Iluminación adecuada','scan.c2':'Posición correcta',
 'mirror.back':'← Atrás','mirror.backAria':'Volver','mirror.look':'Mi look','mirror.compare':'Comparar','mirror.save':'Guardar','mirror.calibrate':'Calibrar','mirror.tag':'Elige un producto para empezar.','mirror.before':'Antes','mirror.after':'Después','mirror.subtle':'Sutil','mirror.intense':'Intensa','mirror.intensity':'Intensidad','mirror.catalog':'Catálogo de demostración · Productos, precios y ubicación ficticios',
 'store.title':'Ubicación de ejemplo','store.close':'Cerrar','store.aisle':'Pasillo de ejemplo','store.section':'Sección','store.demo':'El catálogo y la ubicación son datos ficticios de demostración; no representan existencias reales.',
 'save.eyebrow':'Tu selección','save.h2':'Tu look, listo para guardar','save.placeholder':'La vista previa de tu look aparecerá aquí.','save.download':'Descargar imagen','save.finish':'Terminar','save.keep':'Seguir probando','save.previewAlt':'Vista previa del look creado','save.needProduct':'Prueba al menos un producto antes de guardar tu look.','save.align':'Alinea tu rostro con la cámara antes de guardar.','save.preparing':'Preparando la imagen…','save.ready':'Imagen creada en este dispositivo. Descárgala para guardarla; no se ha subido a ningún servidor.','save.error':'No se pudo preparar la imagen. Vuelve al espejo e inténtalo de nuevo.','save.errorShort':'No se pudo preparar la imagen.',
 'cam.prep':'Preparando la cámara','cam.permission':'Acepta el permiso del navegador para continuar.','cam.face':'Coloca tu rostro aquí','cam.looking':'Mirando a la cámara','cam.loadingFace':'Cargando detección facial…','cam.lost':'Se ha perdido la cámara','cam.lostMsg':'La cámara se ha desconectado. Comprueba el dispositivo y vuelve a intentarlo.','cam.resume':'No se pudo reanudar la cámara. Vuelve al inicio para intentarlo de nuevo.','cam.failTitle':'No se pudo iniciar la prueba','cam.unsupported':'Este navegador no ofrece acceso a la cámara. Prueba con Chrome o Edge.','cam.denied':'No se concedió permiso para la cámara. Actívalo en el navegador y vuelve a intentarlo.','cam.notfound':'No se encontró ninguna cámara conectada.','cam.busy':'La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentarlo.','cam.security':'Abre la aplicación desde localhost o una conexión HTTPS para usar la cámara.','cam.generic':'No se pudo cargar la cámara o la detección facial. Comprueba tu conexión y vuelve a intentarlo.',
 'scan.perfect':'Perfecto.','scan.preparing':'Estamos preparando tu experiencia.',
 'hint.noFace':'No vemos tu rostro. Mira a la cámara.','hint.dark':'Poca luz: acércate a una zona más iluminada.','hint.yaw':'Mira a la cámara para ver el resultado completo.','hint.detectFail':'La detección facial se ha interrumpido. Vuelve a iniciar la prueba.',
 'quality.auto':'Automática','quality.high':'Alta','quality.fluid':'Fluida','quality.btn':l=>`Calidad: ${l}`,
 'cat.base':'Base','cat.blush':'Colorete','cat.lips':'Labios','cat.eyes':'Ojos','cat.glow':'Iluminador','cat.contour':'Contorno','cat.liner':'Delineador','cat.lash':'Pestañas','cat.brow':'Cejas',
 'fin.Mate':'Mate','fin.Luminoso':'Luminoso','fin.Satinado':'Satinado','fin.Brillo':'Brillo','fin.Glitter':'Glitter','fin.Suave':'Suave','fin.Definido':'Definido','fin.Definida':'Definida','fin.Fino':'Fino','fin.Clásico':'Clásico','fin.Alado':'Alado','fin.Natural':'Natural','fin.Volumen':'Volumen',
 'prod.try':'Probar','shade.selected':'Tu selección','look.empty':'Aún no has probado nada.','look.ideas':'Ideas de combinación del catálogo de demostración: ','look.store':'Ver ubicación de ejemplo',
 'rec.button':'Recomendar mi tono','rec.needFace':'Mira a la cámara para analizar tu tono.','rec.done':(b,c)=>`Tono sugerido: base ${b} · colorete ${c}`,
 'cal.confirm':'Coloca una tarjeta gris o blanca en el centro de la imagen. ¿Calibrar ahora?','cal.error':'No se pudo guardar la calibración en este navegador.',
 'export.look':'TU LOOK','export.products':'PRODUCTOS PROBADOS','export.disclaimer':'Vista previa orientativa. El resultado puede variar según la luz y la pantalla.','export.noImage':'No hay una imagen de cámara disponible para exportar.','export.noBlob':'El navegador no pudo crear la imagen.'
},
en:{
 'welcome.eyebrow':'Professional beauty · Virtual experience','welcome.h1':'Your beauty.<br>Your way.','welcome.p':'Discover how our products could look on you.','welcome.start':'Start','welcome.small':'A beauty experience · No commitment',
 'consent.eyebrow':'Your privacy comes first','consent.h2':'We will use your camera to create this virtual try-on experience.','consent.p':'The video is processed on this device; it is not sent or stored. An image is only saved if you download it. If you calibrate the colour, the calibration is stored in this browser. The camera turns off when you leave.','consent.accept':'Accept and continue','consent.no':'Not now',
 'scan.eyebrow':'Virtual try-on','scan.cancel':'Cancel','scan.retry':'Retry camera','scan.c0':'Face detected','scan.c1':'Good lighting','scan.c2':'Correct position',
 'mirror.back':'← Back','mirror.backAria':'Back','mirror.look':'My look','mirror.compare':'Compare','mirror.save':'Save','mirror.calibrate':'Calibrate','mirror.tag':'Choose a product to start.','mirror.before':'Before','mirror.after':'After','mirror.subtle':'Subtle','mirror.intense':'Intense','mirror.intensity':'Intensity','mirror.catalog':'Demo catalog · Fictional products, prices and location',
 'store.title':'Example location','store.close':'Close','store.aisle':'Example aisle','store.section':'Section','store.demo':'The catalog and location are fictional demo data; they do not represent real stock.',
 'save.eyebrow':'Your selection','save.h2':'Your look, ready to save','save.placeholder':'Your look preview will appear here.','save.download':'Download image','save.finish':'Finish','save.keep':'Keep trying','save.previewAlt':'Preview of the created look','save.needProduct':'Try at least one product before saving your look.','save.align':'Align your face with the camera before saving.','save.preparing':'Preparing the image…','save.ready':'Image created on this device. Download it to save it; it has not been uploaded to any server.','save.error':'Could not prepare the image. Go back to the mirror and try again.','save.errorShort':'Could not prepare the image.',
 'cam.prep':'Preparing the camera','cam.permission':'Accept the browser permission to continue.','cam.face':'Place your face here','cam.looking':'Looking at the camera','cam.loadingFace':'Loading face detection…','cam.lost':'Camera lost','cam.lostMsg':'The camera has disconnected. Check the device and try again.','cam.resume':'Could not resume the camera. Go back to the start to try again.','cam.failTitle':'Could not start the try-on','cam.unsupported':'This browser does not offer camera access. Try Chrome or Edge.','cam.denied':'Camera permission was not granted. Enable it in the browser and try again.','cam.notfound':'No connected camera was found.','cam.busy':'The camera is in use by another application. Close it and try again.','cam.security':'Open the app from localhost or an HTTPS connection to use the camera.','cam.generic':'Could not load the camera or face detection. Check your connection and try again.',
 'scan.perfect':'Perfect.','scan.preparing':'We are preparing your experience.',
 'hint.noFace':'We cannot see your face. Look at the camera.','hint.dark':'Low light: move to a brighter area.','hint.yaw':'Look at the camera to see the full result.','hint.detectFail':'Face detection was interrupted. Start the try-on again.',
 'quality.auto':'Auto','quality.high':'High','quality.fluid':'Smooth','quality.btn':l=>`Quality: ${l}`,
 'cat.base':'Foundation','cat.blush':'Blush','cat.lips':'Lips','cat.eyes':'Eyes','cat.glow':'Highlighter','cat.contour':'Contour','cat.liner':'Liner','cat.lash':'Lashes','cat.brow':'Brows',
 'fin.Mate':'Matte','fin.Luminoso':'Glow','fin.Satinado':'Satin','fin.Brillo':'Gloss','fin.Glitter':'Glitter','fin.Suave':'Soft','fin.Definido':'Defined','fin.Definida':'Defined','fin.Fino':'Thin','fin.Clásico':'Classic','fin.Alado':'Winged','fin.Natural':'Natural','fin.Volumen':'Volume',
 'prod.try':'Try','shade.selected':'Your selection','look.empty':'You have not tried anything yet.','look.ideas':'Combination ideas from the demo catalog: ','look.store':'See example location',
 'rec.button':'Recommend my tone','rec.needFace':'Look at the camera to analyse your tone.','rec.done':(b,c)=>`Suggested tone: foundation ${b} · blush ${c}`,
 'cal.confirm':'Place a grey or white card in the centre of the image. Calibrate now?','cal.error':'Could not save the calibration in this browser.',
 'export.look':'YOUR LOOK','export.products':'PRODUCTS TRIED','export.disclaimer':'Indicative preview. The result may vary with lighting and screen.','export.noImage':'No camera image is available to export.','export.noBlob':'The browser could not create the image.'
}
};
let lang=(()=>{try{const s=localStorage.getItem('kiosco.lang');if(s==='es'||s==='en')return s}catch(e){}return /^en/i.test(navigator.language||'')?'en':'es'})();
const t=(k,...a)=>{const v=(I18N[lang]&&I18N[lang][k])??I18N.es[k];return typeof v==='function'?v(...a):(v??k)};
const exportNoUpload=()=>lang==='en'?'The image is prepared on this device. It is not sent to any server.':'La imagen se prepara en este dispositivo. No se envía a ningún servidor.';
function applyLang(){document.documentElement.lang=lang;
 $$('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
 $$('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml)});
 $$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
 $$('.btnLang').forEach(lb=>{lb.textContent=lang==='es'?'EN':'ES';lb.setAttribute('aria-label',lang==='es'?'Switch to English':'Cambiar a español')})}
$$('.btnLang').forEach(lb=>lb.onclick=()=>{lang=lang==='es'?'en':'es';try{localStorage.setItem('kiosco.lang',lang)}catch(e){}
 applyLang();if($('#scan').classList.contains('on')&&!done){$('#scanTitle').textContent=t('cam.face');$('#scanSub').textContent=t('cam.looking')}render()});

/* ---------- Modo quiosco (?kiosco o ?kiosco=segundos) ---------- */
const KIOSK=(()=>{const m=location.search.match(/[?&]kiosco(?:=(\d+))?/);return m?{on:true,idle:Math.max(10,+(m[1]||45))*1000}:{on:false,idle:0}})();

/* ---------- Calidad adaptativa: evita tirones en móvil y equipos lentos ---------- */
const IS_MOBILE=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
const Q={level:2,dpr:2,smooth:true,seg:true,segEvery:140,detEvery:33,renderEvery:0,passes:1,auto:true,cpu:false};
function setLevel(l){l=Math.max(0,Math.min(2,l));Q.level=l;
 Q.dpr=l>=2?2:l===1?1.5:1.25;Q.smooth=l>=2;Q.seg=l>=1;
 Q.segEvery=l>=2?200:l===1?300:99999;Q.detEvery=l>=2?33:l===1?50:66;
 Q.renderEvery=l>=2?0:l===1?33:50;Q.passes=l>=2?1:l===1?.85:.62;
 if(!Q.seg&&segmenter){try{segmenter.close()}catch(e){}segmenter=null;segData=null;skinReady=false}}
const DEFAULT_LEVEL=()=>Q.cpu?0:LOW_END?0:IS_MOBILE?1:2;
const LOW_END=IS_MOBILE&&((navigator.hardwareConcurrency||8)<=2||(navigator.deviceMemory||8)<=2);
const QUALITY={mode:'auto'};
function qualityLabel(){return QUALITY.mode==='high'?t('quality.high'):QUALITY.mode==='fluid'?t('quality.fluid'):t('quality.auto')}
function setMode(m){QUALITY.mode=m;Q.auto=m==='auto';
 if(m==='high')setLevel(Q.cpu?0:2);else if(m==='fluid')setLevel(0);else setLevel(DEFAULT_LEVEL());
 const b=$('#btnQuality');if(b){b.textContent=t('quality.btn',qualityLabel());b.classList.toggle('act',m!=='auto')}
 if(Q.seg&&!segmenter&&!segUnavailable&&stream)startCamera()}
setLevel(DEFAULT_LEVEL());

/* ---------- Cámara + detección (todo en el dispositivo, nada se sube ni se guarda) ---------- */
async function startCamera(){
 const epoch=++cameraEpoch;
 $('#scanRetry').hidden=true;
 try{
  $('#scanTitle').textContent=t('cam.prep');
  $('#scanSub').textContent=t('cam.permission');
  if(!navigator.mediaDevices?.getUserMedia){const error=new Error('UNSUPPORTED');error.name='UNSUPPORTED';throw error}
  if(!stream){const candidate=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:IS_MOBILE?960:1280},height:{ideal:IS_MOBILE?540:720}},audio:false});
   if(epoch!==cameraEpoch){candidate.getTracks().forEach(t=>t.stop());return}stream=candidate}
  $$('video').forEach(video=>{video.pause();video.srcObject=stream});
  for(const track of stream.getVideoTracks())track.addEventListener('ended',()=>{
   if(!stream?.getTracks().includes(track))return;
   LM=null;
   const message=t('cam.lostMsg');
   if($('#scan').classList.contains('on')){$('#scanTitle').textContent=t('cam.lost');$('#scanSub').textContent=message;$('#scanRetry').hidden=false}
   else if($('#mirror').classList.contains('on'))hint(message);
  },{once:true});
  const video=$('#scan').classList.contains('on')?$('#vScan'):$('#vMain');await video.play();
  if(epoch!==cameraEpoch)return;
  $('#scanTitle').textContent=t('cam.face');
  $('#scanSub').textContent=t('cam.looking');
  if(!landmarker||(Q.seg&&!segmenter&&!segUnavailable)){
   const {FaceLandmarker,ImageSegmenter,FilesetResolver}=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs");
   if(epoch!==cameraEpoch)return;
   const fs=await FilesetResolver.forVisionTasks(WASM);
   if(epoch!==cameraEpoch)return;
   if(!landmarker){
     $('#scanSub').textContent=t('cam.loadingFace');
    const options={baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.45,minFacePresenceConfidence:.45,minTrackingConfidence:.45};
    let detector;
    try{detector=await FaceLandmarker.createFromOptions(fs,options)}
    catch(gpuError){if(epoch!==cameraEpoch)return;detector=await FaceLandmarker.createFromOptions(fs,{...options,baseOptions:{modelAssetPath:MODEL,delegate:'CPU'}});Q.cpu=true}
    if(epoch!==cameraEpoch){detector.close();return}
    landmarker=detector;
    if(Q.cpu){if(Q.auto){setLevel(0);Q.detEvery=90;Q.renderEvery=66}console.warn('Detección facial en CPU: se reduce la calidad para mantener la fluidez.')}
   }
   if(Q.seg&&!segmenter&&!segUnavailable){
    try{
     const segOptions={baseOptions:{modelAssetPath:SEGMODEL,delegate:'GPU'},runningMode:'VIDEO',outputCategoryMask:true,outputConfidenceMasks:false};
     const seg=await ImageSegmenter.createFromOptions(fs,segOptions);
     if(epoch!==cameraEpoch){seg.close();return}
     segmenter=seg;skinReady=false;Q.seg=true;
    }catch(err){segmenter=null;skinReady=false;Q.seg=false;segUnavailable=true;console.warn('Segmentación facial no disponible; se usará el óvalo facial como máscara.',err)}
   }
  }
  if(epoch!==cameraEpoch)return;
  $('#scanTitle').textContent=t('cam.face');
  $('#scanSub').textContent=t('cam.looking');
 }catch(err){
  if(epoch!==cameraEpoch)return;
  stopCamera();
  const messages={UNSUPPORTED:t('cam.unsupported'),NotAllowedError:t('cam.denied'),NotFoundError:t('cam.notfound'),NotReadableError:t('cam.busy'),SecurityError:t('cam.security')};
  const message=messages[err.name]||t('cam.generic');
  $('#scanTitle').textContent=t('cam.failTitle');
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
 if(segmenter){segmenter.close();segmenter=null}
 segData=null;skinReady=false;lastSegAt=0;segUnavailable=false;
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
  if(!done&&performance.now()-okSince>1200){done=true;$('#scanTitle').textContent=t('scan.perfect');$('#scanSub').textContent=t('scan.preparing');setTimeout(()=>{if($('#scan').classList.contains('on'))go('mirror')},900)}}
 else okSince=0;
}

/* ---------- Motor de maquillaje sobre landmarks ---------- */
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const LEYE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7],REYE=[362,398,384,385,386,387,388,466,263,249,390,373,374,380,381,382];
const LIPO=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185],LIPI=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
const LBROW=[70,63,105,66,107,55,65,52,53,46],RBROW=[300,293,334,296,336,285,295,282,283,276];
const LLID=[33,246,161,160,159,158,157,173,133],LBR=[70,63,105,66,107],RLID=[263,466,388,387,386,385,384,398,362],RBR=[300,293,334,296,336];
const FOPT={base:[['matte','Mate'],['glow','Luminoso']],blush:[['matte','Mate'],['satin','Satinado']],lips:[['matte','Mate'],['satin','Satinado'],['gloss','Brillo']],eyes:[['matte','Mate'],['satin','Satinado'],['glitter','Glitter']],contour:[['soft','Suave'],['defined','Definido']],liner:[['thin','Fino'],['classic','Clásico'],['wing','Alado']],lash:[['natural','Natural'],['volume','Volumen']],brow:[['natural','Natural'],['defined','Definida']]};
const FDEF={base:'matte',blush:'matte',lips:'satin',eyes:'matte',contour:'soft',liner:'classic',lash:'natural',brow:'natural'};
const cv=$('#cv'),cx=cv.getContext('2d'),cvB=$('#cvB'),cxB=cvB.getContext('2d');
const pigmentCanvas=document.createElement('canvas'),pigmentCtx=pigmentCanvas.getContext('2d');
const segCanvas=document.createElement('canvas');segCanvas.width=segCanvas.height=256;const segCtx=segCanvas.getContext('2d',{willReadFrequently:true});
const skinCanvas=document.createElement('canvas'),skinCtx=skinCanvas.getContext('2d');

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
 let sl=0,sn=0,sr=0,sg=0,sb=0;if(LM)[151,205,425,117,346,50,280,168,234,454].forEach(i=>{const x=Math.min(31,Math.max(0,Math.round(LM[i].x*31))),y=Math.min(23,Math.max(0,Math.round(LM[i].y*23))),k=(y*32+x)*4;sl+=d[k]*.3+d[k+1]*.59+d[k+2]*.11;sr+=d[k];sg+=d[k+1];sb+=d[k+2];sn++});
 if(sn){skinLum+=(sl/sn-skinLum)*.15;skinRGB[0]+=(sr/sn-skinRGB[0])*.15;skinRGB[1]+=(sg/sn-skinRGB[1])*.15;skinRGB[2]+=(sb/sn-skinRGB[2])*.15}
}
const adapt=hex=>{const n=parseInt(hex.slice(1),16);return '#'+[n>>16&255,n>>8&255,n&255].map((v,i)=>Math.max(0,Math.min(255,Math.round(v*ENV.tint[i]*ENV.exp))).toString(16).padStart(2,'0')).join('')};
const dc=document.createElement('canvas'),dx=dc.getContext('2d');let lastTs=0;
function detect(v){ // con poca luz se aclara la imagen antes de detectar
 let src=v;if(ENV.dark&&v.videoWidth){dc.width=640;dc.height=Math.round(640*v.videoHeight/v.videoWidth);dx.filter='brightness(1.9) contrast(1.15)';dx.drawImage(v,0,0,dc.width,dc.height);src=dc}
  const ts=Math.max(lastTs+1,performance.now());lastTs=ts;
  return landmarker.detectForVideo(src,ts).faceLandmarks[0]||null}
function segStep(v){
 if(!segmenter||!v.videoWidth)return;
 const now=performance.now();if(!Q.seg||now-lastSegAt<Q.segEvery)return;lastSegAt=now;
 try{
  const res=segmenter.segmentForVideo(v,now);
  if(res.categoryMask){const a=res.categoryMask.getAsUint8Array();segData=a.slice();segW=res.categoryMask.width;segH=res.categoryMask.height;res.categoryMask.close();skinReady=true;segVersion++}
  if(res.confidenceMasks)res.confidenceMasks.forEach(m=>m.close());
 }catch(err){try{segmenter&&segmenter.close()}catch(e){}segmenter=null;segData=null;skinReady=false;console.error('Error en la segmentación facial:',err)}
}
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
 const st=$('#stage'),W=st.clientWidth,H=st.clientHeight,cmp=st.classList.contains('cmp');
 const ppMax=IS_MOBILE?1.6e6:2.6e6,dpr=Math.max(1,Math.min(devicePixelRatio||1,Q.dpr,Math.sqrt(ppMax/Math.max(1,W*H))));
 for(const c of [cv,cvB])if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}
 cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
 if(cmp){cxB.setTransform(dpr,0,0,dpr,0,0);cxB.clearRect(0,0,W,H)}
 if(!v.videoWidth)return;
 const vw=v.videoWidth,vh=v.videoHeight,sc=Math.max(W/vw,H/vh),ox=(W-vw*sc)/2,oy=(H-vh*sc)/2;
 const f0=ENV.dark?'brightness(1.6) contrast(1.1)':'none';cx.filter=f0;
 cx.drawImage(v,ox,oy,vw*sc,vh*sc);cx.filter='none';
 if(cmp){cxB.filter=f0;cxB.drawImage(v,ox,oy,vw*sc,vh*sc);cxB.filter='none'}
 const L0=activeLook();
 if(!LM){hint(Object.keys(L0).length?t('hint.noFace'):'');return}
 const yaw=(()=>{const dl=LM[1].x-LM[234].x,dr=LM[454].x-LM[1].x;return(dl-dr)/((dl+dr)||1)})();
 const fL=cl(1-(-yaw-.3)/.3),fR=cl(1-(yaw-.3)/.3),tf=lostAt?cl(1-(performance.now()-lostAt)/500):1,F=cl(1-(Math.abs(yaw)-.55)/.2)*tf;
 hint(!Object.keys(L0).length?'':ENV.dark?t('hint.dark'):Math.abs(yaw)>.35?t('hint.yaw'):'');
 const L={};for(const k in L0){const o=L0[k];L[k]={...o,hex:adapt(o.hex),i:Math.min(1,o.i*F*(findProd(o.pid)?.cov??1))}}
 if(!Object.keys(L).length)return;
 const P=i=>[LM[i].x*vw*sc+ox,LM[i].y*vh*sc+oy];
 const path=(idx,p=new Path2D())=>{idx.forEach((i,k)=>{const [x,y]=P(i);k?p.lineTo(x,y):p.moveTo(x,y)});p.closePath();return p};
 const fw=Math.hypot(...P(234).map((a,k)=>a-P(454)[k]));
 const facePoints=OVAL.map(P),faceBounds=facePoints.reduce((b,p)=>({left:Math.min(b.left,p[0]),top:Math.min(b.top,p[1]),right:Math.max(b.right,p[0]),bottom:Math.max(b.bottom,p[1])}),{left:W,top:H,right:0,bottom:0});
 const pad=fw*.04,x0=Math.max(0,faceBounds.left-pad),y0=Math.max(0,faceBounds.top-pad),x1=Math.min(W,faceBounds.right+pad),y1=Math.min(H,faceBounds.bottom+pad);
 const outW=Math.max(1,Math.ceil((x1-x0)*dpr)),outH=Math.max(1,Math.ceil((y1-y0)*dpr));
 const pcW=Math.max(16,Math.ceil(outW/16)*16),pcH=Math.max(16,Math.ceil(outH/16)*16);
  if(pigmentCanvas.width!==pcW||pigmentCanvas.height!==pcH){pigmentCanvas.width=pcW;pigmentCanvas.height=pcH}
  /* máscara de piel real (segmentación multiclase) para que el maquillaje no invada pelo ni fondo */
  const hasSkin=skinReady&&segData&&segW&&segH;
  if(hasSkin){
   if(skinCanvas.width!==pcW||skinCanvas.height!==pcH){skinCanvas.width=pcW;skinCanvas.height=pcH}
   const qx=Math.round(x0*dpr),qy=Math.round(y0*dpr);
   if(skinV!==segVersion||qx!==skinQX||qy!==skinQY||skinW!==pcW||skinH!==pcH){
    if(segBuiltV!==segVersion){
     if(segCanvas.width!==segW||segCanvas.height!==segH){segCanvas.width=segW;segCanvas.height=segH}
     const img=segCtx.createImageData(segW,segH),sd=img.data;
     for(let i=0;i<segW*segH;i++){const c=segData[i],k=i*4,on=(c===FACE_SKIN||c===BODY_SKIN);sd[k]=255;sd[k+1]=255;sd[k+2]=255;sd[k+3]=on?255:0}
     segCtx.putImageData(img,0,0);segBuiltV=segVersion;
    }
    skinCtx.setTransform(1,0,0,1,0,0);skinCtx.clearRect(0,0,skinCanvas.width,skinCanvas.height);
    skinCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);
    skinCtx.save();skinCtx.filter=`blur(${Math.max(1.5,fw*.009)}px)`;skinCtx.drawImage(segCanvas,ox,oy,vw*sc,vh*sc);skinCtx.restore();
    skinV=segVersion;skinQX=qx;skinQY=qy;skinW=pcW;skinH=pcH;
   }
  }
  const skinOnlyLayer=()=>{pigmentCtx.save();pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.globalCompositeOperation='destination-in';pigmentCtx.filter='none';pigmentCtx.drawImage(skinCanvas,0,0);pigmentCtx.restore()};
  const lumHex=hex=>{const n=parseInt(hex.slice(1),16);return (n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11};
  /* máscara suavizada reutilizable: se difumina una vez y cada `tint` solo la colorea y compone */
  const buildMask=(shape,feather,rule='nonzero',skinOnly=false)=>{
   pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.clearRect(0,0,pcW,pcH);
   pigmentCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);
   pigmentCtx.save();pigmentCtx.fillStyle='#fff';pigmentCtx.fill(shape,rule);pigmentCtx.restore();
   if(feather>0){pigmentCtx.save();pigmentCtx.globalCompositeOperation='destination-in';pigmentCtx.filter=`blur(${feather}px)`;pigmentCtx.fillStyle='#fff';pigmentCtx.fill(shape,rule);pigmentCtx.restore()}
   if(skinOnly&&hasSkin)skinOnlyLayer();
  };
  const tint=(hex,alpha,blend)=>{if(alpha<=.002)return;
   pigmentCtx.save();pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.globalCompositeOperation='source-in';pigmentCtx.filter='none';pigmentCtx.fillStyle=hex;pigmentCtx.fillRect(0,0,pcW,pcH);pigmentCtx.restore();
   cx.save();cx.globalCompositeOperation=blend;cx.globalAlpha=Math.min(1,Math.max(0,alpha));cx.drawImage(pigmentCanvas,x0,y0,pcW/dpr,pcH/dpr);cx.restore();
  };
  /* mancha elíptica degradada compuesta en una capa, opcionalmente restringida a la piel */
  const blob=(x,y,rx,ry,rot,hex,alpha,blend,skinOnly=true)=>{
   if(alpha<=.002)return;
   const R=Math.max(rx,ry),bxp=Math.max(0,Math.floor(x-R-x0)),byp=Math.max(0,Math.floor(y-R-y0));
   const bwp=Math.min(pcW-bxp,Math.ceil(2*R)+2),bhp=Math.min(pcH-byp,Math.ceil(2*R)+2);
   if(bwp<=0||bhp<=0)return;
   pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.clearRect(bxp,byp,bwp,bhp);
   pigmentCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);
   pigmentCtx.save();pigmentCtx.translate(x,y);pigmentCtx.rotate(rot);pigmentCtx.scale(rx,ry);
   const g=pigmentCtx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,hex);g.addColorStop(.5,hex+'B0');g.addColorStop(1,hex+'00');
   pigmentCtx.fillStyle=g;pigmentCtx.beginPath();pigmentCtx.arc(0,0,1,0,7);pigmentCtx.fill();pigmentCtx.restore();
   if(skinOnly&&hasSkin){pigmentCtx.save();pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.globalCompositeOperation='destination-in';pigmentCtx.filter='none';pigmentCtx.drawImage(skinCanvas,bxp,byp,bwp,bhp,bxp,byp,bwp,bhp);pigmentCtx.restore()}
   cx.save();cx.globalCompositeOperation=blend;cx.globalAlpha=Math.min(1,Math.max(0,alpha));cx.drawImage(pigmentCanvas,bxp,byp,bwp,bhp,x0+bxp/dpr,y0+byp/dpr,bwp/dpr,bhp/dpr);cx.restore();
  };
 /* pinta trazos (delineador) en una capa aparte y la compone una sola vez para evitar costuras */
 const strokeLayer=(drawFn,alpha)=>{pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.clearRect(0,0,pcW,pcH);
  pigmentCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);drawFn(pigmentCtx);
  cx.save();cx.globalAlpha=Math.min(1,Math.max(0,alpha));cx.drawImage(pigmentCanvas,x0,y0,pcW/dpr,pcH/dpr);cx.restore()};
 /* suaviza la piel bajo la base conservando el detalle de ojos, cejas y labios */
 const smoothSkin=(shape,feather,alpha,rule)=>{if(alpha<=.002)return;
  pigmentCtx.setTransform(1,0,0,1,0,0);pigmentCtx.clearRect(0,0,pcW,pcH);
  pigmentCtx.setTransform(dpr,0,0,dpr,-x0*dpr,-y0*dpr);
  pigmentCtx.fillStyle='#fff';pigmentCtx.fill(shape,rule);
  pigmentCtx.save();pigmentCtx.globalCompositeOperation='destination-in';pigmentCtx.filter=`blur(${feather}px)`;pigmentCtx.fillStyle='#fff';pigmentCtx.fill(shape,rule);pigmentCtx.restore();
  pigmentCtx.save();pigmentCtx.globalCompositeOperation='source-in';pigmentCtx.filter=`blur(${Math.max(3,fw*.022)}px)`;pigmentCtx.drawImage(cv,0,0,W,H);pigmentCtx.restore();
  if(hasSkin)skinOnlyLayer();
  cx.save();cx.globalAlpha=alpha;cx.drawImage(pigmentCanvas,x0,y0,pcW/dpr,pcH/dpr);cx.restore()};
 const spotXY=(x,y,r,hex,a,mode)=>{const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hex);g.addColorStop(.6,hex+'B0');g.addColorStop(1,hex+'00');
  cx.save();cx.globalCompositeOperation=mode;cx.globalAlpha=Math.min(1,Math.max(0,a));cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();cx.restore()};
 const spotY=(i,r,hex,a,mode,dy)=>{const [x,y]=P(i);spotXY(x,y+dy,r,hex,a,mode)};
 const geoms=[[eyeGeom(LLID,LBR,P),fL],[eyeGeom(RLID,RBR,P),fR]];
 const faceMask=new Path2D();[OVAL,LEYE,REYE,LIPO,LBROW,RBROW].forEach(x=>path(x,faceMask));
 const roll=Math.atan2(P(263)[1]-P(33)[1],P(263)[0]-P(33)[0]);

 if(L.base){const b=L.base,i=b.i,delta=(lumHex(b.hex)-skinLum)/255;
  if(Q.smooth)smoothSkin(faceMask,fw*.024,.3*i,'evenodd');
  buildMask(faceMask,fw*.03,'evenodd',true);
  tint(b.hex,.48*i,'color');
  if(Q.passes>=.8)tint(b.hex,.26*i,'soft-light');
  if(delta<-.015)tint(b.hex,Math.min(.55,.16-delta*.9)*i,'multiply');
  else if(delta>.015)tint(b.hex,Math.min(.45,.12+delta*.8)*i,'screen');
  else if(Q.passes>=.8)tint(b.hex,.14*i,'multiply');
  if(b.f==='glow'&&Q.level>=2)[[151,.075],[205,.085],[425,.085],[168,.05]].forEach(([k,r])=>{const [x,y]=P(k);blob(x,y,fw*r,fw*r*.6,roll,'#FFF6E8',.2*i,'screen')})}
 if(L.blush){const b=L.blush
  ;[[205,-1,fL],[425,1,fR]].forEach(([i,s,f])=>{if(f<.02)return;const [x,y]=P(i),nx=x-P(1)[0],ny=y-P(1)[1],nl=Math.hypot(nx,ny)||1;
   const px=x+nx/nl*fw*.02,py=y+ny/nl*fw*.02,rot=roll+s*.28;
   blob(px,py,fw*.135,fw*.092,rot,b.hex,.34*b.i*f,'color');
   if(Q.passes>=.8)blob(px,py,fw*.135,fw*.092,rot,b.hex,.22*b.i*f,'soft-light');
   if(Q.level>=2)blob(x,y,fw*.07,fw*.05,rot,b.hex,.18*b.i*f,'multiply');
   if(b.f==='satin'&&Q.level>=2)blob(px-nx/nl*fw*.03,py-fw*.02,fw*.06,fw*.035,rot,'#FFF4EC',.1*b.i*f,'screen')
  })}
 if(L.contour){const k=L.contour,i=k.i
  ;[[234,205,-1],[454,425,1]].forEach(([ear,cheek,s])=>{const f=s<0?fL:fR;if(f<.02)return;
   const [ex,ey]=P(ear),[bx,by]=P(cheek),mx=(ex+bx)/2,my=(ey+by)/2+fw*.05,rot=roll+s*.32;
   blob(mx,my,fw*.14,fw*.08,rot,k.hex,.3*k.i*f,'multiply');
   if(Q.level>=2)blob(mx,my,fw*.09,fw*.05,rot,k.hex,.16*k.i*f,'multiply')
  });
  if(k.f==='defined'&&Q.level>=2)[136,150,149,176,148,152,365,379,378,400,377,397].forEach(idx=>{const [x,y]=P(idx),nx=P(1)[0]-x,ny=P(1)[1]-y,nl=Math.hypot(nx,ny)||1;
   blob(x+nx/nl*fw*.035,y+ny/nl*fw*.02,fw*.075,fw*.05,Math.atan2(ny,nx),k.hex,.18*k.i*F,'multiply')})}
 if(L.glow){const g=L.glow;[[117,fL],[346,fR]].forEach(([i,f])=>{if(f<.02)return;const [x,y]=P(i),nx=x-P(1)[0],ny=y-P(1)[1],nl=Math.hypot(nx,ny)||1;
   blob(x+nx/nl*fw*.015,y-fw*.01,fw*.09,fw*.045,roll,g.hex,.32*g.i*f,'screen');
   if(Q.level>=2)blob(x+nx/nl*fw*.015,y-fw*.01,fw*.045,fw*.03,roll,'#FFFDF6',.12*g.i*f,'screen')
  });
  blob(P(168)[0],P(168)[1],fw*.035,fw*.03,roll,g.hex,.2*g.i*F,'screen');
  if(Q.level>=2)for(const [gp,f] of geoms){if(f<.02)continue;const ip=gp.pts[gp.pts.length-1];spotXY(ip[0],ip[1],fw*.02,'#FFFDF4',.14*g.i*f,'screen')}}
 if(L.brow){const b=L.brow,i=b.i,def=b.f==='defined';[[LBROW,fL],[RBROW,fR]].forEach(([idx,f])=>{if(f<.02)return;const p=path(idx);
  buildMask(p,fw*.004);
  tint(b.hex,(.32*i+(def?.08*i:0))*f,'multiply');
  if(Q.passes>=.8)tint(b.hex,.18*i*f,'soft-light')
 })}
 if(L.eyes){const e=L.eyes,i=e.i,hi=Q.level>=2;
  for(const [g,f] of geoms){if(f<.02)continue;
    const p=curve(g.pts);curve(g.crease.slice().reverse(),p,false);p.closePath();
    buildMask(p,g.W*.018);
    tint(e.hex,.5*i*f,'soft-light');
    if(Q.passes>=.8)tint(e.hex,.26*i*f,'multiply');
    if(hi)tint(e.hex,.16*i*f,'color');
   if(hi)for(let s=0;s<5;s++){const q=s/4,idx=Math.round(q*(g.pts.length-1)),pp=g.pts[idx],cp=g.crease[idx],gx=(pp[0]+cp[0])/2,gy=(pp[1]+cp[1])/2;
    spotXY(gx,gy,g.W*(.17-.07*q),e.hex,(.2-.12*q)*i*f,'multiply')}
   if(hi){cx.save();cx.strokeStyle=e.hex;cx.globalCompositeOperation='multiply';cx.globalAlpha=.16*i*f;cx.lineWidth=g.W*.03;cx.lineCap='round';cx.stroke(curve(g.crease));cx.restore();
    const oc=g.pts[0];spotXY(oc[0],oc[1]-g.W*.02,g.W*.2,e.hex,.22*i*f,'multiply');
    const ic=g.pts[g.pts.length-1];spotXY(ic[0],ic[1],g.W*.1,'#FFF6EA',.16*i*f,'screen');
    if(e.f==='satin'||e.f==='glitter')spotXY(g.pts[4][0]+g.n[0]*g.W*.07,g.pts[4][1]+g.n[1]*g.W*.07,g.W*.14,'#FFF4E5',.15*i*f,'screen')}
   if(e.f==='glitter'){cx.save();cx.clip(p);cx.globalCompositeOperation='screen';let r=49297;const rnd=()=>(r=(r*9301+49297)%233280)/233280;
    for(let n=0;n<10;n++){const k=Math.floor(rnd()*g.pts.length),q=rnd(),size=Math.max(.8,g.W*.018);cx.globalAlpha=(.08+.22*rnd())*i*f;cx.fillStyle='#FFF4D6';
     cx.beginPath();cx.arc(g.pts[k][0]+(g.crease[k][0]-g.pts[k][0])*q,g.pts[k][1]+(g.crease[k][1]-g.pts[k][1])*q,size*.5,0,Math.PI*2);cx.fill()}cx.restore()}
  }}
 if(L.liner){const l=L.liner,i=l.i,spec={thin:.016,classic:.028,wing:.028}[l.f]||.028;
  for(const [g,f] of geoms){if(f<.02)continue;
   const w=g.W*spec,up=g.pts.map(q=>[q[0]+g.n[0]*w*.35,q[1]+g.n[1]*w*.35]);
   strokeLayer(x=>{x.lineCap='round';x.lineJoin='round';x.strokeStyle=l.hex;x.fillStyle=l.hex;
    for(let k=0;k<up.length-1;k++){const t=(k+.5)/(up.length-1);x.lineWidth=w*(.55+.45*Math.sin(Math.PI*t));x.beginPath();x.moveTo(up[k][0],up[k][1]);x.lineTo(up[k+1][0],up[k+1][1]);x.stroke()}
    if(l.f==='wing'){const o=[-g.u[0],-g.u[1]],e2=[up[0][0]+(o[0]*.8+g.n[0]*.55)*g.W*.26,up[0][1]+(o[1]*.8+g.n[1]*.55)*g.W*.26];
     x.beginPath();x.moveTo(up[0][0],up[0][1]);x.lineTo(e2[0],e2[1]);x.lineTo(up[1][0]+g.n[0]*w*.6,up[1][1]+g.n[1]*w*.6);x.lineTo(up[2][0],up[2][1]);x.closePath();x.fill()}
   },Math.min(1,(.5+.5*i)*f))
  }}
 if(L.lash){const m=L.lash,i=m.i,vol=m.f==='volume',N=vol?26:16;for(const [g,f] of geoms){if(f<.02)continue;
  cx.save();cx.strokeStyle=m.hex;cx.lineCap='round';cx.globalAlpha=Math.min(.82,.8*i*f);
  for(let j=0;j<N;j++){const t=j/(N-1),s=t*(g.pts.length-1),k=Math.min(g.pts.length-2,Math.floor(s)),q=s-k;
   const x=g.pts[k][0]+(g.pts[k+1][0]-g.pts[k][0])*q,y=g.pts[k][1]+(g.pts[k+1][1]-g.pts[k][1])*q;
   const lean=.75*(1-t)-.15*t,dx=g.n[0]-g.u[0]*lean,dy=g.n[1]-g.u[1]*lean,dl=Math.hypot(dx,dy)||1;
   const len=g.W*(vol?.14:.105)*(.55+.45*Math.pow(Math.sin(Math.PI*(.08+.84*t)),.8));
   cx.lineWidth=g.W*(vol?.014:.01)*(.7+.3*Math.sin(Math.PI*t));
   cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+dx/dl*len*.55-g.u[0]*len*.15,y+dy/dl*len*.55-g.u[1]*len*.15,x+dx/dl*len,y+dy/dl*len);cx.stroke()}
  cx.restore()}}
  if(L.lips){const l=L.lips,i=l.i,hi=Q.level>=2,p=new Path2D();path(LIPO,p);path(LIPI,p);
  buildMask(p,fw*.012,'evenodd');
  tint(l.hex,.42*i,'color');
  tint(l.hex,.3*i,'multiply');
  if(Q.passes>=.8)tint(l.hex,.2*i,'soft-light');
  if(hi){cx.save();cx.strokeStyle=l.hex;cx.globalCompositeOperation='multiply';cx.globalAlpha=.28*i;cx.lineWidth=Math.max(1,fw*.01);cx.lineJoin='round';cx.stroke(p);cx.restore()}
  cx.save();cx.clip(p,'evenodd');
  if(hi){spotXY((P(13)[0]+P(14)[0])/2,(P(13)[1]+P(14)[1])/2,fw*.03,'#2A0E12',.22*i,'multiply');
   if(l.f==='gloss'){spotY(17,fw*.038,'#FFF8F4',.26*i,'screen',-fw*.012);spotY(0,fw*.032,'#FFF8F4',.16*i,'screen',fw*.01);spotXY(P(0)[0],P(0)[1]-fw*.02,fw*.02,'#FFFFFF',.18*i,'screen')}
   else if(l.f==='satin'){spotY(17,fw*.045,'#FFF4EC',.1*i,'screen',-fw*.01);spotXY(P(0)[0],P(0)[1]-fw*.018,fw*.016,'#FFFFFF',.1*i,'screen')}}
  cx.restore()}
}
let last=-1,lastDetectAt=0,lastDrawAt=0,lastDrawn=-1,workSum=0,workN=0;
function loop(){
 const now=performance.now();
 const onScan=$('#scan').classList.contains('on'),onMir=$('#mirror').classList.contains('on');
 try{
  if(onScan||onMir){
   const v=onScan?$('#vScan'):$('#vMain');
   if(v.readyState>=2){
    const t0=performance.now();
    sense(v);
    if(landmarker&&v.currentTime!==last&&now-lastDetectAt>=Q.detEvery){
     last=v.currentTime;lastDetectAt=now;
     try{LM=smooth(detect(v))}
       catch(err){LM=null;hint(t('hint.detectFail'));console.error('Error durante la detección facial:',err)}
    }
    if(onScan){if(landmarker)scanStep(v)}
    else if(v.currentTime!==lastDrawn&&now-lastDrawAt>=Q.renderEvery){
     lastDrawn=v.currentTime;lastDrawAt=now;
     if(Q.seg&&Object.keys(activeLook()).length)segStep(v);
     draw(v);
    }
    if(onMir){const cost=performance.now()-t0;
     if(cost<150){workSum+=cost;workN++;if(workN>=20){const avg=workSum/workN;workSum=0;workN=0;if(Q.auto&&avg>34&&Q.level>0)setLevel(Q.level-1)}}}
   }
  }
 }catch(err){console.error('Error en el bucle de render:',err)}
 requestAnimationFrame(loop);
}
loop();

/* ---------- Interfaz ---------- */
function go(id){
 $$('.screen').forEach(s=>s.classList.toggle('on',s.id===id));
 if(id==='scan'){done=false;okSince=0;$('#scanTitle').textContent=t('cam.face');$('#scanSub').textContent=t('cam.looking');$$('.checks li').forEach(l=>l.classList.remove('ok'));startCamera()}
 if(id==='mirror'){render();workSum=0;workN=0;lastDrawn=-1;lastDetectAt=0;if(!stream)startCamera();else{$('#vScan').pause();$('#vScan').srcObject=null;$('#vMain').srcObject=stream;$('#vMain').play().catch(err=>{hint(t('cam.resume'));console.error('No se pudo reanudar la cámara:',err)})}}
 if(id==='welcome'){
  stopCamera();S.look={};S.cat='base';$('#lookPanel').classList.remove('open');
  if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null}
  $('#lookPreview').removeAttribute('src');$('#lookPreview').hidden=true;$('#previewPlaceholder').hidden=false;$('#downloadLook').disabled=true;
  $('#exportStatus').textContent=exportNoUpload();
 }
 if(id==='save')stopCamera();
}
function render(){refresh();renderCats();renderProducts();renderShades()}
function refresh(){$('#tag').style.opacity=Object.keys(S.look).length?0:1;renderLook()}
function renderCats(){$('#cats').innerHTML=Object.keys(CAT_LABEL).map(k=>`<button class="${k===S.cat?'sel':''}" data-c="${k}">${t('cat.'+k)}</button>`).join('')}
function renderProducts(){$('#products').innerHTML=CATALOG[S.cat].map(p=>`<button class="prod ${S.look[S.cat]?.pid===p.id?'sel':''}" data-p="${p.id}" style="--c:${p.shades[0].hex}"><div class="ph"></div><span>${p.brand}</span><b>${p.name}</b><span>${p.price}</span><em>${t('prod.try')}</em></button>`).join('')}
function renderShades(){const c=S.look[S.cat];$('.intensity').hidden=!c;if(!c){$('#shades').innerHTML='';renderFin();return}const p=findProd(c.pid);
 $('#shades').innerHTML=p.shades.map((s,i)=>`<button class="shade ${i===c.s?'sel':''}" data-s="${i}" style="background:${s.hex}" aria-label="${s.n}"></button>`).join('')+`<span style="margin-left:8px;white-space:nowrap">${p.shades[c.s].n} · ${t('shade.selected')}</span>`;renderFin();
 $('#intensity').value=Math.round(c.i*100)}
function renderFin(){const o=FOPT[S.cat],c=S.look[S.cat];
 $('#fin').innerHTML=(o&&c)?o.map(([k,n])=>`<button class="${c.f===k?'sel':''}" data-f="${k}">${t('fin.'+n)}</button>`).join(''):''}
function apply(cat,pid,s,i){const p=findProd(pid);S.look[cat]={pid,s,i,hex:p.shades[s].hex,on:S.look[cat]?.on??true,f:S.look[cat]?.f??FDEF[cat]}}
const suggest=()=>Object.entries(CATALOG).filter(([k])=>!S.look[k]).map(([,v])=>v[0]).slice(0,3);
function renderLook(){const it=Object.entries(S.look),ideas=suggest();
 $('#lookList').innerHTML=it.length?it.map(([k,v])=>{const p=findProd(v.pid);return `<li><label><input type="checkbox" data-t="${k}" ${v.on?'checked':''}><span>${t('cat.'+k)}<small>${p.name} · ${p.shades[v.s].n}</small></span></label><button class="link" data-store="${v.pid}">${t('look.store')}</button></li>`}).join(''):`<li class="rec">${t('look.empty')}</li>`;
 $('#recs').innerHTML=it.length>1&&ideas.length?'<p class="rec">'+t('look.ideas')+ideas.map(p=>p.name).join(', ')+'.</p>':'';
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
$('#btnQuality').textContent=t('quality.btn',qualityLabel());
$('#btnQuality').onclick=()=>{const order=['auto','high','fluid'];setMode(order[(order.indexOf(QUALITY.mode)+1)%3]);lastDrawn=-1;workSum=0;workN=0};
$('#btnCompare').onclick=e=>{const st=$('#stage');st.classList.toggle('cmp');e.currentTarget.setAttribute('aria-pressed',st.classList.contains('cmp'));st.classList.contains('cmp')?anim(50):(cur=0,pos(0))};
if(/calibrar/.test(location.search))$('#btnCal').hidden=false;
 $('#btnCal').onclick=()=>{const v=$('#vMain');if(!v.videoWidth||!confirm(t('cal.confirm')))return;
 const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),s=Math.min(v.videoWidth,v.videoHeight)*.12;
 x.drawImage(v,(v.videoWidth-s)/2,(v.videoHeight-s)/2,s,s,0,0,48,48);const d=x.getImageData(0,0,48,48).data;let r=0,g=0,b=0;
 for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}const n=d.length/4,a=(r+g+b)/(3*n);
 try{localStorage.setItem('kiosco.cal',JSON.stringify({tint:[r/n,g/n,b/n].map(q=>Math.min(1.3,Math.max(.75,q/a))),date:Date.now()}));location.reload()}
  catch(err){hint(t('cal.error'));console.error('No se pudo guardar la calibración:',err)}};
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
 $('#storeBody').innerHTML=`<b>${p.brand} · ${p.name}</b><p>${t('store.aisle')} ${p.aisle} · ${t('store.section')} ${p.section}</p><p class="rec">${t('store.demo')}</p><div class="map" aria-label="Mapa de ejemplo">${Array.from({length:8},(_,i)=>`<i class="${i+1===+p.aisle?'hit':''}"></i>`).join('')}</div>`;$('#storeModal').classList.add('on')}
$('#closeModal').onclick=()=>$('#storeModal').classList.remove('on');
$('#storeModal').addEventListener('click',e=>{if(e.target===$('#storeModal'))$('#storeModal').classList.remove('on')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#storeModal').classList.remove('on')});

/* ---------- Recomendación automática de tono ---------- */
const toneLum=hex=>{const n=parseInt(hex.slice(1),16);return (n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11};
function recommendTone(){
 if(!LM){hint(t('rec.needFace'));return}
 const base=CATALOG.base[0],blush=CATALOG.blush[0];
 let bi=0,bd=1e9;base.shades.forEach((s,k)=>{const d=Math.abs(toneLum(s.hex)-skinLum);if(d<bd){bd=d;bi=k}});
 const warm=skinRGB[0]-skinRGB[2],ci=Math.min(blush.shades.length-1,warm>32?1:warm<18?3:2);
 apply('base',base.id,bi,S.look.base?.i??.6);
 apply('blush',blush.id,ci,S.look.blush?.i??.5);
 S.cat='base';render();$('#lookPanel').classList.add('open');$('#btnLook').classList.add('act');$('#btnLook').setAttribute('aria-pressed','true');
 const note=$('#matchNote');note.hidden=false;note.textContent=t('rec.done',base.shades[bi].n,blush.shades[ci].n);
}
$('#btnMatch').onclick=recommendTone;

/* ---------- Modo quiosco: pantalla completa, reinicio por inactividad y sin menú contextual ---------- */
if(KIOSK.on){
 document.body.classList.add('kiosk');
 const fs=()=>{if(document.fullscreenElement)return;const p=document.documentElement.requestFullscreen?.();if(p&&p.catch)p.catch(()=>{})};
 document.addEventListener('pointerdown',function once(){fs();document.removeEventListener('pointerdown',once)});
 document.addEventListener('contextmenu',e=>e.preventDefault());
 let idle;const reset=()=>{clearTimeout(idle);idle=setTimeout(()=>{if(!$('#welcome').classList.contains('on'))go('welcome')},KIOSK.idle)};
 ['pointerdown','keydown','mousemove','touchstart','wheel'].forEach(ev=>document.addEventListener(ev,reset,{passive:true}));
 reset();
}
applyLang();
function exportBlob(){
 return new Promise((resolve,reject)=>{
  const source=$('#cv'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!source.width||!source.height||!ctx){reject(new Error(t('export.noImage')));return}
  const items=Object.entries(activeLook()).slice(0,8),photoY=238,photoH=Math.round(940*source.height/source.width);
  canvas.width=1080;canvas.height=photoY+photoH+60+40+30+Math.ceil(items.length/2)*78+110;
  ctx.fillStyle='#f5f5f3';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#111111';ctx.fillRect(0,0,canvas.width,150);
  ctx.fillStyle='#c8102e';ctx.fillRect(64,53,8,48);
  ctx.fillStyle='#ffffff';ctx.font='700 30px Montserrat, Arial, sans-serif';ctx.fillText('ESPEJO VIRTUAL',92,87);
  ctx.fillStyle='#c8102e';ctx.font='700 18px Montserrat, Arial, sans-serif';ctx.fillText(t('export.look'),70,207);
  const box={x:70,y:photoY,w:940,h:photoH};
  ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();
  ctx.translate(box.x+box.w,box.y);ctx.scale(-1,1);
  ctx.drawImage(source,0,0,box.w,box.h);ctx.restore();
  ctx.strokeStyle='#d7d7d4';ctx.lineWidth=2;ctx.strokeRect(box.x,box.y,box.w,box.h);
  const listTitleY=photoY+photoH+60;
  ctx.fillStyle='#151515';ctx.font='700 25px Montserrat, Arial, sans-serif';ctx.fillText(t('export.products'),70,listTitleY);
  const colW=470,rowH=78;
  items.forEach(([cat,item],i)=>{
   const x=70+(i%2)*colW,y=listTitleY+45+Math.floor(i/2)*rowH;
   const product=findProd(item.pid),shade=product.shades[item.s];
   ctx.fillStyle=shade.hex;ctx.beginPath();ctx.arc(x+13,y+13,10,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#151515';ctx.font='700 17px Montserrat, Arial, sans-serif';ctx.fillText(`${t('cat.'+cat)} · ${product.name}`,x+34,y+18);
   ctx.fillStyle='#737373';ctx.font='400 15px Montserrat, Arial, sans-serif';ctx.fillText(`${shade.n} · ${product.price}`,x+34,y+44);
  });
  ctx.fillStyle='#737373';ctx.font='400 13px Montserrat, Arial, sans-serif';
  ctx.fillText(t('export.disclaimer'),70,canvas.height-42);
  canvas.toBlob(blob=>blob?resolve(blob):reject(new Error(t('export.noBlob'))),'image/png');
 });
}
async function saveLook(){
 if(!Object.keys(activeLook()).length){hint(t('save.needProduct'));return}
 if(!LM||$('#vMain').readyState<2){hint(t('save.align'));return}
 $('#btnSave').disabled=true;
 $('#exportStatus').textContent=t('save.preparing');
 try{
  const blob=await exportBlob();
  if(exportUrl)URL.revokeObjectURL(exportUrl);
  exportUrl=URL.createObjectURL(blob);
  $('#lookPreview').src=exportUrl;$('#lookPreview').hidden=false;$('#previewPlaceholder').hidden=true;
  $('#downloadLook').disabled=false;
  $('#exportStatus').textContent=t('save.ready');
  go('save');
 }catch(err){
  $('#exportStatus').textContent=t('save.error');
  hint(t('save.errorShort'));
  console.error('Error al crear la imagen del look:',err);
 }finally{$('#btnSave').disabled=false}
}
$('#welcomeFace').innerHTML=faceSVG({lips:{hex:'#A33F4B',i:.8},blush:{hex:'#E58C8A',i:.5}});
window.addEventListener('pagehide',()=>{stopCamera();if(exportUrl)URL.revokeObjectURL(exportUrl)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if($('#scan').classList.contains('on')||$('#mirror').classList.contains('on'))startCamera()});
