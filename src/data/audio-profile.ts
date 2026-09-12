declare const __ROOM_BGM__:string|null;
// The default/development and ZIP builds stay entirely instrumental.
export const roomMusicTrack=typeof __ROOM_BGM__==='undefined'?null:__ROOM_BGM__;
