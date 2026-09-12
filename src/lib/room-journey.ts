export const RELIGHT_DURATION = 7800;
export const CORE_MEMORY_COUNT = 5;
export function memoryCategory(id:string){
  if(['together','portraits','film','tv'].includes(id))return 'film';
  if(['books','magic','sunny'].includes(id))return 'books';
  if(id==='window-cat')return 'cats';
  return id;
}
export function discoveredCategories(ids:string[]){return [...new Set(ids.map(memoryCategory))];}
export function mayWish(ids:string[],alreadyUnlocked=false){return alreadyUnlocked||discoveredCategories(ids).length>=CORE_MEMORY_COUNT;}
const smooth=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
export function relightLevels(seconds:number){
  return {phone:smooth(seconds/.65),books:smooth((seconds-.75)/.8),sofa:smooth((seconds-1.5)/.8),tv:smooth((seconds-2.25)/.8),photos:smooth((seconds-3)/.8),window:smooth((seconds-3.75)/.8),flowers:smooth((seconds-4.5)/.8),elephant:smooth((seconds-5.25)/.9),room:smooth((seconds-6.1)/1.4)};
}
export function slideProgress(start:number,current:number,travel:number){return Math.max(0,Math.min(1,(current-start)/Math.max(1,travel)));}

/** Raw objects are kept apart from the memory families used for the gentle wish threshold. */
export function hasDiscoveredObject(id:string,objects:string[],legacy:string[]=[]){
  return objects.includes(id)||(objects.length===0&&legacy.includes(memoryCategory(id)));
}
export const CAKE_TOPPERS=['calls','film','frames','sunny','books','magic','elephant'] as const;
export function topperDiscovered(id:string,objects:string[]){
  if(id==='film')return objects.some(value=>['film','together','portraits','camera','tv'].includes(value));
  return objects.includes(id);
}
export function cakeCandlesLit(atmosphere:string,ending:string,ready:boolean,seen:boolean){
  if(ending==='dark'||ending==='relight')return false;
  return ending==='wish'||atmosphere==='candle'||(ready&&!seen);
}
