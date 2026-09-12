import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import {audioMix} from '../src/lib/audio-mix.ts';

const sources=await Promise.all(['audio','recorded-room-music'].map(n=>readFile(new URL(`../src/lib/${n}.ts`,import.meta.url),'utf8')));
function harness(track){
 const elements=[],oscillators=[],frames=new Map(),timers=new Map();let now=0,next=0;
 class FakeAudio{
  constructor(src){this.src=src;this.volume=1;this.paused=true;this.currentTime=0;this.playCount=0;elements.push(this);}
  play(){this.playCount++;if(this.reject){const error=this.reject;this.reject=null;return Promise.reject(error);}this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}setAttribute(){}removeAttribute(){this.src='';}load(){}remove(){this.removed=true;}
 }
 const parameter=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class FakeContext{
  constructor(){this.currentTime=0;this.destination={};this.state='suspended';}
  resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createOscillator(){const o={frequency:parameter(),connect(){},disconnect(){},start(){},stop(){}};oscillators.push(o);return o;}
 }
 const common={Audio:FakeAudio,window:{AudioContext:FakeContext},document:{body:{appendChild(){}}},performance:{now:()=>now},requestAnimationFrame:f=>{const id=++next;frames.set(id,f);return id;},cancelAnimationFrame:id=>frames.delete(id),setInterval:(f,ms)=>{const id=++next;timers.set(id,{f,ms});return id;},clearInterval:id=>timers.delete(id)};
 function compile(source,require){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{...common,module,exports:module.exports,require});return module.exports;}
 const recording=compile(sources[1],()=>({}));
 const {RoomAudio}=compile(sources[0],name=>name.includes('audio-profile')?{roomMusicTrack:null}:name.includes('recorded-room-music')?recording:{audioMix});
 const engine=new RoomAudio(track);
 return {engine,elements,oscillators,timers,frames,fade(){now+=1000;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(now));},beat(){for(const {f,ms} of timers.values())if(ms===650)f();}};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));

test('web music waits for a gesture, remains steady on normal clicks, and crossfades for the telephone',async()=>{
 const h=harness('./audio/room-theme.mp3');h.engine.prepare();h.engine.enterRoom();const music=h.elements[0];
 assert.equal(music.playCount,0);h.engine.engage();await settled();h.fade();assert.equal(music.paused,false);assert.equal(music.volume,.095);assert.equal(music.loop,true);
 music.currentTime=37;h.engine.engage();h.engine.setFocus('room');h.fade();assert.equal(music.playCount,1);assert.equal(music.currentTime,37);
 h.engine.phoneRing();h.fade();assert.equal(music.paused,true);assert.equal(music.volume,0);h.beat();assert.ok(h.oscillators.length>0);
 h.engine.stopPhone();await settled();h.fade();assert.equal(music.paused,false);assert.equal(music.currentTime,37);assert.equal(music.volume,.095);
 h.engine.setFocus('ending');h.fade();assert.equal(music.paused,true);h.engine.dispose();assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);
});
test('muting, backgrounding and resuming preserve the original song position',async()=>{
 const h=harness('./audio/room-theme.mp3');h.engine.enterRoom();h.engine.engage();await settled();h.fade();const music=h.elements[0];music.currentTime=19;
 h.engine.setMuted(true);assert.equal(music.muted,true);h.engine.setMuted(false);assert.equal(music.muted,false);
 h.engine.setVisible(false);assert.equal(music.paused,true);assert.equal(h.timers.size,0);
 h.engine.setVisible(true);await settled();h.fade();assert.equal(music.paused,false);assert.equal(music.currentTime,19);
 h.engine.dispose();assert.equal(music.paused,true);assert.equal(music.removed,true);assert.equal(music.src,'');
});
test('blocked playback is retried on the next gesture; a failed media file falls back to instrumental music',async()=>{
 const h=harness('./audio/room-theme.mp3');h.engine.enterRoom();const music=h.elements[0];music.reject=Object.assign(new Error('gesture'),{name:'NotAllowedError'});
 h.engine.engage();await settled();assert.equal(music.paused,true);h.engine.engage();await settled();h.fade();assert.equal(music.paused,false);
 music.onerror();assert.equal(music.paused,true);const count=h.oscillators.length;h.beat();assert.ok(h.oscillators.length>count);h.engine.dispose();
});
test('instrumental build creates no recorded audio and pauses music during the wish',()=>{
 const h=harness(null);h.engine.enterRoom();h.engine.engage();h.beat();assert.equal(h.elements.length,0);assert.ok(h.oscillators.length>0);
 h.engine.setFocus('ending');const count=h.oscillators.length;h.beat();assert.equal(h.oscillators.length,count);
 h.engine.setFocus('relight');h.beat();assert.ok(h.oscillators.length>count);h.engine.dispose();assert.equal(h.timers.size,0);
});
test('a web build works without an optional track, and the ZIP never includes it',async()=>{
 const offline=await readFile(new URL('../dist/assets/main.js',import.meta.url),'utf8'),web=await readFile(new URL('../dist-web/assets/main.js',import.meta.url),'utf8');
 assert.ok(!offline.includes('room-theme.mp3'));
 assert.ok(!(await readdir(new URL('../dist/',import.meta.url))).includes('audio'));
 const optional=await readFile(new URL('../web-assets/audio/room-theme.mp3',import.meta.url)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 assert.equal(web.includes('./audio/room-theme.mp3'),optional!==null);
 if(optional){
  assert.deepEqual(await readdir(new URL('../dist-web/audio/',import.meta.url)),['room-theme.mp3']);
  assert.deepEqual(await readFile(new URL('../dist-web/audio/room-theme.mp3',import.meta.url)),optional);
 }else{
  assert.ok(!(await readdir(new URL('../dist-web/',import.meta.url))).includes('audio'));
 }
});
