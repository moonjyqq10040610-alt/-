import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { shelfBooks } from '../data/books';
import { memories,photo } from '../data/memories';
import {addCakeToppers} from './cake-toppers';
import { makeGrain,createTulips } from './room-craft';
import {roundedSurface} from './rounded-surfaces';
export type RoomAction=string;
export type Vec3=[number,number,number];
export interface FocusView{position:Vec3;target:Vec3}
export const VIEWS:Record<string,FocusView>={
  frames:{position:[-1.7,2.85,-.95],target:[-4.94,2.65,-1.5]},
  books:{position:[-2.5,2.5,2.5],target:[-2.92,1.98,-2.57]},
  drawer:{position:[-2.45,2.25,2.0],target:[-3.65,.78,-.12]},
  calls:{position:[-2.75,2.75,1.65],target:[-3.5,1.32,-.54]},
  calendar:{position:[2.1,2.3,4.5],target:[1.52,1.35,2.0]},
  tv:{position:[-.3,2,4.15],target:[-3.55,1.03,2.12]},
  window:{position:[2.25,3.2,.35],target:[2.55,2.65,-2.93]},
  bookDetail:{position:[-2.95,2.8,1.15],target:[-3.12,2.52,-1.35]},
  cake:{position:[.95,2.65,4.85],target:[0,1.37,1.47]},
};
export const HOME_VIEW:FocusView={position:[3.6,6.7,15.3],target:[0,1.55,.1]};

export function createRoomModel(scene:T.Scene){
  const group=new T.Group();scene.add(group);
  const ownedTextures=new Set<T.Texture>();let disposed=false;
  const interactive:T.Object3D[]=[];
  const wallMaterials:T.MeshStandardMaterial[]=[];
  const books=new Map<string,T.Group>();
  const grains={wood:makeGrain('wood'),cloth:makeGrain('cloth'),paper:makeGrain('paper')};Object.values(grains).forEach(t=>ownedTextures.add(t));
  const materialCache=new Map<string,T.MeshStandardMaterial>();
  const mat=(color:string,roughness=.72,metalness=0)=>{const key=[color,roughness,metalness].join(':');let value=materialCache.get(key);if(!value){value=new T.MeshStandardMaterial({color,roughness:Math.max(.8,Math.round(roughness*10)/10),metalness:Math.min(.4,metalness),bumpMap:grains.paper,bumpScale:.008});materialCache.set(key,value);}return value;};
  const wood=mat('#603b26',.63),woodDark=mat('#30241b',.72),gold=mat('#b08848',.35,.68),cream=mat('#e5d7b7',.85),black=mat('#161816',.62);
  const olive=mat('#3b4439',.98),leather=mat('#85503c',.96),paper=mat('#e9ddc3',.96);
  [wood,woodDark].forEach(m=>{m.bumpMap=grains.wood;m.bumpScale=.026;});leather.bumpMap=grains.cloth;leather.bumpScale=.019;
  function mesh(geometry:T.BufferGeometry,material:T.Material,parent:T.Object3D=group){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w:number,h:number,d:number,material:T.Material,pos:Vec3,parent:T.Object3D=group,r=.03){const m=mesh(r>=.015?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),material,parent);m.position.set(...pos);return m;}
  function slab(w:number,h:number,d:number,material:T.Material,pos:Vec3,parent:T.Object3D=group,r=.12){const m=mesh(roundedSurface(w,d,h,r),material,parent);m.rotation.x=-Math.PI/2;m.position.set(...pos);return m;}
  function ball(radius:number,material:T.Material,pos:Vec3,scale:Vec3=[1,1,1],parent:T.Object3D=group){const m=mesh(new T.SphereGeometry(radius,12,8),material,parent);m.position.set(...pos);m.scale.set(...scale);return m;}
  function cylinder(rt:number,rb:number,h:number,material:T.Material,pos:Vec3,parent:T.Object3D=group){const m=mesh(new T.CylinderGeometry(rt,rb,h,20),material,parent);m.position.set(...pos);return m;}
  function tube(points:Vec3[],radius:number,material:T.Material,parent:T.Object3D=group){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),14,radius,5,false),material,parent);}
  function tag(obj:T.Object3D,id:string,label:string){obj.userData.action=id;obj.userData.label=label;interactive.push(obj);return obj;}
  function textTexture(lines:string[],w=512,h=512,bg='#e5d7b7',color='#483424',size=55){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d')!;
    c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`${size}px "Room Hand","Songti SC",Georgia,serif`;
    lines.forEach((line,i)=>c.fillText(line,w/2,h/2+(i-(lines.length-1)/2)*size*1.45,w*.9));
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;ownedTextures.add(texture);return texture;
  }
  function roundedPanel(w:number,h:number,r:number){
    const shape=new T.Shape(),x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    const g=new T.ShapeGeometry(shape,12),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+h/2)/h);return g;
  }
  function texturePlane(w:number,h:number,texture:T.Texture,pos:Vec3,parent:T.Object3D=group,emissive=false){const m=mesh(new T.PlaneGeometry(w,h),emissive?new T.MeshBasicMaterial({map:texture}):new T.MeshStandardMaterial({map:texture,roughness:.85}),parent);m.position.set(...pos);return m;}
  function updatePhoto(material:T.MeshStandardMaterial|T.MeshBasicMaterial,index:number,ratio:number,source?:string){
    material.userData.dynamicMap=true;
    const item=memories[index],request=(material.userData.request??0)+1;material.userData.request=request;const img=new Image();img.onload=()=>{if(disposed||material.userData.request!==request)return;const canvas=document.createElement('canvas');canvas.width=Math.round(1024*Math.min(1,ratio));canvas.height=Math.round(1024/Math.max(1,ratio));const c=canvas.getContext('2d')!;c.fillStyle=material instanceof T.MeshBasicMaterial?'#181b16':'#ede2ca';c.fillRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/img.width,canvas.height/img.height);c.drawImage(img,(canvas.width-img.width*scale)/2,(canvas.height-img.height*scale)/2,img.width*scale,img.height*scale);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;ownedTextures.add(tex);if(material.map){ownedTextures.delete(material.map);material.map.dispose();}material.map=tex;material.needsUpdate=true;};img.src=source||item.asset;
  }
  // A cutaway room with real thickness, skirting, floorboards and a window opening.
  slab(10.4,.24,8.3,woodDark,[0,-.14,.5],group,.34);
  for(let i=0;i<16;i++)box(.626,.06,8,mat(i%3===0?'#59402d':i%3===1?'#624733':'#543c2a'),[-4.7+i*.626,.005,.5],group,.012);
  const wall=olive.clone();wallMaterials.push(wall);
  const backWall=mesh(roundedSurface(10.16,4.45,.18,.13,[{width:3.45,height:2.2,x:2.45,y:.7,radius:.055}]),wall);backWall.position.set(0,2.22,-3.5);backWall.userData.structural=true;
  const leftWall=mat('#3c4234',.92),rightWall=mat('#3b4438',.92);wallMaterials.push(leftWall,rightWall);
  for(const [x,material] of [[-5.06,leftWall],[5.06,rightWall]] as const){const side=mesh(roundedSurface(4.34,4.45,.16,[.25,0,0,.12]),material);side.rotation.y=Math.PI/2;side.position.set(x,2.22,-1.42);side.userData.structural=true;}
  const trim=mat('#4c5848',.99);trim.bumpScale=.018;
  for(const y of [.72,3.88]){
    box(5.7,.037,.047,trim,[-2.14,y,-3.38],group,.012);
    for(const x of [-4.96,4.96])box(.046,.037,4.1,trim,[x,y,-1.39],group,.011);
  }
  for(const m of wallMaterials){m.bumpScale=.027;m.roughness=1;}
  box(10,.17,.12,woodDark,[0,.12,-3.34]);box(.12,.17,7.85,woodDark,[-4.95,.12,.5]);box(.12,.17,7.85,woodDark,[4.95,.12,.5]);
  const windowGroup=new T.Group();group.add(windowGroup);
  const windowWood=mat('#211d17',.7);
  box(3.55,.12,.34,windowWood,[2.45,1.82,-3.35],windowGroup);box(3.55,.12,.25,windowWood,[2.45,4.02,-3.35],windowGroup);
  for(const x of [.73,2.45,4.17])box(.09,2.2,.24,windowWood,[x,2.92,-3.36],windowGroup,.01);
  for(const y of [2.87])box(3.4,.055,.16,windowWood,[2.45,y,-3.29],windowGroup,.005);
  box(3.8,.12,.96,wood,[2.45,1.78,-3.05],windowGroup);tag(windowGroup,'window','看看窗外');
  const glass=mesh(new T.PlaneGeometry(3.4,2.2),new T.MeshPhysicalMaterial({color:'#406b97',transparent:true,opacity:.17,roughness:.15,metalness:.1}),windowGroup);glass.position.set(2.45,2.92,-3.49);glass.castShadow=false;
  const night=new T.MeshBasicMaterial({color:'#223347'});const view=mesh(new T.PlaneGeometry(6.8,4.4),night);view.position.set(2.45,2.92,-4.78);view.castShadow=false;
  const building=mat('#263846'),windowGlow=new T.MeshBasicMaterial({color:'#bea276'});
  const clip=[new T.Plane(new T.Vector3(1,0,0),-.76),new T.Plane(new T.Vector3(-1,0,0),4.14),new T.Plane(new T.Vector3(0,1,0),-1.84),new T.Plane(new T.Vector3(0,-1,0),4)];
  building.clippingPlanes=clip;windowGlow.clippingPlanes=clip;night.clippingPlanes=clip;
  const moonFace=ball(.16,new T.MeshBasicMaterial({color:'#d6d0b0'}),[3.55,3.57,-4.5],[1,1,.15]);moonFace.castShadow=false;(moonFace.material as T.MeshBasicMaterial).clippingPlanes=clip;
  const curtain=mat('#8a7658',.99);curtain.bumpMap=grains.cloth;
  for(const x of [.46,4.45])for(let i=0;i<6;i++)cylinder(.067,.081,2.51,curtain,[x+(i-2.5)*.095,2.8,-3.1]);
  // A woven rug with quiet inset borders, all geometry on the floor.
  const rug=mat('#553029',1),rugBorder=mat('#95704c',1);
  slab(6.6,.028,4.9,rug,[0,.053,.65],group,.2);
  for(const x of [-3.08,3.08])box(.07,.007,4.5,rugBorder,[x,.072,.65],group,.001);
  for(const z of [-1.61,2.91])box(6.15,.007,.07,rugBorder,[0,.072,z],group,.001);
  for(let i=0;i<19;i++){const diamond=box(.11,.006,.11,rugBorder,[-2.88+i*.32,.076,-1.37],group,.002);diamond.rotation.y=Math.PI/4;const d2=diamond.clone();d2.position.z=2.66;group.add(d2);}
  // Soft contact shadows ground the furniture even under diffuse winter light.
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
  const contactContext=contactCanvas.getContext('2d')!,contactGradient=contactContext.createRadialGradient(64,64,14,64,64,64);
  contactGradient.addColorStop(0,'rgba(20,16,10,.42)');contactGradient.addColorStop(.55,'rgba(20,16,10,.22)');contactGradient.addColorStop(1,'rgba(20,16,10,0)');contactContext.fillStyle=contactGradient;contactContext.fillRect(0,0,128,128);
  const contactTexture=new T.CanvasTexture(contactCanvas);ownedTextures.add(contactTexture);
  const contactMaterial=new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,toneMapped:false});
  for(const [x,z,w,d] of [[0,-1.9,5.5,2.6],[0,1.1,5.6,3.5],[-3.8,1.7,2.5,2],[3.9,1.3,1.8,2.4]]){
    const contact=mesh(new T.PlaneGeometry(w,d),contactMaterial);contact.rotation.x=-Math.PI/2;contact.position.set(x,.085,z);contact.castShadow=false;
  }
  // Sofa: rounded upholstery, separate seat and back cushions, stitched tufting.
  box(4.85,.64,1.72,leather,[0,.56,-1.94],group,.17);
  for(const x of [-2.28,2.28])box(.5,1.25,1.86,leather,[x,.93,-1.99],group,.2);
  for(const x of [-1.48,0,1.48]){box(1.43,.26,1.4,leather,[x,.94,-1.74],group,.115);const back=box(1.43,1.23,.32,leather,[x,1.53,-2.59],group,.13);back.rotation.x=-.12;for(const xx of [-.3,.3])ball(.037,woodDark,[x+xx,1.5,-2.405],[1,1,.3]);}
  for(const x of [-2.08,2.08])for(const z of [-2.5,-1.35])cylinder(.065,.04,.25,woodDark,[x,.18,z]);
  const pillow=box(.67,.61,.22,mat('#bc8350'),[-1.62,1.37,-2.27],group,.15);pillow.rotation.z=.25;pillow.rotation.x=-.15;
  const pillow2=box(.58,.55,.2,mat('#414d42'),[1.7,1.35,-2.27],group,.15);pillow2.rotation.z=-.25;
  const piping=mat('#ae7b57',1);
  for(const x of [-1.48,0,1.48])tube([[x-.61,1.064,-2.34],[x+.61,1.064,-2.34],[x+.66,1.064,-1.14],[x-.66,1.064,-1.14],[x-.61,1.064,-2.34]],.009,piping);
  tag(pillow,'cushion','拍拍靠垫');tag(pillow2,'cushion','拍拍靠垫');
  // Bookcase and real editable title spines.
  const shelf=new T.Group();shelf.position.set(-3.06,0,-3.03);group.add(shelf);
  box(1.86,3.82,.15,woodDark,[0,1.91,-.18],shelf);
  for(const x of [-.98,.98])box(.13,3.88,.67,wood,[x,1.94,0],shelf);
  for(const y of [.13,1.21,2.37,3.87])box(2.13,.12,.73,wood,[0,y,.02],shelf);
  function bookArt(book:typeof shelfBooks[number],spine:boolean){
    const c=document.createElement('canvas');c.width=spine?256:384;c.height=spine?1024:512;const ctx=c.getContext('2d')!;ctx.scale(spine?1:.5,spine?1:.5);ctx.fillStyle=book.color;ctx.fillRect(0,0,spine?256:768,1024);
    ctx.strokeStyle='#d1b27a';ctx.lineWidth=spine?3:4;ctx.strokeRect(18,26,(spine?256:768)-36,972);ctx.strokeRect(25,35,(spine?256:768)-50,954);ctx.fillStyle='#eee0bd';ctx.textAlign='center';ctx.textBaseline='middle';
    if(spine){ctx.font='26px "Room Hand","Songti SC",serif';ctx.fillText(book.family==='magic'?'HARRY POTTER':'LITTLE LIBRARY',128,93,205);ctx.fillRect(40,144,176,2);
      const chars=Array.from(book.spine),step=Math.min(83,650/chars.length);ctx.font=`${Math.min(63,step*.83)}px "Room Hand","Songti SC",serif`;chars.forEach((ch,i)=>ctx.fillText(ch,128,500+(i-(chars.length-1)/2)*step));ctx.fillRect(40,863,176,2);ctx.font='38px Georgia';ctx.fillText(book.volume||'·',128,924);
    }else{ctx.font='24px Georgia';ctx.fillText(book.family==='magic'?'THE HARRY POTTER COLLECTION':'THE LITTLE LIBRARY',384,137);ctx.font='50px "Room Hand","Songti SC",serif';const title=book.title.replace('哈利·波特与','');if(book.family==='magic'){ctx.font='57px "Room Hand","Songti SC",serif';ctx.fillText('哈利·波特',384,320);ctx.font='46px "Room Hand","Songti SC",serif';}const lines=title.match(/.{1,6}/g)??[];lines.forEach((line,i)=>ctx.fillText(line,384,434+i*67));ctx.beginPath();ctx.arc(384,716,76,0,Math.PI*2);ctx.stroke();ctx.font='53px Georgia';ctx.fillText(book.volume||'DOODLE',384,720);ctx.font='28px "Room Hand","Songti SC",serif';ctx.fillText(book.author,384,884,630);}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;ownedTextures.add(tex);return tex;
  }
  const bookOrigins=new Map<string,T.Vector3>();
  function boundBook(book:typeof shelfBooks[number],parent:T.Object3D,w:number,h:number){
    const b=new T.Group();parent.add(b);const cover=mat(book.color,.97);cover.bumpMap=grains.cloth;
    for(const x of [-w/2,w/2])box(.023,h,.61,cover,[x,h/2,0],b,.01);
    box(w-.025,h-.055,.555,paper,[0,h/2,-.012],b,.008);box(w+.02,h,.047,cover,[0,h/2,.291],b,.018);
    for(let j=0;j<12;j++)box(w-.04,.002,.53,mat('#bfb092',1),[0,.05+j*(h-.1)/12,-.01],b,.001);
    texturePlane(w*.88,h*.96,bookArt(book,true),[0,h/2,.319],b);
    const face=texturePlane(.575,h*.965,bookArt(book,false),[w/2+.014,h/2,0],b);face.rotation.y=Math.PI/2;
    for(const y of [.1,h-.1])box(w+.024,.023,.051,cover,[0,y,.292],b,.009);
    return b;
  }
  shelfBooks.forEach((book,i)=>{const w=i<7?.235:.36,h=i<7?.93:.95,b=boundBook(book,shelf,w,h);b.position.set((i<7?-.81:-.68)+(i<7?i:i-7)*(w+.02),i<7?2.46:1.31,.13);books.set(book.id,b);bookOrigins.set(book.id,b.position.clone());tag(b,`book:${book.id}`,book.title);});
  const dustPositions=new Float32Array(18*3);for(let i=0;i<18;i++){dustPositions[i*3]=Math.sin(i*13)*.6;dustPositions[i*3+1]=(i/18)*1.7;dustPositions[i*3+2]=Math.cos(i*7)*.18;}
  const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(dustPositions,3));const bookDust=new T.Points(dustGeometry,new T.PointsMaterial({color:'#d9bb75',size:.012,transparent:true,opacity:.5,depthWrite:false}));bookDust.position.set(-3.06,2.4,-2.56);group.add(bookDust);
  for(let i=0;i<8;i++){const b=box(.16,.55+(i%3)*.1,.5,mat(['#6b4832','#465547','#8a764a'][i%3]),[-.76+i*.2,.44+(i%3)*.05,.09],shelf,.014);b.rotation.z=i===7?-.12:0;}
  const bookmark=box(.18,.29,.009,paper,[-.75,1.21,.45],shelf,.012);bookmark.rotation.z=-.13;
  const markFace=texturePlane(.15,.24,textTexture(['TODAY','☀'],256,384,'#e5cda3','#716141',63),[-.75,1.21,.458],shelf);markFace.rotation.z=-.13;tag(bookmark,'sunny','夹在书里的晴天');tag(markFace,'sunny','夹在书里的晴天');
  const wand=new T.Group();wand.position.set(.46,1.79,.53);wand.rotation.z=-.38;shelf.add(wand);
  tube([[0,0,0],[.07,.18,0],[.11,.37,0]],.014,gold,wand);ball(.028,cream,[.11,.37,0],[1,1,1],wand);tag(wand,'magic','Lumos');
  tag(shelf,'books','走近书架');
  // Wall frame with two-sided photograph inside the moulding.
  const frame=new T.Group();frame.position.set(-4.94,2.65,-1.5);frame.rotation.y=Math.PI/2;group.add(frame);
  mesh(roundedSurface(.96,1.25,.09,.09),woodDark,frame);
  const frameRim=mesh(roundedSurface(1.05,1.34,.13,.1,[{width:.84,height:1.12,x:0,y:0,radius:.055}]),gold,frame);frameRim.position.z=.025;
  const frameTurner=new T.Group();frameTurner.position.z=.1;frame.add(frameTurner);
  const frameMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.7});const frameFront=mesh(roundedPanel(.82,1.1,.045),frameMat,frameTurner);frameFront.position.z=.004;
  const frameBackMat=new T.MeshStandardMaterial({map:textTexture([...(photo(1).backText.match(/.{1,12}/g)??[]),'','小屋 ♡'],512,700,'#dac79b','#483424',35),roughness:.9});const frameBack=mesh(roundedPanel(.82,1.1,.045),frameBackMat,frameTurner);frameBack.rotation.y=Math.PI;frameBack.position.z=-.004;
  updatePhoto(frameMat,0,.82/1.1);tag(frame,'frames','相框里的合照');
  // Desk and rotary phone.
  const desk=new T.Group();desk.position.set(-3.65,0,-.62);group.add(desk);
  slab(1.42,.12,1.0,wood,[0,1.01,0],desk,.14);
  // The drawer has an actual cavity, side runners and an open top.
  box(1.29,.43,.85,wood,[0,.47,-.01],desk,.05);
  for(const x of [-.61,.61])box(.07,.29,.85,wood,[x,.81,-.01],desk,.018);
  box(1.2,.28,.055,woodDark,[0,.81,-.41],desk,.015);
  const drawer=new T.Group();desk.add(drawer);tag(drawer,'drawer','拉开电话柜的抽屉');
  box(1.16,.22,.06,olive,[0,.83,.445],drawer,.025);
  ball(.032,gold,[0,.83,.488],[1,1,1],drawer);
  box(1.08,.035,.68,wood,[0,.72,.07],drawer,.015);
  for(const x of [-.52,.52])box(.032,.17,.67,wood,[x,.805,.07],drawer,.01);
  box(1.05,.17,.033,wood,[0,.805,-.25],drawer,.01);
  for(const x of [-.569,.569])box(.014,.025,.59,gold,[x,.748,-.065],desk,.005);
  const ticket=texturePlane(.58,.26,textTexture(['9¾','ANYWHERE · TOGETHER'],512,256,'#d5b68b','#65452f',51),[-.13,.749,.11],drawer);ticket.rotation.x=-Math.PI/2;ticket.rotation.z=-.13;
  const drawerStar=new T.Group();drawerStar.position.set(.32,.775,.17);drawer.add(drawerStar);tag(drawerStar,'drawer-star','碰一下抽屉里的星星');
  const starShape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.037:.085;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)starShape.lineTo(x,y);else starShape.moveTo(x,y);}starShape.closePath();
  mesh(new T.ExtrudeGeometry(starShape,{depth:.018,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.006,bevelThickness:.004}),gold,drawerStar).rotation.x=-Math.PI/2;
  for(const x of [-.55,.55])for(const z of [-.33,.33])cylinder(.05,.036,.26,woodDark,[x,.14,z],desk);
  box(1.15,.4,.04,olive,[0,.47,.445],desk,.03);
  const phone=new T.Group();phone.position.set(0,1.09,.04);phone.rotation.y=.15;desk.add(phone);
  const red=mat('#794337',.8,.06);box(.8,.15,.61,red,[0,.09,0],phone,.075);const phoneSlope=box(.57,.19,.42,red,[0,.21,.03],phone,.05);phoneSlope.rotation.x=-.18;
  const handset=new T.Group();handset.position.set(0,.44,-.16);phone.add(handset);box(.74,.09,.12,red,[0,0,0],handset,.045);for(const x of [-.31,.31])ball(.125,red,[x,-.055,0],[1,.65,1],handset);
  const dialMount=new T.Group();dialMount.position.set(0,.415,.105);dialMount.rotation.x=-Math.PI/2+.3;phone.add(dialMount);
  cylinder(.207,.207,.017,gold,[0,0,0],dialMount).rotation.x=Math.PI/2;
  const dial=new T.Group();dialMount.add(dial);
  const dialFace=mesh(new T.RingGeometry(.087,.19,48),gold,dial);dialFace.position.z=.02;
  for(let i=0;i<10;i++){const a=(i*28+30)*Math.PI/180,x=.146*Math.cos(a),y=.146*Math.sin(a);const hole=mesh(new T.CircleGeometry(.026,16),black,dial);hole.position.set(x,y,.025);const tex=textTexture([String((i+1)%10)],96,96,'#302718','#f0d49c',68);texturePlane(.027,.027,tex,[x,y,.028],dial,true);}
  texturePlane(.104,.104,textTexture(['hi!'],128,128,'#c5a66c','#503b28',56),[0,0,.027],dialMount);
  tag(dialMount,'dial','拨动电话，听下一条消息');tag(phone,'calls','走近旧电话');
  const cord:T.Vector3[]=[];for(let i=0;i<130;i++){const u=i/129;cord.push(new T.Vector3(-.43+Math.cos(u*50)*.03,.39-u*.29,-.12+Math.sin(u*50)*.025));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cord),150,.008,5,false),black,phone);
  // Desk lamp and floor lamp, with actual light sources.
  const deskLamp=new T.Group();deskLamp.position.set(-4.8,3.43,-1.5);deskLamp.rotation.y=Math.PI/2;group.add(deskLamp);
  box(.17,.15,.025,gold,[0,0,0],deskLamp,.025);tube([[0,0,0],[0,.08,.21],[0,.01,.34]],.018,gold,deskLamp);
  const pictureBar=cylinder(.046,.046,.86,gold,[0,.015,.34],deskLamp);pictureBar.rotation.z=Math.PI/2;
  const pictureBulb=box(.77,.021,.038,new T.MeshBasicMaterial({color:'#ffe2a9'}),[0,-.025,.34],deskLamp,.008);pictureBulb.castShadow=false;
  tag(deskLamp,'desk-lamp','开关相框灯');
  const deskLight=new T.SpotLight('#ffd59a',13,4,.7,.8,1.3);deskLight.position.set(-4.46,3.36,-1.5);deskLight.target.position.set(-4.9,2.48,-1.5);group.add(deskLight,deskLight.target);
  const lamp=new T.Group();lamp.position.set(4.26,0,-2.16);group.add(lamp);
  cylinder(.36,.43,.09,gold,[0,.08,0],lamp);cylinder(.029,.045,2.17,gold,[0,1.18,0],lamp);
  const shadeMat=new T.MeshStandardMaterial({color:'#eed1a0',emissive:'#e4a451',emissiveIntensity:.55,roughness:.95,side:T.DoubleSide});
  const shadeGeometry=new T.CylinderGeometry(.27,.49,.72,64,1,true);const vertices=shadeGeometry.attributes.position;for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i),angle=Math.atan2(z,x),factor=1+Math.cos(angle*32)*.025;vertices.setXYZ(i,x*factor,vertices.getY(i),z*factor);}shadeGeometry.computeVertexNormals();const shade=mesh(shadeGeometry,shadeMat,lamp);shade.position.y=2.47;
  tag(lamp,'lamp','开关落地灯');const floorLight=new T.PointLight('#ffc27e',38,10,2);floorLight.position.set(4.26,2.32,-2.16);floorLight.castShadow=false;floorLight.shadow.mapSize.set(1024,1024);floorLight.shadow.bias=-.002;group.add(floorLight);
  // Coffee table and separated keepsakes.
  const table=new T.Group();table.position.set(0,0,1.68);group.add(table);
  slab(4.3,.17,1.78,wood,[0,.8,0],table,.22);for(const x of [-1.84,1.84])for(const z of [-.6,.6]){const leg=box(.12,.73,.14,woodDark,[x,.4,z],table,.035);leg.rotation.z=x>0?-.06:.06;}
  const cake=new T.Group();cake.position.set(0,.91,-.18);table.add(cake);cylinder(.64,.64,.035,cream,[0,0,0],cake);cylinder(.49,.5,.49,mat('#eadcbf',.83),[0,.26,0],cake);
  cylinder(.5,.5,.035,cream,[0,.505,0],cake);for(let i=0;i<10;i++){const a=i*Math.PI/5;ball(.06,cream,[.43*Math.cos(a),.54,.43*Math.sin(a)],[1,.55,1],cake);if(i%2===0){ball(.059,mat('#9c2925',.43),[.34*Math.cos(a),.572,.34*Math.sin(a)],[.9,1.3,.9],cake);}}
  const frosting=mat('#f0dfc7',.98);
  for(const y of [.05,.48])for(let i=0;i<36;i++){const a=i*Math.PI/18,b=ball(.036,frosting,[.49*Math.cos(a),y,.49*Math.sin(a)],[1,.76,1.3],cake);b.rotation.y=-a;}
  for(let i=0;i<24;i++){const a=i*Math.PI/12;tube([[.503*Math.cos(a),.17,.503*Math.sin(a)],[.506*Math.cos(a+.045),.29,.506*Math.sin(a+.045)],[.503*Math.cos(a),.4,.503*Math.sin(a)]],.007,frosting,cake);}
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;for(let n=0;n<5;n++){const t=n*1.24;ball(.005,mat('#e9bb79'),[.34*Math.cos(a)+.035*Math.cos(t),.598,.34*Math.sin(a)+.035*Math.sin(t)],[1,.45,1],cake);}}
  const flames:T.Mesh[]=[];for(const x of [-.13,.13]){cylinder(.018,.018,.48,paper,[x,.75,0],cake);const flame=ball(.042,new T.MeshBasicMaterial({color:'#ffd985'}),[x,1.025,0],[.5,1.8,.5],cake);flame.castShadow=false;flames.push(flame);}
  const toppers=addCakeToppers({box,ball,tube,mesh,mat},cake);
  const candleLight=new T.PointLight('#ffa24a',2.8,3.4,2);candleLight.position.set(0,1.8,2.1);group.add(candleLight);tag(cake,'cake','许愿蛋糕');
  function polaroid(index:number,pos:Vec3,rot:number,id:string,label:string){const p=new T.Group();p.position.set(...pos);p.rotation.set(-Math.PI/2,0,rot);table.add(p);mesh(roundedSurface(.62,.78,.015,.035),paper,p);const pm=new T.MeshStandardMaterial({color:'#fff'});const image=mesh(roundedPanel(.53,.54,.018),pm,p);image.position.set(0,.045,.014);updatePhoto(pm,index-1,.53/.54);tag(p,id,label);return {group:p,material:pm};}
  polaroid(5,[-1.15,.907,.39],-.18,'portraits','桌上的单人拍立得');polaroid(6,[-.63,.91,.47],.18,'portraits','桌上的单人拍立得');
  const savedPrint=polaroid(5,[.66,.917,.47],-.08,'camera','刚拍下的小屋照片');savedPrint.group.visible=false;
  const album=new T.Group();album.position.set(-1.55,.99,-.4);album.rotation.y=-.1;table.add(album);box(.68,.14,.82,mat('#4b5a48'),[0,0,0],album);const cover=texturePlane(.48,.58,textTexture(['US','IN THE SAME FRAME'],256,320,'#405140','#dfc697',30),[0,.076,0],album);cover.rotation.x=-Math.PI/2;tag(album,'together','合照册');
  const mug=new T.Group();mug.position.set(-.94,1.05,-.52);table.add(mug);cylinder(.12,.1,.3,mat('#8c744e',.4),[0,.02,0],mug);const handle=mesh(new T.TorusGeometry(.1,.025,8,20),gold,mug);handle.position.set(.13,.03,0);cylinder(.104,.104,.007,woodDark,[0,.175,0],mug);
  cylinder(.19,.17,.016,cream,[-.94,.911,-.52],table);
  const latteMat=mat('#dcc59a',1);for(const x of [-.023,.023])ball(.028,latteMat,[x,.18,.005],[1,.12,1],mug);const latteTip=mesh(new T.ConeGeometry(.042,.059,3),latteMat,mug);latteTip.rotation.x=Math.PI/2;latteTip.position.set(0,.18,.035);
  tag(mug,'mug','碰一碰咖啡杯');const steam=new T.Group();mug.add(steam);for(let i=0;i<3;i++){const vapor=tube([[i*.07-.07,.23,0],[i*.07-.09,.37,.01],[i*.07-.06,.51,0]],.005,new T.MeshBasicMaterial({color:'#ded0b4',transparent:true,opacity:.2}),steam);vapor.castShadow=false;}
  const cameraProp=new T.Group();cameraProp.position.set(1.18,1.04,-.27);cameraProp.rotation.y=-.12;table.add(cameraProp);box(.56,.32,.24,black,[0,0,0],cameraProp,.04);box(.23,.12,.2,gold,[0,.18,-.01],cameraProp,.02);const lens=cylinder(.127,.127,.18,black,[0,-.01,.17],cameraProp);lens.rotation.x=Math.PI/2;const glassLens=cylinder(.095,.095,.007,mat('#253d44',.15,.55),[0,-.01,.27],cameraProp);glassLens.rotation.x=Math.PI/2;tag(cameraProp,'camera','拍一张新的小屋照片');
  for(let i=0;i<22;i++){const a=i*Math.PI/11;box(.012,.012,.1,gold,[.12*Math.cos(a),-.01+.12*Math.sin(a),.19],cameraProp,.004);}texturePlane(.22,.035,textTexture(['DOODLE · 35'],256,64,'#20271f','#cfb686',30),[-.15,.06,.127],cameraProp);tube([[-.28,.1,0],[-.37,-.09,-.12],[-.12,-.25,-.16],[.3,.1,0]],.017,woodDark,cameraProp);
  const calendar=new T.Group();calendar.position.set(1.65,.92,.36);calendar.rotation.x=-.16;table.add(calendar);box(.62,.04,.48,wood,[0,0,-.03],calendar);const stand=box(.57,.72,.04,wood,[0,.35,-.14],calendar);stand.rotation.x=.3;
  const calendarPivot=new T.Group();calendarPivot.position.set(0,.69,.02);calendar.add(calendarPivot);
  function calendarTexture(actual:boolean){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=650;const c=canvas.getContext('2d')!;
    c.fillStyle='#e9d9b7';c.fillRect(0,0,512,650);c.strokeStyle='#a99672';c.lineWidth=2;c.strokeRect(22,22,468,606);c.fillStyle='#573b26';c.textAlign='center';
    c.font='32px Georgia';c.fillText(actual?'TOMORROW':'TODAY',256,112);c.font='240px Georgia';c.fillText(actual?'02':'01',256,368);
    c.font='23px Georgia';c.fillText(actual?'A NEW LITTLE DAY':'ONE SMALL WISH',256,459);c.strokeRect(106,500,300,62);c.font='25px Georgia';c.fillText(actual?'TAKE IT SLOW':'MAKE IT COUNT',256,541);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;ownedTextures.add(texture);return texture;
  }
  const calendarMat=new T.MeshStandardMaterial({map:calendarTexture(false),roughness:.98});
  const calendarNextMat=new T.MeshStandardMaterial({map:calendarTexture(true),roughness:.98});
  const calendarBase=mesh(new T.PlaneGeometry(.56,.66),calendarNextMat,calendar);calendarBase.position.set(0,.36,.012);
  const leafGeometry=new T.PlaneGeometry(.56,.66,8,24);leafGeometry.translate(0,-.33,0);
  const calendarLeaf=mesh(leafGeometry,calendarMat,calendarPivot);calendarLeaf.position.z=.014;
  const calendarBack=mesh(leafGeometry.clone(),new T.MeshStandardMaterial({map:textTexture(['A LITTLE','NEW DAY'],512,650,'#e9d9b7','#938064',45),roughness:1,side:T.BackSide}),calendarPivot);calendarBack.position.z=.012;calendarLeaf.userData.deforming=true;calendarBack.userData.deforming=true;
  for(let i=0;i<7;i++){const ring=mesh(new T.TorusGeometry(.029,.005,8,20),gold,calendar);ring.rotation.y=Math.PI/2;ring.position.set(-.24+i*.08,.705,.0);}tag(calendar,'calendar','翻页');
  // CRT: a real cabinet, feet, convex glass and independently updating screen.
  const tv=new T.Group();tv.position.set(-3.55,.1,2.12);tv.rotation.y=1.12;group.add(tv);
  box(1.94,1.45,1.05,wood,[0,.85,0],tv,.11);box(1.79,1.27,.06,black,[0,.86,.545],tv,.08);
  const tvMat=new T.MeshBasicMaterial({color:'#ffffff'});const tvScreen=mesh(roundedPanel(1.28,1.04,.095),tvMat,tv);tvScreen.position.set(-.17,.88,.585);updatePhoto(tvMat,0,1.28/1.04);
  const tvButtons=new Map<string,T.Object3D>();const tvPlay=new T.Group(),tvPause=new T.Group();
  for(const [i,id] of ['tv-prev','tv-pause','tv-next'].entries()){
    const control=new T.Group();control.position.set(.65,1.36-i*.36,.615);tv.add(control);
    const knob=cylinder(.095,.095,.06,gold,[0,0,0],control);knob.rotation.x=Math.PI/2;
    if(id==='tv-pause'){
      control.add(tvPlay,tvPause);for(const x of [-.019,.019])box(.012,.057,.009,black,[x,0,.035],tvPause,.004);
      const arrow=new T.Shape();arrow.moveTo(-.022,-.033);arrow.lineTo(.029,0);arrow.lineTo(-.022,.033);arrow.closePath();const glyph=mesh(new T.ShapeGeometry(arrow),black,tvPlay);glyph.position.z=.035;tvPlay.visible=false;
    }else{const direction=id==='tv-prev'?-1:1;tube([[-direction*.018,.031,.036],[direction*.019,0,.036],[-direction*.018,-.031,.036]],.006,black,control);}
    tag(control,id,['上一张','暂停 / 播放','下一张'][i]);tvButtons.set(id,control);
  }
  for(let i=0;i<5;i++)box(.23,.012,.018,gold,[.65,.42-i*.039,.586],tv,.004);
  for(const x of [-.65,.65])for(const z of [-.34,.34]){const leg=box(.07,.25,.07,woodDark,[x,.06,z],tv);leg.rotation.z=x>0?-.2:.2;}
  tag(tv,'tv','走近正在播放照片的电视');
  // Plants and side table give the room volume from the side as well.
  const sideTable=new T.Group();sideTable.position.set(3.53,0,-.82);group.add(sideTable);
  cylinder(.5,.5,.11,wood,[0,.79,0],sideTable);cylinder(.065,.11,.7,gold,[0,.38,0],sideTable);cylinder(.31,.37,.065,woodDark,[0,.07,0],sideTable);
  const chair=new T.Group();chair.position.set(3.58,0,1.25);chair.rotation.y=-.55;group.add(chair);
  const fabric=mat('#596153',1);fabric.bumpMap=grains.cloth;fabric.bumpScale=.024;
  box(1.17,.24,1.16,fabric,[0,.63,0],chair,.14);const chairBack=box(1.15,.96,.25,fabric,[0,1.01,-.5],chair,.16);chairBack.rotation.x=-.1;
  for(const x of [-.59,.59]){box(.17,.15,1.05,wood,[x,.86,-.01],chair,.065);for(const z of [-.43,.43])box(.065,.7,.065,wood,[x,.42,z],chair,.018);}
  tag(chair,'cushion','坐一会儿');
  const craft={group,ownedTextures,mesh,ball,cylinder,tube,mat,tag};
  const flowers=[createTulips(craft,[4.48,.075,-.05],1.05),createTulips(craft,[-3.87,1.08,-.98],.52)];
  const stool=new T.Group();stool.position.set(2.66,0,.08);group.add(stool);cylinder(.37,.36,.16,fabric,[0,.44,0],stool);for(const x of [-.23,.23])for(const z of [-.23,.23])cylinder(.035,.028,.4,wood,[x,.22,z],stool);
  // A coffee for two: glazed cup, saucer, spoon, and a quietly reserved spot.
  const coffee=new T.Group();coffee.position.set(0,.86,0);sideTable.add(coffee);cylinder(.2,.17,.025,cream,[0,0,0],coffee);cylinder(.105,.075,.18,mat('#b39761'),[0,.105,0],coffee);cylinder(.094,.094,.005,woodDark,[0,.197,0],coffee);
  const coffeeHandle=mesh(new T.TorusGeometry(.067,.014,8,20),gold,coffee);coffeeHandle.position.set(.105,.12,0);
  const spoon=ball(.031,gold,[.145,.027,.018],[.64,.25,1.3],coffee);tube([[.145,.028,.018],[.145,.028,.15]],.007,gold,coffee);tag(coffee,'coffee','这一杯，也给你留着');
  const reserved=texturePlane(.34,.19,textTexture(['RESERVED'],512,230,'#d8c69e','#55402d',42),[.23,.88,-.22],sideTable);reserved.rotation.x=-.8;
  const teaFlame=ball(.026,new T.MeshBasicMaterial({color:'#ffd48b'}),[-.26,1.035,.12],[.5,1.7,.5],sideTable);cylinder(.064,.064,.11,cream,[-.26,.9,.12],sideTable);teaFlame.castShadow=false;
  const teaLight=new T.PointLight('#ffb668',1.3,3.5,2);teaLight.position.set(3.27,1.08,-.7);group.add(teaLight);
  // Art on the other wall, with a supplied photo inside a wooden frame.
  const art=new T.Group();art.position.set(4.92,2.86,-.5);art.rotation.y=-Math.PI/2;group.add(art);mesh(roundedSurface(1.13,1.35,.07,.1),gold,art);const artMat=new T.MeshStandardMaterial({color:'#fff',roughness:.8});const artPhoto=mesh(roundedPanel(.96,1.17,.055),artMat,art);artPhoto.position.z=.04;updatePhoto(artMat,4,.96/1.17);tag(art,'portraits','墙上的旅行照片');
  // A small letter appears after the birthday sequence.
  const letter=new T.Group();letter.position.set(.35,.923,.45);letter.rotation.x=-Math.PI/2;table.add(letter);box(.68,.42,.012,paper,[0,0,0],letter,.015);texturePlane(.59,.34,textTexture(['For You'],512,260,'#e5d7b7','#624936',66),[0,0,.008],letter);letter.visible=false;tag(letter,'letter','再读一遍小屋来信');
  const indicatorMaterial=new T.MeshBasicMaterial({color:'#241b0d'});const phoneIndicator=ball(.025,indicatorMaterial,[.31,.25,.22],[1,.6,.45],phone);phoneIndicator.castShadow=false;
  const shelfBulb=box(1.78,.015,.035,new T.MeshBasicMaterial({color:'#a48a59'}),[-3.06,3.79,-2.76],group,.004);shelfBulb.castShadow=false;
  const relightLights={phone:new T.PointLight('#ffc98f',0,2.3,2),books:new T.PointLight('#ffd4a0',0,3,2),sofa:new T.PointLight('#ffcf9b',0,3.5,2),photos:new T.PointLight('#ffe0b2',0,3,2),flowers:new T.PointLight('#ffd8ab',0,3,2),elephant:new T.PointLight('#ffe0b4',0,2.8,2)};
  relightLights.phone.position.set(-3.55,1.6,-.1);relightLights.books.position.set(-3.06,3.62,-2.3);relightLights.sofa.position.set(-.2,2,-1);relightLights.photos.position.set(-1.1,1.7,2.25);relightLights.flowers.position.set(4.2,1.65,.2);relightLights.elephant.position.set(2.5,1.4,.65);Object.values(relightLights).forEach(l=>group.add(l));
  return {group,drawer,drawerStar,interactive,toppers,wallMaterials,art,exterior:{night,building,windowGlow,glass,moonFace,view,clip},pictureBulb,relightLights,phoneIndicator,shelfBulb,teaLight,teaFlame,coffee,chair,savedPrint,books,bookOrigins,bookDust,pillow,pillow2,flowers,mug,steam,tvButtons,tvPlay,tvPause,frameTurner,frameMat,frameBackMat,phone,handset,dial,dialMount,calendar,calendarPivot,calendarMat,calendarLeaf,calendarBack,calendarBase,tvMat,floorLight,deskLight,candleLight,shadeMat,flames,letter,mesh,box,ball,tube,mat,tag,textTexture,updatePhoto,ownedTextures,
    setFrame(index:number){updatePhoto(frameMat,[0,1][index],.82/1.1);const text=['树下歪歪合影','挤在同一个沙发'][index];const old=frameBackMat.map;frameBackMat.map=textTexture([text.slice(0,12),text.slice(12),'','小屋 ♡'],512,700,'#dac79b','#483424',38);old?.dispose();},
    setCalendar(actual:boolean){calendarPivot.rotation.x=actual?-Math.PI:0;},
    dispose(){disposed=true;group.traverse(obj=>{if(obj instanceof T.Mesh||obj instanceof T.Points||obj instanceof T.LineSegments){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>m.dispose());}});ownedTextures.forEach(t=>t.dispose());scene.remove(group);},
  };
}
export type RoomModel=ReturnType<typeof createRoomModel>;
