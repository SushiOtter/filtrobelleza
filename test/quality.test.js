import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampLevel,detectMobile,levelConfig,defaultLevel,MODES,nextMode} from '../js/quality.js';

test('clampLevel limita a 0..2',()=>{
 assert.equal(clampLevel(-1),0);assert.equal(clampLevel(5),2);assert.equal(clampLevel(1),1);
});

test('detectMobile detecta táctil o user agent',()=>{
 assert.equal(detectMobile(true,'Mozilla'),true);
 assert.equal(detectMobile(false,'Mozilla/5.0 (iPhone)'),true);
 assert.equal(detectMobile(false,'Mozilla/5.0 (Windows)'),false);
});

test('levelConfig define perfiles coherentes',()=>{
 const hi=levelConfig(2),mid=levelConfig(1),lo=levelConfig(0);
 assert.equal(hi.dpr,2);assert.equal(hi.smooth,true);assert.equal(hi.seg,true);assert.equal(hi.passes,1);
 assert.equal(mid.smooth,false);assert.equal(mid.seg,true);
 assert.equal(lo.seg,false);assert.equal(lo.passes,.62);
 assert.ok(hi.detEvery<=mid.detEvery&&mid.detEvery<=lo.detEvery);
});

test('defaultLevel depende del equipo',()=>{
 assert.equal(defaultLevel({cpu:true,lowEnd:false,mobile:false}),0);
 assert.equal(defaultLevel({cpu:false,lowEnd:true,mobile:false}),0);
 assert.equal(defaultLevel({cpu:false,lowEnd:false,mobile:true}),1);
 assert.equal(defaultLevel({cpu:false,lowEnd:false,mobile:false}),2);
});

test('nextMode cicla auto→high→fluid→auto',()=>{
 assert.deepEqual(MODES,['auto','high','fluid']);
 assert.equal(nextMode('auto'),'high');
 assert.equal(nextMode('high'),'fluid');
 assert.equal(nextMode('fluid'),'auto');
});
