import * as T from 'three';
/** Keep hit meshes/rigs intact; consolidate their render copies by material. */
export function createRenderBatches(root:T.Group,scene:T.Scene){
 const buckets=new Map<string,{material:T.Material;colored:boolean;parts:T.Mesh[]}>();
 root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||o.geometry.attributes.position.count===0)return;
  // Calendar sheets deform their vertices in place; keep those meshes live.
  if(o.userData.deforming)return;
  // A photo starts without a map; retain its own material while the image loads.
  const m=o.material,colored=!m.map&&!m.userData.dynamicMap&&!m.transparent&&m.emissive.getHex()===0&&!m.clippingPlanes;
  const key=(colored?['plain',m.roughness,m.metalness,m.side,m.bumpMap?.uuid,m.bumpScale].join(':'):m.uuid)+':shadow:'+o.castShadow;
  let bucket=buckets.get(key);if(!bucket){const material=colored?m.clone():m;if(colored)(material as T.MeshStandardMaterial).color.set('#ffffff');bucket={material,colored,parts:[]};buckets.set(key,bucket);}bucket.parts.push(o);
 });
 const copies:{batch:T.BatchedMesh;entries:{source:T.Mesh;id:number}[]}[]=[];
 for(const {material,colored,parts} of buckets.values()){
  if(parts.length<2){if(colored)material.dispose();continue;}
  const geometries=parts.map(p=>p.geometry.index?p.geometry.toNonIndexed():p.geometry.clone());
  // Standard attributes keep the batch layouts consistent.
  for(const g of geometries){for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();}
  const vertices=geometries.reduce((n,g)=>n+g.attributes.position.count,0),batch=new T.BatchedMesh(parts.length,vertices,0,material);batch.perObjectFrustumCulled=true;batch.sortObjects=false;batch.castShadow=parts[0].castShadow;batch.receiveShadow=true;scene.add(batch);
  const entries=parts.map((source,i)=>{const gid=batch.addGeometry(geometries[i]),id=batch.addInstance(gid);source.layers.set(2);return {source,id};});geometries.forEach(g=>g.dispose());copies.push({batch,entries});
 }
 const tint=new T.Color();
 function update(){root.updateMatrixWorld(true);for(const {batch,entries} of copies)for(const {source,id} of entries){let visible=true,p:T.Object3D|null=source;while(p){if(!p.visible){visible=false;break;}p=p.parent;}batch.setVisibleAt(id,visible);if(!visible)continue;batch.setMatrixAt(id,source.matrixWorld);const m=source.material as T.MeshStandardMaterial;if((batch.material as T.MeshStandardMaterial).color.getHex()===0xffffff&&!m.map)batch.setColorAt(id,tint.copy(m.color));}}
 update();return {update,dispose(){for(const {batch} of copies){batch.dispose();batch.removeFromParent();}}};
}
