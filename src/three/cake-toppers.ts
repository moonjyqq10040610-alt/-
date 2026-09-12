import * as T from 'three';
import type {CraftTools,V3} from './room-craft';
type TopperTools=Pick<CraftTools,'ball'|'tube'|'mesh'|'mat'>&{box:(w:number,h:number,d:number,m:T.Material,p:V3,parent?:T.Object3D,r?:number)=>T.Mesh};
import {CAKE_TOPPERS} from '../lib/room-journey';

/** Seven small sugar keepsakes sit on the cake from the start. */
export function addCakeToppers(model:TopperTools,cake:T.Group):{id:string;root:T.Group;material:T.MeshStandardMaterial}[]{
 const {box,ball,tube,mesh,mat}=model;
 const cream=mat('#ead9b3',1),ink=mat('#52615a',1);
 return CAKE_TOPPERS.map((id,i)=>{
  const root=new T.Group(),angle=-1.32+i*.44;
  root.position.set(Math.sin(angle)*.375,.64,-Math.cos(angle)*.32);root.rotation.y=angle*.25;cake.add(root);
  const material=mat(['#b77f69','#76918c','#bea16b','#c4a574','#839171','#a997b2','#8eaaaa'][i],1).clone();material.emissive.set('#ffc36b');material.emissiveIntensity=0;
  tube([[0,-.11,0],[0,0,0]],.006,cream,root);
  if(id==='calls'){
   box(.12,.043,.06,material,[0,.02,0],root,.019);
   tube([[-.065,.066,0],[-.035,.085,0],[.035,.085,0],[.065,.066,0]],.017,material,root);
   ball(.018,cream,[0,.044,.018],[1,.25,1],root);
  }else if(id==='film'){
   box(.12,.14,.025,material,[0,.063,0],root,.012);box(.083,.085,.008,ink,[0,.078,.016],root,.005);
  }else if(id==='frames'){
   for(const x of [-.05,.05])box(.018,.14,.025,material,[x,.07,0],root,.004);
   for(const y of [.006,.134])box(.1,.018,.025,material,[0,y,0],root,.004);
  }else if(id==='sunny'){
   ball(.045,material,[0,.07,0],[1,1,.3],root);
   for(let r=0;r<8;r++){const a=r*Math.PI/4;tube([[Math.cos(a)*.055,.07+Math.sin(a)*.055,0],[Math.cos(a)*.071,.07+Math.sin(a)*.071,0]],.005,material,root);}
  }else if(id==='books'){
   for(let j=0;j<3;j++){box(.032,.095+j*.012,.052,material,[(j-1)*.038,.05,0],root,.004);box(.028,.004,.044,cream,[(j-1)*.038,.101+j*.006,0],root,.001);}
  }else if(id==='magic'){
   tube([[-.038,-.009,0],[.029,.117,0]],.007,material,root);
   const star=new T.Shape();for(let j=0;j<10;j++){const a=j*Math.PI/5+Math.PI/2,r=j%2?.014:.033;j?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();
   const tip=mesh(new T.ExtrudeGeometry(star,{depth:.012,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1}),material,root);tip.position.set(.029,.122,0);
  }else{
   ball(.047,material,[0,.05,0],[1,1.1,.75],root);ball(.037,material,[0,.104,.01],[1,1,1],root);
   for(const x of [-.038,.038])ball(.032,material,[x,.106,0],[.85,1,.35],root);
   tube([[0,.101,.041],[0,.068,.058],[.014,.053,.063]],.01,material,root);
  }
  return {id,root,material};
 });
}
