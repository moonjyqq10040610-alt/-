import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roomFraming} from '../src/three/room-framing.ts';
import {ROOM_ORBIT} from '../src/three/room-motion.ts';

test('larger portrait overview fills the phone while keeping the default base within the viewport',()=>{
 for(const [width,height] of [[320,596],[390,800],[430,888]]){
  const f=roomFraming(width,height,false),c=new T.PerspectiveCamera(f.fov,width/height,.05,80);
  c.position.set(3.6,6.7,15.3);c.lookAt(0,1.55,.1);c.setViewOffset(width,height,f.offsetX,0,width,height);c.updateMatrixWorld();
  const points=[];
  for(const x of [-5.2,5.2]){
   for(const z of [-3.65,4.65])points.push(new T.Vector3(x,-.26,z));
   for(const z of [-3.65,.8])points.push(new T.Vector3(x,4.45,z));
  }
  const xs=points.map(p=>(p.project(c).x+1)*width/2);
  assert.ok(Math.min(...xs)>0);assert.ok(Math.max(...xs)<width);
  assert.ok(Math.max(...xs)-Math.min(...xs)>width*.91,'room occupies more than 91% of the phone width');
 }
});
test('closer mobile zoom stays in front of the room; focused objects can now be magnified substantially',()=>{
 const r=roomFraming(390,800,false).minDistance;
 for(let a=ROOM_ORBIT.minAzimuth;a<=ROOM_ORBIT.maxAzimuth;a+=.01)for(let p=ROOM_ORBIT.minPolar;p<=ROOM_ORBIT.maxPolar;p+=.01){
  assert.ok(.1+r*Math.sin(p)*Math.cos(a)>6.65,'camera stays beyond the front furniture');
  assert.ok(1.55+r*Math.cos(p)>3.3,'camera stays above the sofa');
 }
 const focused=roomFraming(390,800,true);
 assert.ok(1/focused.focusMin>1.8);assert.ok(focused.focusMax>=1.4);
 assert.ok(focused.fov<roomFraming(390,800,false).fov);
 assert.equal(roomFraming(1280,756,false).minDistance,null,'desktop retains the existing orbit limits');
});
