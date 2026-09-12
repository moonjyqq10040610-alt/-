/** A gesture-unlocked loop that preserves its place across calls and backgrounding. */
export class RecordedRoomMusic {
 private audio:HTMLAudioElement|null=null;
 private unlocked=false;private failed=false;private pending=false;
 private desired=0;private target=0;private muted=false;private fade=0;
 constructor(private source:string|null,private onUnavailable:()=>void){}
 get available(){return !!this.source&&!this.failed;}
 prepare(){
  if(this.audio||!this.available||typeof document==='undefined')return;
  const audio=new Audio(this.source!);this.audio=audio;
  audio.loop=true;audio.preload='none';audio.volume=0;audio.muted=this.muted;
  audio.hidden=true;audio.setAttribute('data-room-bgm','original');document.body.appendChild(audio);
  audio.onerror=()=>this.fail();
 }
 private fail(){
  if(this.failed)return;this.failed=true;cancelAnimationFrame(this.fade);
  this.audio?.pause();this.onUnavailable();
 }
 unlock(){this.unlocked=true;this.prepare();this.sync();}
 setMuted(muted:boolean){this.muted=muted;if(this.audio)this.audio.muted=muted;}
 setLevel(level:number,immediate=false){
  this.desired=level;
  if(immediate){cancelAnimationFrame(this.fade);this.target=0;if(this.audio){this.audio.volume=0;this.audio.pause();}return;}
  this.sync();
 }
 private sync(){
  const audio=this.audio;if(!audio||!this.unlocked||!this.available)return;
  if(this.desired>0&&audio.paused&&!this.pending){
   this.pending=true;
   void audio.play().then(()=>{this.pending=false;}).catch((error:Error)=>{
    this.pending=false;
    if(this.audio===audio&&error.name!=='NotAllowedError'&&error.name!=='AbortError')this.fail();
   });
  }
  // Ordinary prop clicks must not restart either the track or its fade.
  if(this.target===this.desired)return;
  cancelAnimationFrame(this.fade);this.target=this.desired;
  const from=audio.volume,to=this.target,start=performance.now();
  const step=(now:number)=>{
   if(this.audio!==audio)return;
   const p=Math.min(1,(now-start)/850),ease=p*p*(3-2*p);
   audio.volume=Math.max(0,Math.min(1,from+(to-from)*ease));
   if(p<1)this.fade=requestAnimationFrame(step);else if(to===0)audio.pause();
  };
  this.fade=requestAnimationFrame(step);
 }
 dispose(){
  cancelAnimationFrame(this.fade);
  const audio=this.audio;this.audio=null;
  if(audio){audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();audio.remove();}
  this.unlocked=false;this.pending=false;this.target=0;this.desired=0;this.failed=false;
 }
}
