import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cl,hexA,luminance,adaptHex,cameraErrorKey,recommendedShadeIndex,blushIndex} from '../js/util.js';

test('cl recorta a [0,1]',()=>{
 assert.equal(cl(-3),0);assert.equal(cl(.4),.4);assert.equal(cl(9),1);
});

test('hexA compone alfa hexadecimal',()=>{
 assert.equal(hexA('#A33F4B',0),'#A33F4B00');
 assert.equal(hexA('#A33F4B',1),'#A33F4Bff');
 assert.equal(hexA('#000000',.5),'#00000080');
});

test('luminance usa pesos percibidos',()=>{
 assert.equal(luminance('#FFFFFF'),255);
 assert.equal(luminance('#000000'),0);
 assert.ok(Math.abs(luminance('#FF0000')-76.5)<.001);
});

test('adaptHex neutro devuelve el mismo color',()=>{
 assert.equal(adaptHex('#A33F4B',[1,1,1],1),'#a33f4b');
});

test('adaptHex aplica tinte y exposición y recorta',()=>{
 assert.equal(adaptHex('#808080',[1,1,1],0),'#000000');
 assert.equal(adaptHex('#FFFFFF',[2,2,2],1),'#ffffff');
});

test('cameraErrorKey mapea errores conocidos y usa genérico',()=>{
 assert.equal(cameraErrorKey('NotAllowedError'),'cam.denied');
 assert.equal(cameraErrorKey('NotFoundError'),'cam.notfound');
 assert.equal(cameraErrorKey('Whatever'),'cam.generic');
});

test('recommendedShadeIndex elige la luminancia más cercana',()=>{
 const shades=[{hex:'#000000'},{hex:'#808080'},{hex:'#FFFFFF'}];
 assert.equal(recommendedShadeIndex(shades,10),0);
 assert.equal(recommendedShadeIndex(shades,120),1);
 assert.equal(recommendedShadeIndex(shades,250),2);
});

test('blushIndex elige por subtono',()=>{
 assert.equal(blushIndex([220,185,160],5),1); // cálido
 assert.equal(blushIndex([200,185,200],5),3); // frío
 assert.equal(blushIndex([210,185,185],5),2); // neutro
 assert.equal(blushIndex([220,185,160],2),1);
});
