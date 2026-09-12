import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRenderBatches} from '../src/three/render-batches.ts';

test('late-loading photographs retain a live textured material instead of a plain-color batch',()=>{
  const root=new T.Group(),scene=new T.Scene(),geometry=new T.PlaneGeometry(1,1);
  const paper=new T.MeshStandardMaterial(),photo=new T.MeshStandardMaterial();photo.userData.dynamicMap=true;
  const image=new T.Mesh(geometry,photo);root.add(image,new T.Mesh(geometry,paper),new T.Mesh(geometry,paper));scene.add(root);
  const batches=createRenderBatches(root,scene),texture=new T.Texture();photo.map=texture;photo.needsUpdate=true;batches.update();
  assert.ok(image.layers.isEnabled(0),'photo remains on the visible render layer');
  assert.equal(image.material.map,texture,'the asynchronously loaded texture reaches its live material');
  assert.ok(scene.children.some(o=>o instanceof T.BatchedMesh),'ordinary paper still benefits from batching');
  batches.dispose();geometry.dispose();paper.dispose();photo.dispose();texture.dispose();
});
