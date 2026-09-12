'use client';
import {useEffect,useRef,useState} from 'react';
import type {ThreeRoomState,ThreeRoomCallbacks} from '../three/room-engine';
import {memories,photo} from '../data/memories';
import {shelfBooks} from '../data/books';
const shortcuts:[string,string,string,number?][]=[['frames','相框','🖼️',1],['books','书架','📚'],['calls','旧电话','☎️'],['tv','电视','📺',3],['together','合照册','📓',4],['portraits','拍立得','🎞️',5],['cats','摸摸猫','🐈',9],['elephant','小象','🐘'],['calendar','翻页台历','📅'],['drawer','抽屉','🗃️'],['wall-charm','小星星','✨'],['cake','许愿蛋糕','🎂',12],['camera','拍新照片','📷'],['lamp','落地灯','💡'],['window','窗外','🪟']];
export function Room3D({state,onObject,onDial}:{state:ThreeRoomState;onObject:(id:string)=>void;onDial:()=>void}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<ReturnType<typeof import('../three/room-engine').mountRoom>|null>(null);
 const latest=useRef({state,onObject,onDial});latest.current={state,onObject,onDial};
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[hover,setHover]=useState('');
 useEffect(()=>{let cancelled=false;
  void import('../three/room-engine').then(async({mountRoom})=>{
   if(document.fonts?.load)await document.fonts.load('18px "Room Hand"').catch(()=>{});
   if(cancelled||!host.current)return;
   const fail=(message:string)=>{if(cancelled)return;setError(message);setTimeout(()=>{engine.current?.dispose();engine.current=null;},0);};
   const callbacks:ThreeRoomCallbacks={onObject:id=>latest.current.onObject(id),onDial:()=>latest.current.onDial(),onHover:setHover,onReady:()=>setReady(true),onError:fail};
   try{engine.current=mountRoom(host.current,latest.current.state,callbacks);engine.current.sync(latest.current.state);}catch{fail('这台设备更适合轻量小屋。物件和小故事都在这里。');}
  }).catch(()=>setError('房间暂时切换为轻量模式，仍然可以继续探索。'));
  return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>engine.current?.sync(state),[state]);
 const focused=state.focus;
 return <><div ref={host} className="room-three-canvas" inert={!state.entered||state.blocked}/>
 {state.entered&&!ready&&!error&&<p className="three-loading" role="status">小屋正在亮灯。</p>}
 {state.entered&&error&&<section className="room-fallback" aria-label="轻量小屋" inert={state.blocked}><p className="fallback-note">{error}</p>
 {!focused?<div className="fallback-grid">{shortcuts.map(([id,label,symbol,index])=><button key={id} onClick={()=>onObject(id)}>{index?<img src={photo(index).asset} alt=""/>:<span className="fallback-symbol">{symbol}</span>}{label}</button>)}</div>:focused==='books'?<div className="fallback-books">{shelfBooks.map(book=><p key={book.id}>{book.title}<small> · {book.author}</small></p>)}</div>:focused==='frames'?<img src={photo(state.frameIndex+1).asset} alt={photo(state.frameIndex+1).alt}/>:focused==='tv'?<><img src={memories[state.tvIndex].asset} alt={memories[state.tvIndex].alt}/><div className="object-controls"><button onClick={()=>onObject('tv-prev')}>上一张</button><button onClick={()=>onObject('tv-pause')}>{state.tvPaused?'播放':'暂停'}</button><button onClick={()=>onObject('tv-next')}>下一张</button></div></>:focused==='calendar'?<p className="fallback-symbol">{state.calendarPage?'明天 · 02':'今天 · 01'}</p>:focused==='calls'?<button className="fallback-symbol" onClick={onDial} aria-label="拨动电话">☎️</button>:focused==='window'?<p>窗边很安静。猫把尾巴卷成了一个问号。</p>:<p>抽屉里藏着一颗小星星。 ✨</p>}
 </section>}
 {state.entered&&ready&&!error&&!state.blocked&&!state.focus&&<p className="three-hover" aria-live="polite">{hover||<><span className="desktop-room-hint">拖动看看 · 点击探索</span><span className="mobile-room-hint">双指缩放 · 点击探索</span></>}</p>}
 </>;
}
