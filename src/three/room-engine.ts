import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {createRenderBatches} from './render-batches';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRoomModel,HOME_VIEW,VIEWS,type FocusView } from './room-model';
import { createAnimals } from './room-animals';
import {updateWindowAperture} from './window-aperture';
import {createRoomSecrets} from './room-secrets';
import {createRoomWeather} from './room-weather';
import {atmospheres,type Atmosphere} from '../data/atmospheres';
import {relightLevels,cakeCandlesLit,topperDiscovered} from '../lib/room-journey';
import { ROOM_ORBIT,pageTurnPose } from './room-motion';
import { clockwiseDelta } from '../lib/scene-camera';
import {roomPixelRatio} from '../lib/render-quality';
import {roomFraming} from './room-framing';
export interface ThreeRoomState {
  drawerOpen:boolean;charmPulse:number;entered:boolean;blocked:boolean;focus:string|null;frameIndex:number;frameFlipped:boolean;tvIndex:number;tvPaused:boolean;calendarPage:number;
  selectedBook:string|null;atmosphere:Atmosphere;lighting:{floor:number;desk:number;window:number};sofaPet:number;windowPet:number;
  discovered:string[];elephantPet:number;count:number;ready:boolean;seen:boolean;ending:string;magic:boolean;viewReset:number;dialRequest:number;savedPhoto:string;
}
export interface ThreeRoomCallbacks {onObject:(id:string)=>void;onDial:()=>void;onHover:(text:string)=>void;onReady:()=>void;onError:(message:string)=>void}
export function mountRoom(container:HTMLDivElement,initial:ThreeRoomState,callbacks:ThreeRoomCallbacks){
  const scene=new T.Scene();
  const roomSurface=container.closest<HTMLElement>('.experience');
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.localClippingEnabled=true;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','可拖动旋转的三维记忆房间');renderer.domElement.setAttribute('role','img');container.appendChild(renderer.domElement);
  const camera=new T.PerspectiveCamera(40,1,.05,80);camera.position.set(...HOME_VIEW.position);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...HOME_VIEW.target);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=ROOM_ORBIT.minDistance;controls.maxDistance=ROOM_ORBIT.maxDistance;controls.minPolarAngle=ROOM_ORBIT.minPolar;controls.maxPolarAngle=ROOM_ORBIT.maxPolar;controls.minAzimuthAngle=ROOM_ORBIT.minAzimuth;controls.maxAzimuthAngle=ROOM_ORBIT.maxAzimuth;controls.rotateSpeed=.38;controls.zoomSpeed=.65;controls.update();
  const ambient=new T.HemisphereLight('#eadbc0','#40546a',1.05);scene.add(ambient);
  const key=new T.DirectionalLight('#ffe0b0',2.4);key.position.set(-3,7,5);key.castShadow=false;scene.add(key);
  const moon=new T.DirectionalLight('#9cbeff',1.2);moon.position.set(4.7,6.2,-8);moon.target.position.set(-1,.2,2.5);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-7;moon.shadow.camera.right=7;moon.shadow.camera.top=7;moon.shadow.camera.bottom=-7;moon.shadow.normalBias=.018;scene.add(moon,moon.target);
  const model=createRoomModel(scene),animals=createAnimals(model);
  model.group.updateMatrixWorld(true);
  // Tiny page edges and decorative stitches need no separate shadow geometry.
  const span=new T.Vector3(),center=new T.Vector3(),shadowShapes:T.BufferGeometry[]=[];
  model.group.traverse(obj=>{
    if(!(obj instanceof T.Mesh))return;
    obj.geometry.computeBoundingBox();obj.geometry.boundingBox?.getSize(span);
    if(obj.castShadow&&obj.userData.structural){
      // Preserve the actual window opening in the wall's shadow silhouette.
      shadowShapes.push((obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone()).applyMatrix4(obj.matrixWorld));
    }else if(obj.castShadow&&obj.geometry instanceof T.BoxGeometry&&Math.min(span.x,span.y,span.z)>.045&&Math.max(span.x,span.y,span.z)>.16){
      obj.geometry.boundingBox!.getCenter(center);shadowShapes.push(new T.BoxGeometry(span.x,span.y,span.z).toNonIndexed().translate(center.x,center.y,center.z).applyMatrix4(obj.matrixWorld));
    }
    obj.castShadow=false;
  });
  // Architecture casts one inexpensive sunlight pass; fine details use contact shading.
  const shadowGeometry=mergeGeometries(shadowShapes,false)!;shadowShapes.forEach(g=>g.dispose());
  const shadowMaterial=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
  const shadowProxy=new T.Mesh(shadowGeometry,shadowMaterial);shadowProxy.castShadow=true;scene.add(shadowProxy);
  const staticBatches=new Map<string,{material:T.Material;parts:T.Mesh[]}>();
  model.group.traverse(obj=>{
    if(!(obj instanceof T.Mesh)||Array.isArray(obj.material))return;
    let parent:T.Object3D|null=obj;while(parent){if(parent.userData.action)return;parent=parent.parent;}
    const key=obj.material.uuid+':'+obj.castShadow;const batch=staticBatches.get(key)??{material:obj.material,parts:[] as T.Mesh[]};batch.parts.push(obj);staticBatches.set(key,batch);
  });
  for(const {material,parts} of staticBatches.values()){if(parts.length<2)continue;
    const geometries=parts.map(part=>(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrixWorld));
    const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
    const mesh=new T.Mesh(merged,material);mesh.castShadow=parts[0].castShadow;mesh.receiveShadow=true;model.group.add(mesh);
    for(const part of parts){part.removeFromParent();part.geometry.dispose();}
  }
  const protectedMeshes=new Set<T.Object3D>([...model.flames,model.pillow,model.pillow2,model.calendarLeaf,model.calendarBack,model.teaFlame]);
  for(const plant of model.flowers)for(const flower of plant.blossoms)for(const petal of flower.children)protectedMeshes.add(petal);
  function mergeSiblings(parent:T.Object3D){
    for(const child of [...parent.children])if(!(child instanceof T.Mesh))mergeSiblings(child);
    const buckets=new Map<string,{material:T.Material;parts:T.Mesh[]}>();
    for(const child of parent.children){if(!(child instanceof T.Mesh)||child instanceof T.InstancedMesh||Array.isArray(child.material)||child.userData.action||child.userData.dynamic||protectedMeshes.has(child))continue;const key=child.material.uuid+':'+child.castShadow;const a=buckets.get(key)||{material:child.material,parts:[] as T.Mesh[]};a.parts.push(child);buckets.set(key,a);}
    for(const {material,parts} of buckets.values()){if(parts.length<2)continue;const shapes=parts.map(part=>{part.updateMatrix();return(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix);});const geometry=mergeGeometries(shapes,false);shapes.forEach(g=>g.dispose());if(!geometry)continue;const combined=new T.Mesh(geometry,material);combined.castShadow=parts[0].castShadow;combined.receiveShadow=true;parent.add(combined);parts.forEach(part=>{part.removeFromParent();part.geometry.dispose();});}
  }
  mergeSiblings(model.group);
  const weather=createRoomWeather(model),secrets=createRoomSecrets(model);const batches=createRenderBatches(model.group,scene);
  const counts=new Map<string,{meshes:number;triangles:number}>();model.group.traverse(o=>{if(o instanceof T.Mesh){const m=Array.isArray(o.material)?o.material[0]:o.material;const key=m.type+":"+((m as T.MeshStandardMaterial).map?"texture":"solid");const a=counts.get(key)||{meshes:0,triangles:0};a.meshes++;a.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;counts.set(key,a);}});container.dataset.geometry=JSON.stringify([...counts]);let relightStart=0;const sunColor=new T.Color();
  let state=initial,disposed=false,frame=0,last=0,time=0,lastRender=0,hover='';
  let quality=0,sampleFrames=0,totalFrameTime=0,warmupFrames=0,fastWindows=0,slowWindows=0,contextLost=false;
  const sunPosition=new T.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();raycaster.layers.enable(2);
  const roomView={position:camera.position.clone(),target:controls.target.clone()};
  let tween:{start:number;from:T.Vector3;to:T.Vector3;targetFrom:T.Vector3;targetTo:T.Vector3}|null=null;
  let activeFocus:string|null=null,dialDrag:{angle:number;rotation:number}|null=null,dialAnimation:{start:number;rotation:number}|null=null;
  let lastCalendar=-1;let calendarStart=-10,calendarFrom=initial.calendarPage,calendarTo=initial.calendarPage,calendarProgress=initial.calendarPage;let mugUntil=-1,flowersUntil=-1,cushionUntil=-1;
  const down={x:0,y:0,id:'',at:0};
  const pointers=new Set<number>();let pinching=false;
  function configureZoom(){
    const view=roomFraming(container.clientWidth,container.clientHeight,!!activeFocus);
    if(activeFocus&&VIEWS[activeFocus]){
      const preset=VIEWS[activeFocus],d=new T.Vector3(...preset.position).distanceTo(new T.Vector3(...preset.target));
      controls.minDistance=d*view.focusMin;controls.maxDistance=d*view.focusMax;
    }else{controls.minDistance=view.minDistance??ROOM_ORBIT.minDistance;controls.maxDistance=ROOM_ORBIT.maxDistance;}
  }
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    renderer.setPixelRatio(roomPixelRatio(w,h,window.devicePixelRatio,!!activeFocus,quality===1));renderer.setSize(w,h);camera.aspect=w/h;
    const framing=roomFraming(w,h,!!activeFocus);camera.fov=framing.fov;
    // The oblique room extends farther to the left: leave equal breathing room on phones.
    if(framing.offsetX)camera.setViewOffset(w,h,framing.offsetX,0,w,h);else camera.clearViewOffset();
    camera.updateProjectionMatrix();if(!tween)configureZoom();
  }
  resize();const observer=new ResizeObserver(resize);observer.observe(container);
  function startView(view:FocusView){controls.minDistance=0;controls.maxDistance=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.enableRotate=false;tween={start:performance.now(),from:camera.position.clone(),to:new T.Vector3(...view.position),targetFrom:controls.target.clone(),targetTo:new T.Vector3(...view.target)};}
  function hitAt(clientX:number,clientY:number){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(model.group,true);
    for(const h of hits){let visible=true,p:T.Object3D|null=h.object;while(p){if(!p.visible)visible=false;p=p.parent;}if(!visible)continue;
      p=h.object;while(p){if(p.userData.action)return {id:p.userData.action as string,label:p.userData.label as string,object:p};p=p.parent;}
      if(h.object instanceof T.Mesh){const m=h.object.material;if(!Array.isArray(m)&&m.transparent&&m.opacity<.3)continue;return null;}
    }return null;
  }
  function hit(event:PointerEvent){return hitAt(event.clientX,event.clientY);}

  function dialAngle(event:PointerEvent){const center=model.dialMount.getWorldPosition(new T.Vector3()).project(camera),rect=renderer.domElement.getBoundingClientRect();const cx=rect.left+(center.x+1)/2*rect.width,cy=rect.top+(1-center.y)/2*rect.height;return Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI;}
  function onDown(event:PointerEvent){
    if(!pointers.size)pinching=false;pointers.add(event.pointerId);down.at=0;
    if(pointers.size>1){pinching=true;dialDrag=null;model.dial.rotation.z=0;controls.enabled=!state.blocked;}
    if(state.blocked||tween||pinching)return;const h=hit(event);Object.assign(down,{x:event.clientX,y:event.clientY,id:h?.id??'',at:performance.now()});
    if(state.focus==='calls'&&(h?.id==='dial'||h?.id==='calls')&&!dialAnimation){dialDrag={angle:dialAngle(event),rotation:0};renderer.domElement.setPointerCapture(event.pointerId);}
  }
  function onMove(event:PointerEvent){if(state.blocked)return;
    if(dialDrag){const angle=dialAngle(event);dialDrag.rotation=Math.max(0,Math.min(300,dialDrag.rotation+clockwiseDelta(dialDrag.angle,angle)));dialDrag.angle=angle;model.dial.rotation.z=-dialDrag.rotation*Math.PI/180;return;}
    const h=hit(event);const label=h?.label??'';renderer.domElement.style.cursor=h?'pointer':'grab';if(label!==hover){hover=label;callbacks.onHover(label);}
  }
  function onUp(event:PointerEvent){
    pointers.delete(event.pointerId);if(pinching){if(!pointers.size)pinching=false;return;}if(state.blocked)return;
    if(dialDrag){dialAnimation={start:performance.now(),rotation:Math.max(60,dialDrag.rotation)};dialDrag=null;controls.enabled=true;return;}
    if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.at>850)return;
    let h=hit(event);
    // Small touch-only forgiveness; every candidate is still checked for wall occlusion.
    if(!h&&!down.id&&event.pointerType==='touch')for(const [x,y] of [[0,-10],[0,10],[-10,0],[10,0]]){h=hitAt(event.clientX+x,event.clientY+y);if(h)break;}
    if(h&&(h.id===down.id||!down.id&&event.pointerType==='touch')){if(h.id==='dial'){callbacks.onObject('calls');}else{animals.pet(h.id,time);if(h.id==='mug'||h.id==='coffee')mugUntil=time+3;if(h.id==='tulips')flowersUntil=time+3;if(h.id==='cushion')cushionUntil=time+1.4;callbacks.onObject(h.id);}}
  }
  function cancel(){pointers.clear();pinching=false;down.at=0;dialDrag=null;model.dial.rotation.z=0;controls.enabled=!state.blocked;}
  function onWheel(){if(tween)controls.enabled=false;}
  renderer.domElement.addEventListener('pointerdown',onDown,true);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('wheel',onWheel,{passive:true});
  const tvControls=[...model.tvButtons].map(([id,obj])=>{const button=document.createElement('button');button.className='object-tv-control';button.style.display='none';button.setAttribute('aria-label',id==='tv-prev'?'上一张电视照片':id==='tv-next'?'下一张电视照片':'暂停电视轮播');button.addEventListener('click',()=>callbacks.onObject(id));container.appendChild(button);return {id,obj,button};});
  function onContextLost(event:Event){event.preventDefault();contextLost=true;cancelAnimationFrame(frame);callbacks.onError('画面暂时休息一下，切换轻量小屋继续逛。');}
  function onContextRestored(){if(!disposed)callbacks.onError('小屋已切换轻量模式，物件仍然可以探索。');}
  renderer.domElement.addEventListener('webglcontextrestored',onContextRestored);
  renderer.debug.onShaderError=()=>{contextLost=true;cancelAnimationFrame(frame);callbacks.onError('这台设备适合轻量小屋，故事都还在。');};
  renderer.domElement.addEventListener('webglcontextlost',onContextLost);
  function sync(next:ThreeRoomState){
    if(next.dialRequest!==state.dialRequest&&!dialAnimation)dialAnimation={start:performance.now(),rotation:180};
    if(next.savedPhoto!==state.savedPhoto){model.savedPrint.group.visible=!!next.savedPhoto;if(next.savedPhoto)model.updatePhoto(model.savedPrint.material,4,.53/.54,next.savedPhoto);}
    if(next.frameIndex!==state.frameIndex)model.setFrame(next.frameIndex);
    if(next.tvIndex!==state.tvIndex)model.updatePhoto(model.tvMat,next.tvIndex,1.28/1.04);
    if(next.calendarPage!==state.calendarPage){calendarFrom=calendarProgress;calendarTo=next.calendarPage;calendarStart=time;}
    if(next.elephantPet!==state.elephantPet)animals.pet('elephant',time);
    if(next.sofaPet!==state.sofaPet)animals.pet('cats',time);if(next.windowPet!==state.windowPet)animals.pet('window-cat',time);
    if(next.viewReset!==state.viewReset)startView(HOME_VIEW);
    if(next.ending==='relight'&&state.ending!=='relight')relightStart=performance.now();
    if(next.ending==='dark'&&state.ending!=='dark')startView(HOME_VIEW);
    state=next;
    controls.enabled=!state.blocked&&!dialDrag;
    const focused=state.ending==='wish'?'cake':state.focus;
    if(focused!==activeFocus){
      if(focused&&!activeFocus){roomView.position.copy(camera.position);roomView.target.copy(controls.target);}
      if(focused&&VIEWS[focused])startView(VIEWS[focused]);
      else if(!focused&&state.ending!=='dark')startView({position:roomView.position.toArray() as [number,number,number],target:roomView.target.toArray() as [number,number,number]});
      activeFocus=focused;resize();dialDrag=null;dialAnimation=null;model.dial.rotation.z=0;
    }
  }
  function tick(now:number){if(disposed||contextLost||document.visibilityState==='hidden')return;frame=requestAnimationFrame(tick);if(now-lastRender<(quality?40:32))return;lastRender=now;
    const dt=Math.min((now-last)/1000||.016,.05);last=now;if(!state.entered&&lastRender>1000)return;time+=dt;
    const workStart=performance.now();
    if(tween){const t=reduced.matches?1:Math.min(1,(now-tween.start)/1250),e=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,e);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,e);if(t===1){tween=null;controls.enabled=!state.blocked;
      configureZoom();
      if(activeFocus){controls.enableRotate=false;}
      else{controls.minPolarAngle=ROOM_ORBIT.minPolar;controls.maxPolarAngle=ROOM_ORBIT.maxPolar;controls.minAzimuthAngle=ROOM_ORBIT.minAzimuth;controls.maxAzimuthAngle=ROOM_ORBIT.maxAzimuth;controls.enableRotate=true;}
    }}
    controls.update();updateWindowAperture(model.exterior.clip,camera.position);
    const flip=state.frameFlipped?Math.PI:0;model.frameTurner.rotation.y=T.MathUtils.damp(model.frameTurner.rotation.y,flip,5,dt);
    model.bookDust.visible=state.focus==='books';model.bookDust.position.y=2.4+Math.sin(time*.7)*.06;model.bookDust.rotation.y=time*.06;
    model.tvPlay.visible=state.tvPaused;model.tvPause.visible=!state.tvPaused;
    if(time-calendarStart<1.45){const p=Math.min(1,(time-calendarStart)/1.45),e=p*p*(3-2*p);calendarProgress=calendarFrom+(calendarTo-calendarFrom)*e;}else calendarProgress=calendarTo;
    if(calendarProgress!==lastCalendar){
    model.calendarPivot.rotation.x=pageTurnPose(calendarProgress,0).angle;
    for(const leaf of [model.calendarLeaf,model.calendarBack]){const positions=leaf.geometry.attributes.position,uv=leaf.geometry.attributes.uv;for(let i=0;i<positions.count;i++){const v=1-uv.getY(i),pose=pageTurnPose(calendarProgress,v);positions.setY(i,pose.y);positions.setZ(i,pose.z);}positions.needsUpdate=true;leaf.geometry.computeVertexNormals();}
      lastCalendar=calendarProgress;
    }
    if(dialAnimation){const p=Math.min(1,(now-dialAnimation.start)/900);model.dial.rotation.z=-dialAnimation.rotation*Math.PI/180*(1-p)*(1-p);if(p>=1){dialAnimation=null;callbacks.onDial();}}
    model.handset.position.y=T.MathUtils.damp(model.handset.position.y,state.focus==='calls'?.56:.44,5,dt);
    const relighting=state.ending==='relight',dark=state.ending==='dark',wishing=state.ending==='wish';
    const lights=relightLevels((now-relightStart)/1000),global=dark?0:relighting?lights.room:wishing?.035:1;
    const preset=atmospheres[state.atmosphere],windowAmount=dark?0:relighting?lights.window*.16+lights.room*.84:wishing?.06:1;
    moon.castShadow=state.atmosphere==='sunny'||state.atmosphere==='sunset';
    shadowProxy.visible=moon.castShadow&&quality===0;
    const approach=(from:number,to:number)=>T.MathUtils.damp(from,to,2.8,dt);
    // The window is a light aperture: directional sunlight casts the real mullion shadows.
    moon.position.lerp(sunPosition.set(preset.sunPosition[0],preset.sunPosition[1],preset.sunPosition[2]),1-Math.exp(-dt*2));moon.color.lerp(sunColor.set(preset.sun),1-Math.exp(-dt*2));
    const darkNow=dark||relighting;
    moon.intensity=darkNow?preset.sunPower*windowAmount:approach(moon.intensity,preset.sunPower*windowAmount);
    ambient.intensity=wishing?.14:(preset.ambient+state.lighting.floor*.003)*global;
    key.intensity=wishing?.1:(preset.fill+state.lighting.floor*.017)*global;
    model.floorLight.intensity=state.lighting.floor*.43*global;model.deskLight.intensity=state.lighting.desk*.105*(relighting?lights.photos:global);
    model.shadeMat.emissiveIntensity=state.lighting.floor*.009*global;
    (model.pictureBulb.material as T.MeshBasicMaterial).color.setScalar((state.lighting.desk>0?.8:.06)*(relighting?lights.photos:global));
    (model.phoneIndicator.material as T.MeshBasicMaterial).color.setRGB(.7,.26,.055).multiplyScalar(dark?0:relighting?lights.phone:state.focus==='calls'?1:.12);
    (model.shelfBulb.material as T.MeshBasicMaterial).color.setRGB(.86,.67,.35).multiplyScalar(dark?0:relighting?lights.books:global*.4);
    const glowLevels={phone:lights.phone,books:lights.books,sofa:lights.sofa,photos:lights.photos,flowers:lights.flowers,elephant:lights.elephant};
    for(const name of Object.keys(model.relightLights) as (keyof typeof model.relightLights)[]){model.relightLights[name].intensity=relighting?glowLevels[name]*[5,8,5,4,4,5][Object.keys(model.relightLights).indexOf(name)]*(1-lights.room*.65):name==='books'?(state.focus==='books'?7:state.lighting.desk*.025)*global:0;}
    model.tvMat.color.setScalar(dark?0:relighting?lights.tv:wishing?.015:1);
    // Background color stays in display space, independent of the room's filmic lighting.
    roomSurface?.style.setProperty('--backdrop-visibility',String(dark?0:relighting?.02+lights.room*.98:wishing?.09:1));
    model.drawer.position.z=T.MathUtils.damp(model.drawer.position.z,state.drawerOpen?.58:0,reduced.matches?100:5,dt);
    secrets.update(time,dt,state.magic,state.charmPulse,state.drawerOpen,global,reduced.matches);
    weather.update(state.atmosphere,time,dt,windowAmount,reduced.matches);
    const burning=cakeCandlesLit(state.atmosphere,state.ending,state.ready,state.seen);
    for(const [i,flame] of model.flames.entries()){flame.visible=burning;flame.scale.y=1.8+Math.sin(time*8+i)*.25;}
    model.candleLight.intensity=burning?3.5+Math.sin(time*7)*.35:0;
    for(const topper of model.toppers){const found=topperDiscovered(topper.id,state.discovered),level=dark?0:relighting?lights.photos:wishing?.08:1;topper.material.emissiveIntensity=T.MathUtils.damp(topper.material.emissiveIntensity,found?(.55+Math.sin(time*1.1)*.055)*level:0,2.3,dt);}
    const teaOn=state.atmosphere==='candle'&&!dark&&!relighting&&!wishing;model.teaFlame.visible=teaOn;model.teaLight.intensity=teaOn?1.7+Math.sin(time*6)*.13:0;
    animals.update(time,dt,state.count,state.ready,state.seen,reduced.matches);model.letter.visible=state.seen&&state.ending!=='dark'&&state.ending!=='relight';
    model.steam.visible=time<mugUntil;model.mug.position.y=T.MathUtils.damp(model.mug.position.y,time<mugUntil?1.14:1.05,5,dt);model.steam.rotation.y=time*.3;
    model.coffee.rotation.y=time<mugUntil?Math.sin(time*2)*.035:0;model.pillow.scale.y=1+(time<cushionUntil?Math.sin((cushionUntil-time)*9)*.09:0);
    model.flowers.forEach((flower,i)=>{flower.blossoms.forEach((b,j)=>{b.rotation.z=Math.cos(j*2.4)*.13+Math.sin(time*2+j)*(time<flowersUntil?.14:.015);});});
    for(const {id,obj,button} of tvControls){const shown=state.focus==='tv'&&!state.blocked&&!tween;button.style.display=shown?'block':'none';if(shown){const p=obj.getWorldPosition(new T.Vector3()).project(camera);button.style.left=`${(p.x+1)*container.clientWidth/2}px`;button.style.top=`${(1-p.y)*container.clientHeight/2}px`;button.setAttribute('aria-label',id==='tv-pause'?(state.tvPaused?'继续电视轮播':'暂停电视轮播'):id==='tv-prev'?'上一张电视照片':'下一张电视照片');}}
    // Room orbit stays in front. Focus cameras cannot orbit through walls.

    // Solid walls keep their depth and shadows at every allowed camera angle.
    batches.update();renderer.render(scene,camera);
    // Measure our own work, not time spent hidden, throttled, or compiling the first frame.
    if(++warmupFrames>20){sampleFrames++;totalFrameTime+=performance.now()-workStart;
      if(sampleFrames>=75){const mean=totalFrameTime/sampleFrames;container.dataset.frameMs=mean.toFixed(1);
        if(mean>32&&quality===0){quality=1;fastWindows=0;renderer.shadowMap.enabled=false;resize();}
        else if(quality===1&&mean>65){if(++slowWindows>=2){callbacks.onError('换成轻量小屋，继续摸猫、翻照片和许愿。');cancelAnimationFrame(frame);return;}}
        else if(quality===1&&mean<16){if(++fastWindows>=3){quality=0;fastWindows=0;renderer.shadowMap.enabled=true;resize();}}
        else{fastWindows=0;slowWindows=0;}
        sampleFrames=0;totalFrameTime=0;
      }
    }
    container.dataset.renderCalls=String(renderer.info.render.calls);container.dataset.triangles=String(renderer.info.render.triangles);container.dataset.quality=String(quality);container.dataset.buffer=`${renderer.domElement.width}×${renderer.domElement.height}`;
  }
  model.setFrame(initial.frameIndex);model.setCalendar(!!initial.calendarPage);model.updatePhoto(model.tvMat,initial.tvIndex,1.28/1.04);
  if(initial.savedPhoto){model.savedPrint.group.visible=true;model.updatePhoto(model.savedPrint.material,4,.53/.54,initial.savedPhoto);}
  function visibility(){cancelAnimationFrame(frame);last=0;lastRender=0;sampleFrames=0;totalFrameTime=0;if(document.visibilityState!=='hidden'&&!disposed&&!contextLost)frame=requestAnimationFrame(tick);}
  document.addEventListener('visibilitychange',visibility);
  frame=requestAnimationFrame(tick);callbacks.onReady();
  return {sync,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',onContextLost);renderer.domElement.removeEventListener('webglcontextrestored',onContextRestored);controls.dispose();batches.dispose();shadowGeometry.dispose();shadowMaterial.dispose();shadowProxy.removeFromParent();model.dispose();renderer.dispose();renderer.domElement.remove();tvControls.forEach(c=>c.button.remove());},reset(){startView(HOME_VIEW);}};
}
