import * as T from 'three';

type Corners = [number,number,number,number];
export function roundedOutline(width:number,height:number,radius:number|Corners):T.Shape{
  const [tl,tr,br,bl]=(Array.isArray(radius)?radius:[radius,radius,radius,radius]).map(r=>Math.min(r,width/2,height/2));
  const x=-width/2,y=-height/2,s=new T.Shape();
  s.moveTo(x+bl,y);s.lineTo(x+width-br,y);s.quadraticCurveTo(x+width,y,x+width,y+br);
  s.lineTo(x+width,y+height-tr);s.quadraticCurveTo(x+width,y+height,x+width-tr,y+height);
  s.lineTo(x+tl,y+height);s.quadraticCurveTo(x,y+height,x,y+height-tl);
  s.lineTo(x,y+bl);s.quadraticCurveTo(x,y,x+bl,y);s.closePath();return s;
}

/** A broad rounded outline, independent of a tabletop or wall's thin depth. */
export function roundedSurface(width:number,height:number,depth:number,radius:number|Corners,holes:{width:number;height:number;x:number;y:number;radius:number}[]=[]){
  const shape=roundedOutline(width,height,radius);
  for(const hole of holes){const path=roundedOutline(hole.width,hole.height,hole.radius);const points=path.getPoints(8).map(p=>new T.Vector2(p.x+hole.x,p.y+hole.y));shape.holes.push(new T.Path(points));}
  const bevel=Math.min(.025,depth*.16);
  const geometry=new T.ExtrudeGeometry(shape,{depth:depth-bevel*2,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.translate(0,0,-depth/2+bevel);return geometry;
}
