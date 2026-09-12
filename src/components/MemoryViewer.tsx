'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { albums, episodeTitles, photo, type MemoryKind } from '../data/memories';
import { roomAudio } from '../lib/audio';

export function MemoryViewer({ kind, onClose, onMagic }: { kind: MemoryKind | null; onClose: () => void; onMagic: () => void }) {
  return <Dialog open={!!kind} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={`memory-dialog memory-${kind ?? 'closed'}`} showCloseButton={false}>
      {kind && <>
        <button className="close-object" onClick={onClose} aria-label="放回房间"><X size={21} /></button>
        <DialogTitle className="memory-episode">{episodeTitles[kind]}</DialogTitle>
        <DialogDescription className="sr-only">房间里的一个记忆。按 Escape 或关闭按钮放回原处。</DialogDescription>
        <div className="memory-content" key={kind}>
          {kind === 'sunny' ? <MarchMemory /> : kind === 'magic' ? <MagicMemory onMagic={() => { onClose(); onMagic(); }} /> : <PolaroidAlbum kind={kind} />}
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}

function PolaroidAlbum({ kind }: { kind: MemoryKind }) {
  const ids = albums[kind] ?? albums.film!;
  const [index, setIndex] = useState(0), [flipped, setFlipped] = useState(false);
  const swipe = useRef(0);
  const memory = photo(ids[index]);
  function move(direction: number) { setFlipped(false); setIndex(i => (i + direction + ids.length) % ids.length); roomAudio.foley('paper'); }
  function flip() { setFlipped(f => !f); roomAudio.foley('paper'); }
  return <div className="album-view">
    <button className={`polaroid ${flipped ? 'is-flipped' : ''}`} onClick={flip} aria-label={flipped ? '看照片正面' : '翻到照片背面'} onTouchStart={event => { swipe.current = event.touches[0].clientX; }} onTouchEnd={event => { if (Math.abs(event.changedTouches[0].clientX - swipe.current) > 45) { event.preventDefault(); flip(); } }}>
      <span className="polaroid-turner">
        <span className="polaroid-front"><img src={memory.asset} alt={memory.alt} /><span className="photo-caption">{kind === 'frames' ? 'Those days, with you.' : kind === 'cats' ? 'many cats' : kind === 'portraits' ? 'Little things, loosely drawn.' : 'A perfectly crooked day.'}</span></span>
        <span className="polaroid-back"><span className="back-note">{memory.backText}</span><span className="back-signature">小屋 ♡</span></span>
      </span>
    </button>
    <p className="album-label">{kind === 'together' ? '合照册' : kind === 'portraits' ? '一个人的小事' : kind === 'cats' ? 'many cats' : '留下来的日子'}<span>{index + 1} / {ids.length}</span></p>
    <div className="object-controls">
      <button aria-label="上一张照片" onClick={() => move(-1)}><ArrowLeft size={18} /></button>
      <button className="flip-control" onClick={flip}><RotateCcw size={13} />{flipped ? '看照片' : '翻到背面'}</button>
      <button aria-label="下一张照片" onClick={() => move(1)}><ArrowRight size={18} /></button>
    </div>
    {kind === 'frames' && <p className="memory-afterword">树下站一会儿，<br />让风把头发吹歪。</p>}
  </div>;
}

function MarchMemory() {
  const [index, setIndex] = useState(0);
  const ids = albums.sunny!, memory = photo(ids[index]);
  return <div className="march-memory">
    <article className="event-ticket"><span>A LITTLE SUNSHINE</span><h3>今天有太阳</h3><p>慢一点也没关系。<br />小花还在等下一阵风。</p><div className="ticket-footer"><span>HELLO, LITTLE DAY</span><span>KEEP THIS MOMENT</span></div></article>
    <button className="event-photo" onClick={() => setIndex(i => (i + 1) % ids.length)} aria-label="看下一张晴天的照片"><img src={memory.asset} alt={memory.alt} /><span>这一日，有我们。 <ArrowRight size={14} /></span></button>
  </div>;
}

function MagicMemory({ onMagic }: { onMagic: () => void }) {
  return <div className="magic-memory"><img src={photo(11).asset} alt={photo(11).alt} /><p>有些光，<br />只要你还相信，就会亮。</p><button className="spell-button" onClick={onMagic}>Lumos <span>✧</span></button></div>;
}
