'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Download, RefreshCw, RotateCcw, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { deleteBirthdayPhoto, latestBirthdayPhoto, saveBirthdayPhoto, type BirthdayPhoto } from '../lib/storage';
import { getBirthdayState } from '../data/timeline';
import { roomAudio } from '../lib/audio';

export function BirthdayCamera({ open, onClose, onKept, season }: { open: boolean; onClose: () => void; onKept: () => void; season: number }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="memory-dialog camera-dialog" showCloseButton={false}>
    <button className="close-object" onClick={onClose} aria-label="放下相机"><X size={21} /></button>
    <DialogTitle className="memory-episode">今天，也留一张</DialogTitle>
    <DialogDescription className="sr-only">拍一张新的照片，决定重拍、留下或删除。照片只留在这台设备里。</DialogDescription>
    {open && <CameraSession onKept={onKept} season={season} />}
  </DialogContent></Dialog>;
}

function CameraSession({ onKept, season }: { onKept: () => void; season: number }) {
  const [stage, setStage] = useState<'ready' | 'live' | 'shot'>('ready');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [photo, setPhoto] = useState<BirthdayPhoto | null>(null), [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false), [developing, setDeveloping] = useState(false);
  const [busy, setBusy] = useState(false), [note, setNote] = useState('');
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null);
  const active = useRef(true), requestId = useRef(0);
  const stop = useCallback(() => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; }, []);
  useEffect(() => {
    active.current = true;
    void latestBirthdayPhoto().then(previous => {
      if (active.current && requestId.current === 0 && previous) { setPhoto(previous); setSaved(true); setStage('shot'); }
    }).catch(() => {});
    return () => { active.current = false; requestId.current++; stop(); };
  }, [stop]);
  useEffect(() => {
    if (!photo) { setUrl(''); return; }
    const objectUrl = URL.createObjectURL(photo.blob); setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);
  useEffect(() => {
    if (!developing) return;
    const timer = setTimeout(() => setDeveloping(false), 5000);
    return () => clearTimeout(timer);
  }, [developing]);
  useEffect(() => {
    if (stage === 'live' && video.current && stream.current) {
      video.current.srcObject = stream.current;
      void video.current.play().catch(() => setNote('轻触画面，继续取景。'));
    }
  }, [stage, facing]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') { requestId.current++; stop(); setBusy(false); setStage(s => s === 'live' ? 'ready' : s); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [stop]);

  async function start(nextFacing = facing) {
    const id = ++requestId.current; stop(); setBusy(true); setNote('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      if (!active.current || id !== requestId.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media; setFacing(nextFacing); setStage('live'); setPhoto(null); setSaved(false);
      // A facing switch can keep the same React video element mounted.
      if (video.current) { video.current.srcObject = media; await video.current.play().catch(() => {}); }
    } catch {
      if (active.current && id === requestId.current) { setStage('ready'); setNote('那下次再拍。房间会一直在。'); }
    } finally { if (active.current && id === requestId.current) setBusy(false); }
  }
  async function capture() {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) { setNote('再等一下，镜头还在对焦。'); return; }
    setBusy(true);
    const canvas = document.createElement('canvas'), size = Math.min(source.videoWidth, source.videoHeight, 1200);
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) { setBusy(false); setNote('这次没拍好，再试一次。'); return; }
    if (facing === 'user') { context.translate(size, 0); context.scale(-1, 1); }
    const crop = Math.min(source.videoWidth, source.videoHeight);
    context.drawImage(source, (source.videoWidth-crop)/2, (source.videoHeight-crop)/2, crop, crop, 0, 0, size, size);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .92));
    if (!active.current) return;
    setBusy(false);
    if (!blob) { setNote('这次没拍好，再试一次。'); return; }
    stop(); roomAudio.foley('shutter');
    const now = new Date();
    setPhoto({ id: `room-${Date.now()}-${Math.random().toString(36).slice(2,10)}`, createdAt: now.toISOString(), age: 0, blob });
    setSaved(false); setDeveloping(true); setStage('shot'); setNote('');
  }
  async function keep() {
    if (!photo) return;
    setBusy(true);
    try { await saveBirthdayPhoto(photo); if (active.current) { setSaved(true); setNote('好，这一张也留在房间里。'); onKept(); } }
    catch { if (active.current) setNote('这次没能存进房间，可以先保存到相册。'); }
    finally { if (active.current) setBusy(false); }
  }
  async function remove() {
    if (!photo) return;
    setBusy(true);
    try { if (saved) await deleteBirthdayPhoto(photo.id); if (active.current) { setPhoto(null); setSaved(false); setStage('ready'); setNote('这张已经删掉了。'); onKept(); } }
    catch { if (active.current) setNote('这次没能删掉，稍后再试一下。'); }
    finally { if (active.current) setBusy(false); }
  }
  async function download() {
    if (!photo || !url) return;
    const source = new Image(); source.src = url;
    await new Promise<void>((resolve,reject)=>{if(source.complete&&source.naturalWidth){resolve();return;}source.onload=()=>resolve();source.onerror=()=>reject(new Error('Image unavailable'));});
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1220;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#e9dfca'; ctx.fillRect(0,0,1024,1220); ctx.drawImage(source,50,50,924,924);
    ctx.fillStyle = '#544332'; ctx.font = '44px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('A LITTLE DAY',512,1070); ctx.font = '27px Georgia'; ctx.fillText(formatDate(photo.createdAt),512,1140);
    const bridge=(window as unknown as {xhs?:{miniTool?:{writeTempFile:(o:{data:string})=>Promise<{filePath:string}>;saveImageToPhotosAlbum:(o:{filePath:string})=>Promise<unknown>}}}).xhs?.miniTool;
    if(!bridge?.writeTempFile||!bridge?.saveImageToPhotosAlbum){setNote('这张照片已显示在这里，也可以把画面截图留住。');return;}
    try{const {filePath}=await bridge.writeTempFile({data:canvas.toDataURL('image/png')});await bridge.saveImageToPhotosAlbum({filePath});setNote('已经保存到相册。');}catch{setNote('这次没有存入相册，照片仍在这里。');}
  }
  return <div className="camera-session">
    {stage === 'ready' && <div className="camera-ready"><Camera size={42} strokeWidth={1} /><h3>今天，也留一张吧。</h3><p>前面的日子，已经在房间里。<br />这一张，留给现在。</p><button className="text-action" onClick={() => void start()} disabled={busy}>{busy ? '等镜头准备好…' : '打开相机'}</button></div>}
    {stage === 'live' && <><div className="camera-live"><video ref={video} playsInline autoPlay muted className={facing === 'user' ? 'is-mirrored' : ''} onClick={() => void video.current?.play()} /><div className="viewfinder-corners" /><span>DOODLE · NOW</span></div><div className="camera-controls"><button onClick={() => void start(facing === 'user' ? 'environment' : 'user')} disabled={busy} aria-label="切换前后摄像头"><RefreshCw size={19} /></button><button className="shutter-button" onClick={() => void capture()} disabled={busy} aria-label="按下快门" /><span /></div></>}
    {stage === 'shot' && photo && <><div className={`new-polaroid ${developing ? 'is-developing' : ''}`} key={photo.id}><img src={url || undefined} alt="刚刚留下的生日拍立得" /><div><strong>A LITTLE DAY</strong><span>{formatDate(photo.createdAt)}</span></div></div><div className="camera-controls shot-controls"><button onClick={() => void start()} disabled={busy} aria-label="重新拍摄"><RotateCcw size={16} /><span>重拍</span></button>{!saved ? <button onClick={() => void keep()} disabled={busy || developing}>留住这一张</button> : <button onClick={() => void download()} aria-label="保存到相册"><Download size={16} /><span>存相册</span></button>}<button onClick={() => void remove()} disabled={busy} aria-label="删除这张照片"><Trash2 size={16} /><span>删除</span></button></div>{!saved && !developing && <button className="text-action" onClick={() => void download()}>保存到相册<Download size={15} /></button>}</>}
    <p className="camera-note" role="status">{developing ? '慢慢来，照片还在显影。' : note}</p>
    <p className="camera-privacy">照片只留在这台设备里，由你决定要不要留下。</p>
  </div>;
}
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' }).toUpperCase(); }
