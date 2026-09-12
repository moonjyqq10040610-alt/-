import * as T from 'three';
import type {RoomModel} from './room-model';

/** Small physical keepsakes, animated independently of the room's static furniture. */
export function createRoomSecrets(model:RoomModel){
 const {group,box,ball,tube,mat,tag,textTexture}=model;
 const gold=mat('#b69859',.9,.2),cord=mat('#9f9479'),paper=mat('#dfcaa7');
 const charm=new T.Group();charm.position.set(-.8,3.13,-3.35);group.add(charm);tag(charm,'wall-charm','碰一下墙上的星星');
 ball(.032,gold,[0,.39,0],[1,1,.5],charm);tube([[0,.38,0],[0,.16,.015]],.005,cord,charm);
 const ring=new T.Mesh(new T.TorusGeometry(.22,.008,7,48),gold);charm.add(ring);
 const stars:T.Group[]=[];
 for(let i=0;i<3;i++){
  const star=new T.Group();star.position.set((i-1)*.19,-.26-(i%2)*.18,.025);charm.add(star);stars.push(star);
  tube([[(i-1)*.16,-.13,0],[(i-1)*.19,star.position.y+.06,.02]],.004,cord,charm);
  const shape=new T.Shape();for(let j=0;j<10;j++){const a=j*Math.PI/5+Math.PI/2,r=j%2?.024:.055;if(j)shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();
  star.add(new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSegments:2,bevelSize:.005,bevelThickness:.003,steps:1}),gold));
 }
 const notes=new T.Group();notes.position.set(-.12,2.45,-3.345);group.add(notes);
 for(let i=0;i<2;i++){
  const note=new T.Group();note.position.set(i*.37,i*.2,i*.013);note.rotation.z=i?-.1:.07;notes.add(note);box(.3,.37,.012,paper,[0,0,0],note,.012);
  const m=new T.MeshStandardMaterial({roughness:1});
  if(i===0)model.updatePhoto(m,0,.24/.25);else m.map=textTexture(['see you','soon ♡'],256,256,'#dfcaa7','#59583e',49);
  const image=new T.Mesh(new T.PlaneGeometry(.24,.25),m);image.position.set(0,.025,.009);note.add(image);ball(.016,gold,[0,.155,.018],[1,1,.5],note);
 }
 const dot=document.createElement('canvas');dot.width=32;dot.height=32;const c=dot.getContext('2d')!,g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'#fff');g.addColorStop(.18,'#fff7d8');g.addColorStop(1,'#fff0');c.fillStyle=g;c.fillRect(0,0,32,32);const texture=new T.CanvasTexture(dot);model.ownedTextures.add(texture);
 const positions=new Float32Array(72*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const material=new T.PointsMaterial({map:texture,color:'#ffe0a1',size:.075,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const sparks=new T.Points(geometry,material);sparks.frustumCulled=false;group.add(sparks);
 const glow=new T.PointLight('#ffd99a',0,4,2);glow.position.set(-.8,2.75,-2.65);group.add(glow);
 let lastPulse=0,burstAt=-100,lastMagic=false;const origin=new T.Vector3();
 function update(time:number,dt:number,magic:boolean,pulse:number,drawerOpen:boolean,visibility:number,reduced:boolean){
  if(pulse!==lastPulse||(magic&&!lastMagic)){burstAt=time;if(drawerOpen)model.drawerStar.getWorldPosition(origin);else origin.set(-.8,2.6,-3.02);lastPulse=pulse;}
  lastMagic=magic;const age=time-burstAt,burst=Math.max(0,1-age/5),power=magic?.65:burst;
  charm.rotation.z=reduced?0:Math.sin(time*.65)*(.013+burst*.05);stars.forEach((s,i)=>s.rotation.y=reduced?0:Math.sin(time*.5+i)*(.17+burst*.7));
  model.drawerStar.position.y=T.MathUtils.damp(model.drawerStar.position.y,drawerOpen&&power>0?.85+Math.sin(time*1.8)*.025:.775,4,dt);model.drawerStar.rotation.y=reduced?0:Math.sin(time*.7)*power*.4;
  sparks.visible=power>.005&&visibility>.01;material.opacity=power*.8*visibility;glow.intensity=power*3*visibility;
  if(sparks.visible){for(let i=0;i<72;i++){
    const phase=i*2.399,life=magic?((time*.13+i/72)%1):Math.min(1,age/5),radius=(.15+life*1.8)*(i%3?.75:1);
    positions[i*3]=(magic?-1:origin.x)+Math.cos(phase+(reduced?0:time*.18))*radius;
    positions[i*3+1]=(magic?1.55:origin.y)+life*(magic?2:1.2)+(i%5)*.05;
    positions[i*3+2]=(magic?-.5:origin.z)+Math.sin(phase)*radius*.8;
   }geometry.attributes.position.needsUpdate=true;}
 }
 return {update};
}
