export function roomFraming(width:number,height:number,focused:boolean){
 const aspect=width/Math.max(1,height),portrait=aspect<.8,mobile=width<=650;
 const factor=portrait?(focused?.84:1.15):.95;
 return {
  fov:2*Math.atan(Math.tan(Math.PI/9)*Math.max(1,factor/aspect))*180/Math.PI,
  offsetX:portrait&&!focused?-width*.05:0,
  minDistance:mobile?8.2:null,
  focusMin:mobile?.55:.88,
  focusMax:mobile?1.4:1.16,
 };
}
