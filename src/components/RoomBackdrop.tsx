import type {CSSProperties} from 'react';
import {atmospheres,type Atmosphere} from '../data/atmospheres';

export function RoomBackdrop({value}:{value:Atmosphere}){
 return <div className="room-backdrop" aria-hidden="true">
  {(Object.keys(atmospheres) as Atmosphere[]).map(id=>{
   const palette=atmospheres[id];
   return <div key={id} className={`backdrop-layer ${id===value?'is-active':''}`} style={{'--backdrop-edge':palette.backdrop,'--backdrop-glow':palette.backdropGlow} as CSSProperties}/>;
  })}
 </div>;
}
