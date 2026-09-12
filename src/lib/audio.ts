import {audioMix,type AudioScene} from './audio-mix';
import {roomMusicTrack} from '../data/audio-profile';
import {RecordedRoomMusic} from './recorded-room-music';

export class RoomAudio {
 private context:AudioContext|null=null;private bus:GainNode|null=null;private musicBus:GainNode|null=null;
 private muted=false;private active=true;private inRoom=false;private speaking=false;private focus:AudioScene='room';
 private timer:ReturnType<typeof setInterval>|undefined;private intro:ReturnType<typeof setInterval>|undefined;
 private elapsed=0;private beat=0;private onTime:((n:number)=>void)|null=null;private onEnd:(()=>void)|null=null;
 private nodes=new Set<OscillatorNode>();private recording:RecordedRoomMusic;
 constructor(track:string|null=roomMusicTrack){this.recording=new RecordedRoomMusic(track,()=>this.updateMix());}
 prepare(){this.recording.prepare();}
 private unlock(){
  try{
   if(!this.context){
    const A=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;if(!A)return;
    this.context=new A();this.bus=this.context.createGain();this.bus.connect(this.context.destination);
    this.musicBus=this.context.createGain();this.musicBus.connect(this.bus);
   }
   void this.context.resume().catch(()=>{});this.volume();this.updateMix();
  }catch{}
 }
 private volume(){if(this.bus&&this.context)this.bus.gain.setTargetAtTime(this.muted||!this.active?0:.11,this.context.currentTime,.3);}
 private mix(){return audioMix(this.focus,this.inRoom,this.speaking,{bgm:.095,phone:.13});}
 private updateMix(){
  const mix=this.mix(),synth=this.active&&(mix.phone>0||(!this.recording.available&&mix.room>0));
  if(this.musicBus&&this.context)this.musicBus.gain.setTargetAtTime(synth?1:0,this.context.currentTime,.28);
  this.recording.setLevel(this.active?mix.room:0,!this.active);
 }
 private note(f:number,duration=.9,strength=.08,music=false){
  if(!this.context||!this.bus||this.muted||!this.active)return;
  const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(strength,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(music?this.musicBus!:this.bus);o.start(t);o.stop(t+duration+.03);this.nodes.add(o);
  o.onended=()=>{o.disconnect();g.disconnect();this.nodes.delete(o);};
 }
 private music(){
  clearInterval(this.timer);if(!this.active)return;
  this.timer=setInterval(()=>{
   const mix=this.mix();if(!this.active||(!mix.phone&&(!mix.room||this.recording.available)))return;
   const melody=mix.phone?[392,493.88,587.33,493.88,440,523.25,659.25,523.25]:[261.63,329.63,392,329.63,220,293.66,349.23,293.66,246.94,329.63,392,493.88,220,293.66,349.23,293.66];
   this.note(melody[this.beat%melody.length],1.7,.075,true);
   if(this.beat%4===0)this.note(melody[this.beat%melody.length]/2,2.8,.06,true);this.beat++;
  },650);
 }
 startRinging(){/* Sound begins with the first gesture. */}
 engage(){this.unlock();this.recording.unlock();if(this.inRoom&&!this.timer)this.music();}
 connect(muted:boolean,onEnded:()=>void,_onError:()=>void,onTime:(n:number)=>void){
  this.cancelIntro();this.inRoom=false;this.speaking=true;this.unlock();this.recording.unlock();this.setMuted(muted);this.updateMix();
  this.elapsed=0;this.onTime=onTime;this.onEnd=onEnded;this.note(523.25,1,.11);this.note(659.25,1.2,.06);this.startIntro();
 }
 private startIntro(){
  clearInterval(this.intro);this.intro=setInterval(()=>{if(!this.active)return;this.elapsed++;this.onTime?.(this.elapsed);if(this.elapsed===3)this.note(392,1.2,.08);if(this.elapsed>=7){const done=this.onEnd;this.cancelIntro();done?.();}},1000);
 }
 private cancelIntro(){clearInterval(this.intro);this.intro=undefined;this.speaking=false;this.onTime=null;this.onEnd=null;}
 enterRoom(){this.cancelIntro();this.prepare();this.inRoom=true;this.focus='room';this.updateMix();this.music();}
 setMuted(value:boolean){this.muted=value;this.volume();this.recording.setMuted(value);}
 setFocus(focus:AudioScene){if(this.focus===focus)return;this.focus=focus;this.updateMix();}
 phoneRing(){this.setFocus('phone');}
 stopPhone(){this.setFocus('room');}
 foley(kind:'pickup'|'paper'|'magic'|'shutter'|'switch'|'cat'){if(this.speaking)return;this.note({pickup:190,paper:85,magic:740,shutter:110,switch:140,cat:470}[kind],kind==='magic'?.65:.18,.16);}
 setVisible(value:boolean){
  this.active=value;this.volume();this.updateMix();
  if(!value){clearInterval(this.timer);this.timer=undefined;clearInterval(this.intro);void this.context?.suspend().catch(()=>{});}
  else{if(this.context)void this.context.resume().catch(()=>{});if(this.speaking)this.startIntro();else if(this.inRoom)this.music();}
 }
 dispose(){
  this.cancelIntro();clearInterval(this.timer);this.timer=undefined;this.recording.dispose();
  for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();
  if(this.context)void this.context.close().catch(()=>{});this.context=null;this.bus=null;this.musicBus=null;this.inRoom=false;
 }
}
export const roomAudio=new RoomAudio();
