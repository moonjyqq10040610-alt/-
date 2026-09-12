'use client';
import {useRef,useEffect} from 'react';
import {ArrowLeft,ArrowRight,RotateCcw} from 'lucide-react';
import {callFragments} from '../data/memories';
import {shelfBooks,type ShelfBook} from '../data/books';
import type {FocusKind} from '../data/room';
const titles: Record<FocusKind,string> = { frames:'Those days, with you.',books:'小屋书架',calls:'喂，小屋在听',calendar:'今天与明天',tv:'All the little things.',window:'Outside, the world goes on.',drawer:'电话柜里的小秘密' };
interface FocusProps {
  kind: FocusKind; onClose: () => void; frameIndex: number; frameFlipped: boolean; onFrameMove: (n:number)=>void; onFrameFlip:()=>void;
  selectedBook: ShelfBook|null; onBookSelect:(id:string)=>void; onDial:()=>void; onBookMemory: (magic:boolean)=>void; callIndex:number;
  calendarPage:number; onCalendarFlip:()=>void; tvIndex:number; tvPaused:boolean; onTVPause:()=>void; onTVNext:()=>void;
  onWindowCat:()=>void; drawerOpen:boolean;onDrawerToggle:()=>void;onDrawerMagic:()=>void;
}
export function FocusControls(p: FocusProps) {
  const close=useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus({preventScroll:true}); }, [p.kind]);
  const bare=['tv','window','books'].includes(p.kind);
  return <section className={`focus-ui focus-${p.kind}`} aria-label={titles[p.kind]}>
    <header className="focus-heading"><button ref={close} onClick={p.onClose} aria-label="回到房间"><ArrowLeft size={18}/><span>返回</span></button></header>
    {!bare&&<div className={`focus-detail ${p.kind==='books'?'book-detail-quiet':''}`}>
      {p.kind==='frames'&&<><p className="focus-note">{p.frameIndex===0?'树下歪歪合影':'挤在同一个沙发'}</p><div className="focus-actions"><button onClick={()=>p.onFrameMove(-1)} aria-label="上一张相框照片"><ArrowLeft size={18}/></button><button onClick={p.onFrameFlip} aria-label={p.frameFlipped?'看照片':'翻到背面'}><RotateCcw size={17}/></button><button onClick={()=>p.onFrameMove(1)} aria-label="下一张相框照片"><ArrowRight size={18}/></button></div></>}
      {p.kind==='books'&&<div className="book-pick-controls"><select className="book-select" aria-label="选择一本书" value={p.selectedBook?.id??''} onChange={e=>p.onBookSelect(e.target.value)}><option value="">书架</option>{shelfBooks.map(book=><option key={book.id} value={book.id}>{book.title}</option>)}</select>{p.selectedBook&&<button className="focus-text-action" onClick={()=>p.onBookSelect('')}>放回去</button>}</div>}
      {p.kind==='calls'&&<>{p.callIndex<0?<h2>喂？ ☎</h2>:<div className="dial-message" key={p.callIndex} role="status"><time>{callFragments[p.callIndex].time}</time><h2>{callFragments[p.callIndex].line}</h2>{callFragments[p.callIndex].aside&&<p>{callFragments[p.callIndex].aside}</p>}</div>}<button className="focus-text-action" onClick={p.onDial} aria-label="拨一下"><RotateCcw size={16}/></button></>}
      {p.kind==='drawer'&&<div className="drawer-actions"><button onClick={p.onDrawerToggle} aria-label={p.drawerOpen?'合上抽屉':'打开抽屉'}>{p.drawerOpen?'合上':'拉开'}</button>{p.drawerOpen&&<button onClick={p.onDrawerMagic}>碰一下星星 ✧</button>}</div>}
      {p.kind==='calendar'&&<button className="focus-text-action" onClick={p.onCalendarFlip} aria-label={p.calendarPage?'翻回今天':'翻到明天'}><RotateCcw size={19}/></button>}
    </div>}
  </section>;
}
