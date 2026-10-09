import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eyeGeom,OVAL,LEYE,REYE,FOPT,FDEF} from '../js/geometry.js';

test('los índices de landmarks son coherentes',()=>{
 assert.equal(OVAL.length,36);
 assert.equal(LEYE.length,REYE.length);
 assert.equal(new Set(OVAL).size,OVAL.length);
});

test('FOPT y FDEF cubren las mismas categorías',()=>{
 assert.deepEqual(Object.keys(FOPT).sort(),Object.keys(FDEF).sort());
 for(const k of Object.keys(FOPT)){
  assert.ok(FDEF[k],`sin acabado por defecto para ${k}`);
  assert.ok(FOPT[k].some(([id])=>id===FDEF[k]),`FDEF.${k} no está en FOPT.${k}`);
 }
});

test('eyeGeom devuelve puntos, pliegue, normal unitaria y ancho',()=>{
 const coords=[[0,0],[10,0],[20,0]];
 const P=i=>coords[i];
 const g=eyeGeom([0,1,2],[0,1,2],P);
 assert.equal(g.pts.length,3);
 assert.equal(g.crease.length,3);
 assert.ok(Math.abs(Math.hypot(g.u[0],g.u[1])-1)<1e-9);
 assert.ok(Math.abs(Math.hypot(g.n[0],g.n[1])-1)<1e-9);
 assert.equal(g.W,20);
 // el pliegue va en el sentido de la normal (hacia la ceja, +y en este caso)
 assert.ok(g.crease[1][1]>g.pts[1][1]);
});
