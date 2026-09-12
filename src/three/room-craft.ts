import * as T from 'three';
export type V3=[number,number,number];
export interface CraftTools {
 group:T.Group; ownedTextures:Set<T.Texture>;
 mesh:(g:T.BufferGeometry,m:T.Material,p?:T.Object3D)=>T.Mesh;
 ball:(r:number,m:T.Material,p:V3,s?:V3,parent?:T.Object3D)=>T.Mesh;
 cylinder:(rt:number,rb:number,h:number,m:T.Material,p:V3,parent?:T.Object3D)=>T.Mesh;
 tube:(points:V3[],r:number,m:T.Material,parent?:T.Object3D)=>T.Mesh;
 mat:(color:string,roughness?:number,metalness?:number)=>T.MeshStandardMaterial;
 tag:(obj:T.Object3D,id:string,label:string)=>T.Object3D;
}
export function makeGrain(kind:'wood'|'cloth'|'paper'){
 const size=256,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d')!,pixels=ctx.createImageData(size,size);let seed=4217;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=(random()-.5)*23,grain=kind==='wood'?Math.sin(x*.3+Math.sin(y*.026)*2)*12+Math.sin(x*.88+y*.004)*5:kind==='cloth'?((x%4<2?9:-9)+(y%4<2?7:-7)):0;
  const v=139+noise+grain,i=(y*size+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;
 }ctx.putImageData(pixels,0,0);const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='cloth'?7:3,kind==='cloth'?7:3);return texture;
}
function petalGeometry(){
 const positions:number[]=[],uv:number[]=[],index:number[]=[],rows=8,cols=6;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const v=j/rows,u=(i/cols-.5)*2,angle=u*1.13;
  const radius=.025+Math.sin(v*Math.PI*.87)*.11;
  positions.push(Math.sin(angle)*radius, v*.28-.021*u*u*Math.sin(v*Math.PI/2),Math.cos(angle)*radius+.023*v*v);uv.push(i/cols,v);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;index.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function tulipLeaf(){
 const positions:number[]=[],uv:number[]=[],idx:number[]=[],n=10;
 for(let j=0;j<=n;j++)for(let side=0;side<3;side++){
  const t=j/n,s=side-1,width=Math.pow(Math.sin(Math.PI*t),.75)*.105;
  positions.push(s*width,.56*t-.09*t*t,.32*t*t+Math.abs(s)*.025*Math.sin(t*Math.PI));uv.push(side/2,t);
 }
 for(let j=0;j<n;j++)for(let i=0;i<2;i++){const a=j*3+i;idx.push(a,a+3,a+1,a+3,a+4,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createTulips(t:CraftTools,pos:V3,size=1){
 const root=new T.Group();root.position.set(...pos);root.scale.setScalar(size);t.group.add(root);
 const ceramic=t.mat('#d0bd99',.92),green=t.mat('#4b664b',.98),leafMat=green.clone();leafMat.side=T.DoubleSide;
 const vase=t.mesh(new T.LatheGeometry([[.12,0],[.17,.02],[.21,.12],[.2,.27],[.13,.4],[.12,.45],[.105,.45],[.115,.4],[.185,.26],[.195,.12],[.155,.03],[.12,.02]].map(p=>new T.Vector2(...p as [number,number])),20),ceramic,root);
 const soil=t.cylinder(.1,.1,.015,t.mat('#323a2a'),[0,.405,0],root);
 const blossoms:T.Group[]=[];
 for(let n=0;n<5;n++){
  const a=n*2.4,x=Math.cos(a)*(.07+n*.012),z=Math.sin(a)*.11,h=.8+(n%3)*.14;
  t.tube([[x*.2,.38,z*.2],[x*.6,.63,z*.7],[x,h,z]],.012,green,root);
  for(let l=0;l<2;l++){const leaf=t.mesh(tulipLeaf(),leafMat,root);leaf.position.set(x*.4,.4+l*.12,z*.4);leaf.rotation.y=a+l*Math.PI;leaf.rotation.x=-.13-l*.14;}
  const flower=new T.Group();flower.position.set(x,h,z);flower.rotation.set(.08*Math.sin(a),a,.13*Math.cos(a));root.add(flower);blossoms.push(flower);
  for(let k=0;k<6;k++){const m=t.mat(n%2?'#d4a296':'#b86360',.96).clone();m.side=T.DoubleSide;const petal=t.mesh(petalGeometry(),m,flower);petal.rotation.y=k*Math.PI*2/3+(k<3?0:Math.PI/3);if(k>=3){petal.scale.set(.84,.93,.84);petal.position.y=.012;}}
 }
 t.tag(root,'tulips','郁金香');return {root,blossoms,vase,soil};
}
