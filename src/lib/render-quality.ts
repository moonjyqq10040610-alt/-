/** Keep close-ups sharp without exceeding the mobile drawing-buffer budget. */
export function roomPixelRatio(width:number,height:number,deviceRatio:number,focused:boolean,lowQuality:boolean){
  const pixels=Math.max(1,width*height);
  const budget=lowQuality?1000000:2000000;
  const limit=lowQuality?1.25:focused?2:1.5;
  return Math.min(limit,Math.max(1,deviceRatio||1),Math.sqrt(budget/pixels));
}
