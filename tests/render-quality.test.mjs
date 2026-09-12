import test from 'node:test';
import assert from 'node:assert/strict';
import {roomPixelRatio} from '../src/lib/render-quality.ts';
test('retina phone close-ups gain detail within the two-million-pixel budget',()=>{
 const overview=roomPixelRatio(390,800,3,false,false),focus=roomPixelRatio(390,800,3,true,false);
 assert.equal(overview,1.5);assert.equal(focus,2);assert.ok(390*800*focus*focus<=2000000);
});
test('large displays and low-power mode keep bounded drawing buffers',()=>{
 for(const [w,h] of [[320,560],[1440,900],[3840,2160]]){
  for(const low of [true,false]){const ratio=roomPixelRatio(w,h,3,true,low);assert.ok(w*h*ratio*ratio<=(low?1000000:2000000)+1);}
 }
 assert.equal(roomPixelRatio(390,800,1,true,false),1);
});
