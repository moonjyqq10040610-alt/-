import {Plane,Vector3} from 'three';
const corners=[new Vector3(.76,1.84,-3.5),new Vector3(4.14,1.84,-3.5),new Vector3(4.14,4,-3.5),new Vector3(.76,4,-3.5)];
const inside=new Vector3(2.45,2.92,-3.5);
/** Exterior scenery is masked by the real opening, rather than a flat world-space crop. */
export function updateWindowAperture(planes:Plane[],camera:Vector3){
 for(let i=0;i<4;i++){
  planes[i].setFromCoplanarPoints(camera,corners[i],corners[(i+1)%4]);
  if(planes[i].distanceToPoint(inside)<0)planes[i].negate();
 }
}
