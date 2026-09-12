import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {atmospheres,type Atmosphere} from '../data/atmospheres';
import {discoveredCategories,mayWish,memoryCategory} from '../lib/room-journey';
type RoomState = {
  openingSeen: boolean; discoveredMemories: string[];
  discoveredObjects: string[];
  notice: (id:string) => void; endingSeen: boolean;
  endingUnlocked: boolean; audioMuted: boolean; atmosphere:Atmosphere; setAtmosphere:(value:Atmosphere)=>void;
  enter: () => void; discover: (id: string) => void; unlockEnding: () => void;
  finish: () => void; toggleMuted: () => void;
  lighting: { floor: number; desk: number; window: number };
  setLighting: (value: Partial<RoomState['lighting']>) => void;
};
export const useRoomState = create<RoomState>()(persist((set) => ({
  openingSeen: false, discoveredMemories: [], discoveredObjects: [],
  notice:id=>set(s=>({discoveredObjects:[...new Set([...(s.discoveredObjects??[]),id])]})), endingSeen: false, endingUnlocked: false, audioMuted: false,
  lighting: { floor: 80, desk: 70, window: 55 }, atmosphere:'night',
  setAtmosphere:value=>set({atmosphere:value,lighting:{floor:atmospheres[value].floor,desk:atmospheres[value].desk,window:55}}),
  setLighting: (value) => set(s => ({ lighting: { ...s.lighting, ...Object.fromEntries(Object.entries(value).map(([key, n]) => [key, Math.max(0, Math.min(100, n))])) } })),
  enter: () => set({ openingSeen: true }),
  discover: (id) => set(s => {
    const memories = discoveredCategories([...s.discoveredMemories,memoryCategory(id)]);
    return { discoveredObjects:[...new Set([...(s.discoveredObjects??[]),id])], discoveredMemories: memories, endingUnlocked: mayWish(memories,s.endingUnlocked) };
  }),
  unlockEnding: () => set({ endingUnlocked: true }),
  finish: () => set({ endingSeen: true, endingUnlocked: true }),
  toggleMuted: () => set(s => ({ audioMuted: !s.audioMuted })),
}), { name: 'doodle-room-v1', version:1, skipHydration: true, migrate:persisted=>{const old=persisted as Partial<RoomState>;return {...old,discoveredObjects:old.discoveredObjects??old.discoveredMemories??[]};} }));
