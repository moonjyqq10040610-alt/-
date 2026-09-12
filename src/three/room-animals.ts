import * as T from 'three';
import {catBlink} from './room-motion';
import type { RoomModel,Vec3 } from './room-model';
export function createAnimals(model:RoomModel){
  const {ball,box,tube,mat,tag,group}=model;
  const dark=mat('#1b1e18',.8),ivory=mat('#d8bc8c',.93);
  function cat(color:string,position:Vec3,size:number,action:string){
    const root=new T.Group();root.position.set(...position);root.scale.setScalar(size);group.add(root);
    const fur=mat(color,1),stripe=mat(color==='#c0986d'?'#97734d':'#676050',1),muzzle=mat('#d8cbb3',1);
    // A seated body has shoulders and haunches, rather than a single round belly.
    const torso=ball(.31,fur,[0,.36,-.065],[.77,1.16,.91],root);
    ball(.21,fur,[0,.2,-.13],[1.32,.82,1.12],root);
    for(const side of [-1,1]){
      ball(.16,fur,[side*.19,.17,-.1],[.89,1.04,1.14],root);
      ball(.08,fur,[side*.108,.24,.143],[.72,2.35,.87],root);
      ball(.092,muzzle,[side*.11,.074,.2],[.82,.62,1.14],root);
      for(let i=0;i<2;i++)tube([[side*.11-.024+i*.035,.079,.278],[side*.11-.026+i*.035,.098,.253]],.002,stripe,root);
    }
    torso.userData.dynamic=true;
    const head=new T.Group();head.position.set(0,.69,.13);root.add(head);
    const skull=ball(.257,fur,[0,0,0],[1.1,.92,.92],head);
    const verts=skull.geometry.attributes.position;for(let i=0;i<verts.count;i++){const y=verts.getY(i);if(y<0)verts.setX(i,verts.getX(i)*(1+y*.65));}skull.geometry.computeVertexNormals();
    const ears:T.Object3D[]=[];
    const earShape=new T.Shape();earShape.moveTo(-.105,0);earShape.quadraticCurveTo(-.068,.15,-.025,.23);earShape.quadraticCurveTo(.005,.27,.027,.223);earShape.quadraticCurveTo(.09,.14,.105,0);earShape.quadraticCurveTo(0,-.027,-.105,0);
    for(const side of [-1,1]){
      const ear=new T.Group();ear.position.set(side*.17,.17,-.012);ear.rotation.z=side*-.3;ear.scale.y=.72;head.add(ear);ears.push(ear);
      const outer=model.mesh(new T.ExtrudeGeometry(earShape,{depth:.045,bevelEnabled:true,bevelThickness:.02,bevelSize:.015,bevelSegments:1,steps:1,curveSegments:8}),fur,ear);outer.position.z=-.04;
      const inner=model.mesh(new T.ShapeGeometry(earShape,8),mat('#b99688',1),ear);inner.scale.set(.64,.76,1);inner.position.set(0,.022,.027);
    }
    ball(.071,muzzle,[-.056,-.097,.208],[1.05,.72,.65],head);ball(.071,muzzle,[.056,-.097,.208],[1.05,.72,.65],head);ball(.067,muzzle,[0,-.146,.183],[1,.48,.5],head);
    const nose=ball(.029,mat('#936d64',.95),[0,-.074,.258],[1,.68,.45],head);nose.rotation.z=Math.PI;
    tube([[0,-.09,.266],[0,-.119,.26],[-.024,-.131,.249]],.0025,dark,head);tube([[0,-.119,.26],[.024,-.131,.249]],.0025,dark,head);
    const eyes:T.Object3D[]=[];
    for(const x of [-.106,.106]){
      const eye=new T.Group();eye.position.set(x,.018,.214);eye.rotation.y=x>0?.16:-.16;head.add(eye);eyes.push(eye);
      ball(.062,stripe,[0,0,-.004],[1.06,.92,.23],eye);ball(.054,mat('#b1a079',.83),[0,0,.007],[1,.92,.2],eye);
      ball(.039,dark,[0,0,.018],[.86,1.08,.18],eye);ball(.01,mat('#eee5ca',.75),[-.016,.019,.027],[1,1,.2],eye);
    }
    // Low-contrast painted tabby marks follow the cheeks and brow.
    for(const side of [-1,1]){
      tube([[side*.032,.14,.187],[side*.057,.094,.208],[side*.082,.154,.174]],.007,stripe,head);
      for(let i=0;i<2;i++)tube([[side*.15,-.041-i*.024,.188],[side*.212,-.022-i*.03,.128]],.006,stripe,head);
      for(let i=0;i<3;i++)tube([[side*.094,-.111+i*.012,.259],[side*.207,-.105+i*.027,.256],[side*.3,-.105+i*.035,.215]],.0015,muzzle,head);
    }
    const tail=new T.Group();tail.position.set(0,.17,-.27);root.add(tail);
    tube([[0,0,0],[.25,-.07,-.11],[.35,-.105,.1],[.27,-.108,.39],[.11,-.098,.45]],.032,fur,tail);ball(.031,fur,[.11,-.098,.45],[1,1,1],tail);
    for(const side of [-1,1])for(let i=0;i<3;i++)tube([[side*.19,.49-i*.072,-.08],[side*.235,.43-i*.06,.016],[side*.205,.37-i*.045,.055]],.009,stripe,root);
    tag(root,action,action==='cats'?'摸摸猫':'摸摸窗边的猫');
    return {root,torso,head,tail,ears,eyes,base:root.position.clone(),petUntil:0};
  }
  const sofa=cat('#c0986d',[1.22,1.085,-1.67],.92,'cats');sofa.root.rotation.y=-.24;
  const window=cat('#9c9685',[1.53,1.84,-2.83],.77,'window-cat');window.root.rotation.y=.18;
  const elephant=new T.Group();group.add(elephant);elephant.scale.setScalar(.66);
  const blue=mat('#7b9191',.96),inner=mat('#a5aaa0',.99);
  const body=ball(.36,blue,[0,.38,0],[1,1.13,.83],elephant);
  body.userData.dynamic=true;
  const elephantHead=new T.Group();elephantHead.position.set(0,.79,.1);elephant.add(elephantHead);ball(.295,blue,[0,0,0],[1,.95,.92],elephantHead);
  const elephantEars:T.Object3D[]=[];
  for(const x of [-.32,.32]){const ear=new T.Group();ear.position.set(x,.03,-.055);elephantHead.add(ear);ball(.235,blue,[0,0,0],[.85,1.08,.3],ear);ball(.186,inner,[0,0,.038],[.83,1.05,.2],ear);elephantEars.push(ear);ball(.024,dark,[x*.44,.015,.248],[1,1,.5],elephantHead);ball(.009,ivory,[x*.44-.006,.024,.262],[1,1,.3],elephantHead);}
  const trunk=new T.Group();trunk.position.set(0,-.045,.245);elephantHead.add(trunk);tube([[0,0,0],[0,-.16,.08],[0,-.36,.08],[.06,-.45,.16],[.11,-.4,.2]],.073,blue,trunk);
  const legs:T.Object3D[]=[];
  for(const x of [-.23,.23])for(const z of [-.13,.19]){const leg=new T.Group();leg.position.set(x,.24,z);elephant.add(leg);ball(.155,blue,[0,-.07,.01],[.8,1.12,1],leg);ball(.095,inner,[0,-.16,.06],[1,.38,1],leg);legs.push(leg);}
  const photo=new T.Group();photo.position.set(0,.47,.33);elephant.add(photo);box(.31,.38,.018,ivory,[0,0,0],photo,.01);box(.255,.26,.012,mat('#3c524b'),[0,.025,.013],photo,.002);photo.visible=false;
  const book=new T.Group();book.position.set(0,.38,.4);book.rotation.x=-.45;elephant.add(book);for(const side of [-1,1]){const half=box(.24,.035,.32,mat('#b3a37b'),[side*.105,0,0],book,.012);half.rotation.z=side*.13;}book.visible=false;
  tube([[0,.31,-.26],[.03,.3,-.4],[.1,.27,-.45]],.025,blue,elephant);
  const thread=mat('#586c6b',1);
  for(let i=0;i<9;i++){const y=.23+i*.051;tube([[-.014,y,.303],[.012,y+.007,.305]],.0025,thread,elephant);}
  for(const side of [-1,1])for(let i=0;i<8;i++){const a=-1.2+i*.32;tube([[side*.32+Math.cos(a)*.153,.82+Math.sin(a)*.194,.026],[side*.32+Math.cos(a+.055)*.153,.82+Math.sin(a+.055)*.194,.028]],.0024,thread,elephant);}
  tag(elephant,'elephant','碰碰小象的鼻子');
  const home=new T.Vector3(2.66,.52,.08),besideCake=new T.Vector3(.93,.93,1.08);
  elephant.position.copy(home);let stage=0,elephantPetUntil=0,journeyStart=-1,arrived=false;
  function pet(id:string,time:number){if(id==='cats')sofa.petUntil=time+3.5;else if(id==='window-cat')window.petUntil=time+3;else if(id==='elephant')elephantPetUntil=time+2.5;}
  function update(time:number,dt:number,count:number,ready:boolean,seen:boolean,reduced:boolean){
    for(const [index,c] of [sofa,window].entries()){
      const petting=time<c.petUntil,motion=reduced?0:1,clock=time+(index?3.7:0),tempo=index?.89:1;
      c.torso.scale.y=1.16+Math.sin(clock*2.1*tempo)*.024*motion;
      c.head.rotation.y=Math.sin(clock*.37*tempo)*.11*motion+(petting?Math.sin(clock*1.8)*.17:0);
      c.head.rotation.z=petting?(index?-.16:.17)+Math.sin(clock*2.4)*.035:Math.sin(clock*.5)*.025*motion;
      c.head.position.y=.69+(petting?.024:0);
      c.tail.rotation.z=Math.sin(clock*1.25*tempo)*(.19+(petting?.22:0))*motion;
      c.ears.forEach((ear,i)=>{ear.rotation.x=petting?-.14+Math.sin(clock*3+i)*.045:Math.sin(clock*.7+i)*.025*motion;});
      c.eyes.forEach(eye=>eye.scale.y=petting?.18+Math.sin(clock*1.6)*.05:catBlink(time,index));
      c.root.position.y=c.base.y+(petting?Math.max(0,Math.sin(clock*2.2))*.018:0);
    }
    stage=seen?5:ready?6:Math.min(5,count);
    if(ready&&!seen&&journeyStart<0)journeyStart=time;
    const jumping=journeyStart>=0&&!arrived;
    if(jumping){
      const p=reduced?1:Math.min(1,(time-journeyStart)/2.6),e=p*p*(3-2*p);
      elephant.position.lerpVectors(home,besideCake,e);elephant.position.y+=Math.sin(p*Math.PI)*.72;
      elephant.rotation.y=T.MathUtils.lerp(-.85,-.55,e);
      if(p===1)arrived=true;
    }else if(!arrived){elephant.position.copy(home);elephant.rotation.y=T.MathUtils.lerp(elephant.rotation.y,stage===4?-1.6:0,.035);}
    const moving=jumping;
    legs.forEach((leg,i)=>leg.rotation.x=moving&&!reduced?Math.sin(time*8+(i%2)*Math.PI)*.3:0);
    body.scale.y=1.13+(reduced?0:Math.sin(time*1.7)*.025);elephantHead.rotation.z=(time<elephantPetUntil?Math.sin(time*3)*.1:0);
    trunk.rotation.x=time<elephantPetUntil?-.5-.18*Math.sin(time*3):arrived&&!seen?-.22+Math.sin(time*.9)*.04:Math.sin(time*.9)*.025;
    elephantEars.forEach((ear,i)=>ear.rotation.y=Math.sin(time*.8+i)*.045);
    book.visible=stage===1||stage===2;photo.visible=stage===5||time<elephantPetUntil;

  }
  return {sofa,window,elephant,pet,update};
}
