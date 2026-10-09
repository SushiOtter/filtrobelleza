import {test} from 'node:test';
import assert from 'node:assert/strict';
import {I18N,LANGS,translate,pickLang} from '../js/i18n.js';

test('hay exactamente ES y EN',()=>{
 assert.deepEqual(LANGS.sort(),['en','es']);
});

test('ES y EN tienen las mismas claves (paridad)',()=>{
 const es=Object.keys(I18N.es).sort(),en=Object.keys(I18N.en).sort();
 const onlyEs=es.filter(k=>!en.includes(k)),onlyEn=en.filter(k=>!es.includes(k));
 assert.deepEqual(onlyEs,[],'claves solo en ES');
 assert.deepEqual(onlyEn,[],'claves solo en EN');
});

test('translate devuelve el texto del idioma pedido',()=>{
 assert.equal(translate('es','welcome.start'),'Comenzar');
 assert.equal(translate('en','welcome.start'),'Start');
});

test('translate evalúa claves función',()=>{
 assert.equal(translate('es','quality.btn','Alta'),'Calidad: Alta');
 assert.equal(translate('en','quality.btn','High'),'Quality: High');
});

test('translate cae a español si el idioma no existe',()=>{
 assert.equal(translate('fr','welcome.start'),'Comenzar');
});

test('translate devuelve la clave si no existe',()=>{
 assert.equal(translate('es','no.existe'),'no.existe');
});

test('pickLang respeta preferencia válida y si no el navegador',()=>{
 assert.equal(pickLang('en','es-ES'),'en');
 assert.equal(pickLang('es','en-US'),'es');
 assert.equal(pickLang(null,'en-GB'),'en');
 assert.equal(pickLang('xx','es-ES'),'es');
});
