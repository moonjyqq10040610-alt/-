import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roundedSurface} from '../src/three/rounded-surfaces.ts';

test('rounded wall is solid from both sides, while its window remains a true opening',()=>{
  const geometry=roundedSurface(10.16,4.45,.18,.13,[{width:3.45,height:2.2,x:2.45,y:.7,radius:.055}]);
  const material=new T.MeshBasicMaterial({side:T.DoubleSide}),wall=new T.Mesh(geometry,material);
  const hits=(x,y,z)=>new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(0,0,-Math.sign(z))).intersectObject(wall).length;
  for(const z of [-2,2]){
    assert.equal(hits(2.45,.7,z),0,'window center must admit light from either side');
    assert.ok(hits(-2,.7,z)>0,'left wall must occlude sunlight');
    assert.ok(hits(2.45,-1.5,z)>0,'wall below the window must remain solid');
    assert.ok(hits(2.45,2,z)>0,'lintel above the window must remain solid');
  }
  geometry.dispose();material.dispose();
});

test('thin tabletop keeps broad rounded corners without changing its top height',()=>{
  const geometry=roundedSurface(4.3,1.78,.17,.22);
  const material=new T.MeshBasicMaterial({side:T.DoubleSide}),table=new T.Mesh(geometry,material);
  const hits=(x,y)=>new T.Raycaster(new T.Vector3(x,y,2),new T.Vector3(0,0,-1)).intersectObject(table);
  assert.equal(hits(2.145,.885).length,0,'cut-away corner must not remain a rectangular slab');
  const center=hits(0,0);assert.ok(center.length>0);assert.ok(Math.abs(center[0].point.z-.085)<1e-6);
  assert.ok(hits(1.95,.68).length>0,'the usable top extends into the rounded shoulder');
  geometry.dispose();material.dispose();
});
