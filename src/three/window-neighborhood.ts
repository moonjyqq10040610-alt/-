import * as T from 'three';
import type {RoomModel} from './room-model';
import {atmospheres,type Atmosphere} from '../data/atmospheres';

/** A layered miniature block: every material shares the real window aperture. */
export function createWindowNeighborhood(model:RoomModel){
 const {group,exterior:e}=model,city=new T.Group();group.add(city);
 const material=(color:string)=>new T.MeshBasicMaterial({color,clippingPlanes:e.clip});
 const facades=[material('#52646b'),material('#52646b'),material('#52646b')],stone=material('#6f7b78'),iron=material('#31454e'),lit=material('#d9bd89'),unlit=material('#334c5b'),snowMat=material('#e6e6df');
 const batches=new Map<T.Material,T.Matrix4[]>(),snowBatches:T.Matrix4[]=[],dummy=new T.Object3D();
 function block(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();const list=batches.get(m)??[];list.push(dummy.matrix.clone());batches.set(m,list);}
 function snowCap(w:number,x:number,y:number,z:number,d=.2){dummy.position.set(x,y,z);dummy.scale.set(w,.025,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();snowBatches.push(dummy.matrix.clone());}
 const fronts=[{x:.35,w:.68,h:1.02},{x:1.1,w:.66,h:1.26},{x:1.81,w:.64,h:.93},{x:2.51,w:.62,h:1.09},{x:3.23,w:.7,h:1.34},{x:4.05,w:.77,h:1.1},{x:4.85,w:.68,h:1.26}];
 // Distant rooftops make a second depth layer behind the detailed brownstones.
 for(let i=0;i<12;i++){const x=-.15+i*.48,h=.8+(i*7%5)*.16;block(.4,h,.1,x,1.54+h/2,-4.65,facades[2]);block(.44,.035,.15,x,1.56+h,-4.65,stone);if(i%3===1)block(.05,.2,.05,x+.09,1.65+h,-4.6,iron);}
 for(const [i,b] of fronts.entries()){
  const base=1.18,top=base+b.h,z=-4.18,front=z+.11;
  block(b.w,b.h,.22,b.x,base+b.h/2,z,facades[i%2]);
  block(b.w+.055,.052,.27,b.x,top,z,stone);block(b.w+.025,.025,.25,b.x,top-.065,z,stone);snowCap(b.w+.05,b.x,top+.034,z,.27);
  // Brick courses, slender cornices, inset sash windows and window sills.
  for(let row=0;row<8;row++)block(b.w,.005,.008,b.x,base+.06+row*.13,front+.003,stone);
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const x=b.x+(col?1:-1)*b.w*.23,y=base+.18+row*(b.h-.26)/3;
   block(.12,.2,.024,x,y,front+.013,iron);
   block(.086,.168,.01,x,y,front+.028,(i+col+row)%4?lit:unlit);
   block(.007,.168,.012,x,y,front+.035,stone);block(.086,.009,.012,x,y+.005,front+.035,stone);
   block(.145,.018,.057,x,y-.107,front+.03,stone);snowCap(.145,x,y-.091,front+.03,.06);
  }
  if(i===1||i===4){
   for(const y of [base+.47,base+.81]){block(b.w*.82,.02,.15,b.x,y,front+.085,iron);block(b.w*.82,.01,.015,b.x,y+.09,front+.16,iron);for(let k=0;k<6;k++)block(.008,.1,.015,b.x-b.w*.38+k*b.w*.15,y+.05,front+.16,iron);}
   for(let k=0;k<10;k++)block(.15,.01,.05,b.x+.07,base+.23+k*.058,front+.11,iron);
  }
  if(i===2){block(.1,.25,.09,b.x+.14,top+.1,z,stone);snowCap(.12,b.x+.14,top+.235,z,.12);}
 }
 // A little rooftop water tank and its four supporting legs.
 const tankMat=facades[1],tank=new T.Mesh(new T.CylinderGeometry(.14,.14,.27,16),tankMat);tank.position.set(3.23,2.86,-4.28);city.add(tank);
 const roof=new T.Mesh(new T.ConeGeometry(.16,.09,16),iron);roof.position.set(3.23,3.04,-4.28);city.add(roof);
 for(const x of [3.13,3.33])for(const z of [-4.36,-4.2])block(.018,.2,.018,x,2.65,z,iron);
 for(const y of [2.77,2.95]){const band=new T.Mesh(new T.TorusGeometry(.142,.009,5,20),iron);band.rotation.x=Math.PI/2;band.position.set(3.23,y,-4.28);city.add(band);}
 block(.008,.24,.008,1.1,2.6,-4.2,iron);block(.25,.008,.008,1.1,2.69,-4.2,iron);
 const geometry=new T.BoxGeometry(1,1,1);
 for(const [m,matrices] of batches){const mesh=new T.InstancedMesh(geometry,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();city.add(mesh);}
 const snow=new T.InstancedMesh(geometry,snowMat,snowBatches.length);snowBatches.forEach((matrix,i)=>snow.setMatrixAt(i,matrix));snow.computeBoundingSphere();city.add(snow);
 // One small flock passes far outside; it never crosses the glass into the room.
 const birdMaterial=new T.LineBasicMaterial({color:'#44545e',clippingPlanes:e.clip,transparent:true,opacity:.7});
 const birds=Array.from({length:3},(_,i)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.045,0,0,0,-.02,0,.045,0,0],3));const bird=new T.Line(g,birdMaterial);city.add(bird);return bird;});
 const starsGeometry=new T.BufferGeometry(),starPositions=[];for(let i=0;i<32;i++)starPositions.push(.1+(i*.811)%5,3.12+(i*.419)%.99,-4.72);starsGeometry.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));
 const starMat=new T.PointsMaterial({color:'#f6e6c5',size:.013,transparent:true,opacity:.6,clippingPlanes:e.clip,depthWrite:false});const stars=new T.Points(starsGeometry,starMat);city.add(stars);
 const target=new T.Color(),ink=new T.Color();
 function update(id:Atmosphere,time:number,dt:number,visibility:number,reduced:boolean){
  const p=atmospheres[id],night=p.moon,blend=1-Math.exp(-dt*2);
  target.set(p.building);facades.forEach((m,i)=>m.color.lerp(ink.copy(target).multiplyScalar((i===2?.76:i===1?1.07:.94)*visibility),blend));
  stone.color.copy(target).lerp(ink.set(night?'#65747b':'#ddd0b9'),.26).multiplyScalar(visibility);
  iron.color.copy(target).multiplyScalar(.48*visibility);unlit.color.set(night?'#243749':'#648899').multiplyScalar(visibility);
  lit.color.lerp(ink.set(night||id==='sunset'||id==='rain'?'#d9af74':'#8aa1a3').multiplyScalar(visibility),blend);
  snow.visible=id==='snow';snowMat.color.set('#e5e8e3').multiplyScalar(visibility);
  stars.visible=night&&visibility>.01;starMat.opacity=(.48+Math.sin(time*.45)*.1)*visibility;
  for(const [i,bird] of birds.entries()){
   bird.visible=(id==='sunny'||id==='sunset')&&visibility>.01;
   bird.position.set(reduced?2+i*.12:((time*.065+i*.14)%6)-.5,3.35+i*.09,-4.5);const a=bird.geometry.attributes.position;a.setY(0,reduced?0:Math.sin(time*4+i)*.035);a.setY(2,a.getY(0));a.needsUpdate=true;
  }
 }
 return {update};
}
