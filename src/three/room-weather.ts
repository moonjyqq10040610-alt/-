import * as T from 'three';
import {createWindowNeighborhood} from './window-neighborhood';
import {atmospheres,type Atmosphere} from '../data/atmospheres';
import type {RoomModel} from './room-model';
export function createRoomWeather(model:RoomModel){
 const {exterior:e,group}=model;const neighborhood=createWindowNeighborhood(model);const textures=new Map<Atmosphere,T.Texture>();
 for(const id of Object.keys(atmospheres) as Atmosphere[]){const preset=atmospheres[id],canvas=document.createElement('canvas');canvas.width=32;canvas.height=256;const c=canvas.getContext('2d')!,gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,preset.sky[0]);gradient.addColorStop(1,preset.sky[1]);c.fillStyle=gradient;c.fillRect(0,0,32,256);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.set(id,texture);model.ownedTextures.add(texture);}
 const cloudGroup=new T.Group();group.add(cloudGroup);const cloudMat=new T.MeshBasicMaterial({color:'#e0dfd5',transparent:true,opacity:.5,depthWrite:false,clippingPlanes:e.clip});
 for(let i=0;i<7;i++){const cloud=new T.Mesh(new T.SphereGeometry(.23,16,10),cloudMat);cloud.scale.set(1.3,.27,.3);cloud.position.set(1.2+i*.4,3.56+(i%2)*.12,-4.62);cloudGroup.add(cloud);}
 const rainGeometry=new T.BufferGeometry(),rainPositions=new Float32Array(150*6);rainGeometry.setAttribute('position',new T.BufferAttribute(rainPositions,3));
 const rainMaterial=new T.LineBasicMaterial({color:'#c4d9e0',transparent:true,opacity:.55,clippingPlanes:e.clip,depthWrite:false});const rain=new T.LineSegments(rainGeometry,rainMaterial);group.add(rain);
 const snowGeometry=new T.BufferGeometry(),snowPositions=new Float32Array(110*3);snowGeometry.setAttribute('position',new T.BufferAttribute(snowPositions,3));
 const dot=document.createElement('canvas');dot.width=32;dot.height=32;const dc=dot.getContext('2d')!;const dg=dc.createRadialGradient(16,16,0,16,16,16);dg.addColorStop(0,'#fff');dg.addColorStop(.5,'#ffffffed');dg.addColorStop(1,'#fff0');dc.fillStyle=dg;dc.fillRect(0,0,32,32);const dotTexture=new T.CanvasTexture(dot);model.ownedTextures.add(dotTexture);
 const snowMaterial=new T.PointsMaterial({color:'#f0f5ed',size:.08,map:dotTexture,transparent:true,opacity:.85,clippingPlanes:e.clip,depthWrite:false});const snow=new T.Points(snowGeometry,snowMaterial);group.add(snow);
 let last:Atmosphere|undefined;const tint=new T.Color(),buildingTarget=new T.Color(),windowTarget=new T.Color();
 function update(id:Atmosphere,time:number,dt:number,visibility=1,reduced=false){
  neighborhood.update(id,time,dt,visibility,reduced);
  const preset=atmospheres[id];if(last!==id){e.night.map=textures.get(id)!;e.night.needsUpdate=true;buildingTarget.set(preset.building);windowTarget.set(preset.moon?'#d5b88c':'#526b7a');e.moonFace.position.set(preset.moon?3.55:id==='sunset'?3.7:3.3,preset.moon?3.57:id==='sunset'?2.87:3.7,-4.5);e.moonFace.scale.setScalar(preset.moon?1:1.18);e.moonFace.scale.z=.15;(e.moonFace.material as T.MeshBasicMaterial).color.set(preset.moon?'#d6d0b0':'#ffe4ad');last=id;}
  const blend=1-Math.exp(-dt*2);e.building.color.lerp(buildingTarget,blend);e.building.emissive.copy(buildingTarget);e.building.emissiveIntensity=(preset.moon?.025:.38)*visibility;e.windowGlow.color.lerp(windowTarget,blend);e.windowGlow.color.copy(windowTarget).multiplyScalar(visibility);e.night.color.setScalar(visibility);e.moonFace.visible=(preset.moon||id==='sunny'||id==='sunset')&&visibility>.01;(e.moonFace.material as T.MeshBasicMaterial).color.lerp(tint.set(preset.moon?'#d6d0b0':'#ffe4ad').multiplyScalar(visibility),blend);
  e.glass.material.opacity=.055;(e.glass.material as T.MeshPhysicalMaterial).color.set(preset.sun);cloudMat.color.set(id==='rain'?'#9daeb9':'#e0dfd5');cloudMat.opacity=preset.clouds*visibility;cloudGroup.position.x=reduced?0:Math.sin(time*.04)*.15;
  rain.visible=id==='rain'&&visibility>.01;snow.visible=id==='snow'&&visibility>.01;rainMaterial.opacity=.55*visibility;snowMaterial.opacity=.85*visibility;
  const motion=reduced?0:time;
  if(rain.visible){for(let i=0;i<150;i++){const k=i*6,x=.9+((i*.731)%3.2),y=1.85+((i*.173-motion*1.8)%2.2+2.2)%2.2,z=-3.68-(i%7)*.1;rainPositions.set([x,y,z,x-.025,y+.12,z],k);}rainGeometry.attributes.position.needsUpdate=true;}
  if(snow.visible){for(let i=0;i<110;i++){const k=i*3;snowPositions[k]=.9+((i*.619+Math.sin(motion*.45+i)*.09)%3.2+3.2)%3.2;snowPositions[k+1]=1.85+((i*.137-motion*.19)%2.2+2.2)%2.2;snowPositions[k+2]=-3.7-(i%9)*.085;}snowGeometry.attributes.position.needsUpdate=true;}
 }
 return {update};
}
