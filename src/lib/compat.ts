// Small local fallbacks used by this application and its existing dependencies.
if(!Object.fromEntries)Object.fromEntries=function(entries:Iterable<readonly [PropertyKey,unknown]>){const value:Record<PropertyKey,unknown>={};for(const [key,item] of entries)value[key]=item;return value;};
if(!Object.hasOwn)Object.hasOwn=(object:object,key:PropertyKey)=>Object.prototype.hasOwnProperty.call(object,key);
if(!Array.prototype.flat)Object.defineProperty(Array.prototype,'flat',{value:function(depth=1){return depth>0?this.reduce((a:unknown[],v:unknown)=>a.concat(Array.isArray(v)?v.flat(depth-1):v),[]):this.slice();}});
if(!Array.prototype.flatMap)Object.defineProperty(Array.prototype,'flatMap',{value:function(fn:(v:unknown,i:number,a:unknown[])=>unknown){return this.map(fn).flat();}});
if(!window.queueMicrotask)window.queueMicrotask=callback=>{void Promise.resolve().then(callback);};
// ResizeObserver is an enhancement; the room itself also listens for resize.
if(!window.ResizeObserver){class LocalResizeObserver{private targets=new Set<Element>();private callback:ResizeObserverCallback;constructor(callback:ResizeObserverCallback){this.callback=callback;window.addEventListener('resize',this.update);}private update=()=>{this.callback(Array.from(this.targets).map(target=>({target,contentRect:target.getBoundingClientRect()} as ResizeObserverEntry)),this as unknown as ResizeObserver);};observe(target:Element){this.targets.add(target);this.update();}unobserve(target:Element){this.targets.delete(target);}disconnect(){this.targets.clear();window.removeEventListener('resize',this.update);}}window.ResizeObserver=LocalResizeObserver as unknown as typeof ResizeObserver;}
const root=document.documentElement;
function viewport(){const height=window.visualViewport?window.visualViewport.height:window.innerHeight;root.style.setProperty('--app-height',`${height}px`);}
viewport();window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);
const flex=document.createElement('div');flex.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';flex.appendChild(document.createElement('div'));flex.appendChild(document.createElement('div'));document.body.appendChild(flex);root.classList.add(flex.scrollHeight===1?'has-flex-gap':'no-flex-gap');flex.remove();
