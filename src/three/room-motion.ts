export const ROOM_ORBIT={minAzimuth:-.27,maxAzimuth:.30,minPolar:1.02,maxPolar:1.35,minDistance:11.8,maxDistance:19.5} as const;
export function pageTurnPose(progress:number,fraction:number){
 const p=Math.max(0,Math.min(1,progress)),c=Math.max(0,(p-.35)/.65),curl=c*c*(3-2*c);let y=0,z=0;const steps=32,ds=fraction*.66/steps;
 for(let i=0;i<steps;i++){const s=fraction*(i+.5)/steps,bend=Math.PI*curl*Math.min(1,s*7);y-=Math.cos(bend)*ds;z+=Math.sin(bend)*ds;}
 return {y,z,angle:-Math.PI*p};
}

/** Two independent rhythms, including a second blink only for the window cat. */
export function catBlink(time:number,cat:number){
 const period=cat===0?6.73:9.17,phase=cat===0?1.6:4.2;
 const t=(time+phase)%period;
 const close=(at:number,width:number)=>Math.max(0,1-Math.abs(t-at)/(width/2));
 return 1-.94*Math.max(close(period-.5,cat===0?.3:.42),cat===1?close(period-.12,.19):0);
}
