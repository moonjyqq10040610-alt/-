import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { getBirthdayState } from '../src/data/timeline.ts';
import { BreathDetector } from '../src/lib/breath.ts';

test('a sharp click cannot extinguish a candle', () => {
  const detector = new BreathDetector();
  assert.equal(detector.sample(1,16).extinguished,false);
  for (let i=0;i<180;i++) assert.equal(detector.sample(.005,16).extinguished,false);
});
test('sustained breath works, while low room noise does not', () => {
  const noise = new BreathDetector();
  for(let i=0;i<400;i++) assert.equal(noise.sample(.03,16).extinguished,false);
  const breath = new BreathDetector(); let result;
  for(let i=0;i<45;i++) result=breath.sample(.18,16);
  assert.equal(result.extinguished,true);
});
test('a long suspended frame does not count as sustained breath', () => {
  const detector=new BreathDetector();
  assert.equal(detector.sample(1,60000).extinguished,false);
});
test('camera keeps every focused prop inside desktop, panned mobile, and short viewports', async () => {
  const { focusCamera }=await import('../src/lib/scene-camera.ts');
  const { focusBoxes }=await import('../src/data/room.ts');
  for(const g of [
    {width:1320,height:800,sceneWidth:1200,sceneHeight:800,sceneLeft:60,sceneTop:0},
    {width:390,height:844,sceneWidth:912,sceneHeight:608,sceneLeft:-365,sceneTop:152},
    {width:320,height:568,sceneWidth:840,sceneHeight:560,sceneLeft:-364,sceneTop:102},
    {width:1100,height:485,sceneWidth:680,sceneHeight:453,sceneLeft:210,sceneTop:16},
  ]) for(const box of Object.values(focusBoxes)) {
    const camera=focusCamera(g,box);
    const left=g.sceneLeft+camera.x+g.sceneWidth*box.x/100*camera.scale;
    const top=g.sceneTop+camera.y+g.sceneHeight*box.y/100*camera.scale;
    const width=g.sceneWidth*box.w/100*camera.scale,height=g.sceneHeight*box.h/100*camera.scale;
    assert.ok(camera.scale>1 && camera.scale<=6.5);
    assert.ok(left>=0 && left+width<=g.width);
    assert.ok(top>=0 && top+height<=g.height*.69);
    assert.ok(Math.abs(left+width/2-g.width/2)<1e-8);
  }
});
test('rotary motion crosses the angle seam smoothly and distinguishes turning back', async()=>{
  const { clockwiseDelta }=await import('../src/lib/scene-camera.ts');
  assert.equal(clockwiseDelta(178,-177),5);
  assert.equal(clockwiseDelta(-178,177),-5);
  let rotation=0;const angles=[120,155,179,-165,-120,-70];
  for(let i=1;i<angles.length;i++)rotation+=clockwiseDelta(angles[i-1],angles[i]);
  assert.equal(rotation,170);
});
test('TV completes the full collection before repeating; portrait and group albums are distinct',async()=>{
  const { advancePhoto }=await import('../src/lib/scene-camera.ts');
  const { albums }=await import('../src/data/photo-collections.ts');
  const visited=[];let index=0;
  for(let i=0;i<12;i++){visited.push(index);index=advancePhoto(index,12);}
  assert.equal(new Set(visited).size,12);assert.equal(index,0);
  assert.equal(albums.together.filter(id=>albums.portraits.includes(id)).length,0);
  assert.equal(albums.frames.filter(id=>albums.together.includes(id)).length,0);
  const ids=Object.values(albums).flat();assert.ok(ids.every(id=>Number.isInteger(id)&&id>=1&&id<=12));
});

test('the entire room orbit stays in front of the room and outside the furniture',async()=>{
  const {ROOM_ORBIT:o}=await import('../src/three/room-motion.ts');
  for(let a=o.minAzimuth;a<=o.maxAzimuth;a+=.02)for(let p=o.minPolar;p<=o.maxPolar;p+=.02){
    const z=.1+o.minDistance*Math.sin(p)*Math.cos(a);
    const y=1.55+o.minDistance*Math.cos(p);
    assert.ok(z>8,'the camera must never reach the rear wall');assert.ok(y>3,'the overview camera stays above table and sofa');
  }
});
test('calendar paper remains attached, moves continuously, and settles behind the binding',async()=>{
  const {pageTurnPose}=await import('../src/three/room-motion.ts');
  const world=(p,v)=>{const q=pageTurnPose(p,v);return {y:q.y*Math.cos(q.angle)-q.z*Math.sin(q.angle),z:q.y*Math.sin(q.angle)+q.z*Math.cos(q.angle)};};
  for(let i=0;i<=100;i++){
    const hinge=world(i/100,0);assert.ok(Math.abs(hinge.y)<1e-12);assert.ok(Math.abs(hinge.z)<1e-12);
    if(i){const previous=world((i-1)/100,1),next=world(i/100,1);assert.ok(Math.hypot(next.y-previous.y,next.z-previous.z)<.08);}
  }
  assert.ok(Math.abs(world(0,1).y+.66)<1e-9);assert.ok(world(.5,1).z>.5);
  const end=world(1,1);assert.ok(end.y<-.4&&end.z<-.02,'turned paper hangs behind, rather than bouncing to its front');
});

test('wish requires five distinct memories; related books and albums count once',async()=>{
 const {mayWish,discoveredCategories}=await import('../src/lib/room-journey.ts');
 assert.equal(mayWish(['books','magic','sunny','together','portraits','tv']),false);
 assert.equal(discoveredCategories(['books','magic','sunny']).length,1);
 assert.equal(mayWish(['books','frames','calls','cats']),false);
 assert.equal(mayWish(['books','frames','calls','cats','calendar']),true);
 assert.equal(mayWish([],true),true);
});
test('relighting reveals corners in sequence before the full room',async()=>{
 const {relightLevels}=await import('../src/lib/room-journey.ts');
 const start=relightLevels(0);assert.ok(Object.values(start).every(v=>v===0));
 assert.equal(relightLevels(1).phone,1);assert.equal(relightLevels(1).tv,0);assert.equal(relightLevels(3).window,0);assert.equal(relightLevels(5.8).room,0);
 for(let t=0;t<=8;t+=.1){const a=relightLevels(t),b=relightLevels(t+.1);for(const key of Object.keys(a)){assert.ok(a[key]>=0&&a[key]<=1);assert.ok(b[key]>=a[key]);}}
 assert.ok(Object.values(relightLevels(7.8)).every(v=>v===1));
});
test('music stays low and steady for normal exploration and crossfades only for calls',async()=>{
 const {audioMix}=await import('../src/lib/audio-mix.ts');const levels={bgm:.095,phone:.13};
 assert.deepEqual(audioMix('room',false,true,levels),{room:0,phone:0});
 assert.deepEqual(audioMix('room',true,false,levels),{room:.095,phone:0});
 assert.deepEqual(audioMix('phone',true,false,levels),{room:0,phone:.13});
 assert.deepEqual(audioMix('ending',true,false,levels),{room:0,phone:0});
 assert.equal(audioMix('relight',true,false,levels).room,.095*.7);
});
test('answer slider cannot complete on a tap or a backward swipe',async()=>{
 const {slideProgress}=await import('../src/lib/room-journey.ts');
 assert.equal(slideProgress(100,100,242),0);assert.equal(slideProgress(100,20,242),0);assert.ok(slideProgress(100,170,242)<.86);assert.equal(slideProgress(100,400,242),1);
});
test('daylight and sunset enter through the actual window opening',async()=>{
 const {atmospheres}=await import('../src/data/atmospheres.ts');
 assert.equal(Object.keys(atmospheres).length,7);
 for(const id of ['sunny','sunset']){const p=atmospheres[id].sunPosition,t=[-1,.2,2.5],u=(-3.5-p[2])/(t[2]-p[2]);const x=p[0]+u*(t[0]-p[0]),y=p[1]+u*(t[1]-p[1]);assert.ok(x>.76&&x<4.14&&y>1.84&&y<4);}
});

test('new discoveries reveal only that object; legacy progress stays readable',async()=>{
 const {hasDiscoveredObject,topperDiscovered}=await import('../src/lib/room-journey.ts');
 assert.equal(hasDiscoveredObject('portraits',['together'],['film']),false);
 assert.equal(hasDiscoveredObject('together',['together'],['film']),true);
 assert.equal(hasDiscoveredObject('books',[],['books']),true);
 assert.equal(topperDiscovered('film',['portraits']),true);
 assert.equal(topperDiscovered('magic',['books']),false);
 assert.equal(topperDiscovered('sunny',['sunny']),true);
});
test('candle atmosphere lights the cake but never interrupts the blow-out sequence',async()=>{
 const {cakeCandlesLit}=await import('../src/lib/room-journey.ts');
 assert.equal(cakeCandlesLit('candle','idle',false,false),true);
 assert.equal(cakeCandlesLit('candle','idle',true,true),true);
 for(const ending of ['dark','relight'])assert.equal(cakeCandlesLit('candle',ending,true,false),false);
 assert.equal(cakeCandlesLit('sunny','idle',false,false),false);
 assert.equal(cakeCandlesLit('sunny','wish',true,true),true);
});
test('cats blink independently with smoothly closing eyelids',async()=>{
 const {catBlink}=await import('../src/three/room-motion.ts');
 const events=[[],[]];
 for(let i=0;i<6000;i++)for(let cat=0;cat<2;cat++){
  const v=catBlink(i/100,cat);assert.ok(v>=.059&&v<=1);
  if(v<.3)events[cat].push(i);
  assert.ok(Math.abs(v-catBlink((i+1)/100,cat))<.11);
 }
 assert.ok(events.every(list=>list.length>10));
 assert.ok(events[0].filter(i=>events[1].includes(i)).length<events[0].length*.15);
});
test('the exterior mask follows the window opening at both orbit extremes',async()=>{
 const {Plane,Vector3}=await import('three');const {updateWindowAperture}=await import('../src/three/window-aperture.ts');
 for(const camera of [new Vector3(-4.8,6.7,15.3),new Vector3(5.3,6.7,15.3),new Vector3(2.25,3.2,.35)]){
  const planes=Array.from({length:4},()=>new Plane());updateWindowAperture(planes,camera);
  const behind=(x,y)=>{const windowPoint=new Vector3(x,y,-3.5);return camera.clone().lerp(windowPoint,(-4.78-camera.z)/(-3.5-camera.z));};
  for(const x of [.8,2.45,4.1])for(const y of [1.88,2.92,3.96])assert.ok(planes.every(p=>p.distanceToPoint(behind(x,y))>0),'every pane stays filled with sky');
  for(const x of [.65,4.3])assert.ok(planes.some(p=>p.distanceToPoint(behind(x,2.92))<0),'scenery never draws over the surrounding wall');
 }
});
