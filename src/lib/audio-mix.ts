export type AudioScene='room'|'phone'|'ending'|'relight';
export function audioMix(scene:AudioScene,inRoom:boolean,speaking:boolean,levels:{bgm:number;phone:number}){
 if(!inRoom||speaking||scene==='ending')return {room:0,phone:0};
 return scene==='phone'?{room:0,phone:levels.phone}:{room:scene==='relight'?levels.bgm*.7:levels.bgm,phone:0};
}
